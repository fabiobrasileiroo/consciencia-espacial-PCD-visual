/*
 * ESP32-CAM Stream de Vídeo para Image Captioning
 * 
 * Este código configura o ESP32-CAM para transmitir vídeo via WiFi
 * Pode ser usado com o script test_esp32cam.py para gerar legendas
 * 
 * Baseado em: https://github.com/espressif/arduino-esp32/tree/master/libraries/ESP32/examples/Camera/CameraWebServer
 * 
 * CONFIGURAÇÃO:
 * 1. Instale a biblioteca ESP32 no Arduino IDE
 * 2. Selecione: Tools > Board > ESP32 > AI Thinker ESP32-CAM
 * 3. Configure o WiFi (ssid e password abaixo)
 * 4. Faça upload do código
 * 5. Abra o Serial Monitor (115200 baud) para ver o IP
 * 6. Acesse http://IP_DO_ESP32:81/stream no navegador ou Python
 */

#include <WiFi.h>
#include <WiFiClient.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include "esp_camera.h"

// ===== CONFIGURAÇÕES WiFi =====
const char* ssid = "SEU_WIFI_AQUI";        // ⚠️ ALTERE AQUI
const char* password = "SUA_SENHA_AQUI";   // ⚠️ ALTERE AQUI

// ===== Configuração dos pinos do ESP32-CAM (AI-Thinker) =====
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// ===== Configuração do LED Flash =====
#define FLASH_LED_PIN      4
bool flashState = false;

WebServer server(80);

// ===== Configuração da Câmera =====
void configCamera() {
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
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  // Qualidade da imagem (maior = melhor qualidade, maior uso de memória)
  if (psramFound()) {
    config.frame_size = FRAMESIZE_SVGA;    // 800x600
    config.jpeg_quality = 10;              // 0-63 (menor = melhor)
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_VGA;     // 640x480
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  // Inicializar câmera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("❌ Erro ao inicializar câmera: 0x%x\n", err);
    ESP.restart();
  }

  // Configurações adicionais do sensor
  sensor_t* s = esp_camera_sensor_get();
  if (s != NULL) {
    s->set_brightness(s, 0);     // -2 a 2
    s->set_contrast(s, 0);       // -2 a 2
    s->set_saturation(s, 0);     // -2 a 2
    s->set_special_effect(s, 0); // 0 = sem efeito
    s->set_whitebal(s, 1);       // 0 = desligado, 1 = ligado
    s->set_awb_gain(s, 1);       // 0 = desligado, 1 = ligado
    s->set_wb_mode(s, 0);        // 0 a 4
    s->set_exposure_ctrl(s, 1);  // 0 = desligado, 1 = ligado
    s->set_aec2(s, 0);           // 0 = desligado, 1 = ligado
    s->set_ae_level(s, 0);       // -2 a 2
    s->set_aec_value(s, 300);    // 0 a 1200
    s->set_gain_ctrl(s, 1);      // 0 = desligado, 1 = ligado
    s->set_agc_gain(s, 0);       // 0 a 30
    s->set_gainceiling(s, (gainceiling_t)0);  // 0 a 6
    s->set_bpc(s, 0);            // 0 = desligado, 1 = ligado
    s->set_wpc(s, 1);            // 0 = desligado, 1 = ligado
    s->set_raw_gma(s, 1);        // 0 = desligado, 1 = ligado
    s->set_lenc(s, 1);           // 0 = desligado, 1 = ligado
    s->set_hmirror(s, 0);        // 0 = normal, 1 = espelhado
    s->set_vflip(s, 0);          // 0 = normal, 1 = invertido
    s->set_dcw(s, 1);            // 0 = desligado, 1 = ligado
    s->set_colorbar(s, 0);       // 0 = desligado, 1 = ligado
  }

  Serial.println("✅ Câmera inicializada com sucesso!");
}

// ===== Stream MJPEG =====
void handleStream() {
  WiFiClient client = server.client();
  String response = "HTTP/1.1 200 OK\r\n";
  response += "Content-Type: multipart/x-mixed-replace; boundary=frame\r\n\r\n";
  server.sendContent(response);

  while (client.connected()) {
    camera_fb_t* fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("❌ Erro ao capturar frame");
      break;
    }

    String head = "--frame\r\n";
    head += "Content-Type: image/jpeg\r\n\r\n";
    server.sendContent(head);
    
    client.write(fb->buf, fb->len);
    server.sendContent("\r\n");
    
    esp_camera_fb_return(fb);

    // Pequeno delay para não sobrecarregar
    delay(10);
  }
}

// ===== Captura única de imagem =====
void handleCapture() {
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    server.send(500, "text/plain", "Erro ao capturar imagem");
    return;
  }

  server.sendHeader("Content-Disposition", "inline; filename=capture.jpg");
  server.send_P(200, "image/jpeg", (const char*)fb->buf, fb->len);
  
  esp_camera_fb_return(fb);
}

// ===== Controle do Flash =====
void handleFlash() {
  if (server.hasArg("state")) {
    String state = server.arg("state");
    if (state == "on") {
      digitalWrite(FLASH_LED_PIN, HIGH);
      flashState = true;
      server.send(200, "text/plain", "Flash ligado");
    } else if (state == "off") {
      digitalWrite(FLASH_LED_PIN, LOW);
      flashState = false;
      server.send(200, "text/plain", "Flash desligado");
    } else {
      server.send(400, "text/plain", "Estado inválido (use on ou off)");
    }
  } else {
    server.send(400, "text/plain", "Parâmetro 'state' não fornecido");
  }
}

// ===== Página principal =====
void handleRoot() {
  String html = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ESP32-CAM Stream</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      text-align: center;
      background-color: #1a1a1a;
      color: white;
      margin: 0;
      padding: 20px;
    }
    h1 {
      color: #4CAF50;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    img {
      width: 100%;
      max-width: 640px;
      border: 3px solid #4CAF50;
      border-radius: 10px;
    }
    .info {
      background-color: #2a2a2a;
      padding: 15px;
      border-radius: 10px;
      margin: 20px 0;
      text-align: left;
    }
    .info code {
      background-color: #1a1a1a;
      padding: 5px 10px;
      border-radius: 5px;
      display: block;
      margin: 5px 0;
      color: #4CAF50;
    }
    button {
      background-color: #4CAF50;
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      margin: 5px;
    }
    button:hover {
      background-color: #45a049;
    }
    button:active {
      background-color: #3d8b40;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📷 ESP32-CAM Stream</h1>
    
    <img src="/stream" id="stream">
    
    <div style="margin: 20px 0;">
      <button onclick="toggleFlash()">💡 Flash On/Off</button>
      <button onclick="location.reload()">🔄 Recarregar</button>
    </div>
    
    <div class="info">
      <h3>📋 Informações de Uso:</h3>
      <p><strong>Stream URL:</strong></p>
      <code>http://)rawliteral" + WiFi.localIP().toString() + R"rawliteral(:81/stream</code>
      
      <p><strong>Captura única:</strong></p>
      <code>http://)rawliteral" + WiFi.localIP().toString() + R"rawliteral(/capture</code>
      
      <p><strong>Usar no Python:</strong></p>
      <code>python3 test_esp32cam.py --url http://)rawliteral" + WiFi.localIP().toString() + R"rawliteral(:81/stream</code>
    </div>
  </div>
  
  <script>
    let flashOn = false;
    
    function toggleFlash() {
      flashOn = !flashOn;
      fetch('/flash?state=' + (flashOn ? 'on' : 'off'))
        .then(response => response.text())
        .then(data => console.log(data));
    }
  </script>
</body>
</html>
)rawliteral";
  
  server.send(200, "text/html", html);
}

// ===== Setup =====
void setup() {
  Serial.begin(115200);
  Serial.println("\n\n🚀 ESP32-CAM Image Captioning Stream");
  Serial.println("=====================================");

  // Configurar LED Flash
  pinMode(FLASH_LED_PIN, OUTPUT);
  digitalWrite(FLASH_LED_PIN, LOW);

  // Conectar WiFi
  Serial.printf("📡 Conectando ao WiFi: %s\n", ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\n❌ Falha ao conectar ao WiFi!");
    Serial.println("⚠️  Verifique o SSID e senha no código");
    ESP.restart();
  }

  Serial.println("\n✅ WiFi conectado!");
  Serial.print("📍 Endereço IP: ");
  Serial.println(WiFi.localIP());
  Serial.print("📶 Força do sinal: ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");

  // Configurar câmera
  configCamera();

  // Configurar rotas do servidor
  server.on("/", handleRoot);
  server.on("/stream", handleStream);
  server.on("/capture", handleCapture);
  server.on("/flash", handleFlash);

  // Iniciar servidor
  server.begin();
  Serial.println("✅ Servidor web iniciado!");
  Serial.println("\n=====================================");
  Serial.println("🌐 URLs de Acesso:");
  Serial.printf("   Interface Web: http://%s/\n", WiFi.localIP().toString().c_str());
  Serial.printf("   Stream MJPEG:  http://%s:81/stream\n", WiFi.localIP().toString().c_str());
  Serial.printf("   Captura:       http://%s/capture\n", WiFi.localIP().toString().c_str());
  Serial.println("=====================================\n");
}

// ===== Loop =====
void loop() {
  server.handleClient();
  delay(1);
}
