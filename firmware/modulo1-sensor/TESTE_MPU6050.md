# 🧪 TESTE DO MPU6050 - GUIA RÁPIDO

## ✅ O que você deve ver no Serial Monitor:

### 1️⃣ Durante o SETUP (inicialização):
```
╔═══════════════════════════════════════╗
║   DIAGNÓSTICO SENSOR MPU6050          ║
╚═══════════════════════════════════════╝
🔌 Configurando I2C para MPU6050...
   SDA: GPIO 32
   SCL: GPIO 27

🔍 Escaneando barramento I2C (MPU6050)...
✅ Dispositivo I2C encontrado no endereço 0x68
✅ Total de dispositivos I2C: 1

🎯 Inicializando sensor MPU6050...
✅ MPU6050 inicializado com sucesso!
```

### 2️⃣ Durante o LOOP (leituras):
```
╔════════════════════════════════════════════════════╗
║          📊 LEITURA MPU6050 (IMU)                  ║
╠════════════════════════════════════════════════════╣
║  🎯 ORIENTAÇÃO:
║     👆 OLHANDO PARA CIMA (CÉU)
╠════════════════════════════════════════════════════╣
║  📈 ACELERÔMETRO (m/s²):
║     X:    -0.52  Y:    +1.23  Z:    +9.81
║  🌀 GIROSCÓPIO (rad/s):
║     X:    +0.02  Y:    -0.01  Z:    +0.00
║  🌡️  TEMPERATURA MPU:
║     36.5 °C
╚════════════════════════════════════════════════════╝
```

---

## ❌ Se os valores estiverem TODOS ZERADOS:

### **Problema**: Sensor não conectado ou com erro

```
║  📈 ACELERÔMETRO (m/s²):
║     X:    +0.00  Y:    +0.00  Z:    +0.00  ⚠️ ERRO!
║  🌀 GIROSCÓPIO (rad/s):
║     X:    +0.00  Y:    +0.00  Z:    +0.00  ⚠️ ERRO!
```

### **Soluções**:
1. ✅ Verifique conexões físicas:
   - SDA → GPIO 32
   - SCL → GPIO 27
   - VCC → 3.3V
   - GND → GND

2. ✅ Verifique se o scan I2C encontrou dispositivo em **0x68**

3. ✅ Teste trocar os pinos SDA/SCL (pode estar invertido)

4. ✅ Meça tensão no VCC do MPU6050 (deve ser 3.3V)

---

## 📊 VALORES ESPERADOS (MPU6050 em REPOUSO):

### **Acelerômetro** (gravidade terrestre):
- **Z ≈ +9.81 m/s²** (se sensor plano, virado para cima)
- **Z ≈ -9.81 m/s²** (se sensor de cabeça para baixo)
- X e Y devem ser próximos de 0

### **Giroscópio** (em repouso):
- Todos os eixos próximos de **0.00** (pequenas variações ±0.05 são normais)

### **Temperatura**:
- Entre **25-40°C** (temperatura do chip)

---

## 🎯 TESTE DE ORIENTAÇÃO:

### 1️⃣ **Sensor PLANO (virado para cima)**:
```
║  🎯 ORIENTAÇÃO:
║     👆 OLHANDO PARA CIMA (CÉU)
║  📈 ACELERÔMETRO (m/s²):
║     X:    +0.00  Y:    +0.00  Z:    +9.81
```

### 2️⃣ **Sensor DE CABEÇA PARA BAIXO**:
```
║  🎯 ORIENTAÇÃO:
║     👇 OLHANDO PARA BAIXO
║  📈 ACELERÔMETRO (m/s²):
║     X:    +0.00  Y:    +0.00  Z:    -9.81
```

### 3️⃣ **Sensor NA VERTICAL (em pé)**:
```
║  🎯 ORIENTAÇÃO:
║     ➡️  OLHANDO RETO (HORIZONTAL)
║  📈 ACELERÔMETRO (m/s²):
║     X:    +9.81  Y:    +0.00  Z:    +0.00
```

---

## 🔧 COMANDOS ÚTEIS:

### Fazer upload do código:
```bash
cd /home/fabiotrocados/inovatech2025/sistema_de_dectacao_de_objetos/firmware/modulo1-sensor
platformio run --target upload
```

### Abrir monitor serial:
```bash
platformio device monitor --baud 115200
```

### Upload + Monitor (tudo junto):
```bash
platformio run --target upload && platformio device monitor --baud 115200
```

---

## 🚨 DIAGNÓSTICO RÁPIDO:

| Sintoma | Causa Provável | Solução |
|---------|---------------|----------|
| Valores todos 0.00 | Sensor não inicializado | Verificar conexões físicas |
| Não encontra 0x68 no scan | Problema I2C | Trocar pinos SDA/SCL ou verificar soldagem |
| Z ≈ 9.81 mas não muda | Sensor travado | Reset do ESP32 |
| Temperatura absurda | Sensor defeituoso | Testar outro MPU6050 |
| Orientação sempre "SEM GRAVIDADE" | magnitude < 0.1 | Valores muito baixos, sensor com problema |

---

## 📝 CÓDIGO ATUAL:

O código em `/modulo1-sensor/src/main.cpp` já está configurado com:
- ✅ Detecção de orientação (para baixo/cima/reto)
- ✅ Display formatado com caixas
- ✅ Leitura de Acelerômetro, Giroscópio e Temperatura
- ✅ Indicadores visuais com emojis
