#include <WiFi.h>
#include <SocketIOclient.h>
#include <ArduinoJson.h>

// Configurações WiFi
const char* ssid = "SEU_WIFI";
const char* password = "SUA_SENHA";

// Configuração do servidor
const char* serverIP = "192.168.1.100"; // IP do seu servidor
const int serverPort = 3000;

// Cliente WebSocket
SocketIOclient socketIO;

// ID único deste ESP32
const char* MODULE_ID = "ESP32_CAM_001";

// Variáveis de configuração (controladas remotamente)
int currentFPS = 10;
String currentResolution = "VGA";
float confidenceThreshold = 0.7;
String operationMode = "continuous";

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("=== ESP32-CAM Vision System ===");
  
  // Conectar WiFi
  WiFi.begin(ssid, password);
  Serial.print("Conectando ao WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\n✅ WiFi conectado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  // Configurar WebSocket
  String serverURL = String("ws://") + serverIP + ":" + serverPort + "/vision";
  socketIO.begin(serverIP, serverPort, "/socket.io/?EIO=4&transport=websocket");
  
  // Definir callback de eventos
  socketIO.onEvent(webSocketEvent);
  
  Serial.println("✅ WebSocket configurado");
}

void loop() {
  // Manter conexão WebSocket ativa
  socketIO.loop();

  // Simular detecção de objetos (substitua por seu código real)
  static unsigned long lastDetection = 0;
  unsigned long interval = 1000 / currentFPS; // Intervalo baseado no FPS

  if (millis() - lastDetection > interval) {
    lastDetection = millis();
    sendDetection();
  }
}

void webSocketEvent(socketIOmessageType_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case sIOtype_DISCONNECT:
      Serial.println("❌ Desconectado do servidor");
      break;
      
    case sIOtype_CONNECT:
      Serial.println("✅ Conectado ao servidor WebSocket");
      registerESP32();
      break;
      
    case sIOtype_EVENT:
      handleWebSocketMessage((char*)payload);
      break;
      
    case sIOtype_ACK:
      Serial.println("📬 ACK recebido");
      break;
      
    case sIOtype_ERROR:
      Serial.printf("❌ Erro WebSocket: %s\n", payload);
      break;
  }
}

void registerESP32() {
  // Registrar este ESP32 no servidor
  DynamicJsonDocument doc(256);
  JsonArray array = doc.to<JsonArray>();
  
  array.add("register_esp32");
  
  JsonObject param = array.createNestedObject();
  param["moduleId"] = MODULE_ID;
  
  String output;
  serializeJson(doc, output);
  
  socketIO.sendEVENT(output);
  Serial.println("📡 Registro enviado ao servidor");
}

void sendDetection() {
  // Criar payload de detecção
  DynamicJsonDocument doc(1024);
  JsonArray array = doc.to<JsonArray>();
  
  array.add("detection");
  
  JsonObject payload = array.createNestedObject();
  payload["moduleId"] = MODULE_ID;
  payload["timestamp"] = millis();
  
  // Array de objetos detectados (exemplo)
  JsonArray objects = payload.createNestedArray("objects");
  
  // Exemplo: detectou uma pessoa
  JsonObject obj1 = objects.createNestedObject();
  obj1["name"] = "pessoa";
  obj1["confidence"] = 0.85;
  obj1["description"] = "Pessoa à frente";
  
  // Métricas do sistema
  JsonObject metrics = payload.createNestedObject("metrics");
  metrics["captureTime"] = random(200, 500);
  metrics["detectionTime"] = random(100, 300);
  metrics["sendTime"] = random(50, 150);
  metrics["totalTime"] = random(350, 950);
  metrics["freeHeap"] = ESP.getFreeHeap();
  metrics["rssi"] = WiFi.RSSI();
  metrics["fps"] = currentFPS;
  
  String output;
  serializeJson(doc, output);
  
  socketIO.sendEVENT(output);
  
  Serial.print("📤 Detecção enviada (");
  Serial.print(objects.size());
  Serial.println(" objetos)");
}

void handleWebSocketMessage(char* payload) {
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, payload);
  
  if (error) {
    Serial.println("❌ Erro ao parsear JSON");
    return;
  }
  
  // Pegar o nome do evento
  const char* eventName = doc[0];
  
  if (strcmp(eventName, "connected") == 0) {
    Serial.println("✅ Confirmação de conexão recebida");
    return;
  }
  
  if (strcmp(eventName, "registered") == 0) {
    Serial.println("✅ ESP32 registrado com sucesso!");
    return;
  }
  
  if (strcmp(eventName, "detection_ack") == 0) {
    JsonObject data = doc[1];
    Serial.print("✅ Detecção confirmada - ID: ");
    Serial.println(data["detectionId"].as<String>());
    return;
  }
  
  if (strcmp(eventName, "command") == 0) {
    JsonObject data = doc[1];
    handleCommand(data);
    return;
  }
  
  Serial.print("📨 Evento desconhecido: ");
  Serial.println(eventName);
}

void handleCommand(JsonObject commandData) {
  const char* command = commandData["command"];
  JsonObject data = commandData["data"];
  
  Serial.print("📥 Comando recebido: ");
  Serial.println(command);
  
  if (strcmp(command, "setFPS") == 0) {
    int newFPS = data["fps"];
    if (newFPS >= 1 && newFPS <= 30) {
      currentFPS = newFPS;
      Serial.printf("✅ FPS ajustado para: %d\n", currentFPS);
    }
  }
  
  else if (strcmp(command, "setResolution") == 0) {
    const char* resolution = data["resolution"];
    currentResolution = String(resolution);
    Serial.printf("✅ Resolução alterada para: %s\n", resolution);
    // Aqui você aplicaria a mudança na câmera
  }
  
  else if (strcmp(command, "setThreshold") == 0) {
    float threshold = data["threshold"];
    if (threshold >= 0.0 && threshold <= 1.0) {
      confidenceThreshold = threshold;
      Serial.printf("✅ Threshold ajustado para: %.2f\n", confidenceThreshold);
    }
  }
  
  else if (strcmp(command, "toggleMode") == 0) {
    const char* mode = data["mode"];
    operationMode = String(mode);
    Serial.printf("✅ Modo alterado para: %s\n", mode);
  }
  
  else if (strcmp(command, "reboot") == 0) {
    Serial.println("🔄 Reiniciando ESP32...");
    delay(1000);
    ESP.restart();
  }
  
  else if (strcmp(command, "calibrate") == 0) {
    Serial.println("🔧 Calibrando sensores...");
    // Implementar lógica de calibração
  }
  
  else if (strcmp(command, "getStatus") == 0) {
    sendStatusReport();
  }
  
  else {
    Serial.printf("❓ Comando desconhecido: %s\n", command);
  }
}

void sendStatusReport() {
  DynamicJsonDocument doc(512);
  JsonArray array = doc.to<JsonArray>();
  
  array.add("status_report");
  
  JsonObject status = array.createNestedObject();
  status["moduleId"] = MODULE_ID;
  status["fps"] = currentFPS;
  status["resolution"] = currentResolution;
  status["threshold"] = confidenceThreshold;
  status["mode"] = operationMode;
  status["freeHeap"] = ESP.getFreeHeap();
  status["rssi"] = WiFi.RSSI();
  status["uptime"] = millis() / 1000;
  
  String output;
  serializeJson(doc, output);
  
  socketIO.sendEVENT(output);
  
  Serial.println("📊 Status enviado ao servidor");
}
