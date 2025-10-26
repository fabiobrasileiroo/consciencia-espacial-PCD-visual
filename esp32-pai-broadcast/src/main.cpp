#include <Arduino.h>
#include <esp_now.h>
#include <WiFi.h>

// MAC Address do Módulo 1 (Cálculo de distância)
// SUBSTITUA PELO MAC DO SEU ESP32 DO MÓDULO 1
uint8_t modulo1Address[] = {0xD0, 0xEF, 0x76, 0x15, 0x8F, 0x04};
// D0:EF:76:15:8F:04 módulo 1


// MAC Address do Módulo 3 (Motor de Vibração)
// SUBSTITUA PELO MAC DO SEU ESP32 DO MÓDULO 3
uint8_t modulo3Address[] = {0xEC, 0x64, 0xC9, 0x7B, 0x99, 0x8C};
// EC:64:C9:7B:99:8C módulo 3


// Estrutura para receber dados do Módulo 1
typedef struct struct_receive {
  int distance;
  int moduleId;
} struct_receive;

// Estrutura para enviar comandos ao Módulo 2
typedef struct struct_send {
  int vibrationLevel; // 0=parado, 1=baixo, 2=médio, 3=forte
  int moduleId;
} struct_send;

struct_receive receivedData;
struct_send commandData;

// Callback quando dados são recebidos
void OnDataRecv(const uint8_t * mac, const uint8_t *incomingData, int len) {
  memcpy(&receivedData, incomingData, sizeof(receivedData));
  
  Serial.println("\n=== DADOS RECEBIDOS ===");
  Serial.print("Módulo ID: ");
  Serial.println(receivedData.moduleId);
  Serial.print("Distância: ");
  Serial.print(receivedData.distance);
  Serial.println(" cm");
  
  // Determinar nível de vibração baseado na distância
  int vibLevel = 0;
  
  if (receivedData.distance < 20) {
    vibLevel = 3; // FORTE - Muito perto!
    Serial.println("Intensidade: FORTE");
  } else if (receivedData.distance < 50) {
    vibLevel = 2; // MÉDIO - Atenção!
    Serial.println("Intensidade: MÉDIA");
  } else if (receivedData.distance < 100) {
    vibLevel = 1; // BAIXO - Cuidado!
    Serial.println("Intensidade: BAIXA");
  } else {
    vibLevel = 0; // PARADO - Caminho livre
    Serial.println("Intensidade: PARADO");
  }
  
  // Enviar comando para o Módulo 3
  commandData.vibrationLevel = vibLevel;
  commandData.moduleId = 3;
  
  esp_err_t result = esp_now_send(modulo3Address, (uint8_t *) &commandData, sizeof(commandData));
  
  if (result == ESP_OK) {
    Serial.println("Comando enviado ao Módulo 3 com sucesso!");
  } else {
    Serial.println("Erro ao enviar comando ao Módulo 3");
  }
  Serial.println("=======================\n");
}

// Callback quando dados são enviados
void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  Serial.print("Status do envio para Módulo 3: ");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Sucesso" : "Falha");
}

void setup() {
  Serial.begin(115200);
  
  Serial.println("\n\n=================================");
  Serial.println("ESP32-PAI - MESTRE (BROADCAST)");
  Serial.println("=================================");
  
  // Configurar WiFi em modo Station
  WiFi.mode(WIFI_STA);
  
  Serial.print("MAC Address do PAI: ");
  Serial.println(WiFi.macAddress());
  Serial.println("IMPORTANTE: Use este MAC no Módulo 1!");
  
  // Inicializar ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("Erro ao inicializar ESP-NOW");
    return;
  }
  
  Serial.println("ESP-NOW inicializado com sucesso!");
  
  // Registrar callbacks
  esp_now_register_recv_cb(OnDataRecv);
  esp_now_register_send_cb(OnDataSent);

  // Registrar peer (Módulo 3 - Motor de Vibração)
  esp_now_peer_info_t peerInfo3;
  memset(&peerInfo3, 0, sizeof(esp_now_peer_info_t));
  memcpy(peerInfo3.peer_addr, modulo3Address, 6);
  peerInfo3.channel = 0;
  peerInfo3.encrypt = false;
  peerInfo3.ifidx = WIFI_IF_STA;
  
  if (esp_now_add_peer(&peerInfo3) != ESP_OK) {
    Serial.println("Falha ao adicionar Módulo 3 como peer");
    return;
  }

  Serial.println("Módulo 3 registrado como peer!");
  Serial.println("\nAguardando dados do Módulo 1...\n");
}

void loop() {
  // O loop fica vazio, tudo é feito nos callbacks
  delay(10);
}

