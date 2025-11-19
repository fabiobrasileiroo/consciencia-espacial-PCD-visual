#include <Arduino.h>
#include <esp_now.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// ===========================
// CONFIGURAÇÃO WIFI
// ===========================
const char* ssid = "FJ";
const char* password = "#f39A@jl32*1";

// ===========================
// CONFIGURAÇÃO WEBSOCKET
// ===========================
// PRODUÇÃO (Render):
// const char* wsServer = "seu-servico.onrender.com";
// const int wsPort = 443;
// const char* wsPath = "/esp32";
// const bool useSSL = true;

// DESENVOLVIMENTO (Local):
const char* wsServer = "192.168.100.11";  // IP do seu PC rodando Node.js
const int wsPort = 3000;
const char* wsPath = "/esp32";
const bool useSSL = false;

WebSocketsClient webSocket;
bool wsConnected = false;  // ===========================
// ESP-NOW - MAC ADDRESSES
// ===========================
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
} struct_sensor_data;

// Estrutura para enviar comandos ao Módulo 3 (Motor)
typedef struct struct_motor_command {
  int vibrationLevel; // 0=parado, 1=baixo, 2=médio, 3=forte
  int moduleId;
} struct_motor_command;

struct_sensor_data sensorData;
struct_motor_command motorCommand;

// ===========================
// ESTADO DO SISTEMA
// ===========================
unsigned long lastSensorUpdate = 0;
unsigned long lastStatusSend = 0;
unsigned long lastWsRetryLog = 0;
const unsigned long STATUS_INTERVAL = 2000;  // Enviar status a cada 2s
const unsigned long WS_LOG_INTERVAL = 30000; // Log de reconexão a cada 30s

// ===========================
// DECLARAÇÕES DE FUNÇÕES
// ===========================
void sendRealtimeStatus();
void sendAlert(const char* level, const char* message, int distance);

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
              Serial.println("🔧 Teste de motor enviado");
            }
            else if (strcmp(cmd, "get_status") == 0) {
              // Enviar status imediatamente
              sendRealtimeStatus();
            }
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
    } else {
      Serial.println("❌ Erro ao enviar comando ao Motor");
    }
    
    // Enviar status ao servidor via WebSocket
    sendRealtimeStatus();
    
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
  
  // Configurar WiFi em modo Station
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  Serial.print("📡 Conectando ao WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("✅ WiFi conectado!");
  Serial.printf("   IP: %s\n", WiFi.localIP().toString().c_str());
  Serial.printf("   MAC: %s\n", WiFi.macAddress().c_str());
  Serial.printf("   Canal WiFi: %d\n", WiFi.channel());
  Serial.println("   IMPORTANTE: Use este MAC no Módulo 1 e Câmera!");
  
  // Inicializar ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("❌ Erro ao inicializar ESP-NOW");
    return;
  }
  
  Serial.println("✅ ESP-NOW inicializado!");
  Serial.printf("   ESP-NOW usa canal WiFi: %d\n", WiFi.channel());
  
  // Registrar callbacks ESP-NOW
  esp_now_register_recv_cb(OnDataRecv);
  esp_now_register_send_cb(OnDataSent);

  // Registrar Módulo 1 (Sensor) como peer - IMPORTANTE para receber dados!
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

  // Registrar Módulo 3 (Motor) como peer
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

  // Configurar WebSocket (em segundo plano)
  Serial.printf("\n🔌 Configurando WebSocket...\n");
  Serial.printf("   Servidor: %s:%d\n", wsServer, wsPort);
  Serial.printf("   Path: %s\n", wsPath);
  Serial.printf("   SSL: %s\n", useSSL ? "SIM" : "NÃO");
  Serial.println("   (Tentará conectar em segundo plano)");
  
  if (useSSL) {
    webSocket.beginSSL(wsServer, wsPort, wsPath);
  } else {
    webSocket.begin(wsServer, wsPort, wsPath);
  }
  
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(10000); // Aumentado para 10s
  webSocket.enableHeartbeat(15000, 3000, 2); // Ping a cada 15s, timeout 3s, 2 tentativas
  
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
// LOOP
// ===========================
void loop() {
  webSocket.loop();
  
  // Enviar status periódico ao servidor
  if (wsConnected && (millis() - lastStatusSend >= STATUS_INTERVAL)) {
    sendRealtimeStatus();
    lastStatusSend = millis();
  }
  
  delay(10);
}

