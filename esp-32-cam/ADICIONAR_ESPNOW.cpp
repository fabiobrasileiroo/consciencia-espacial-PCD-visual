/**
 * ESP32-CAM - Integração com ESP-NOW + HTTP Server
 * 
 * Esta versão da ESP32-CAM mantém o servidor HTTP para streaming/captura
 * E ADICIONA ESP-NOW para comunicação com o ESP32-PAI
 * 
 * Funcionalidades:
 * - ✅ Servidor HTTP para /capture e /stream (para Node.js)
 * - ✅ ESP-NOW para enviar heartbeat ao PAI
 * - ✅ Dual mode: HTTP + ESP-NOW
 * 
 * Arquivo: esp-32-cam/src/main.cpp (ADICIONAR ao código existente)
 */

#include <esp_now.h>
#include <WiFi.h>
#include <esp_wifi.h>

// ===== MAC ADDRESS DO ESP32-PAI =====
// SUBSTITUA PELO MAC DO SEU ESP32-PAI
uint8_t paiMacAddress[] = {0xEC, 0x64, 0xC9, 0x7C, 0x38, 0x30};

// ===== ESTRUTURA DE DADOS =====
typedef struct struct_camera_status {
  int moduleId;           // 2 = camera
  bool capturing;         // Se está capturando frames
  int frameCount;         // Quantidade de frames capturados
  long rssi;              // Sinal WiFi
  unsigned long uptime;   // Tempo ligado (ms)
} struct_camera_status;

struct_camera_status cameraStatus;

// ===== VARIÁVEIS DE CONTROLE =====
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 3000;  // Enviar status a cada 3s

// ===== CALLBACK ESP-NOW: Confirmação de Envio =====
void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  if (status == ESP_NOW_SEND_SUCCESS) {
    Serial.println("📤 Heartbeat enviado ao PAI");
  } else {
    Serial.println("❌ Falha ao enviar heartbeat");
  }
}

// ===== ENVIAR HEARTBEAT AO PAI =====
void sendHeartbeatToPAI() {
  cameraStatus.moduleId = 2;  // ID da câmera
  cameraStatus.capturing = true;
  cameraStatus.frameCount++;
  cameraStatus.rssi = WiFi.RSSI();
  cameraStatus.uptime = millis();
  
  esp_err_t result = esp_now_send(paiMacAddress, (uint8_t*)&cameraStatus, sizeof(cameraStatus));
  
  if (result == ESP_OK) {
    Serial.println("💓 Heartbeat: Câmera online");
  } else {
    Serial.printf("❌ Erro ESP-NOW: %d\n", result);
  }
}

// ===== ADICIONAR NO SETUP() =====
void setupESPNOW() {
  // WiFi já está em modo AP para o servidor HTTP
  // Adicionar modo STA para ESP-NOW
  WiFi.mode(WIFI_AP_STA);
  
  // Inicializar ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("❌ Erro ao iniciar ESP-NOW");
    return;
  }
  
  Serial.println("✅ ESP-NOW inicializado");
  
  // Registrar callback
  esp_now_register_send_cb(OnDataSent);
  
  // Adicionar peer (ESP32-PAI)
  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, paiMacAddress, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;
  
  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("❌ Erro ao adicionar PAI como peer");
  } else {
    Serial.println("✅ PAI adicionado como peer");
  }
}

// ===== ADICIONAR NO LOOP() =====
void loopESPNOW() {
  // Enviar heartbeat periódico
  if (millis() - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    sendHeartbeatToPAI();
    lastHeartbeat = millis();
  }
}

// ===== CÓDIGO COMPLETO PARA ADICIONAR NO MAIN.CPP =====
/*

// No topo do arquivo (após os includes existentes):
#include <esp_now.h>

// Após as variáveis globais:
uint8_t paiMacAddress[] = {0xEC, 0x64, 0xC9, 0x7C, 0x38, 0x30};

typedef struct struct_camera_status {
  int moduleId;
  bool capturing;
  int frameCount;
  long rssi;
  unsigned long uptime;
} struct_camera_status;

struct_camera_status cameraStatus = {2, false, 0, 0, 0};
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 3000;

void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  if (status == ESP_NOW_SEND_SUCCESS) {
    Serial.println("📤 Heartbeat enviado");
  }
}

void sendHeartbeatToPAI() {
  cameraStatus.capturing = true;
  cameraStatus.frameCount++;
  cameraStatus.rssi = WiFi.RSSI();
  cameraStatus.uptime = millis();
  
  esp_now_send(paiMacAddress, (uint8_t*)&cameraStatus, sizeof(cameraStatus));
}

// No setup() (após startCameraServer):
void setup() {
  // ... código existente ...
  
  startCameraServer();
  
  // ADICIONAR:
  WiFi.mode(WIFI_AP_STA);  // Manter AP + adicionar STA
  
  if (esp_now_init() == ESP_OK) {
    Serial.println("✅ ESP-NOW OK");
    esp_now_register_send_cb(OnDataSent);
    
    esp_now_peer_info_t peerInfo = {};
    memcpy(peerInfo.peer_addr, paiMacAddress, 6);
    peerInfo.channel = 0;
    peerInfo.encrypt = false;
    esp_now_add_peer(&peerInfo);
  }
}

// No loop():
void loop() {
  // Enviar heartbeat a cada 3s
  if (millis() - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    sendHeartbeatToPAI();
    lastHeartbeat = millis();
  }
  
  delay(100);
}

*/

// ===== MODIFICAR ESP32-PAI PARA RECEBER =====
/*

No ESP32-PAI, modificar a estrutura de recebimento para suportar múltiplos tipos:

// Estrutura genérica para receber
typedef struct struct_receive {
  int moduleId;    // 1=sensor, 2=camera, 3=motor
  int data1;       // distance OU frameCount
  int data2;       // rssi
  unsigned long timestamp;
} struct_receive;

void OnDataRecv(const uint8_t *mac_addr, const uint8_t *data, int len) {
  struct_receive receivedData;
  memcpy(&receivedData, data, len);
  
  Serial.printf("\n📥 Módulo %d\n", receivedData.moduleId);
  
  if (receivedData.moduleId == 1) {
    // Módulo Sensor
    esp32Status.sensorConnected = true;
    esp32Status.distance = receivedData.data1;
    Serial.printf("📏 Distância: %d cm\n", receivedData.data1);
    
    // Calcular vibração e enviar
    int vibLevel = calculateVibrationLevel(receivedData.data1);
    sendVibrationCommand(vibLevel);
    
    // WebSocket: Enviar status sensor + motor
    sendRealtimeStatus("sensor", receivedData.data1, 0);
    sendRealtimeStatus("motor", 0, vibLevel);
  }
  else if (receivedData.moduleId == 2) {
    // Módulo Câmera (heartbeat)
    esp32Status.cameraConnected = true;
    esp32Status.lastCameraUpdate = millis();
    Serial.printf("📷 Câmera: %d frames, RSSI: %d\n", 
                  receivedData.data1, receivedData.data2);
    
    // WebSocket: Enviar status câmera
    sendRealtimeStatus("camera", 0, 0);
  }
}

*/
