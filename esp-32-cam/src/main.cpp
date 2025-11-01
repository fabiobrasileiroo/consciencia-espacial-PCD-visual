#include <Arduino.h>
#include "esp_camera.h"
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>

// ===========================
// Select camera model in board_config.h
// ===========================
#include "board_config.h"

// ===========================
// Enter your WiFi credentials
// ===========================
const char *ssid = "FJ";
const char *password = "#f39A@jl32*1";

// ===========================
// ESP-NOW Configuration
// ===========================
// SUBSTITUA PELO MAC ADDRESS DO SEU ESP32-PAI
uint8_t paiMacAddress[] = {0xEC, 0x64, 0xC9, 0x7C, 0x38, 0x30};

// Estrutura de dados para enviar ao PAI
typedef struct struct_camera_status {
  int moduleId;           // 2 = camera
  bool capturing;         // Se está capturando frames
  int frameCount;         // Quantidade de frames capturados
  long rssi;              // Sinal WiFi
  unsigned long uptime;   // Tempo ligado (ms)
} struct_camera_status;

struct_camera_status cameraStatus;
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 3000;  // Enviar status a cada 3s

// ===========================
// ESP-NOW Callbacks
// ===========================
void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  if (status == ESP_NOW_SEND_SUCCESS) {
    Serial.println("📤 Heartbeat enviado ao PAI com sucesso");
  } else {
    Serial.println("❌ Falha ao enviar heartbeat ao PAI");
  }
}

void sendHeartbeatToPAI() {
  cameraStatus.moduleId = 2;  // ID da câmera
  cameraStatus.capturing = true;
  cameraStatus.frameCount++;
  cameraStatus.rssi = WiFi.RSSI();
  cameraStatus.uptime = millis();
  
  esp_err_t result = esp_now_send(paiMacAddress, (uint8_t*)&cameraStatus, sizeof(cameraStatus));
  
  if (result == ESP_OK) {
    Serial.printf("💓 Heartbeat enviado - Frames: %d, RSSI: %ld dBm\n", 
                  cameraStatus.frameCount, cameraStatus.rssi);
  } else {
    Serial.printf("❌ Erro ESP-NOW: %d\n", result);
  }
}

void startCameraServer();
void setupLedFlash();

void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println();

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
  config.pixel_format = PIXFORMAT_JPEG;  // for streaming
  //config.pixel_format = PIXFORMAT_RGB565; // for face detection/recognition
  config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
  config.fb_location = CAMERA_FB_IN_PSRAM;
  config.jpeg_quality = 12;
  config.fb_count = 1;

  // if PSRAM IC present, init with UXGA resolution and higher JPEG quality
  //                      for larger pre-allocated frame buffer.
  if (config.pixel_format == PIXFORMAT_JPEG) {
    if (psramFound()) {
      config.jpeg_quality = 10;
      config.fb_count = 2;
      config.grab_mode = CAMERA_GRAB_LATEST;
    } else {
      // Limit the frame size when PSRAM is not available
      config.frame_size = FRAMESIZE_SVGA;
      config.fb_location = CAMERA_FB_IN_DRAM;
    }
  } else {
    // Best option for face detection/recognition
    config.frame_size = FRAMESIZE_240X240;
#if CONFIG_IDF_TARGET_ESP32S3
    config.fb_count = 2;
#endif
  }

#if defined(CAMERA_MODEL_ESP_EYE)
  pinMode(13, INPUT_PULLUP);
  pinMode(14, INPUT_PULLUP);
#endif

  // camera init
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }

  sensor_t *s = esp_camera_sensor_get();
  // initial sensors are flipped vertically and colors are a bit saturated
  if (s->id.PID == OV3660_PID) {
    s->set_vflip(s, 1);        // flip it back
    s->set_brightness(s, 1);   // up the brightness just a bit
    s->set_saturation(s, -2);  // lower the saturation
  }
  // drop down frame size for higher initial frame rate
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

// Setup LED FLash if LED pin is defined in camera_pins.h
#if defined(LED_GPIO_NUM)
  setupLedFlash();
#endif

  WiFi.begin(ssid, password);
  WiFi.setSleep(false);

  Serial.print("WiFi connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");

  // ===========================
  // Inicializar ESP-NOW
  // ===========================
  // Mudar para modo AP_STA (AP para servidor HTTP + STA para ESP-NOW)
  WiFi.mode(WIFI_AP_STA);
  
  if (esp_now_init() == ESP_OK) {
    Serial.println("✅ ESP-NOW inicializado com sucesso");
    
    // Registrar callback de envio
    esp_now_register_send_cb(OnDataSent);
    
    // Adicionar ESP32-PAI como peer
    esp_now_peer_info_t peerInfo = {};
    memcpy(peerInfo.peer_addr, paiMacAddress, 6);
    peerInfo.channel = 0;
    peerInfo.encrypt = false;
    
    if (esp_now_add_peer(&peerInfo) == ESP_OK) {
      Serial.println("✅ ESP32-PAI adicionado como peer");
      Serial.printf("   MAC: %02X:%02X:%02X:%02X:%02X:%02X\n",
                    paiMacAddress[0], paiMacAddress[1], paiMacAddress[2],
                    paiMacAddress[3], paiMacAddress[4], paiMacAddress[5]);
    } else {
      Serial.println("❌ Erro ao adicionar PAI como peer");
    }
  } else {
    Serial.println("❌ Erro ao inicializar ESP-NOW");
  }
  
  // Inicializar estrutura de status
  cameraStatus.moduleId = 2;
  cameraStatus.capturing = false;
  cameraStatus.frameCount = 0;
  cameraStatus.rssi = WiFi.RSSI();
  cameraStatus.uptime = 0;

  startCameraServer();

  Serial.print("Camera Ready! Use 'http://");
  Serial.print(WiFi.localIP());
  Serial.println("' to connect");
  Serial.println("📡 ESP-NOW: Enviando heartbeat a cada 3 segundos");
}

void loop() {
  // Enviar heartbeat periódico via ESP-NOW
  if (millis() - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    sendHeartbeatToPAI();
    lastHeartbeat = millis();
  }
  
  delay(100);
}
