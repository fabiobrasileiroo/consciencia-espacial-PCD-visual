#include <Arduino.h>
#include "esp_camera.h"
#include <WiFi.h>
#include <SocketIOclient.h>
#include <ArduinoJson.h>
#include "esp_timer.h"
#include "img_converters.h"

using namespace ArduinoJson;

// ===== CONFIGURAÇÕES WIFI & SERVIDOR =====
const char* ssid = "FJ";
const char* password = "#f39A@jl32*1";
const char* serverIP = "192.168.100.11"; // IP do servidor
const int serverPort = 3000;
const char* MODULE_ID = "ESP32_CAM_MODULE2"; // ID único deste módulo

// ===== DECLARAÇÕES FORWARD =====
void webSocketEvent(socketIOmessageType_t type, uint8_t * payload, size_t length);
void registerESP32();
void handleWebSocketMessage(char* payload);
void handleCommand(JsonObject commandData);
void sendStatusReport();
bool sendToServerWebSocket(const String& description, camera_fb_t *fb, 
                           unsigned long captureTime, unsigned long detectionTime, 
                           unsigned long sendTime);

// ===== CONFIGURAÇÃO DOS PINOS DA CÂMERA ESP32-S3 =====
#define PWDN_GPIO_NUM     -1
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM     15
#define SIOD_GPIO_NUM     4
#define SIOC_GPIO_NUM     5
#define Y9_GPIO_NUM       16
#define Y8_GPIO_NUM       17
#define Y7_GPIO_NUM       18
#define Y6_GPIO_NUM       12
#define Y5_GPIO_NUM       10
#define Y4_GPIO_NUM       8
#define Y3_GPIO_NUM       9
#define Y2_GPIO_NUM       11
#define VSYNC_GPIO_NUM    6
#define HREF_GPIO_NUM     7
#define PCLK_GPIO_NUM     13

// ===== CLASSES DE OBJETOS DETECTÁVEIS (COCO Dataset) =====
const char* OBJECT_CLASSES[] = {
  "pessoa", "bicicleta", "carro", "moto", "avião", "ônibus", "trem", "caminhão", 
  "barco", "semáforo", "hidrante", "placa_pare", "parquímetro", "banco", 
  "pássaro", "gato", "cachorro", "cavalo", "ovelha", "vaca", "elefante", "urso", 
  "zebra", "girafa", "mochila", "guarda-chuva", "bolsa", "gravata", "mala", 
  "frisbee", "esqui", "snowboard", "bola", "pipa", "taco_baseball", "luva_baseball", 
  "skate", "prancha_surf", "raquete_tenis", "garrafa", "taça_vinho", "xícara", 
  "garfo", "faca", "colher", "tigela", "banana", "maçã", "sanduíche", "laranja", 
  "brócolis", "cenoura", "cachorro-quente", "pizza", "donut", "bolo", "cadeira", 
  "sofá", "vaso_planta", "cama", "mesa_jantar", "vaso_sanitário", "tv", 
  "laptop", "mouse", "controle_remoto", "teclado", "celular", "microondas", 
  "forno", "torradeira", "pia", "geladeira", "livro", "relógio", "vaso", 
  "tesoura", "urso_pelúcia", "secador_cabelo", "escova_dente"
};

const int NUM_CLASSES = sizeof(OBJECT_CLASSES) / sizeof(OBJECT_CLASSES[0]);

// ===== ESTRUTURA PARA DETECÇÕES =====
struct Detection {
  int classId;
  float confidence;
  int x, y, width, height;
};

// ===== VARIÁVEIS GLOBAIS =====
SocketIOclient socketIO;
unsigned long lastDetectionTime = 0;
const unsigned long DETECTION_INTERVAL = 3000; // Detecção a cada 3 segundos
bool wifiConnected = false;
bool cameraOK = false; // Flag para indicar se câmera está funcionando
bool websocketConnected = false;
bool isRegistered = false;

// Variáveis de configuração (controladas remotamente)
int currentFPS = 10;
String currentResolution = "QVGA";
float confidenceThreshold = 0.7;
String operationMode = "continuous";

// ===== FUNÇÃO: INICIALIZAR CÂMERA =====
bool initCamera() {
  Serial.println("\n🔧 === INICIANDO CONFIGURAÇÃO DA CÂMERA ===");
  Serial.println("🔧 Configurando pinos da câmera...");
  
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
  config.pixel_format = PIXFORMAT_JPEG;
  config.grab_mode = CAMERA_GRAB_LATEST;

  Serial.println("✅ Pinos configurados!");
  Serial.println("🔧 Configurando memória e resolução...");
  
  // Configurações otimizadas COM PSRAM
  if(psramFound()){
    Serial.println("✅ PSRAM detectado! Usando alta resolução");
    config.fb_location = CAMERA_FB_IN_PSRAM;
    config.frame_size = FRAMESIZE_QVGA; // 320x240 - Boa qualidade com PSRAM
    config.jpeg_quality = 10; // Melhor qualidade
    config.fb_count = 2; // 2 buffers para melhor performance
  } else {
    Serial.println("⚠️  PSRAM não detectado! Usando DRAM");
    config.fb_location = CAMERA_FB_IN_DRAM;
    config.frame_size = FRAMESIZE_QQVGA; // 160x120 - Fallback
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  Serial.println("🔧 Inicializando driver da câmera...");
  
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("❌ ERRO ao inicializar câmera: 0x%x\n", err);
    Serial.println("❌ Código do erro:");
    switch(err) {
      case ESP_ERR_INVALID_ARG:
        Serial.println("   - Argumento inválido");
        break;
      case ESP_ERR_NO_MEM:
        Serial.println("   - Sem memória disponível");
        break;
      case ESP_ERR_NOT_FOUND:
        Serial.println("   - Câmera não encontrada");
        break;
      default:
        Serial.println("   - Erro desconhecido");
    }
    return false;
  }

  Serial.println("🔧 Configurando sensor...");
  
  // Otimizar sensor para detecção
  sensor_t * s = esp_camera_sensor_get();
  if (s != NULL) {
    s->set_brightness(s, 0);
    s->set_contrast(s, 0);
    s->set_saturation(s, 0);
    s->set_whitebal(s, 1);
    s->set_awb_gain(s, 1);
    s->set_exposure_ctrl(s, 1);
    s->set_aec2(s, 1);
    s->set_gain_ctrl(s, 1);
    s->set_agc_gain(s, 0);
    s->set_bpc(s, 1);
    s->set_wpc(s, 1);
    s->set_raw_gma(s, 1);
    s->set_lenc(s, 1);
    s->set_hmirror(s, 0);
    s->set_vflip(s, 0);
    Serial.println("✅ Sensor configurado!");
  } else {
    Serial.println("⚠️  Aviso: Não foi possível acessar configurações do sensor");
  }

  Serial.println("✅ Câmera inicializada com sucesso!");
  cameraOK = true; // Marca que câmera está OK
  return true;
}

// ===== FUNÇÃO: DETECÇÃO SIMULADA (PLACEHOLDER) =====
// NOTA: Aqui você integraria um modelo TFLite ou usaria API externa
String detectObjectsAndDescribe(camera_fb_t *fb) {
  // Esta é uma implementação simulada
  // Na versão real, você usaria:
  // 1. TensorFlow Lite Micro para inferência local
  // 2. Edge Impulse para modelo otimizado
  // 3. API externa (Google Vision, AWS Rekognition, Roboflow)
  
  Serial.println("🔍 Analisando imagem...");
  
  // Simulação de detecção (remova em produção)
  Detection detections[3];
  int numDetections = 0;
  
  // Simulação: detecta objetos aleatórios
  if (random(0, 100) > 30) {
    detections[numDetections++] = {0, 0.95, 10, 20, 100, 150}; // pessoa
  }
  if (random(0, 100) > 60) {
    detections[numDetections++] = {56, 0.87, 120, 80, 80, 60}; // cadeira
  }
  if (random(0, 100) > 70) {
    detections[numDetections++] = {73, 0.92, 200, 150, 50, 40}; // livro
  }
  
  // Construir descrição em português
  String description = "";
  
  if (numDetections == 0) {
    description = "Nenhum objeto detectado na cena";
  } else {
    description = "Detectado ";
    description += String(numDetections);
    description += (numDetections == 1) ? " objeto: " : " objetos: ";
    
    for (int i = 0; i < numDetections; i++) {
      int classId = detections[i].classId;
      float conf = detections[i].confidence;
      
      if (classId < NUM_CLASSES) {
        description += OBJECT_CLASSES[classId];
        description += " (";
        description += String((int)(conf * 100));
        description += "%)";
        
        if (i < numDetections - 1) {
          description += ", ";
        }
      }
    }
    
    // Adicionar contexto espacial
    description += ". ";
    if (detections[0].x < 100) {
      description += "à esquerda";
    } else if (detections[0].x > 220) {
      description += "à direita";
    } else {
      description += "ao centro";
    }
  }
  
  return description;
}

// ===== FUNÇÃO: CALLBACK WEBSOCKET =====
void webSocketEvent(socketIOmessageType_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case sIOtype_DISCONNECT:
      Serial.println("❌ Desconectado do servidor WebSocket");
      websocketConnected = false;
      isRegistered = false;
      break;
      
    case sIOtype_CONNECT:
      Serial.println("✅ Conectado ao servidor WebSocket");
      websocketConnected = true;
      registerESP32();
      break;
      
    case sIOtype_EVENT:
      handleWebSocketMessage((char*)payload);
      break;
      
    case sIOtype_ACK:
      Serial.println("📬 ACK recebido do servidor");
      break;
      
    case sIOtype_ERROR:
      Serial.printf("❌ Erro WebSocket: %s\n", payload);
      websocketConnected = false;
      break;
  }
}

// ===== FUNÇÃO: REGISTRAR ESP32 NO SERVIDOR =====
void registerESP32() {
  if (!websocketConnected) return;
  
  JsonDocument doc;
  JsonArray array = doc.to<JsonArray>();
  
  array.add("register_esp32");
  
  JsonObject param = array.add<JsonObject>();
  param["moduleId"] = MODULE_ID;
  
  String output;
  serializeJson(doc, output);
  
  socketIO.sendEVENT(output);
  Serial.println("📡 Registro enviado ao servidor");
}

// ===== FUNÇÃO: PROCESSAR MENSAGENS WEBSOCKET =====
void handleWebSocketMessage(char* payload) {
  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, payload);
  
  if (error) {
    Serial.println("❌ Erro ao parsear JSON do WebSocket");
    return;
  }
  
  // Pegar o nome do evento
  const char* eventName = doc[0];
  
  if (strcmp(eventName, "connected") == 0) {
    Serial.println("✅ Confirmação de conexão recebida");
    return;
  }
  
  if (strcmp(eventName, "registered") == 0) {
    Serial.println("✅ ESP32 registrado com sucesso no servidor!");
    isRegistered = true;
    JsonObject data = doc[1];
    Serial.print("📍 Module ID: ");
    Serial.println(data["moduleId"].as<String>());
    return;
  }
  
  if (strcmp(eventName, "detection_ack") == 0) {
    JsonObject data = doc[1];
    Serial.print("✅ Detecção confirmada pelo servidor - ID: ");
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

// ===== FUNÇÃO: PROCESSAR COMANDOS DO SERVIDOR =====
void handleCommand(JsonObject commandData) {
  const char* command = commandData["command"];
  JsonObject data = commandData["data"];
  
  Serial.println("\n╔════════════════════════════════════════════════════════╗");
  Serial.println("║            📥 COMANDO RECEBIDO DO SERVIDOR            ║");
  Serial.println("╚════════════════════════════════════════════════════════╝");
  Serial.print("🎯 Comando: ");
  Serial.println(command);
  
  if (strcmp(command, "setFPS") == 0) {
    int newFPS = data["fps"];
    if (newFPS >= 1 && newFPS <= 30) {
      currentFPS = newFPS;
      Serial.printf("✅ FPS ajustado para: %d\n", currentFPS);
      // Atualizar intervalo de detecção
      // DETECTION_INTERVAL seria recalculado aqui
    } else {
      Serial.println("❌ FPS inválido (deve ser 1-30)");
    }
  }
  
  else if (strcmp(command, "setResolution") == 0) {
    const char* resolution = data["resolution"];
    currentResolution = String(resolution);
    Serial.printf("✅ Resolução alterada para: %s\n", resolution);
    
    // Aplicar mudança de resolução na câmera
    sensor_t * s = esp_camera_sensor_get();
    if (s != NULL) {
      if (strcmp(resolution, "QQVGA") == 0) {
        s->set_framesize(s, FRAMESIZE_QQVGA); // 160x120
      } else if (strcmp(resolution, "QVGA") == 0) {
        s->set_framesize(s, FRAMESIZE_QVGA); // 320x240
      } else if (strcmp(resolution, "VGA") == 0) {
        s->set_framesize(s, FRAMESIZE_VGA); // 640x480
      } else if (strcmp(resolution, "SVGA") == 0) {
        s->set_framesize(s, FRAMESIZE_SVGA); // 800x600
      }
      Serial.println("📸 Resolução da câmera atualizada!");
    }
  }
  
  else if (strcmp(command, "setThreshold") == 0) {
    float threshold = data["threshold"];
    if (threshold >= 0.0 && threshold <= 1.0) {
      confidenceThreshold = threshold;
      Serial.printf("✅ Threshold de confiança ajustado para: %.2f\n", confidenceThreshold);
    } else {
      Serial.println("❌ Threshold inválido (deve ser 0.0-1.0)");
    }
  }
  
  else if (strcmp(command, "toggleMode") == 0) {
    const char* mode = data["mode"];
    operationMode = String(mode);
    Serial.printf("✅ Modo de operação alterado para: %s\n", mode);
  }
  
  else if (strcmp(command, "reboot") == 0) {
    Serial.println("🔄 Reiniciando ESP32 em 3 segundos...");
    delay(3000);
    ESP.restart();
  }
  
  else if (strcmp(command, "calibrate") == 0) {
    Serial.println("🔧 Calibrando sensores da câmera...");
    sensor_t * s = esp_camera_sensor_get();
    if (s != NULL) {
      // Reset para configurações padrão
      s->set_brightness(s, 0);
      s->set_contrast(s, 0);
      s->set_saturation(s, 0);
      Serial.println("✅ Calibração concluída!");
    }
  }
  
  else if (strcmp(command, "getStatus") == 0) {
    Serial.println("📊 Enviando status ao servidor...");
    sendStatusReport();
  }
  
  else {
    Serial.printf("❓ Comando desconhecido: %s\n", command);
  }
  
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// ===== FUNÇÃO: ENVIAR STATUS PARA SERVIDOR =====
void sendStatusReport() {
  if (!websocketConnected || !isRegistered) {
    Serial.println("⚠️  WebSocket não conectado, não é possível enviar status");
    return;
  }
  
  JsonDocument doc;
  JsonArray array = doc.to<JsonArray>();
  
  array.add("status_report");
  
  JsonObject status = array.add<JsonObject>();
  status["moduleId"] = MODULE_ID;
  status["fps"] = currentFPS;
  status["resolution"] = currentResolution;
  status["threshold"] = confidenceThreshold;
  status["mode"] = operationMode;
  status["freeHeap"] = ESP.getFreeHeap();
  status["rssi"] = WiFi.RSSI();
  status["uptime"] = millis() / 1000;
  status["cameraOK"] = cameraOK;
  
  String output;
  serializeJson(doc, output);
  
  socketIO.sendEVENT(output);
  Serial.println("📊 Status enviado ao servidor");
}

// ===== FUNÇÃO: ENVIAR DETECÇÃO VIA WEBSOCKET =====
bool sendToServerWebSocket(const String& description, camera_fb_t *fb, 
                           unsigned long captureTime, unsigned long detectionTime, 
                           unsigned long sendTime) {
  if (!websocketConnected || !isRegistered) {
    Serial.println("⚠️  WebSocket não conectado ou não registrado");
    return false;
  }
  
  JsonDocument doc;
  JsonArray array = doc.to<JsonArray>();
  
  array.add("detection");
  
  JsonObject payload = array.add<JsonObject>();
  payload["moduleId"] = MODULE_ID;
  payload["timestamp"] = millis();
  
  // Array de objetos detectados (simulação)
  JsonArray objects = payload["objects"].to<JsonArray>();
  
  // Exemplo: pessoa detectada
  JsonObject obj1 = objects.add<JsonObject>();
  obj1["name"] = "pessoa";
  obj1["confidence"] = 0.85;
  obj1["description"] = description;
  
  // Métricas do sistema
  JsonObject metrics = payload["metrics"].to<JsonObject>();
  metrics["captureTime"] = captureTime;
  metrics["detectionTime"] = detectionTime;
  metrics["sendTime"] = sendTime;
  metrics["totalTime"] = captureTime + detectionTime + sendTime;
  metrics["freeHeap"] = ESP.getFreeHeap();
  metrics["rssi"] = WiFi.RSSI();
  metrics["fps"] = currentFPS;
  
  String output;
  serializeJson(doc, output);
  
  socketIO.sendEVENT(output);
  
  Serial.println("📤 Detecção enviada via WebSocket");
  return true;
}

// ===== FUNÇÃO: ENVIAR PARA SERVIDOR (MANTIDA PARA COMPATIBILIDADE) =====
bool sendToServer(const String& description, camera_fb_t *fb) {
  // Redirecionar para WebSocket se conectado
  if (websocketConnected && isRegistered) {
    return sendToServerWebSocket(description, fb, 0, 0, 0);
  }
  
  Serial.println("⚠️  WebSocket não disponível");
  return false;
}

// ===== FUNÇÃO: PROCESSAR FRAME =====
void processFrame() {
  unsigned long startTime = millis();
  uint32_t freeHeapBefore = ESP.getFreeHeap();
  
  camera_fb_t *fb = esp_camera_fb_get();
  
  if (!fb) {
    Serial.println("❌ Falha ao capturar frame");
    return;
  }
  
  unsigned long captureTime = millis() - startTime;
  
  Serial.println("\n╔════════════════════════════════════════════════════════╗");
  Serial.println("║            📸 NOVA CAPTURA E ANÁLISE                  ║");
  Serial.println("╚════════════════════════════════════════════════════════╝");
  Serial.printf("📸 Frame: %dx%d (%d bytes) - Captura: %lu ms\n", 
                fb->width, fb->height, fb->len, captureTime);
  
  // Detectar objetos e gerar descrição
  unsigned long detectionStart = millis();
  String description = detectObjectsAndDescribe(fb);
  unsigned long detectionTime = millis() - detectionStart;
  
  // Exibir descrição
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("🎯 DESCRIÇÃO DA CENA:");
  Serial.println(description);
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // Enviar para servidor
  unsigned long sendStart = millis();
  bool success = sendToServerWebSocket(description, fb, captureTime, detectionTime, millis() - sendStart);
  unsigned long sendTime = millis() - sendStart;
  
  // Liberar memória
  esp_camera_fb_return(fb);
  
  // Calcular métricas
  unsigned long totalTime = millis() - startTime;
  uint32_t freeHeapAfter = ESP.getFreeHeap();
  int32_t heapUsed = freeHeapBefore - freeHeapAfter;
  
  // Exibir estatísticas de performance
  Serial.println("\n┌─────────────────── ⚡ PERFORMANCE ────────────────────┐");
  Serial.printf("│ ⏱️  Tempo Captura:    %4lu ms                        │\n", captureTime);
  Serial.printf("│ 🔍 Tempo Detecção:    %4lu ms                        │\n", detectionTime);
  Serial.printf("│ 📤 Tempo Envio:       %4lu ms   [%s]           │\n", 
                sendTime, success ? "✅" : "❌");
  Serial.printf("│ ⏲️  Tempo Total:       %4lu ms                        │\n", totalTime);
  Serial.println("├───────────────────── 💾 MEMÓRIA ─────────────────────┤");
  Serial.printf("│ 🧠 Heap Livre:        %6d bytes                  │\n", freeHeapAfter);
  Serial.printf("│ 📊 Heap Usado Ciclo:  %6d bytes                  │\n", heapUsed > 0 ? heapUsed : 0);
  Serial.printf("│ 📈 Uso Memória:       %3d%%                          │\n", 
                (int)((327680 - freeHeapAfter) * 100 / 327680));
  Serial.println("├──────────────────── 🌡️  SISTEMA ────────────────────┤");
  Serial.printf("│ 🔥 CPU Freq:          %3d MHz                       │\n", ESP.getCpuFreqMHz());
  Serial.printf("│ 📶 WiFi RSSI:         %3d dBm                       │\n", WiFi.RSSI());
  Serial.printf("│ ⚡ FPS Estimado:      %.2f fps                      │\n", 
                totalTime > 0 ? 1000.0 / totalTime : 0.0);
  Serial.println("└──────────────────────────────────────────────────────┘\n");
}

// ===== SETUP =====
void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(false);
  
  Serial.println("\n\n=== ESP32 INICIANDO ===");
  Serial.println("Aguardando estabilização...");
  
  delay(2000); // Delay maior para estabilizar
  
  Serial.println("\n╔══════════════════════════════════════╗");
  Serial.println("║  👁️  SISTEMA DE VISÃO PARA PCD      ║");
  Serial.println("║  Detecção de Objetos → Texto        ║");
  Serial.println("║  WebSocket Bidirectional            ║");
  Serial.println("╚══════════════════════════════════════╝\n");
  
  Serial.printf("🔋 Heap livre no início: %d bytes\n", ESP.getFreeHeap());
  Serial.printf("⚡ CPU: %d MHz\n\n", ESP.getCpuFreqMHz());
  
  // Inicializar câmera
  Serial.println("📷 Tentando inicializar câmera...");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  if (!initCamera()) {
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Serial.println("❌ ERRO CRÍTICO: Câmera não inicializou!");
    Serial.println("");
    Serial.println("⚠️  Possíveis causas:");
    Serial.println("   1. Câmera não conectada corretamente");
    Serial.println("   2. GPIOs incorretos");
    Serial.println("   3. Câmera defeituosa");
    Serial.println("   4. Falta de memória");
    Serial.println("");
    Serial.println("🔄 Sistema em modo seguro - SEM câmera");
    Serial.println("   Continuará apenas com WiFi e servidor");
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    // NÃO reinicia - continua em modo seguro
    delay(3000);
  } else {
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  }
  
  // Conectar WiFi
  Serial.println("📡 Conectando ao WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  WiFi.setSleep(false);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\n✅ WiFi conectado!");
    Serial.print("📍 IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("📶 RSSI: ");
    Serial.println(WiFi.RSSI());
    
    // Inicializar WebSocket
    Serial.println("\n🔌 Conectando ao servidor WebSocket...");
    String serverURL = String("ws://") + serverIP + ":" + serverPort + "/vision";
    Serial.print("🌐 URL: ");
    Serial.println(serverURL);
    
    socketIO.begin(serverIP, serverPort, "/socket.io/?EIO=4&transport=websocket");
    socketIO.onEvent(webSocketEvent);
    
    Serial.println("✅ WebSocket configurado!");
  } else {
    wifiConnected = false;
    Serial.println("\n⚠️  WiFi não conectado (modo offline)");
  }
  
  // Informações do sistema
  Serial.println("\n📊 Informações do Sistema:");
  Serial.printf("💾 PSRAM: %s\n", psramFound() ? "✅ Disponível" : "❌ Não disponível");
  if(psramFound()) {
    Serial.printf("🔢 PSRAM Total: %d bytes (%.2f MB)\n", 
                  ESP.getPsramSize(), ESP.getPsramSize() / 1048576.0);
    Serial.printf("✅ PSRAM Livre: %d bytes (%.2f MB)\n", 
                  ESP.getFreePsram(), ESP.getFreePsram() / 1048576.0);
  }
  Serial.printf("🧠 Heap Livre: %d bytes\n", ESP.getFreeHeap());
  Serial.printf("⚡ CPU Freq: %d MHz\n", ESP.getCpuFreqMHz());
  Serial.printf("📷 Resolução: %s\n", psramFound() ? "320x240 (QVGA)" : "160x120 (QQVGA)");
  Serial.printf("⏱️  Intervalo de detecção: %d ms\n", DETECTION_INTERVAL);
  
  Serial.println("\n🚀 Sistema pronto para detectar objetos!");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
  delay(2000);
}

// ===== LOOP =====
void loop() {
  unsigned long currentTime = millis();
  
  // Manter WebSocket ativo
  socketIO.loop();
  
  // Executar detecção a cada intervalo definido (somente se câmera estiver OK e WebSocket conectado)
  if (cameraOK && websocketConnected && isRegistered && 
      currentTime - lastDetectionTime >= DETECTION_INTERVAL) {
    lastDetectionTime = currentTime;
    processFrame();
  } else if (!cameraOK && currentTime - lastDetectionTime >= 10000) {
    // Se câmera não está OK, exibe mensagem a cada 10 segundos
    lastDetectionTime = currentTime;
    Serial.println("⚠️  Sistema em modo seguro - Câmera não disponível");
    Serial.printf("🧠 Heap livre: %d bytes | ", ESP.getFreeHeap());
    Serial.printf("📶 WiFi: %s | ", wifiConnected ? "Conectado" : "Desconectado");
    Serial.printf("🔌 WebSocket: %s\n", websocketConnected ? "Conectado" : "Desconectado");
  } else if (cameraOK && !isRegistered && websocketConnected && 
             currentTime - lastDetectionTime >= 5000) {
    // Tentar registrar novamente se não estiver registrado
    lastDetectionTime = currentTime;
    Serial.println("⚠️  Tentando registrar no servidor...");
    registerESP32();
  }
  
  // Verificar conexão WiFi
  if (WiFi.status() != WL_CONNECTED && wifiConnected) {
    wifiConnected = false;
    websocketConnected = false;
    isRegistered = false;
    Serial.println("⚠️  WiFi desconectado!");
  } else if (WiFi.status() == WL_CONNECTED && !wifiConnected) {
    wifiConnected = true;
    Serial.println("✅ WiFi reconectado!");
    
    // Reconectar WebSocket
    Serial.println("🔌 Reconectando WebSocket...");
    socketIO.begin(serverIP, serverPort, "/socket.io/?EIO=4&transport=websocket");
  }
  
  delay(100);
}
