#include <Arduino.h>
#include <esp_now.h>
#include <WiFi.h>

// NOTE: Definição dos pinos do HC-SR04
#define TRIG_PIN 33 
#define ECHO_PIN 25
// NOTE: Definição dos pinos do AHT10 sensor de temperatura e umidade
#define AHT10_SDA 21
#define AHT10_SCL 22

// MAC Address do ESP32-PAI (SUBSTITUA PELO MAC DO SEU ESP32-PAI)
// Para descobrir o MAC, use: WiFi.macAddress()
// EC:64:C9:7C:38:30 é o MAC do PAI
uint8_t broadcastAddress[] = {0xEC, 0x64, 0xC9, 0x7C, 0x38, 0x30};

// Estrutura para enviar dados
typedef struct struct_message {
  int distance;
  int moduleId;
} struct_message;

struct_message myData;

// Callback quando dados são enviados
void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  Serial.print("Status do envio: ");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Sucesso" : "Falha");
}

// Função para medir distância
int measureDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // timeout de 30ms
  
  if (duration == 0) {
    return -1; // Erro na leitura
  }
  
  int distance = (duration / 2) / 29.1;
  Serial.println("Distância medida: " + String(distance) + " cm");
  return distance;
}

void setup() {
  Serial.begin(115200);
  
  // Configurar pinos do sensor
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  // Configurar WiFi em modo Station
  WiFi.mode(WIFI_STA);
  
  Serial.println("MÓDULO 1 - SENSOR HC-SR04");
  Serial.print("MAC Address: ");
  Serial.println(WiFi.macAddress());
  
  // Inicializar ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("Erro ao inicializar ESP-NOW");
    return;
  }
  
  // Registrar callback de envio
  esp_now_register_send_cb(OnDataSent);
  
  // Registrar peer (ESP32-PAI)
  esp_now_peer_info_t peerInfo;
  memset(&peerInfo, 0, sizeof(esp_now_peer_info_t));
  memcpy(peerInfo.peer_addr, broadcastAddress, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;
  peerInfo.ifidx = WIFI_IF_STA;
  
  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Falha ao adicionar peer");
    return;
  }
  
  Serial.println("ESP-NOW Inicializado com sucesso!");
}

void loop() {
  Serial.println("=================================");
  Serial.println("MÓDULO 1 - Cálculo de Distância");
  Serial.println("=================================");
   WiFi.mode(WIFI_STA);
  
  Serial.print("MAC Address do filho módulo1: ");
  Serial.println(WiFi.macAddress());
  int distance = measureDistance();

  
  if (distance > 0 && distance < 400) { // HC-SR04 alcance até ~4m
    Serial.print("Distância: ");
    Serial.print(distance);
    Serial.println(" cm");
    
    // Preparar dados para envio
    myData.distance = distance;
    myData.moduleId = 1; // ID do Módulo 1
    
    // Enviar dados via ESP-NOW
    esp_err_t result = esp_now_send(broadcastAddress, (uint8_t *) &myData, sizeof(myData));

    if (result == ESP_OK) {
      Serial.println("Dados enviados com sucesso");
    } else {
      Serial.println("Erro ao enviar dados");
    }
  } else {
    Serial.println("Erro na leitura ou fora de alcance");
  }
  
  delay(500); // Atualizar a cada 500ms
}

