// #include <Arduino.h>
// #define PIN 4
// void setup() {
//   // put your setup code here, to run once:
//   pinMode(PIN,OUTPUT);
// }

// void loop() {
//   // put your main code here, to run repeatedly:
//   digitalWrite(PIN, HIGH);
//   delay(500);
//   digitalWrite(PIN,LOW);
//   delay(500);
// }

#include <Arduino.h>
#include <esp_now.h>
#include <WiFi.h>

// Pino do motor de vibração (vibracall)
#define MOTOR_PIN 4
#define PWM_CHANNEL 0
#define PWM_FREQ 1000
#define PWM_RESOLUTION 8

// Estrutura para receber comandos
typedef struct struct_message {
  int vibrationLevel; // 0=parado, 1=baixo, 2=médio, 3=forte
  int moduleId;
} struct_message;

struct_message receivedCommand;

// Variáveis de controle
int currentLevel = 0;
unsigned long lastUpdate = 0;
bool motorState = false;

// Callback quando dados são recebidos
void OnDataRecv(const uint8_t * mac, const uint8_t *incomingData, int len) {
  memcpy(&receivedCommand, incomingData, sizeof(receivedCommand));
  
  Serial.println("\n=== COMANDO RECEBIDO ===");
  Serial.print("Módulo ID: ");
  Serial.println(receivedCommand.moduleId);
  Serial.print("Nível de Vibração: ");
  Serial.println(receivedCommand.vibrationLevel);
  
  switch(receivedCommand.vibrationLevel) {
    case 0:
      Serial.println("PARADO");
      break;
    case 1:
      Serial.println("BAIXO");
      break;
    case 2:
      Serial.println("MÉDIO");
      break;
    case 3:
      Serial.println("FORTE");
      break;
    default:
      Serial.println("INVÁLIDO");
  }
  
  currentLevel = receivedCommand.vibrationLevel;
  Serial.print("currentLevel atualizado para: ");
  Serial.println(currentLevel);
  Serial.println("========================\n");
}

void setup() {
  Serial.begin(115200);
  
  // Configurar PWM para o motor
  ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(MOTOR_PIN, PWM_CHANNEL);
  ledcWrite(PWM_CHANNEL, 0); // Iniciar desligado
  
  Serial.println("\n\n=================================");
  Serial.println("MÓDULO 3 - MOTOR DE VIBRAÇÃO");
  Serial.println("=================================");
  
  // Configurar WiFi em modo Station
  WiFi.mode(WIFI_STA);
  
  Serial.print("MAC Address do Módulo 3: ");
  Serial.println(WiFi.macAddress());
  Serial.println("IMPORTANTE: Use este MAC no ESP32-PAI!");
  
  // Inicializar ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("Erro ao inicializar ESP-NOW");
    return;
  }
  
  Serial.println("ESP-NOW inicializado com sucesso!");
  
  // Registrar callback de recepção
  esp_now_register_recv_cb(OnDataRecv);
  
  Serial.println("Aguardando comandos do ESP32-PAI...\n");
}

void loop() {
  unsigned long currentTime = millis();
  
  // Debug a cada 2 segundos
  static unsigned long lastDebug = 0;
  if (currentTime - lastDebug >= 2000) {
    Serial.print("Loop - currentLevel: ");
    Serial.println(currentLevel);
    lastDebug = currentTime;
  }
  
  switch(currentLevel) {
    case 0: // PARADO
      ledcWrite(PWM_CHANNEL, 0);
      motorState = false;
      break;
      
    case 1: // BAIXO - PWM 30% (pulsa lentamente)
      if (currentTime - lastUpdate >= 500) {
        motorState = !motorState;
        ledcWrite(PWM_CHANNEL, motorState ? 77 : 0); // 30% de 255
        Serial.print("BAIXO - Motor: ");
        Serial.println(motorState ? "ON (30%)" : "OFF");
        lastUpdate = currentTime;
      }
      break;
      
    case 2: // MÉDIO - PWM 60% (pulsa rapidamente)
      if (currentTime - lastUpdate >= 250) {
        motorState = !motorState;
        ledcWrite(PWM_CHANNEL, motorState ? 153 : 0); // 60% de 255
        Serial.print("MÉDIO - Motor: ");
        Serial.println(motorState ? "ON (60%)" : "OFF");
        lastUpdate = currentTime;
      }
      break;
      
    case 3: // FORTE - PWM 100% (sempre ligado)
      ledcWrite(PWM_CHANNEL, 255); // 100%
      if (currentTime - lastUpdate >= 1000) {
        Serial.println("FORTE - Motor: ON (100%)");
        lastUpdate = currentTime;
      }
      motorState = true;
      break;
      
    default:
      ledcWrite(PWM_CHANNEL, 0);
      motorState = false;
  }
  
  delay(10);
}

//  Níveis de Vibração com PWM:
// Nível	Intensidade	Comportamento
// 0	PARADO	Motor desligado (0%)
// 1	BAIXO	Pulsa 500ms ON/OFF com 30% de potência
// 2	MÉDIO	Pulsa 250ms ON/OFF com 60% de potência
// 3	FORTE	Sempre ligado com 100% de potência