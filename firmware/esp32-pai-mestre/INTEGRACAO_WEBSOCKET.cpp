/**
 * ESP32-PAI - Integração REAL-TIME com Servidor Node.js via WebSocket
 * 
 * Versão otimizada usando WebSocket para comunicação bidirecional em tempo real.
 * Muito mais eficiente que HTTP POST polling!
 * 
 * Vantagens do WebSocket:
 * - ✅ Conexão persistente (baixa latência)
 * - ✅ Bidirecional (servidor pode enviar comandos)
 * - ✅ Menos overhead que HTTP
 * - ✅ Eventos instantâneos
 * 
 * Arquivo: firmware/esp32-pai-mestre/src/main.cpp
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <esp_now.h>

// ===== CONFIGURAÇÃO WIFI =====
const char* ssid = "SUA_REDE_WIFI";
const char* password = "SUA_SENHA_WIFI";

// ===== CONFIGURAÇÃO WEBSOCKET =====
const char* ws_host = "192.168.100.XXX";  // IP do servidor Node.js
const uint16_t ws_port = 8080;            // Porta WebSocket

WebSocketsClient webSocket;

// ===== ESTRUTURA DE DADOS DOS MÓDULOS =====
struct ESP32Status {
  bool paiConnected = true;
  bool sensorConnected = false;
  bool motorConnected = false;
  bool cameraConnected = false;
  
  int distance = 0;
  int vibrationLevel = 0;
  unsigned long lastSensorUpdate = 0;
  unsigned long lastMotorUpdate = 0;
};

ESP32Status esp32Status;

// ===== VARIÁVEIS DE CONTROLE =====
bool wsConnected = false;
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 5000;  // 5 segundos

// ===== CONFIGURAÇÃO ESP-NOW =====
// MAC Address do Módulo 1 (Sensor)
uint8_t modulo1Address[] = {0xD0, 0xEF, 0x76, 0x15, 0x8F, 0x04};

// MAC Address do Módulo 3 (Motor)
uint8_t modulo3Address[] = {0xEC, 0x64, 0xC9, 0x7B, 0x99, 0x8C};

// Estruturas ESP-NOW
typedef struct struct_receive {
  int distance;
  int moduleId;
} struct_receive;

typedef struct struct_send {
  int vibrationLevel;
  int moduleId;
} struct_send;

struct_receive receivedData;
struct_send commandData;

// ===== CALLBACK WEBSOCKET =====
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("🔴 WebSocket desconectado");
      wsConnected = false;
      break;
      
    case WStype_CONNECTED:
      Serial.println("🟢 WebSocket conectado!");
      wsConnected = true;
      
      // Enviar identificação
      sendIdentification();
      break;
      
    case WStype_TEXT:
      Serial.printf("📩 Recebido: %s\n", payload);
      handleWebSocketMessage((char*)payload);
      break;
      
    case WStype_ERROR:
      Serial.println("❌ Erro WebSocket");
      break;
      
    case WStype_PING:
      Serial.println("🏓 Ping recebido");
      break;
      
    case WStype_PONG:
      Serial.println("🏓 Pong recebido");
      break;
  }
}

// ===== ENVIAR IDENTIFICAÇÃO =====
void sendIdentification() {
  StaticJsonDocument<256> doc;
  doc["type"] = "identify";
  doc["device"] = "ESP32-PAI";
  doc["mac"] = WiFi.macAddress();
  doc["modules"] = JsonArray();
  doc["modules"].add("sensor");
  doc["modules"].add("motor");
  doc["modules"].add("camera");
  
  String output;
  serializeJson(doc, output);
  webSocket.sendTXT(output);
  
  Serial.println("📤 Identificação enviada");
}

// ===== PROCESSAR MENSAGENS DO SERVIDOR =====
void handleWebSocketMessage(char* message) {
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) {
    Serial.println("❌ Erro ao parsear JSON");
    return;
  }
  
  const char* type = doc["type"];
  
  if (strcmp(type, "command") == 0) {
    // Servidor enviou comando
    const char* target = doc["target"];
    
    if (strcmp(target, "motor") == 0) {
      int vibLevel = doc["vibrationLevel"];
      Serial.printf("🎮 Comando: Vibração nível %d\n", vibLevel);
      sendVibrationCommand(vibLevel);
    }
  }
  else if (strcmp(type, "ping") == 0) {
    // Responder ping
    sendPong();
  }
}

// ===== ENVIAR STATUS EM TEMPO REAL =====
void sendRealtimeStatus(const char* module, int distance = 0, int vibLevel = 0) {
  if (!wsConnected) return;
  
  StaticJsonDocument<512> doc;
  doc["type"] = "status";
  doc["module"] = module;
  doc["connected"] = true;
  doc["timestamp"] = millis();
  
  if (distance > 0) {
    doc["distance"] = distance;
    
    // Determinar nível
    String level = "livre";
    if (distance < 20) level = "alto";
    else if (distance < 50) level = "medio";
    else if (distance < 100) level = "baixo";
    
    doc["level"] = level;
  }
  
  if (vibLevel >= 0) {
    doc["vibrationLevel"] = vibLevel;
  }
  
  String output;
  serializeJson(doc, output);
  webSocket.sendTXT(output);
  
  Serial.printf("📤 Status enviado: %s\n", module);
}

// ===== ENVIAR ALERTA =====
void sendAlert(const char* level, const char* message) {
  if (!wsConnected) return;
  
  StaticJsonDocument<512> doc;
  doc["type"] = "alert";
  doc["level"] = level;
  doc["message"] = message;
  doc["timestamp"] = millis();
  
  String output;
  serializeJson(doc, output);
  webSocket.sendTXT(output);
  
  Serial.printf("⚠️ Alerta: %s - %s\n", level, message);
}

// ===== ENVIAR PONG =====
void sendPong() {
  if (!wsConnected) return;
  
  StaticJsonDocument<128> doc;
  doc["type"] = "pong";
  doc["timestamp"] = millis();
  
  String output;
  serializeJson(doc, output);
  webSocket.sendTXT(output);
}

// ===== HEARTBEAT =====
void sendHeartbeat() {
  if (!wsConnected) return;
  
  StaticJsonDocument<256> doc;
  doc["type"] = "heartbeat";
  doc["uptime"] = millis() / 1000;
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["modules"]["sensor"] = esp32Status.sensorConnected;
  doc["modules"]["motor"] = esp32Status.motorConnected;
  doc["modules"]["camera"] = esp32Status.cameraConnected;
  
  String output;
  serializeJson(doc, output);
  webSocket.sendTXT(output);
}

// ===== CALLBACK ESP-NOW: RECEBER DADOS DO SENSOR =====
void OnDataRecv(const uint8_t *mac_addr, const uint8_t *data, int len) {
  memcpy(&receivedData, data, sizeof(receivedData));
  
  Serial.println("\n━━━ DADOS RECEBIDOS ━━━");
  Serial.printf("Módulo ID: %d\n", receivedData.moduleId);
  Serial.printf("Distância: %d cm\n", receivedData.distance);
  
  // Atualizar status
  esp32Status.sensorConnected = true;
  esp32Status.distance = receivedData.distance;
  esp32Status.lastSensorUpdate = millis();
  
  // Calcular vibração
  int vibLevel = 0;
  if (receivedData.distance < 20) {
    vibLevel = 3;
    Serial.println("🔴 PERIGO! Muito perto!");
    
    // Enviar alerta ao servidor
    char alertMsg[64];
    sprintf(alertMsg, "PERIGO! Objeto a %d cm", receivedData.distance);
    sendAlert("danger", alertMsg);
  }
  else if (receivedData.distance < 50) {
    vibLevel = 2;
    Serial.println("🟡 ATENÇÃO!");
    
    char alertMsg[64];
    sprintf(alertMsg, "Atenção! Objeto a %d cm", receivedData.distance);
    sendAlert("warning", alertMsg);
  }
  else if (receivedData.distance < 100) {
    vibLevel = 1;
    Serial.println("🟢 Cuidado");
  }
  else {
    vibLevel = 0;
    Serial.println("⚪ Livre");
  }
  
  esp32Status.vibrationLevel = vibLevel;
  
  // Enviar comando ao motor
  sendVibrationCommand(vibLevel);
  
  // 🚀 ENVIAR STATUS EM TEMPO REAL AO SERVIDOR (WebSocket)
  sendRealtimeStatus("sensor", receivedData.distance, 0);
  sendRealtimeStatus("motor", 0, vibLevel);
}

// ===== CALLBACK ESP-NOW: CONFIRMAÇÃO DE ENVIO =====
void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  if (status == ESP_NOW_SEND_SUCCESS) {
    Serial.println("✅ Comando enviado com sucesso");
    esp32Status.motorConnected = true;
    esp32Status.lastMotorUpdate = millis();
  } else {
    Serial.println("❌ Falha ao enviar comando");
    esp32Status.motorConnected = false;
  }
}

// ===== ENVIAR COMANDO DE VIBRAÇÃO =====
void sendVibrationCommand(int level) {
  commandData.vibrationLevel = level;
  commandData.moduleId = 3;
  
  esp_err_t result = esp_now_send(modulo3Address, (uint8_t*)&commandData, sizeof(commandData));
  
  if (result == ESP_OK) {
    Serial.printf("📤 Vibração: Nível %d\n", level);
  } else {
    Serial.printf("❌ Erro ao enviar: %d\n", result);
  }
}

// ===== SETUP =====
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("🚀 ESP32-PAI com WebSocket");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
  // 1. Conectar ao WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  Serial.print("📶 Conectando ao WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi conectado!");
    Serial.printf("📍 IP: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("📶 RSSI: %d dBm\n", WiFi.RSSI());
  } else {
    Serial.println("\n❌ Falha ao conectar WiFi");
  }
  
  // 2. Configurar WebSocket
  webSocket.begin(ws_host, ws_port, "/");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
  
  Serial.printf("🔌 WebSocket: ws://%s:%d\n", ws_host, ws_port);
  
  // 3. Inicializar ESP-NOW
  WiFi.mode(WIFI_AP_STA);  // Modo AP+STA para ESP-NOW + WiFi
  
  if (esp_now_init() != ESP_OK) {
    Serial.println("❌ Erro ao iniciar ESP-NOW");
    return;
  }
  
  Serial.println("✅ ESP-NOW inicializado");
  
  // Registrar callbacks
  esp_now_register_recv_cb(OnDataRecv);
  esp_now_register_send_cb(OnDataSent);
  
  // Adicionar peer (Módulo 3 - Motor)
  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, modulo3Address, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;
  
  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("❌ Erro ao adicionar peer");
  } else {
    Serial.println("✅ Peer adicionado (Motor)");
  }
  
  Serial.println("\n🎯 Sistema pronto!\n");
}

// ===== LOOP =====
void loop() {
  // 1. Manter WebSocket vivo
  webSocket.loop();
  
  // 2. Heartbeat periódico
  if (millis() - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }
  
  // 3. Verificar timeout dos módulos
  checkModuleTimeouts();
  
  delay(10);
}

// ===== VERIFICAR TIMEOUT DOS MÓDULOS =====
void checkModuleTimeouts() {
  const unsigned long TIMEOUT = 5000;  // 5 segundos
  
  // Sensor timeout?
  if (esp32Status.sensorConnected && 
      (millis() - esp32Status.lastSensorUpdate > TIMEOUT)) {
    esp32Status.sensorConnected = false;
    Serial.println("⚠️ Sensor desconectado (timeout)");
    sendAlert("warning", "Módulo Sensor desconectado");
  }
  
  // Motor timeout?
  if (esp32Status.motorConnected && 
      (millis() - esp32Status.lastMotorUpdate > TIMEOUT)) {
    esp32Status.motorConnected = false;
    Serial.println("⚠️ Motor desconectado (timeout)");
    sendAlert("warning", "Módulo Motor desconectado");
  }
}

// ===== DEPENDÊNCIAS (platformio.ini) =====
/*
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino

lib_deps =
    bblanchon/ArduinoJson@^6.21.3
    links2004/WebSockets@^2.4.1

monitor_speed = 115200
*/

// ===== FORMATO DAS MENSAGENS WEBSOCKET =====
/*

1. IDENTIFICAÇÃO (ESP32 → Servidor):
{
  "type": "identify",
  "device": "ESP32-PAI",
  "mac": "EC:64:C9:7C:38:30",
  "modules": ["sensor", "motor", "camera"]
}

2. STATUS EM TEMPO REAL (ESP32 → Servidor):
{
  "type": "status",
  "module": "sensor",
  "connected": true,
  "distance": 45,
  "level": "medio",
  "timestamp": 12345
}

3. ALERTA (ESP32 → Servidor):
{
  "type": "alert",
  "level": "danger",
  "message": "PERIGO! Objeto a 15 cm",
  "timestamp": 12345
}

4. HEARTBEAT (ESP32 → Servidor):
{
  "type": "heartbeat",
  "uptime": 3600,
  "freeHeap": 250000,
  "modules": {
    "sensor": true,
    "motor": true,
    "camera": false
  }
}

5. COMANDO (Servidor → ESP32):
{
  "type": "command",
  "target": "motor",
  "vibrationLevel": 2
}

6. PING/PONG (Bidirecional):
{ "type": "ping" }
{ "type": "pong", "timestamp": 12345 }

*/

// ===== EXEMPLO DE SAÍDA SERIAL =====
/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 ESP32-PAI com WebSocket
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📶 Conectando ao WiFi........
✅ WiFi conectado!
📍 IP: 192.168.100.10
📶 RSSI: -45 dBm
🔌 WebSocket: ws://192.168.100.20:8080
✅ ESP-NOW inicializado
✅ Peer adicionado (Motor)

🎯 Sistema pronto!

🟢 WebSocket conectado!
📤 Identificação enviada

━━━ DADOS RECEBIDOS ━━━
Módulo ID: 1
Distância: 45 cm
🟡 ATENÇÃO!
📤 Vibração: Nível 2
✅ Comando enviado com sucesso
📤 Status enviado: sensor
📤 Status enviado: motor
⚠️ Alerta: warning - Atenção! Objeto a 45 cm
*/
