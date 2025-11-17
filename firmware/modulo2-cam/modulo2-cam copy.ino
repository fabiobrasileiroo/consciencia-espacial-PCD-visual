// ESP32-CAM + Captive Portal integrado
#include "esp_camera.h"
#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>

// ===========================
// Select camera model in board_config.h
// ===========================
#include "board_config.h"

// ===========================
// Prototipos (implemente startCameraServer() do seu exemplo de câmera)
// ===========================
void startCameraServer();
void setupLedFlash(); // opcional se você tiver LED definido

// ===========================
// Credenciais padrão (substitua por algo seguro)
// ===========================
const char* defaultSsid = "FJ";
const char* defaultPassword = "#f39A@jl32*";

// Configurações do portal
const char* CAPTIVE_AP_SSID = "ESP32-CAM-SETUP";
const char* CAPTIVE_AP_PASS = "camsetup";
const unsigned long WIFI_CONNECT_TIMEOUT = 20000; // ms

Preferences preferences;
WebServer configServer(80);

String wifiSsid;
String wifiPassword;

bool preferencesReady = false;
bool wifiConnected = false;
bool captivePortalActive = false;
bool pendingPortalClose = false;
unsigned long portalCloseAt = 0;

// ===========================
// Funções auxiliares
// ===========================
bool attemptWiFiConnection(const String& ssid, const String& pass, bool keepAP = false) {
  Serial.printf("\n📡 Tentando conectar à rede: %s\n", ssid.c_str());
  if (keepAP) {
    WiFi.mode(WIFI_AP_STA);
  } else {
    WiFi.mode(WIFI_STA);
  }

  WiFi.disconnect(true, true);
  delay(100);
  WiFi.begin(ssid.c_str(), pass.c_str());

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - start) < WIFI_CONNECT_TIMEOUT) {
    delay(250);
    Serial.print(".");
  }
  bool connected = WiFi.status() == WL_CONNECTED;
  if (connected) {
    Serial.println("\n✅ WiFi conectado!");
    Serial.printf("   SSID: %s\n", ssid.c_str());
    Serial.printf("   IP: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("   MAC: %s\n", WiFi.macAddress().c_str());
    Serial.printf("   Canal WiFi: %d\n", WiFi.channel());
  } else {
    Serial.println("\n❌ Não foi possível conectar ao WiFi");
  }
  return connected;
}

void saveWifiCredentials(const String& ssid, const String& pass) {
  if (!preferencesReady) return;
  preferences.putString("ssid", ssid);
  preferences.putString("pass", pass);
}

// Monta a página do portal (estilizada)
String buildPortalPage(const String& extraMessage = "") {
  String page = R"HTML(
    <!DOCTYPE html><html lang="pt-br"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Configurar Wi-Fi</title>
    <style>body{font-family:Arial;background:#0f172a;color:#f8fafc;padding:18px} .card{max-width:480px;margin:0 auto;background:#1e293b;border-radius:12px;padding:20px} input{width:100%;padding:10px;margin:6px 0;border-radius:8px;border:none} button{width:100%;padding:12px;border-radius:999px;border:none;background:#38bdf8;color:#042046;font-weight:700} .msg{background:#334155;padding:8px;border-radius:8px;margin-bottom:8px}</style>
    </head><body><div class="card"><h2>Configurar Wi-Fi do ESP32-CAM</h2><p>Escolha uma rede ou informe SSID e senha.</p>
  )HTML";

  if (extraMessage.length() > 0) page += "<div class=\"msg\">" + extraMessage + "</div>";

  page += R"HTML(
    <div style="margin:12px 0;padding:10px;background:#020617;border-radius:8px"><strong>Redes próximas</strong><div id="networks" style="margin-top:8px"></div><small>Toque em uma rede para preencher o SSID.</small></div>
    <form method="POST" action="/save">
      <label>SSID</label>
      <input id="ssid-input" name="ssid" required />
      <label>Senha</label>
      <input id="password-input" name="password" type="password" required />
      <button type="submit">Salvar e Conectar</button>
    </form>
    <small>Após conectar, esta página mostrará o IP do ESP32-CAM.</small></div>
    <script>/* redesData será injetado pelo servidor */ if(typeof redesData!=='undefined'){var c=document.getElementById('networks'); if(redesData.length){redesData.forEach(function(it){var b=document.createElement('button');b.type='button';b.textContent=it.ssid+' ('+it.rssi+' dBm)';b.style.display='block';b.style.margin='6px 0';b.onclick=function(){document.getElementById('ssid-input').value=it.ssid;document.getElementById('password-input').focus();};c.appendChild(b);});} else c.textContent='Nenhuma rede encontrada.';} </script></body></html>
  )HTML";

  return page;
}

String buildResultPage(bool success, const String& ssid, const String& ip, const String& extraMessage) {
  String color = success ? "#4ade80" : "#f87171";
  String status = success ? "Conectado com sucesso" : "Falha na conexão";
  String page = R"HTML(
    <!DOCTYPE html><html lang="pt-br"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Resultado</title>
    <style>body{font-family:Arial;background:#0f172a;color:#f8fafc;padding:18px} .card{max-width:520px;margin:0 auto;background:#1e293b;border-radius:12px;padding:20px} code{background:#020617;padding:4px 6px;border-radius:6px;color:#38bdf8}</style>
    </head><body><div class="card">
  )HTML";
  page += "<div style='font-weight:700;color:" + color + ";margin-bottom:8px;'>" + status + "</div>";
  page += "<p><strong>Rede:</strong> " + ssid + "</p>";
  if (success) page += "<p><strong>IP do ESP32:</strong> <code>" + ip + "</code></p>";
  if (extraMessage.length()) page += "<p>" + extraMessage + "</p>";
  page += "<p>Você pode fechar esta página.</p></div></body></html>";
  return page;
}

// Handler do root do portal — faz scan e injeta redes
void handlePortalRoot() {
  Serial.println("\n📡 Escaneando redes Wi-Fi para o portal...");
  int n = WiFi.scanNetworks();
  String networksJson = "[";
  for (int i = 0; i < n; i++) {
    if (i > 0) networksJson += ",";
    String ssid = WiFi.SSID(i);
    int rssi = WiFi.RSSI(i);
    // Escapa aspas simples/duplas simples (básico) para evitar injeção quebrada
    ssid.replace("\\", "\\\\");
    ssid.replace("\"", "\\\"");
    networksJson += "{\"ssid\":\"" + ssid + "\",\"rssi\":" + String(rssi) + "}";
  }
  networksJson += "]";
  String page = buildPortalPage();
  // injeta a variável redesData
  page.replace("</head>", "  <script>var redesData = " + networksJson + ";</script>\n    </head>");
  configServer.send(200, "text/html", page);
}

void stopCaptivePortal() {
  if (!captivePortalActive) return;
  configServer.stop();
  WiFi.softAPdisconnect(true);
  WiFi.mode(WIFI_STA);
  captivePortalActive = false;
  pendingPortalClose = false;
  portalCloseAt = 0;
  Serial.println("📴 Portal cativo encerrado.");
}

void handlePortalSave() {
  Serial.println("\n📨 Recebendo configuração do portal...");
  
  if (!configServer.hasArg("ssid") || !configServer.hasArg("password")) {
    Serial.println("❌ Erro: SSID ou senha não fornecidos");
    configServer.send(400, "text/plain", "SSID e senha são obrigatórios");
    return;
  }
  String newSsid = configServer.arg("ssid");
  String newPassword = configServer.arg("password");

  Serial.printf("   SSID recebido: %s\n", newSsid.c_str());
  Serial.printf("   Senha recebida: %s\n", newPassword.c_str());

  if (newSsid.isEmpty() || newPassword.isEmpty()) {
    Serial.println("❌ Erro: Valores vazios detectados");
    configServer.send(400, "text/plain", "Valores inválidos");
    return;
  }

  // tenta conectar mantendo AP ativo (para não derrubar client antes de responder)
  Serial.println("🔌 Tentando conectar ao WiFi...");
  bool connected = attemptWiFiConnection(newSsid, newPassword, true);
  
  if (connected) {
    wifiSsid = newSsid;
    wifiPassword = newPassword;
    wifiConnected = true;
    
    Serial.println("💾 Salvando credenciais na memória...");
    saveWifiCredentials(newSsid, newPassword);
    
    String ipAddress = WiFi.localIP().toString();
    Serial.printf("✅ IP obtido: %s\n", ipAddress.c_str());
    
    String html = buildResultPage(true, newSsid, ipAddress,
      "O ESP32 permanecerá online e o portal será encerrado em alguns segundos.");
    configServer.send(200, "text/html", html);

    // inicia servidor da câmera agora que está conectado
    Serial.println("▶️ Iniciando servidor da câmera...");
    startCameraServer();
    Serial.println("✅ Servidor da câmera iniciado!");
    Serial.printf("📹 Acesse o stream em: http://%s/stream\n", ipAddress.c_str());
    Serial.printf("🎛️ Painel de controle: http://%s\n", ipAddress.c_str());

    // agenda fechamento do portal para dar tempo do cliente ler IP
    pendingPortalClose = true;
    portalCloseAt = millis() + 5000;
    Serial.println("⏱️ Portal será fechado em 5 segundos...");
  } else {
    Serial.println("❌ Falha ao conectar ao WiFi");
    String html = buildResultPage(false, newSsid, "0.0.0.0",
      "Não conseguimos autenticar na rede. Verifique a senha e tente novamente.");
    configServer.send(200, "text/html", html);
  }
}

void startCaptivePortal() {
  if (captivePortalActive) return;
  captivePortalActive = true;
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(CAPTIVE_AP_SSID, CAPTIVE_AP_PASS);
  IPAddress apIP = WiFi.softAPIP();

  Serial.println("\n📶 Nenhuma rede configurada encontrada.");
  Serial.println("🔐 Abrindo portal para configurar Wi-Fi do ESP32-CAM");
  Serial.printf("   SSID do AP: %s\n", CAPTIVE_AP_SSID);
  Serial.printf("   Senha: %s\n", CAPTIVE_AP_PASS);
  Serial.printf("   Acesse: http://%s para configurar\n", apIP.toString().c_str());

  configServer.on("/", handlePortalRoot);
  configServer.on("/save", HTTP_POST, handlePortalSave);
  configServer.onNotFound(handlePortalRoot);
  configServer.begin();
}

// ===========================
// Setup da câmera (cópia do seu sketch original)
// ===========================
void setupCamera() {
  Serial.println("📷 Configurando sensor da câmera...");
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.frame_size = FRAMESIZE_UXGA;
  config.pixel_format = PIXFORMAT_JPEG;
  config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
  config.fb_location = CAMERA_FB_IN_PSRAM;
  config.jpeg_quality = 12;
  config.fb_count = 1;

  if (config.pixel_format == PIXFORMAT_JPEG) {
    if (psramFound()) {
      config.jpeg_quality = 10;
      config.fb_count = 2;
      config.grab_mode = CAMERA_GRAB_LATEST;
    } else {
      config.frame_size = FRAMESIZE_SVGA;
      config.fb_location = CAMERA_FB_IN_DRAM;
    }
  } else {
    config.frame_size = FRAMESIZE_240X240;
  }

#if defined(CAMERA_MODEL_ESP_EYE)
  pinMode(13, INPUT_PULLUP);
  pinMode(14, INPUT_PULLUP);
#endif

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("❌ ERRO! Falha ao iniciar câmera: 0x%x\n", err);
    Serial.println("Verifique as conexões do módulo da câmera!");
    Serial.flush();
    // Não retorna — mas evita continuar se a câmera falhar
    return;
  }
  Serial.println("✅ Sensor da câmera inicializado com sucesso!");

  sensor_t *s = esp_camera_sensor_get();
  if (s->id.PID == OV3660_PID) {
    s->set_vflip(s, 1);
    s->set_brightness(s, 1);
    s->set_saturation(s, -2);
  }
  if (config.pixel_format == PIXFORMAT_JPEG) {
    s->set_framesize(s, FRAMESIZE_QVGA);
  }

#if defined(CAMERA_MODEL_M5STACK_WIDE) || defined(CAMERA_MODEL_M5STACK_ESP32CAM)
  s->set_vflip(s, 1);
  s->set_hmirror(s, 1);
#endif

#if defined(CAMERA_MODEL_ESP32S3_EYE)
  s->set_vflip(s, 1);
#endif

#if defined(LED_GPIO_NUM)
  setupLedFlash();
#endif
}

// ===========================
// SETUP
// ===========================
void setup() {
  Serial.begin(115200);
  delay(1000); // Aguarda Serial inicializar
  Serial.setDebugOutput(true);
  Serial.println();
  Serial.println();
  Serial.println("========================================");
  Serial.println("=== ESP32-CAM com Captive Portal ===");
  Serial.println("========================================");
  Serial.flush(); // Força envio

  Serial.println("🔧 Iniciando configuração da câmera...");
  setupCamera();
  Serial.println("✅ Câmera configurada!");

  Serial.println("✅ Câmera configurada!");

  Serial.println("💾 Iniciando sistema de preferências...");
  preferencesReady = preferences.begin("wifi-config", false);
  
  // DESCOMENTE A LINHA ABAIXO PARA FORÇAR RESET (teste do portal)
  // resetWifiCredentials();
  
  if (!preferencesReady) {
    Serial.println("⚠️ Não foi possível iniciar Preferences. Abrindo portal...");
    Serial.flush();
    startCaptivePortal();
    return;
  }
  Serial.println("✅ Preferences iniciado com sucesso!");

  // Verifica se há credenciais salvas (não usa valores padrão aqui)
  wifiSsid = preferences.getString("ssid", "");
  wifiPassword = preferences.getString("pass", "");
  
  Serial.println("🔍 Verificando credenciais salvas...");
  Serial.printf("   SSID salvo: %s\n", wifiSsid.isEmpty() ? "(vazio)" : wifiSsid.c_str());
  Serial.printf("   Senha salva: %s\n", wifiPassword.isEmpty() ? "(vazio)" : "********");

  // Se não há credenciais salvas, abre o portal direto
  if (wifiSsid.isEmpty() || wifiPassword.isEmpty()) {
    Serial.println("📝 Nenhuma credencial salva. Abrindo portal de configuração...");
    Serial.flush();
    startCaptivePortal();
    return;
  }

  // Tenta conectar com credenciais salvas
  bool connected = attemptWiFiConnection(wifiSsid, wifiPassword);
  wifiConnected = connected;

  if (connected) {
    Serial.println("▶️ Iniciando servidor da câmera...");
    startCameraServer();
    Serial.println("✅ Servidor da câmera iniciado com sucesso!");
    Serial.printf("📹 Acesse o stream em: http://%s/stream\n", WiFi.localIP().toString().c_str());
    Serial.printf("🎛️ Painel de controle em: http://%s\n", WiFi.localIP().toString().c_str());
    Serial.printf("Camera Ready! Use 'http://%s' para conectar\n", WiFi.localIP().toString().c_str());
  } else {
    // Se falhou, abre portal
    Serial.println("⚠️ Falha na conexão com credenciais salvas. Abrindo portal...");
    startCaptivePortal();
  }
}

// ===========================
// LOOP
// ===========================
void loop() {
  if (captivePortalActive) {
    configServer.handleClient();
    if (pendingPortalClose && millis() >= portalCloseAt) {
      Serial.println("⏰ Tempo de fechamento do portal atingido.");
      stopCaptivePortal();
      Serial.println("📡 WiFi configurado e servidor da câmera ativo.");
      Serial.printf("🌐 IP Final: %s\n", WiFi.localIP().toString().c_str());
      // porta fechada — nada mais a fazer (server da câmera já iniciado ao conectar)
    }
  }

  // detecta conexões que aconteceram fora do portal (p.ex. credenciais já salvas)
  if (!wifiConnected && WiFi.status() == WL_CONNECTED) {
    Serial.println("✅ WiFi conectado. Iniciando servidor da câmera...");
    wifiConnected = true;
    startCameraServer();
    Serial.printf("📹 Stream disponível em: http://%s/stream\n", WiFi.localIP().toString().c_str());
    Serial.printf("🎛️ Controles em: http://%s\n", WiFi.localIP().toString().c_str());
  }

  // se caiu a conexão, tenta reconectar e reabrir portal se falhar
  if (wifiConnected && WiFi.status() != WL_CONNECTED && !captivePortalActive) {
    Serial.println("⚠️ WiFi desconectado. Tentando reconectar...");
    wifiConnected = false;
    bool reconnected = attemptWiFiConnection(wifiSsid, wifiPassword);
    wifiConnected = reconnected;
    if (reconnected) {
      Serial.println("🔄 Reconectado! Reiniciando servidor da câmera...");
      startCameraServer();
      Serial.printf("📹 Stream: http://%s/stream\n", WiFi.localIP().toString().c_str());
    } else {
      Serial.println("❌ Falha na reconexão. Abrindo portal...");
      startCaptivePortal();
    }
  }

  delay(10);
}
