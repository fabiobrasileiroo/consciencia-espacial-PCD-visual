/*
 * ESP32-CAM - Servidor HTTP para Captura de Imagens
 * 
 * Este código transforma o ESP32-CAM em um servidor HTTP
 * que pode ser acessado pelo servidor Node.js para captura
 * de frames e processamento com TensorFlow
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <WebServer.h>

// ===== CONFIGURAÇÃO WIFI =====
const char* ssid = "SEU_WIFI_AQUI";         // 👈 MODIFIQUE
const char* password = "SUA_SENHA_AQUI";     // 👈 MODIFIQUE

// ===== SERVIDOR WEB =====
WebServer server(80);

// ===== PINOS DA CÂMERA (AI-Thinker) =====
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

// ===== CONFIGURAR CÂMERA =====
bool setupCamera() {
  camera_config_t config;
  
  // Pinos
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
  
  // Configurações da imagem
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  
  // Resolução e qualidade
  // FRAMESIZE_QVGA (320x240) - Rápido
  // FRAMESIZE_VGA (640x480)  - Médio (RECOMENDADO)
  // FRAMESIZE_SVGA (800x600) - Lento mas melhor qualidade
  config.frame_size = FRAMESIZE_VGA;
  config.jpeg_quality = 12; // 0-63 (menor = melhor qualidade)
  config.fb_count = 1;

  // Inicializar câmera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("❌ Falha ao iniciar câmera: 0x%x\n", err);
    return false;
  }

  // Ajustes de sensor (opcional)
  sensor_t * s = esp_camera_sensor_get();
  if (s) {
    s->set_brightness(s, 0);     // -2 to 2
    s->set_contrast(s, 0);       // -2 to 2
    s->set_saturation(s, 0);     // -2 to 2
    s->set_whitebal(s, 1);       // 0 = disable , 1 = enable
    s->set_awb_gain(s, 1);       // 0 = disable , 1 = enable
    s->set_wb_mode(s, 0);        // 0 to 4
    s->set_exposure_ctrl(s, 1);  // 0 = disable , 1 = enable
    s->set_aec2(s, 0);           // 0 = disable , 1 = enable
    s->set_gain_ctrl(s, 1);      // 0 = disable , 1 = enable
    s->set_agc_gain(s, 0);       // 0 to 30
    s->set_gainceiling(s, (gainceiling_t)0);  // 0 to 6
  }

  Serial.println("✅ Câmera inicializada!");
  return true;
}

// ===== ROTA: /capture =====
// Captura uma foto e retorna JPEG
void handleCapture() {
  Serial.println("📸 Capturando imagem...");
  
  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("❌ Falha ao capturar imagem");
    server.send(500, "text/plain", "Camera capture failed");
    return;
  }

  Serial.printf("✅ Imagem capturada: %d bytes\n", fb->len);
  
  // Enviar JPEG
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send_P(200, "image/jpeg", (const char *)fb->buf, fb->len);
  
  // Liberar buffer
  esp_camera_fb_return(fb);
}

// ===== ROTA: /status =====
// Retorna status do ESP32-CAM
void handleStatus() {
  String json = "{";
  json += "\"status\":\"online\",";
  json += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
  json += "\"rssi\":" + String(WiFi.RSSI()) + ",";
  json += "\"uptime\":" + String(millis() / 1000) + ",";
  json += "\"free_heap\":" + String(ESP.getFreeHeap());
  json += "}";
  
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", json);
}

// ===== ROTA: / (raiz) =====
void handleRoot() {
  String html = "<!DOCTYPE html><html><head>";
  html += "<meta charset='UTF-8'>";
  html += "<title>ESP32-CAM - Servidor</title>";
  html += "<style>";
  html += "body { font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px; }";
  html += "h1 { color: #333; }";
  html += "img { max-width: 100%; border: 2px solid #ddd; margin: 20px 0; }";
  html += "button { background: #007bff; color: white; border: none; padding: 10px 20px; font-size: 16px; cursor: pointer; margin: 5px; }";
  html += "button:hover { background: #0056b3; }";
  html += ".info { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 10px 0; }";
  html += "</style>";
  html += "</head><body>";
  html += "<h1>📷 ESP32-CAM Servidor</h1>";
  html += "<div class='info'>";
  html += "<strong>IP:</strong> " + WiFi.localIP().toString() + "<br>";
  html += "<strong>RSSI:</strong> " + String(WiFi.RSSI()) + " dBm<br>";
  html += "<strong>Uptime:</strong> " + String(millis() / 1000) + "s";
  html += "</div>";
  html += "<button onclick='capture()'>📸 Capturar Foto</button>";
  html += "<button onclick='location.reload()'>🔄 Atualizar</button>";
  html += "<div id='image'></div>";
  html += "<h2>📡 Endpoints</h2>";
  html += "<ul>";
  html += "<li><code>GET /capture</code> - Captura uma foto (JPEG)</li>";
  html += "<li><code>GET /status</code> - Status do sistema (JSON)</li>";
  html += "</ul>";
  html += "<script>";
  html += "function capture() {";
  html += "  document.getElementById('image').innerHTML = '<img src=\"/capture?t=' + Date.now() + '\" />';";
  html += "}";
  html += "</script>";
  html += "</body></html>";
  
  server.send(200, "text/html", html);
}

// ===== SETUP =====
void setup() {
  Serial.begin(115200);
  Serial.println("\n\n╔══════════════════════════════════════╗");
  Serial.println("║  ESP32-CAM - Servidor de Imagens  ║");
  Serial.println("╚══════════════════════════════════════╝\n");

  // Configurar câmera
  if (!setupCamera()) {
    Serial.println("❌ Erro fatal - reiniciando...");
    delay(3000);
    ESP.restart();
  }

  // Conectar WiFi
  Serial.print("📡 Conectando ao WiFi");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\n❌ Falha ao conectar WiFi - reiniciando...");
    delay(3000);
    ESP.restart();
  }
  
  Serial.println("\n✅ WiFi conectado!");
  Serial.print("📍 IP: ");
  Serial.println(WiFi.localIP());
  Serial.print("📶 RSSI: ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");

  // Configurar rotas
  server.on("/", handleRoot);
  server.on("/capture", handleCapture);
  server.on("/status", handleStatus);
  
  // Iniciar servidor
  server.begin();
  Serial.println("🌐 Servidor HTTP iniciado!");
  Serial.println("\n✅ Sistema pronto!");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// ===== LOOP =====
void loop() {
  server.handleClient();
  delay(1); // Evitar watchdog
}
