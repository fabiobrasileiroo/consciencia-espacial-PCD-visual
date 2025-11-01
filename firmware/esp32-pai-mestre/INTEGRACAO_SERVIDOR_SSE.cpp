/**
 * ESP32-PAI - Integração com Servidor Node.js (SSE)
 * 
 * Adicione este código ao firmware do ESP32-PAI para enviar
 * dados de status ao servidor Node.js via HTTP POST.
 * 
 * Arquivo: firmware/esp32-pai-mestre/src/main.cpp
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ===== CONFIGURAÇÃO WIFI =====
const char* ssid = "SUA_REDE_WIFI";
const char* password = "SUA_SENHA_WIFI";

// ===== CONFIGURAÇÃO SERVIDOR =====
const char* serverUrl = "http://192.168.100.XXX:3000/api/esp32/status-update";
// Substitua XXX pelo IP do computador rodando o servidor Node.js

// ===== VARIÁVEIS DE ESTADO =====
unsigned long lastStatusUpdate = 0;
const unsigned long STATUS_UPDATE_INTERVAL = 2000; // Enviar a cada 2 segundos

// ===== ESTRUTURA DE DADOS DOS MÓDULOS =====
struct ESP32Status {
  bool paiConnected = true;  // PAI sempre conectado (é ele mesmo)
  bool sensorConnected = false;
  bool motorConnected = false;
  bool cameraConnected = false;
  
  int distance = 0;          // Distância do sensor (cm)
  int vibrationLevel = 0;    // Nível de vibração (0-3)
};

ESP32Status esp32Status;

void setup() {
  Serial.begin(115200);
  
  // Conectar ao WiFi
  WiFi.begin(ssid, password);
  Serial.print("Conectando ao WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("✅ WiFi conectado!");
  Serial.print("📍 IP do ESP32-PAI: ");
  Serial.println(WiFi.localIP());
  
  // Resto do setup (ESP-NOW, etc)
  // ...
}

void loop() {
  // Seu código ESP-NOW existente aqui
  // ...
  
  // Enviar status ao servidor a cada 2 segundos
  if (millis() - lastStatusUpdate >= STATUS_UPDATE_INTERVAL) {
    sendStatusToServer();
    lastStatusUpdate = millis();
  }
}

// ===== ENVIAR STATUS AO SERVIDOR =====
void sendStatusToServer() {
  // Verificar se WiFi está conectado
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi desconectado");
    return;
  }
  
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  // ===== 1. Enviar status do PAI (ele mesmo) =====
  sendModuleStatus("pai", true, 0, 0);
  
  // ===== 2. Enviar status do Sensor =====
  if (esp32Status.sensorConnected) {
    sendModuleStatus("sensor", true, esp32Status.distance, 0);
  }
  
  // ===== 3. Enviar status do Motor =====
  if (esp32Status.motorConnected) {
    sendModuleStatus("motor", true, 0, esp32Status.vibrationLevel);
  }
  
  // ===== 4. Enviar status da Câmera =====
  // A câmera atualiza seu próprio status via ping
  // Mas PAI pode informar se está recebendo frames
  sendModuleStatus("camera", esp32Status.cameraConnected, 0, 0);
}

// ===== FUNÇÃO AUXILIAR: ENVIAR STATUS DE UM MÓDULO =====
void sendModuleStatus(const char* moduleId, bool connected, int distance, int vibrationLevel) {
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  // Criar JSON
  StaticJsonDocument<256> doc;
  doc["moduleId"] = moduleId;
  doc["connected"] = connected;
  
  if (distance > 0) {
    doc["distance"] = distance;
  }
  
  if (vibrationLevel >= 0) {
    doc["vibrationLevel"] = vibrationLevel;
  }
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Enviar POST
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("✅ Status enviado [%s]: %d - %s\n", moduleId, httpResponseCode, response.c_str());
  } else {
    Serial.printf("❌ Erro ao enviar status [%s]: %s\n", moduleId, http.errorToString(httpResponseCode).c_str());
  }
  
  http.end();
}

// ===== CALLBACK ESP-NOW: RECEBER DADOS DO SENSOR =====
void OnDataRecv(const uint8_t *mac_addr, const uint8_t *data, int len) {
  // Identificar módulo pela MAC address
  char macStr[18];
  snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X",
           mac_addr[0], mac_addr[1], mac_addr[2], 
           mac_addr[3], mac_addr[4], mac_addr[5]);
  
  Serial.printf("📥 Dados recebidos de: %s\n", macStr);
  
  // Processar dados (exemplo: sensor de distância)
  if (len >= 4) {
    int distance = *((int*)data);
    Serial.printf("📏 Distância: %d cm\n", distance);
    
    // Atualizar status
    esp32Status.sensorConnected = true;
    esp32Status.distance = distance;
    
    // Calcular nível de vibração
    int vibrationLevel = calculateVibrationLevel(distance);
    esp32Status.vibrationLevel = vibrationLevel;
    
    // Enviar comando ao motor
    sendVibrationCommand(vibrationLevel);
  }
}

// ===== CALCULAR NÍVEL DE VIBRAÇÃO BASEADO NA DISTÂNCIA =====
int calculateVibrationLevel(int distance) {
  if (distance < 20) return 3;        // FORTE
  else if (distance < 50) return 2;   // MÉDIO
  else if (distance < 100) return 1;  // BAIXO
  else return 0;                      // PARADO
}

// ===== ENVIAR COMANDO DE VIBRAÇÃO AO MÓDULO MOTOR =====
void sendVibrationCommand(int level) {
  // MAC address do Modulo3-Motor
  uint8_t motorMacAddress[] = {0x24, 0x0A, 0xC4, 0xXX, 0xXX, 0xXX};
  
  // Enviar nível de vibração via ESP-NOW
  esp_err_t result = esp_now_send(motorMacAddress, (uint8_t*)&level, sizeof(level));
  
  if (result == ESP_OK) {
    Serial.printf("✅ Comando de vibração enviado: Nível %d\n", level);
    esp32Status.motorConnected = true;
  } else {
    Serial.printf("❌ Erro ao enviar comando de vibração: %d\n", result);
    esp32Status.motorConnected = false;
  }
}

// ===== MONITORAR CONEXÃO DA CÂMERA =====
// Ping periódico na câmera ESP32-CAM
void checkCameraConnection() {
  HTTPClient http;
  http.begin("http://192.168.100.56/"); // IP da ESP32-CAM
  http.setTimeout(2000); // Timeout de 2 segundos
  
  int httpCode = http.GET();
  
  if (httpCode > 0) {
    esp32Status.cameraConnected = true;
    Serial.println("✅ Câmera ESP32-CAM: Online");
  } else {
    esp32Status.cameraConnected = false;
    Serial.println("❌ Câmera ESP32-CAM: Offline");
  }
  
  http.end();
}

// ===== EXEMPLO DE INTEGRAÇÃO NO LOOP =====
/*
void loop() {
  static unsigned long lastCameraCheck = 0;
  
  // Verificar câmera a cada 5 segundos
  if (millis() - lastCameraCheck >= 5000) {
    checkCameraConnection();
    lastCameraCheck = millis();
  }
  
  // Enviar status ao servidor a cada 2 segundos
  if (millis() - lastStatusUpdate >= STATUS_UPDATE_INTERVAL) {
    sendStatusToServer();
    lastStatusUpdate = millis();
  }
  
  // Resto do código...
}
*/

// ===== DEPENDÊNCIAS (platformio.ini) =====
/*
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino

lib_deps =
    bblanchon/ArduinoJson@^6.21.3
    espressif/esp32-camera@^2.0.4
*/

// ===== EXEMPLO DE SAÍDA SERIAL =====
/*
✅ WiFi conectado!
📍 IP do ESP32-PAI: 192.168.100.10
📥 Dados recebidos de: 24:0A:C4:12:34:56
📏 Distância: 45 cm
✅ Comando de vibração enviado: Nível 2
✅ Status enviado [pai]: 200 - {"success":true,"status":{"connected":true,"lastSeen":"2025-01-15T10:30:00.000Z"}}
✅ Status enviado [sensor]: 200 - {"success":true,"status":{"connected":true,"distance":45,"level":"médio"}}
✅ Status enviado [motor]: 200 - {"success":true,"status":{"connected":true,"vibrationLevel":2}}
✅ Câmera ESP32-CAM: Online
*/
