#include <Arduino.h>
#include <esp_now.h>
#include <WiFi.h>
#include <esp_wifi.h>  // Necessário para esp_wifi_set_channel
#include <Wire.h>
#include <Adafruit_Sensor.h>  // https://github.com/adafruit/Adafruit_Sensor

// ===== AHT10 ATIVO (novo sensor) =====
#include <Adafruit_AHTX0.h>
Adafruit_AHTX0 aht10;
sensors_event_t aht10Temp, aht10Hum;
const String SENSOR_NAME = "AHT10 T & H";
float temperature = -99;
float humidity = -99;
bool aht10_ok = false;

// MPU6050 DESABILITADO
// #include <Adafruit_MPU6050.h>
// Adafruit_MPU6050 mpu;
// bool mpu6050_ok = false;

// NOTE: Definição dos pinos do HC-SR04
#define TRIG_PIN 33 
#define ECHO_PIN 25

// NOTE: Definição dos pinos do AHT10 (agora ativo)
// Usando pinos I2C padrão do ESP32
#define AHT10_SDA 21   // GPIO 21 (SDA)
#define AHT10_SCL 22   // GPIO 22 (SCL)

// MPU6050 desabilitado — se quiser reativar depois, defina aqui os pinos
// #define MPU6050_SDA 21
// #define MPU6050_SCL 22

// MAC Address do ESP32-PAI (SUBSTITUA PELO MAC DO SEU ESP32-PAI)
// Para descobrir o MAC, use: WiFi.macAddress()
// EC:64:C9:7C:38:30 é o MAC do PAI
uint8_t broadcastAddress[] = {0xEC, 0x64, 0xC9, 0x7C, 0x38, 0x30};

// Estrutura para enviar dados
typedef struct struct_message {
  int distance;
  int moduleId;
  float temperature;
  float humidity;
  uint8_t sensorOk;
} struct_message;

struct_message myData;

// Callback quando dados são enviados
void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  Serial.print("Status do envio: ");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Sucesso" : "Falha");
}

// Função para medir distância
int measureDistance() {
  // Garante trigger em LOW antes do pulso
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // timeout de 30ms
  
  if (duration == 0) {
    return -1; // Erro na leitura
  }

  // Se ainda não temos temperatura válida, assume 20 °C como fallback
  float tempC = temperature;
  if (tempC < -40 || tempC > 85) {
    tempC = 20.0;
  }

  // Velocidade do som em m/s em função da temperatura
  float speedSound = 331.0 + 0.6 * tempC; // m/s

  // Converter duration (µs) em distância (cm):
  // d_cm = duration * speedSound / (2 * 10^4)
  float distanceCm = (duration * speedSound) / 20000.0f;

  Serial.printf("HC-SR04: temp=%.2f °C, c=%.2f m/s, dur=%ld us, dist=%.2f cm\n",
                tempC, speedSound, duration, distanceCm);

  return (int)distanceCm;
}

void setup() {
  Serial.begin(115200);
  
  // Configurar pinos do sensor
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  // Configurar WiFi em modo Station
  WiFi.mode(WIFI_STA);
  WiFi.disconnect(); // Desconectar de qualquer rede anterior
  
  // ⚠️ IMPORTANTE: Definir o mesmo canal WiFi do PAI
  // O PAI usa o canal da rede WiFi "FJ"
  // SEU ROTEADOR ESTÁ NO CANAL 4 (visto no monitor serial do PAI)
  int8_t channel = 6; // ← CANAL 4 DO SEU ROTEADOR "FJ"
  esp_wifi_set_channel(channel, WIFI_SECOND_CHAN_NONE);
  
  Serial.println("\n╔════════════════════════════════════════╗");
  Serial.println("║   MÓDULO 1 - SENSOR HC-SR04        ║");
  Serial.println("╚════════════════════════════════════════╝");
  Serial.printf("📍 MAC Address: %s\n", WiFi.macAddress().c_str());
  Serial.printf("📡 Canal WiFi: %d\n", channel);
  Serial.printf("📡 MAC do PAI: %02X:%02X:%02X:%02X:%02X:%02X\n",
    broadcastAddress[0], broadcastAddress[1], broadcastAddress[2],
    broadcastAddress[3], broadcastAddress[4], broadcastAddress[5]);
  
  // Inicializar ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("❌ Erro ao inicializar ESP-NOW");
    return;
  }
  
  Serial.println("✅ ESP-NOW inicializado!");
  
  // Registrar callback de envio
  esp_now_register_send_cb(OnDataSent);
  
  // Registrar peer (ESP32-PAI) - SEM especificar canal!
  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, broadcastAddress, 6);
  peerInfo.channel = 0;  // 0 = usa canal atual do WiFi
  peerInfo.encrypt = false;
  peerInfo.ifidx = WIFI_IF_STA;
  
  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("❌ Falha ao adicionar ESP32-PAI como peer");
    return;
  }
  
  Serial.println("✅ ESP32-PAI registrado como peer!");
  Serial.println("✅ Sistema pronto para enviar dados!\n");
  
  // ========================================
  // INICIALIZAÇÃO DO AHT10 (SDA=21, SCL=22)
  // ========================================
  Serial.println("╔═══════════════════════════════════════╗");
  Serial.println("║   DIAGNÓSTICO SENSOR AHT10            ║");
  Serial.println("╚═══════════════════════════════════════╝");
  Serial.printf("🔌 Configurando I2C para AHT10...\n");
  Serial.printf("   SDA: GPIO %d\n", AHT10_SDA);
  Serial.printf("   SCL: GPIO %d\n", AHT10_SCL);

  Wire.begin(AHT10_SDA, AHT10_SCL);
  delay(100);

  Serial.println("\n🔍 Escaneando barramento I2C...");
  byte error, address;
  int nDevices = 0;

  for (address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();

    if (error == 0) {
      Serial.printf("✅ Dispositivo I2C encontrado no endereço 0x%02X\n", address);
      nDevices++;
    }
  }

  if (nDevices == 0) {
    Serial.println("❌ NENHUM dispositivo I2C encontrado!");
    Serial.println("   Verifique:");
    Serial.println("   - Conexões SDA e SCL");
    Serial.println("   - Alimentação do sensor (3.3V)");
    Serial.println("   - Soldagem dos fios");
  } else {
    Serial.printf("✅ Total de dispositivos I2C: %d\n", nDevices);
  }

  // Tentar inicializar AHT10
  Serial.println("\n�️ Inicializando sensor AHT10...");
  if (!aht10.begin()) {
    Serial.println("❌ Falha ao inicializar AHT10!");
    Serial.println("   O sensor deve estar no endereço 0x38");
    Serial.println("   Continuando sem sensor de temperatura...\n");
    aht10_ok = false;
  } else {
    Serial.println("✅ Sensor AHT10 inicializado com sucesso!");
    aht10_ok = true;

    // Fazer leitura de teste
    sensors_event_t temp, hum;
    aht10.getEvent(&hum, &temp);
    Serial.printf("📊 Leitura de teste:\n");
    Serial.printf("   Temperatura: %.2f °C\n", temp.temperature);
    Serial.printf("   Umidade: %.2f %%\n\n", hum.relative_humidity);
  }

  Serial.println("═══════════════════════════════════════\n");
}

// ═══════════════════════════════════════════════════════════
// FUNÇÃO AHT10 DESABILITADA (sensor removido)
// ═══════════════════════════════════════════════════════════
/*
void getAht10Values() {
  // Sensor removido temporariamente
  Serial.println("\n╔════════════════════════════════════════════════════╗");
  Serial.println("║       🌡️  SENSOR AHT10 DESABILITADO              ║");
  Serial.println("╚════════════════════════════════════════════════════╝");
}
*/

// ====== FUNÇÕES RELACIONADAS AO MPU6050 DESABILITADAS ======
// (mantidas comentadas caso queira voltar a usar depois)
/*
String getOrientation(float x, float y, float z) { ... }
void getMpuValues() { ... }
*/

// ========= LEITURA DO AHT10 =========
void getAht10Values() {
  if (!aht10_ok) {
    Serial.println("\n╔════════════════════════════════════════════════════╗");
    Serial.println("║       🌡️  SENSOR AHT10 (Temp & Umidade)           ║");
    Serial.println("╠════════════════════════════════════════════════════╣");
    Serial.println("║  ⚠️  Sensor AHT10 não inicializado");
    Serial.println("╚════════════════════════════════════════════════════╝");
    return;
  }

  aht10.getEvent(&aht10Hum, &aht10Temp);
  temperature = aht10Temp.temperature;
  humidity    = aht10Hum.relative_humidity;

  Serial.println("\n╔════════════════════════════════════════════════════╗");
  Serial.println("║       🌡️  SENSOR AHT10 (Temp & Umidade)           ║");
  Serial.println("╠════════════════════════════════════════════════════╣");
  Serial.printf ("║  🌡️  Temperatura: %6.2f °C\n", temperature);
  Serial.printf ("║  � Umidade:      %6.2f %%\n", humidity);
  Serial.println("╚════════════════════════════════════════════════════╝");
}

void loop() {
  Serial.println("\n\n");
  Serial.println("████████████████████████████████████████████████████████");
  Serial.println("█          🔄 NOVA LEITURA DE SENSORES               █");
  Serial.println("████████████████████████████████████████████████████████");
  
  // Leitura dos sensores
  getAht10Values();   // Agora só AHT10 está ativo
  
  // ═══════════════════════════════════════════════════════════
  // SENSOR DE DISTÂNCIA HC-SR04
  // ═══════════════════════════════════════════════════════════
  Serial.println("\n╔════════════════════════════════════════════════════╗");
  Serial.println("║       📏 SENSOR DE DISTÂNCIA HC-SR04               ║");
  Serial.println("╠════════════════════════════════════════════════════╣");
  
  int distance = measureDistance();
  
  if (distance > 0 && distance < 400) { // HC-SR04 alcance até ~4m
    Serial.printf("║  📏 Distância medida: %4d cm\n", distance);
    
    // Indicador visual de proximidade
    if (distance < 20) {
      Serial.println("║  🚨 Status: MUITO PRÓXIMO!");
    } else if (distance < 50) {
      Serial.println("║  ⚠️  Status: PROXIMIDADE DETECTADA");
    } else if (distance < 100) {
      Serial.println("║  ✅ Status: DISTÂNCIA NORMAL");
    } else {
      Serial.println("║  🔵 Status: LONGE");
    }
    
    Serial.println("╠════════════════════════════════════════════════════╣");
    
  // Preparar dados para envio
  myData.distance = distance;
  myData.moduleId = 1; // ID do Módulo 1
  myData.temperature = aht10_ok ? temperature : -127.0f;
  myData.humidity = aht10_ok ? humidity : -1.0f;
  myData.sensorOk = aht10_ok ? 1 : 0;
    
    // Enviar dados via ESP-NOW
    esp_err_t result = esp_now_send(broadcastAddress, (uint8_t *) &myData, sizeof(myData));

    if (result == ESP_OK) {
      Serial.println("║  ✅ Dados enviados para ESP32-PAI");
    } else {
      Serial.printf("║  ❌ Erro ao enviar dados (código: %d)\n", result);
    }
  } else {
    Serial.println("║  ⚠️  Erro na leitura ou fora de alcance");
  }
  
  Serial.println("╚════════════════════════════════════════════════════╝");
  
  delay(500); // Atualizar a cada 500ms
}

