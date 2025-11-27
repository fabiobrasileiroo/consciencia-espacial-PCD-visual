#include <Arduino.h>
#include <esp_now.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <WebServer.h>

// ===========================
// CONFIGURAÇÃO WIFI
// ===========================
const char* defaultSsid = "Projetos";
const char* defaultPassword = "Inovatech@2025";
String wifiSsid = defaultSsid;
String wifiPassword = defaultPassword;

// ===========================https://wired-literally-sawfish.ngrok-free.app
// CONFIGURAÇÃO WEBSOCKET
// ===========================
// PRODUÇÃO (Render):
// const char* wsServer = "seu-servico.onrender.com";
// const int wsPort = 443;
// const char* wsPath = "/esp32";
// const bool useSSL = true;

// DESENVOLVIMENTO (Local):
const char* wsServer = "192.168.100.56";  // IP do seu PC rodando Node.js
const int wsPort = 3000;
const char* wsPath = "/esp32";
const bool useSSL = false;

WebSocketsClient webSocket;
bool wsConnected = false;  // ===========================
// ESP-NOW - MAC ADDRESSES Pai: EC:64:C9:7C:38:30
// =========================== EC:64:C9:7C:38:30
// MAC Address do Módulo 1 (Sensor de Distância) - D0:EF:76:15:8F:04
uint8_t modulo1Address[] = {0xD0, 0xEF, 0x76, 0x15, 0x8F, 0x04};

// MAC Address do Módulo 3 (Motor de Vibração)
uint8_t modulo3Address[] = {0xEC, 0x64, 0xC9, 0x7B, 0x99, 0x8C};

// ===========================
// ESTRUTURAS DE DADOS
// ===========================
// Estrutura para receber dados do Módulo 1 (Sensor)
typedef struct struct_sensor_data {
  int distance;
  int moduleId;
  float temperature;
  float humidity;
  uint8_t sensorOk;
} struct_sensor_data;

// Estrutura para enviar comandos ao Módulo 3 (Motor)
typedef struct struct_motor_command {
  int vibrationLevel; // 0=parado, 1=baixo, 2=médio, 3=forte
  int moduleId;
} struct_motor_command;

struct_sensor_data sensorData = {};
struct_motor_command motorCommand;

Preferences preferences;
WebServer configServer(80);

bool preferencesReady = false;

bool wifiConnected = false;
bool captivePortalActive = false;
bool systemsInitialized = false;
bool pendingPortalClose = false;
unsigned long portalCloseAt = 0;

const char* CAPTIVE_AP_SSID = "ESP32-PAI-Setup";
const char* CAPTIVE_AP_PASS = "pai12345";
const unsigned long WIFI_CONNECT_TIMEOUT = 20000;

// ===========================
// ESTADO DO SISTEMA
// ===========================
unsigned long lastSensorUpdate = 0;
unsigned long lastStatusSend = 0;
unsigned long lastWsRetryLog = 0;
const unsigned long STATUS_INTERVAL = 2000;  // Enviar status a cada 2s
const unsigned long WS_LOG_INTERVAL = 30000; // Log de reconexão a cada 30s
unsigned long lastMotorCommandSent = 0;
bool cameraOnline = false;
const unsigned long SENSOR_TIMEOUT = 5000;
const unsigned long MOTOR_TIMEOUT = 5000;
const unsigned long CAMERA_TIMEOUT = 10000;

// ===========================
// DECLARAÇÕES DE FUNÇÕES
// ===========================
void sendRealtimeStatus();
void sendAlert(const char* level, const char* message, int distance);
void loadWifiCredentials();
void saveWifiCredentials(const String& ssid, const String& pass);
bool attemptWiFiConnection(const String& ssid, const String& pass, bool keepAP = false);
void startCaptivePortal();
void stopCaptivePortal();
String buildPortalPage(const String& extraMessage = "");
String buildResultPage(bool success, const String& ssid, const String& ip, const String& extraMessage);
void handlePortalRoot();
void handlePortalSave();
void initializeCoreSystems();
void OnDataRecv(const uint8_t * mac, const uint8_t *incomingData, int len);
void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status);

// ===========================
// WEBSOCKET EVENT HANDLER
// ===========================
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      if (wsConnected) {
        Serial.println("\n⚠️  WebSocket desconectado do servidor");
        Serial.println("    (Tentará reconectar automaticamente)");
        wsConnected = false;
      } else {
        // Só loga desconexão a cada 30s para evitar flood
        unsigned long now = millis();
        if (now - lastWsRetryLog >= WS_LOG_INTERVAL) {
          Serial.println("⏳ WebSocket ainda tentando conectar...");
          lastWsRetryLog = now;
        }
      }
      break;
      
    case WStype_CONNECTED:
      Serial.printf("✅ WebSocket conectado a: %s\n", wsServer);
      wsConnected = true;
      
      // Enviar identificação
      {
        StaticJsonDocument<200> doc;
        doc["type"] = "identify";
        doc["deviceId"] = "ESP32-PAI-MESTRE";
        doc["mac"] = WiFi.macAddress();
        doc["timestamp"] = millis();
        
        String output;
        serializeJson(doc, output);
        webSocket.sendTXT(output);
        Serial.println("📤 Identificação enviada ao servidor");
      }
      break;
      
    case WStype_TEXT:
      {
        Serial.printf("📥 Mensagem recebida: %s\n", payload);
        
        StaticJsonDocument<512> doc;
        DeserializationError error = deserializeJson(doc, payload);
        
        if (!error) {
          const char* msgType = doc["type"];
          
          if (strcmp(msgType, "command") == 0) {
            const char* cmd = doc["command"];
            Serial.printf("🎮 Comando recebido: %s\n", cmd);
            
            // Processar comandos do servidor
            if (strcmp(cmd, "test_motor") == 0) {
              // Testar motor
              motorCommand.vibrationLevel = 2;
              motorCommand.moduleId = 3;
              esp_now_send(modulo3Address, (uint8_t*)&motorCommand, sizeof(motorCommand));
              lastMotorCommandSent = millis();
              Serial.println("🔧 Teste de motor enviado");
            }
            else if (strcmp(cmd, "get_status") == 0) {
              // Enviar status imediatamente
              sendRealtimeStatus();
            }
          } else if (strcmp(msgType, "camera-status") == 0) {
            cameraOnline = doc["connected"].as<bool>();
            Serial.printf("📷 Status da câmera atualizado: %s\n", cameraOnline ? "ONLINE" : "OFFLINE");
          }
        }
      }
      break;
      
    case WStype_PING:
      // Silencioso - não logar
      break;
      
    case WStype_PONG:
      // Silencioso - não logar
      break;
      
    case WStype_ERROR:
      Serial.println("⚠️  Erro no WebSocket");
      break;
  }
}

// ===========================
// FUNÇÕES WEBSOCKET
// ===========================
void sendRealtimeStatus() {
  if (!wsConnected) return;
  
  StaticJsonDocument<512> doc;
  doc["type"] = "status";
  doc["module"] = "sensor";
  doc["distance"] = sensorData.distance;
  doc["rssi"] = WiFi.RSSI();
  doc["timestamp"] = millis();
  doc["lastSensorUpdate"] = millis() - lastSensorUpdate;
  doc["temperature"] = sensorData.temperature;
  doc["humidity"] = sensorData.humidity;
  doc["sensorOk"] = sensorData.sensorOk > 0;
  
  // Adicionar nível de intensidade baseado na distância
  const char* intensityLevel = "safe";
  if (sensorData.distance < 20) {
    intensityLevel = "danger";
  } else if (sensorData.distance < 50) {
    intensityLevel = "warning";
  } else if (sensorData.distance < 100) {
    intensityLevel = "caution";
  }
  doc["level"] = intensityLevel;
  doc["vibrationLevel"] = motorCommand.vibrationLevel;

  bool sensorActive = (millis() - lastSensorUpdate) <= SENSOR_TIMEOUT;
  bool motorActive = (millis() - lastMotorCommandSent) <= MOTOR_TIMEOUT;
  bool cameraActive = cameraOnline;

  JsonObject systems = doc.createNestedObject("systems");
  systems["pai"] = true;
  systems["sensor"] = sensorActive;
  systems["vibracall"] = motorActive;
  systems["camera"] = cameraActive;
  
  String output;
  serializeJson(doc, output);
  webSocket.sendTXT(output);
}

void sendAlert(const char* level, const char* message, int distance) {
  if (!wsConnected) return;
  
  StaticJsonDocument<300> doc;
  doc["type"] = "alert";
  doc["level"] = level;
  doc["msg"] = message;
  doc["distance"] = distance;
  doc["timestamp"] = millis();
  
  String output;
  serializeJson(doc, output);
  webSocket.sendTXT(output);
  
  Serial.printf("🚨 Alerta enviado: %s - %s\n", level, message);
}

void loadWifiCredentials() {
  if (!preferencesReady) {
    wifiSsid = defaultSsid;
    wifiPassword = defaultPassword;
    return;
  }

  wifiSsid = preferences.getString("ssid", defaultSsid);
  wifiPassword = preferences.getString("pass", defaultPassword);
}

void saveWifiCredentials(const String& ssid, const String& pass) {
  if (!preferencesReady) return;
  preferences.putString("ssid", ssid);
  preferences.putString("pass", pass);
}

bool attemptWiFiConnection(const String& ssid, const String& pass, bool keepAP) {
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
    Serial.println("✅ WiFi conectado!");
    Serial.printf("   SSID: %s\n", ssid.c_str());
    Serial.printf("   IP: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("   MAC: %s\n", WiFi.macAddress().c_str());
    Serial.printf("   Canal WiFi: %d\n", WiFi.channel());
  } else {
    Serial.println("❌ Não foi possível conectar ao WiFi");
  }

  return connected;
}

String buildPortalPage(const String& extraMessage) {
  String page = R"HTML(
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>ESP32-PAI • Configuração Wi-Fi</title>
      <style>
        body { font-family: Arial, sans-serif; background:#0f172a; color:#f8fafc; padding:20px; }
        .card { max-width:480px; margin:0 auto; background:#1e293b; border-radius:16px; padding:24px; box-shadow:0 10px 40px rgba(15,23,42,0.6); }
        h1 { margin-top:0; font-size:1.6rem; }
        label { display:block; margin-bottom:6px; font-weight:600; }
        input { width:100%; padding:12px; border-radius:10px; border:none; margin-bottom:16px; font-size:1rem; }
        button { width:100%; padding:14px; border:none; border-radius:999px; background:#38bdf8; color:#0f172a; font-size:1rem; font-weight:700; cursor:pointer; }
        button:hover { background:#0ea5e9; }
        .msg { margin-bottom:16px; padding:12px; border-radius:10px; background:#334155; }
        small { color:#94a3b8; }
        code { background:#0f172a; padding:4px 6px; border-radius:6px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Configurar Wi-Fi do ESP32-PAI</h1>
    <p>Escolha uma rede Wi-Fi disponível ou use a rede já salva, depois informe a senha.</p>
  )HTML";

  if (extraMessage.length() > 0) {
    page += "<div class=\"msg\">" + extraMessage + "</div>";
  }

  // Bloco com redes encontradas via scan (preenchido pelo handlePortalRoot)
  page += R"HTML(
        <div style="margin:16px 0; padding:12px; border-radius:10px; background:#020617;">
          <strong>Redes Wi-Fi próximas</strong>
          <div id="networks" style="margin-top:8px;"></div>
          <small>Toque em uma rede para preencher o nome automaticamente.</small>
        </div>
        <form method="POST" action="/save">
          <label>Nome da Rede (SSID)</label>
  )HTML";
  page += "<input id=\"ssid-input\" name=\"ssid\" placeholder=\"MinhaRede\" value=\"" + wifiSsid + "\" required />";
  page += R"HTML(
          <label>Senha</label>
  )HTML";
  page += "<input id=\"password-input\" type=\"password\" name=\"password\" placeholder=\"********\" value=\"" + wifiPassword + "\" required />";
  page += R"HTML(
          <button type="submit">Salvar e Conectar</button>
        </form>
        <small>Após conectar, este portal mostrará o IP do ESP32 para configurar o back-end e a câmera.</small>
      </div>
      <script>
        // redesData será injetado dinamicamente como JSON pelo firmware
        if (typeof redesData !== 'undefined' && Array.isArray(redesData)) {
          var container = document.getElementById('networks');
          if (container && redesData.length > 0) {
            redesData.forEach(function(item) {
              var btn = document.createElement('button');
              btn.type = 'button';
              btn.textContent = item.ssid + ' (' + item.rssi + ' dBm)';
              btn.style.display = 'block';
              btn.style.width = '100%';
              btn.style.marginBottom = '6px';
              btn.style.padding = '8px 10px';
              btn.style.borderRadius = '999px';
              btn.style.border = 'none';
              btn.style.background = '#1d4ed8';
              btn.style.color = '#e2e8f0';
              btn.style.cursor = 'pointer';
              btn.onclick = function() {
                var ssidInput = document.getElementById('ssid-input');
                if (ssidInput) ssidInput.value = item.ssid;
                var passInput = document.getElementById('password-input');
                if (passInput) passInput.focus();
              };
              container.appendChild(btn);
            });
          } else if (container) {
            container.textContent = 'Nenhuma rede encontrada. Tente aproximar o ESP32 do roteador e atualizar a página.';
          }
        }
      </script>
    </body>
    </html>
  )HTML";

  return page;
}

String buildResultPage(bool success, const String& ssid, const String& ip, const String& extraMessage) {
  String color = success ? "#4ade80" : "#f87171";
  String status = success ? "Conectado com sucesso" : "Falha na conexão";
  String page = R"HTML(
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Resultado da Configuração</title>
      <style>
        body { font-family: Arial, sans-serif; background:#0f172a; color:#f8fafc; padding:20px; }
        .card { max-width:520px; margin:0 auto; background:#1e293b; border-radius:16px; padding:24px; box-shadow:0 10px 40px rgba(15,23,42,0.6); }
        h1 { margin:0 0 12px 0; }
        .status { font-weight:700; margin-bottom:12px; }
        code { background:#0f172a; padding:4px 6px; border-radius:6px; color:#38bdf8; }
        a { color:#38bdf8; }
      </style>
    </head>
    <body>
      <div class="card">
  )HTML";

  page += "<div class=\"status\" style=\"color:" + color + ";\">" + status + "</div>";
  page += "<p><strong>Rede:</strong> " + ssid + "</p>";
  if (success) {
    page += "<p><strong>IP do ESP32:</strong> <code>" + ip + "</code></p>";
    page += "<p>Use este IP nos módulos:<br/>"
            "• Back-end/WebSocket: ws://" + ip + ":3000/esp32<br/>"
            "• ESP32-CAM/App: ws://" + ip + ":3000/esp32-cam</p>";
  }

  if (extraMessage.length() > 0) {
    page += "<p>" + extraMessage + "</p>";
  }

  page += R"HTML(
        <p>Você pode fechar esta página após anotar as informações.</p>
      </div>
    </body>
    </html>
  )HTML";

  return page;
}

void handlePortalRoot() {
  // Faz um scan de redes sempre que alguém abre a página do portal
  Serial.println("\n📡 Escaneando redes Wi-Fi para o portal...");
  int n = WiFi.scanNetworks();

  // Monta um pequeno JSON com ssid e rssi para injetar na página
  String networksJson = "[";
  for (int i = 0; i < n; i++) {
    if (i > 0) networksJson += ",";
    networksJson += "{\"ssid\":\"" + WiFi.SSID(i) + "\",\"rssi\":" + String(WiFi.RSSI(i)) + "}";
  }
  networksJson += "]";

  String page = buildPortalPage();
  // Injeta o JSON na página como variável global "redesData"
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
  Serial.println("📴 Portal cativo encerrado. Continuando operação normal.");
}

void handlePortalSave() {
  if (!configServer.hasArg("ssid") || !configServer.hasArg("password")) {
    configServer.send(400, "text/plain", "SSID e senha são obrigatórios");
    return;
  }

  String newSsid = configServer.arg("ssid");
  String newPassword = configServer.arg("password");

  if (newSsid.isEmpty() || newPassword.isEmpty()) {
    configServer.send(400, "text/plain", "Valores inválidos");
    return;
  }

  bool connected = attemptWiFiConnection(newSsid, newPassword, true);
  if (connected) {
    wifiSsid = newSsid;
    wifiPassword = newPassword;
    saveWifiCredentials(newSsid, newPassword);
    wifiConnected = true;
    initializeCoreSystems();

    String html = buildResultPage(true, newSsid, WiFi.localIP().toString(),
      "O ESP32 permanecerá online e o portal será encerrado em alguns segundos.");
    configServer.send(200, "text/html", html);

    pendingPortalClose = true;
    portalCloseAt = millis() + 5000;
  } else {
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
  Serial.println("🔐 Abrindo portal para configurar Wi-Fi do ESP32-PAI");
  Serial.printf("   SSID do AP: %s\n", CAPTIVE_AP_SSID);
  Serial.printf("   Senha: %s\n", CAPTIVE_AP_PASS);
  Serial.printf("   Acesse: http://%s para configurar\n", apIP.toString().c_str());

  configServer.on("/", handlePortalRoot);
  configServer.on("/save", HTTP_POST, handlePortalSave);
  configServer.onNotFound(handlePortalRoot);
  configServer.begin();
}

void initializeCoreSystems() {
  if (systemsInitialized || WiFi.status() != WL_CONNECTED) {
    return;
  }

  systemsInitialized = true;
  wifiConnected = true;

  Serial.println("\n🌐 Conexão estabelecida. Preparando ESP-NOW e WebSocket...");
  Serial.printf("   IP: %s | Canal: %d\n", WiFi.localIP().toString().c_str(), WiFi.channel());
  Serial.printf("   MAC do ESP32-PAI: %s\n", WiFi.macAddress().c_str());

  if (esp_now_init() != ESP_OK) {
    Serial.println("❌ Erro ao inicializar ESP-NOW");
    return;
  }
  
  Serial.println("✅ ESP-NOW inicializado!");
  Serial.printf("   ESP-NOW usa canal WiFi: %d\n", WiFi.channel());
  
  esp_now_register_recv_cb(OnDataRecv);
  esp_now_register_send_cb(OnDataSent);

  esp_now_peer_info_t peerInfo1 = {};
  memcpy(peerInfo1.peer_addr, modulo1Address, 6);
  peerInfo1.channel = 0;
  peerInfo1.encrypt = false;
  peerInfo1.ifidx = WIFI_IF_STA;
  
  if (esp_now_add_peer(&peerInfo1) != ESP_OK) {
    Serial.println("❌ Falha ao adicionar Sensor como peer");
  } else {
    Serial.println("✅ Sensor (Módulo 1) registrado como peer");
  }

  esp_now_peer_info_t peerInfo3 = {};
  memcpy(peerInfo3.peer_addr, modulo3Address, 6);
  peerInfo3.channel = 0;
  peerInfo3.encrypt = false;
  peerInfo3.ifidx = WIFI_IF_STA;
  
  if (esp_now_add_peer(&peerInfo3) != ESP_OK) {
    Serial.println("❌ Falha ao adicionar Motor como peer");
  } else {
    Serial.println("✅ Motor (Módulo 3) registrado como peer");
  }

  Serial.printf("\n🔌 Configurando WebSocket... Servidor: %s:%d | Path: %s | SSL: %s\n",
                wsServer, wsPort, wsPath, useSSL ? "SIM" : "NÃO");

  if (useSSL) {
    webSocket.beginSSL(wsServer, wsPort, wsPath);
  } else {
    webSocket.begin(wsServer, wsPort, wsPath);
  }
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(10000);
  webSocket.enableHeartbeat(15000, 3000, 2);

  Serial.println("\n╔══════════════════════════════════════╗");
  Serial.println("║  ✅ SISTEMA PRONTO!                  ║");
  Serial.println("╠══════════════════════════════════════╣");
  Serial.println("║  📡 ESP-NOW: ATIVO                   ║");
  Serial.println("║     Aguardando Módulo 1 (Sensor)     ║");
  Serial.println("║     Módulo 3 (Motor) registrado      ║");
  Serial.println("║                                      ║");
  Serial.println("║  🔌 WebSocket: Conectando...         ║");
  Serial.println("║     (Não bloqueia ESP-NOW)           ║");
  Serial.println("╚══════════════════════════════════════╝\n");
}

// ===========================
// ESP-NOW CALLBACKS
// ===========================
void OnDataRecv(const uint8_t * mac, const uint8_t *incomingData, int len) {
  char macStr[18];
  snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X",
           mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  
  // Verificar se é do Módulo 1 comparando MAC
  bool isModulo1 = (mac[0] == modulo1Address[0] && 
                    mac[1] == modulo1Address[1] && 
                    mac[2] == modulo1Address[2] && 
                    mac[3] == modulo1Address[3] && 
                    mac[4] == modulo1Address[4] && 
                    mac[5] == modulo1Address[5]);
  
  // Receber dados do Módulo 1 (Sensor)
  if (isModulo1 && len == sizeof(struct_sensor_data)) {
    memcpy(&sensorData, incomingData, sizeof(sensorData));
    lastSensorUpdate = millis();
    
    Serial.println("\n╔════════════════════════════════╗");
    Serial.println("║     SENSOR (Módulo 1)          ║");
    Serial.println("╚════════════════════════════════╝");
    Serial.printf("📍 MAC: %s\n", macStr);
    Serial.printf("📏 Distância: %d cm\n", sensorData.distance);
  Serial.printf("🌡️  Temperatura: %.2f °C\n", sensorData.temperature);
  Serial.printf("💧 Umidade: %.2f %%\n", sensorData.humidity);
    
    // Determinar nível de vibração baseado na distância
    int vibLevel = 0;
    const char* alertLevel = "info";
    const char* alertMsg = "Caminho livre";
    
    if (sensorData.distance < 20) {
      vibLevel = 3; // FORTE
      alertLevel = "danger";
      alertMsg = "⚠️ PERIGO! Objeto muito próximo";
      Serial.println("🔴 Intensidade: FORTE (nível 3)");
    } else if (sensorData.distance < 50) {
      vibLevel = 2; // MÉDIO
      alertLevel = "warning";
      alertMsg = "⚠️ ATENÇÃO! Objeto próximo";
      Serial.println("🟡 Intensidade: MÉDIA (nível 2)");
    } else if (sensorData.distance < 100) {
      vibLevel = 1; // BAIXO
      alertLevel = "info";
      alertMsg = "Cuidado! Objeto detectado";
      Serial.println("🟢 Intensidade: BAIXA (nível 1)");
    } else {
      vibLevel = 0;
      Serial.println("✅ Intensidade: PARADO (nível 0)");
    }
    
    // Enviar comando para o Módulo 3 (Motor)
    motorCommand.vibrationLevel = vibLevel;
    motorCommand.moduleId = 3;
    
    esp_err_t result = esp_now_send(modulo3Address, (uint8_t*)&motorCommand, sizeof(motorCommand));
    
    if (result == ESP_OK) {
      Serial.println("✅ Comando enviado ao Motor");
      lastMotorCommandSent = millis();
    } else {
      Serial.println("❌ Erro ao enviar comando ao Motor");
    }
    
    // Enviar dados detalhados via WebSocket
    if (wsConnected) {
      StaticJsonDocument<512> doc;
      doc["type"] = "sensor_update";
      doc["distance"] = sensorData.distance;
      doc["vibrationLevel"] = vibLevel;
      doc["alertLevel"] = alertLevel;
      doc["alertMsg"] = alertMsg;
      doc["moduleId"] = 1;
      doc["rssi"] = WiFi.RSSI();
      doc["timestamp"] = millis();
  doc["temperature"] = sensorData.temperature;
  doc["humidity"] = sensorData.humidity;
  doc["sensorOk"] = sensorData.sensorOk > 0;
      
      String output;
      serializeJson(doc, output);
      webSocket.sendTXT(output);
      Serial.println("📤 Dados enviados via WebSocket");
    }
    
    // Enviar alerta se necessário
    if (vibLevel > 0) {
      sendAlert(alertLevel, alertMsg, sensorData.distance);
    }
    
    Serial.println("════════════════════════════════\n");
  }
}

void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  // Serial.printf("📤 Status envio: %s\n", status == ESP_NOW_SEND_SUCCESS ? "OK" : "FALHA");
}

// ===========================
// SETUP
// ===========================
void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n\n╔════════════════════════════════════╗");
  Serial.println("║  ESP32-PAI - MESTRE (BROADCAST) + WEBSOCKET  ║");
  Serial.println("╚════════════════════════════════════╝\n");

  // Opção para resetar credenciais Wi-Fi (pressione 'r' no Serial Monitor)
  Serial.println("🔄 Pressione 'r' dentro de 3 segundos para resetar credenciais Wi-Fi salvas...");
  unsigned long start = millis();
  while (millis() - start < 3000) {
    if (Serial.available() && Serial.read() == 'r') {
      Serial.println("🗑️  Limpando credenciais Wi-Fi salvas...");
      preferences.begin("wifi-config", false);
      preferences.clear();
      preferences.end();
      Serial.println("✅ Credenciais limpas! Reiniciando ESP32...");
      delay(1000);
      ESP.restart();
    }
    delay(10);
  }
  Serial.println("⏭️  Continuando inicialização normal...");

  preferencesReady = preferences.begin("wifi-config", false);
  if (!preferencesReady) {
    Serial.println("⚠️  Não foi possível inicializar Preferences. Usando credenciais padrão.");
  }

  loadWifiCredentials();
  if (wifiSsid.isEmpty()) wifiSsid = defaultSsid;
  if (wifiPassword.isEmpty()) wifiPassword = defaultPassword;

  bool connected = attemptWiFiConnection(wifiSsid, wifiPassword);
  wifiConnected = connected;

  if (connected) {
    initializeCoreSystems();
  } else {
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
      stopCaptivePortal();
    }
  }

  if (!wifiConnected && WiFi.status() == WL_CONNECTED) {
    Serial.println("✅ WiFi conectado. Iniciando serviços...");
    wifiConnected = true;
    initializeCoreSystems();
  }

  if (wifiConnected && WiFi.status() != WL_CONNECTED && !captivePortalActive) {
    Serial.println("⚠️  WiFi desconectado. Tentando reconectar...");
    wifiConnected = false;
    wsConnected = false;
    systemsInitialized = false;

    bool reconnected = attemptWiFiConnection(wifiSsid, wifiPassword);
    wifiConnected = reconnected;
    if (reconnected) {
      initializeCoreSystems();
    } else {
      startCaptivePortal();
    }
  }

  webSocket.loop();
  
  if (wsConnected && (millis() - lastStatusSend >= STATUS_INTERVAL)) {
    sendRealtimeStatus();
    lastStatusSend = millis();
  }
  
  delay(10);
}

// ╔════════════════════════════════════════╗
// ║   MÓDULO 1 - SENSOR HC-SR04        ║
// ╚════════════════════════════════════════╝
// 📍 MAC Address: D0:EF:76:15:8F:04
// 📡 Canal WiFi: 1
// 📡 MAC do PAI: EC:64:C9:7C:38:30
// ✅ ESP-NOW inicializado!
// ✅ ESP32-PAI registrado como peer!
// ╔════════════════════════════════════╗
// ║  ESP32-PAI - MESTRE (BROADCAST) + WEBSOCKET  ║
// ╚════════════════════════════════════╝

// 📡 Conectando ao WiFi.....................✅ WiFi conectado!
//    IP: 192.168.100.56
//    MAC: EC:64:C9:7C:38:30
//    Canal WiFi: 4
//    IMPORTANTE: Use este MAC no Módulo 1 e Câmera!
