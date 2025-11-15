// ═══════════════════════════════════════════════════════════
// TESTE ISOLADO DO MPU6050
// Use este código para testar APENAS o giroscópio/acelerômetro
// ═══════════════════════════════════════════════════════════

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

TwoWire I2C_MPU = TwoWire(1);
Adafruit_MPU6050 mpu;

#define MPU6050_SDA 32
#define MPU6050_SCL 27

// Função para determinar orientação
String getOrientation(float x, float y, float z) {
  float magnitude = sqrt(x*x + y*y + z*z);
  
  if (magnitude < 0.1) {
    return "❓ SEM GRAVIDADE";
  }
  
  float nx = x / magnitude;
  float ny = y / magnitude;
  float nz = z / magnitude;
  
  const float THRESHOLD_LOOKING_DOWN = 0.7;
  const float THRESHOLD_LOOKING_UP = -0.7;
  const float THRESHOLD_UPRIGHT = 0.3;
  
  if (nz < THRESHOLD_LOOKING_UP) {
    return "👇 OLHANDO PARA BAIXO";
  } 
  else if (nz > THRESHOLD_LOOKING_DOWN) {
    return "👆 OLHANDO PARA CIMA (CÉU)";
  } 
  else if (abs(nz) < THRESHOLD_UPRIGHT) {
    return "➡️  OLHANDO RETO (HORIZONTAL)";
  }
  else {
    return "↗️  INCLINADO";
  }
}

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n\n");
  Serial.println("╔═══════════════════════════════════════════════════════╗");
  Serial.println("║       🧪 TESTE ISOLADO DO MPU6050                    ║");
  Serial.println("╚═══════════════════════════════════════════════════════╝");
  
  // Configurar I2C
  Serial.printf("🔌 Configurando I2C...\n");
  Serial.printf("   SDA: GPIO %d\n", MPU6050_SDA);
  Serial.printf("   SCL: GPIO %d\n", MPU6050_SCL);
  
  I2C_MPU.begin(MPU6050_SDA, MPU6050_SCL, 400000);
  delay(100);
  
  // Escanear I2C
  Serial.println("\n🔍 Escaneando barramento I2C...");
  byte error, address;
  int nDevices = 0;
  
  for(address = 1; address < 127; address++ ) {
    I2C_MPU.beginTransmission(address);
    error = I2C_MPU.endTransmission();
    
    if (error == 0) {
      Serial.printf("   ✅ Dispositivo encontrado: 0x%02X", address);
      if (address == 0x68) Serial.print(" ← MPU6050!");
      Serial.println();
      nDevices++;
    }
  }
  
  if (nDevices == 0) {
    Serial.println("   ❌ NENHUM dispositivo I2C encontrado!");
    Serial.println("\n🚨 PROBLEMA DETECTADO:");
    Serial.println("   1. Verifique se o MPU6050 está conectado");
    Serial.println("   2. Verifique os pinos SDA (32) e SCL (27)");
    Serial.println("   3. Verifique alimentação 3.3V");
    Serial.println("   4. Tente trocar SDA com SCL (pode estar invertido)");
    while(1) delay(1000);
  }
  
  // Inicializar MPU6050
  Serial.println("\n🎯 Inicializando MPU6050...");
  if (!mpu.begin(0x68, &I2C_MPU)) {
    Serial.println("   ❌ FALHA ao inicializar MPU6050!");
    Serial.println("\n🚨 PROBLEMA:");
    Serial.println("   - Dispositivo encontrado no scan, mas não inicializa");
    Serial.println("   - Pode ser problema de alimentação ou sensor defeituoso");
    while(1) delay(1000);
  }
  
  Serial.println("   ✅ MPU6050 inicializado com sucesso!");
  
  // Configurar ranges
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  
  Serial.println("\n📊 Configurações:");
  Serial.print("   Acelerômetro: ");
  switch (mpu.getAccelerometerRange()) {
    case MPU6050_RANGE_2_G: Serial.println("±2G"); break;
    case MPU6050_RANGE_4_G: Serial.println("±4G"); break;
    case MPU6050_RANGE_8_G: Serial.println("±8G"); break;
    case MPU6050_RANGE_16_G: Serial.println("±16G"); break;
  }
  
  Serial.print("   Giroscópio: ");
  switch (mpu.getGyroRange()) {
    case MPU6050_RANGE_250_DEG: Serial.println("±250°/s"); break;
    case MPU6050_RANGE_500_DEG: Serial.println("±500°/s"); break;
    case MPU6050_RANGE_1000_DEG: Serial.println("±1000°/s"); break;
    case MPU6050_RANGE_2000_DEG: Serial.println("±2000°/s"); break;
  }
  
  Serial.println("\n✅ Iniciando leituras em 2 segundos...\n");
  delay(2000);
}

void loop() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);
  
  String orientation = getOrientation(a.acceleration.x, a.acceleration.y, a.acceleration.z);
  float magnitude = sqrt(a.acceleration.x * a.acceleration.x + 
                        a.acceleration.y * a.acceleration.y + 
                        a.acceleration.z * a.acceleration.z);
  
  Serial.println("\n╔════════════════════════════════════════════════════════╗");
  Serial.println("║              📊 LEITURA MPU6050                        ║");
  Serial.println("╠════════════════════════════════════════════════════════╣");
  
  // Orientação
  Serial.println("║  🎯 ORIENTAÇÃO:");
  Serial.printf("║     %s\n", orientation.c_str());
  Serial.println("╠════════════════════════════════════════════════════════╣");
  
  // Acelerômetro
  Serial.println("║  📈 ACELERÔMETRO (m/s²):");
  Serial.printf("║     X: %+8.2f  Y: %+8.2f  Z: %+8.2f\n", 
                a.acceleration.x, a.acceleration.y, a.acceleration.z);
  Serial.printf("║     Magnitude: %.2f m/s² (esperado ≈9.81)\n", magnitude);
  
  // Validação
  if (magnitude < 0.5) {
    Serial.println("║     ⚠️  ALERTA: Magnitude muito baixa!");
  } else if (magnitude > 15.0) {
    Serial.println("║     ⚠️  ALERTA: Magnitude muito alta!");
  } else {
    Serial.println("║     ✅ Magnitude OK");
  }
  
  Serial.println("╠════════════════════════════════════════════════════════╣");
  
  // Giroscópio
  Serial.println("║  🌀 GIROSCÓPIO (rad/s):");
  Serial.printf("║     X: %+8.2f  Y: %+8.2f  Z: %+8.2f\n", 
                g.gyro.x, g.gyro.y, g.gyro.z);
  
  // Validação
  if (abs(g.gyro.x) < 0.1 && abs(g.gyro.y) < 0.1 && abs(g.gyro.z) < 0.1) {
    Serial.println("║     ✅ Sensor em repouso");
  } else {
    Serial.println("║     🔄 Movimento detectado");
  }
  
  Serial.println("╠════════════════════════════════════════════════════════╣");
  
  // Temperatura
  Serial.println("║  🌡️  TEMPERATURA:");
  Serial.printf("║     %.2f °C", temp.temperature);
  
  if (temp.temperature > 25 && temp.temperature < 45) {
    Serial.println(" ✅ Normal");
  } else {
    Serial.println(" ⚠️  Fora do esperado");
  }
  
  Serial.println("╚════════════════════════════════════════════════════════╝");
  
  delay(1000); // Atualizar a cada 1 segundo
}
