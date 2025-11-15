# 🔧 MUDANÇAS NO CÓDIGO - MPU6050

## ✅ O QUE FOI ALTERADO:

### 1️⃣ **AHT10 Removido Temporariamente**
- ❌ Código do AHT10 comentado
- ❌ Função `getAht10Values()` desabilitada
- ❌ Variáveis do AHT10 comentadas

### 2️⃣ **MPU6050 nos Pinos Padrão I2C**
- ✅ **SDA: GPIO 21** (pino padrão I2C do ESP32)
- ✅ **SCL: GPIO 22** (pino padrão I2C do ESP32)
- ✅ Usando barramento **Wire** padrão (não mais TwoWire)
- ✅ Simplificou a inicialização (`mpu.begin()` ao invés de `mpu.begin(0x68, &I2C_MPU)`)

### 3️⃣ **Detecção de Orientação Mantida**
- ✅ **👇 OLHANDO PARA BAIXO** - quando Z < -0.7
- ✅ **👆 OLHANDO PARA CIMA (CÉU)** - quando Z > 0.7
- ✅ **➡️ OLHANDO RETO (HORIZONTAL)** - quando Z próximo de 0
- ✅ **↗️ INCLINADO** - outras posições

### 4️⃣ **Validação Automática**
- ✅ Verifica se magnitude do acelerômetro está OK (≈9.81 m/s²)
- ✅ Detecta se valores estão zerados (sensor com problema)
- ✅ Mostra status de movimento do giroscópio

---

## 🔌 CONEXÕES FÍSICAS:

```
MPU6050          ESP32
-------          -----
VCC    ------→   3.3V
GND    ------→   GND
SDA    ------→   GPIO 21
SCL    ------→   GPIO 22
```

---

## 📊 O QUE VOCÊ VERÁ NO SERIAL MONITOR:

### Durante a Inicialização:
```
╔═══════════════════════════════════════╗
║   DIAGNÓSTICO SENSOR MPU6050          ║
╚═══════════════════════════════════════╝
🔌 Configurando I2C padrão do ESP32...
   SDA: GPIO 21 (pino padrão)
   SCL: GPIO 22 (pino padrão)

🔍 Escaneando barramento I2C...
✅ Dispositivo I2C encontrado no endereço 0x68 ← MPU6050!
✅ Total de dispositivos I2C: 1

🎯 Inicializando sensor MPU6050...
✅ MPU6050 inicializado com sucesso!
Variação do acelerômetro para: +-8G
Variação do Giroscópio para: +-500 deg/s
Filtro: 21 Hz

📊 Leitura de teste MPU6050:
   Acelerômetro Z: 9.81 m/s² (esperado ≈9.81)
   Temperatura: 28.50 °C
```

### Durante as Leituras:
```
████████████████████████████████████████████████████████
█          🔄 NOVA LEITURA DE SENSORES               █
████████████████████████████████████████████████████████

╔════════════════════════════════════════════════════╗
║          📊 LEITURA MPU6050 (IMU)                  ║
╠════════════════════════════════════════════════════╣
║  🎯 ORIENTAÇÃO:
║     👆 OLHANDO PARA CIMA (CÉU)
╠════════════════════════════════════════════════════╣
║  📈 ACELERÔMETRO (m/s²):
║     X:    -0.12  Y:    +0.34  Z:    +9.81
║     Magnitude: 9.82 m/s² ✅ OK
╠════════════════════════════════════════════════════╣
║  🌀 GIROSCÓPIO (rad/s):
║     X:    +0.01  Y:    -0.02  Z:    +0.00
║     Status: 🛑 Em repouso
╠════════════════════════════════════════════════════╣
║  🌡️  TEMPERATURA MPU:
║     28.45 °C
╚════════════════════════════════════════════════════╝
```

---

## 🚨 SE OS VALORES ESTIVEREM ZERADOS:

```
╔════════════════════════════════════════════════════╗
║          📊 LEITURA MPU6050 (IMU)                  ║
╠════════════════════════════════════════════════════╣
║  ⚠️  MPU6050 NÃO INICIALIZADO!
║
║  🔧 Verifique:
║     • Conexões SDA (GPIO 21) e SCL (GPIO 22)
║     • Alimentação 3.3V do sensor
║     • Soldagem dos fios
║     • Tente trocar SDA com SCL
╚════════════════════════════════════════════════════╝
```

### **Passos para resolver:**
1. ✅ Verificar se o MPU6050 aparece no scan I2C em **0x68**
2. ✅ Medir tensão VCC do MPU6050 (deve ser 3.3V)
3. ✅ Trocar fios SDA e SCL (pode estar invertido)
4. ✅ Verificar soldagem dos pinos
5. ✅ Testar com outro MPU6050 (pode estar defeituoso)

---

## 🎯 PARA FAZER UPLOAD:

### 1. Conectar o ESP32 via USB

### 2. Descobrir a porta:
```bash
ls /dev/ttyUSB* /dev/ttyACM*
```

### 3. Fazer upload:
```bash
cd /home/fabiotrocados/inovatech2025/sistema_de_dectacao_de_objetos/firmware/modulo1-sensor
~/.platformio/penv/bin/platformio run --target upload --upload-port /dev/ttyUSB0
```

### 4. Abrir monitor serial:
```bash
~/.platformio/penv/bin/platformio device monitor --baud 115200
```

### OU fazer tudo de uma vez:
```bash
~/.platformio/penv/bin/platformio run --target upload --upload-port /dev/ttyUSB0 && ~/.platformio/penv/bin/platformio device monitor --baud 115200
```

---

## 📝 VANTAGENS DOS PINOS 21 e 22:

✅ **Pinos padrão I2C do ESP32** - maior compatibilidade
✅ **Não precisa de barramento secundário** - código mais simples
✅ **Mais estável** - testado e documentado pela Espressif
✅ **Fácil de debugar** - maioria dos exemplos usa esses pinos

---

## ⚙️ COMPILAÇÃO:

**Status:** ✅ **SUCESSO!**
- RAM: 13.4% (43.964 bytes)
- Flash: 58.5% (766.369 bytes)

Pronto para fazer upload assim que conectar o ESP32!
