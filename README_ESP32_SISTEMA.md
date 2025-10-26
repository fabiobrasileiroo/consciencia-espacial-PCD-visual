# 📡 Sistema de Detecção de Obstáculos com ESP32 + ESP-NOW

Sistema completo de detecção de distância com 3 ESP32 comunicando-se via ESP-NOW (sem necessidade de WiFi/Router).

## 🎯 Estrutura do Sistema

### 📦 Módulo 1 - Sensor HC-SR04

**Pasta:** `Modulo1/`

- **Função:** Mede distância e envia para o ESP32-PAI
- **Hardware:**
  - Sensor HC-SR04
  - Pinos: TRIG=GPIO5, ECHO=GPIO18
- **Status:** ✅ Compilado com sucesso

### 📦 ESP32-PAI (Mestre)

**Pasta:** `esp32-pai-broadcast/`

- **Função:** Recebe dados e coordena o sistema
- **Lógica:**
  - `< 20cm` → Vibração FORTE (nível 3)
  - `20-50cm` → Vibração MÉDIA (nível 2)
  - `50-100cm` → Vibração BAIXA (nível 1)
  - `> 100cm` → PARADO (nível 0)
- **Status:** ✅ Compilado com sucesso

### 📦 Módulo 3 - Motor de Vibração

**Pasta:** `Modulo3/`

- **Função:** Recebe comandos e vibra conforme intensidade
- **Hardware:**
  - Motor vibracall (vibracall de celular)
  - Pino: GPIO4 (use transistor/driver de motor)
- **Padrões de vibração:**
  - Nível 1: Pulsa 500ms ON/OFF
  - Nível 2: Pulsa 250ms ON/OFF
  - Nível 3: Sempre ligado
- **Status:** ✅ Compilado com sucesso

## 🔧 Configuração - PASSO A PASSO

### ⚡ Passo 1: Descobrir os MAC Addresses

1. **Faça upload no ESP32-PAI primeiro:**

   ```bash
   cd esp32-pai-broadcast
   ~/.platformio/penv/bin/platformio run -t upload
   ~/.platformio/penv/bin/platformio device monitor
   ```

   - Anote o MAC que aparece: `MAC Address do PAI: XX:XX:XX:XX:XX:XX`
   - Pressione `Ctrl+]` para sair

2. **Faça upload no Módulo 3:**
   ```bash
   cd ../Modulo3
   ~/.platformio/penv/bin/platformio run -t upload
   ~/.platformio/penv/bin/platformio device monitor
   ```
   - Anote o MAC que aparece: `MAC Address do Módulo 3: XX:XX:XX:XX:XX:XX`
   - Pressione `Ctrl+]` para sair

### 🔨 Passo 2: Configurar os MACs no código

1. **No arquivo `Modulo1/src/main.cpp` (linha 11):**

   ```cpp
   // Substitua pelo MAC do ESP32-PAI
   uint8_t broadcastAddress[] = {0x24, 0x6F, 0x28, 0xAB, 0xCD, 0xEF};
   ```

2. **No arquivo `esp32-pai-broadcast/src/main.cpp` (linha 7):**
   ```cpp
   // Substitua pelo MAC do Módulo 3
   uint8_t modulo2Address[] = {0x30, 0xAE, 0xA4, 0x12, 0x34, 0x56};
   ```

### 📤 Passo 3: Recompilar e fazer upload

1. **Módulo 1:**

   ```bash
   cd Modulo1
   ~/.platformio/penv/bin/platformio run -t upload
   ```

2. **ESP32-PAI:**

   ```bash
   cd ../esp32-pai-broadcast
   ~/.platformio/penv/bin/platformio run -t upload
   ```

3. **Módulo 3** (apenas se mudou algo):
   ```bash
   cd ../Modulo3
   ~/.platformio/penv/bin/platformio run -t upload
   ```

## 🔌 Conexões Físicas

### Módulo 1 - HC-SR04

```
HC-SR04          ESP32
-------          -----
VCC      →       5V
GND      →       GND
TRIG     →       GPIO 5
ECHO     →       GPIO 18
```

### Módulo 3 - Motor de Vibração

```
Motor de Vibração    ESP32
-----------------    -----
+ (via transistor)   GPIO 4
-                    GND

⚠️ IMPORTANTE: Use um transistor (2N2222 ou similar) ou driver de motor!
   Não conecte o motor diretamente ao GPIO!

Esquema com transistor:
GPIO 4 → Resistor 1kΩ → Base do transistor
Coletor → Motor (+)
Emissor → GND
Motor (-) → VCC (3.3V ou 5V)
```

### ESP32-PAI

Apenas alimentação USB - não precisa de hardware adicional.

## 🚀 Como Testar

1. Ligue os 3 ESP32
2. Abra o Serial Monitor do ESP32-PAI:
   ```bash
   cd esp32-pai-broadcast
   ~/.platformio/penv/bin/platformio device monitor
   ```
3. Coloque um objeto na frente do sensor HC-SR04
4. Observe no Serial Monitor:
   - Distância detectada
   - Intensidade calculada
   - Status do envio
5. O motor deve vibrar conforme a distância!

## 📊 Exemplo de Output no Serial Monitor

```
=== DADOS RECEBIDOS ===
Módulo ID: 1
Distância: 15 cm
Intensidade: FORTE
Comando enviado ao Módulo 2 com sucesso!
Status do envio para Módulo 2: Sucesso
=======================
```

## 🐛 Solução de Problemas

### ❌ "Erro ao enviar dados"

- Verifique se os MACs estão corretos
- Certifique-se que todos os ESP32 estão ligados
- Distância máxima do ESP-NOW: ~200m (sem obstáculos)

### ❌ Motor não vibra

- Verifique as conexões do transistor
- Teste o motor diretamente com 3.3V
- Verifique se o GPIO 4 está configurado corretamente

### ❌ Sensor não lê distância

- Verifique as conexões TRIG e ECHO
- Sensor precisa de 5V no VCC
- Distância máxima do HC-SR04: ~4m

## 📝 Comandos Úteis do PlatformIO

```bash
# Compilar
~/.platformio/penv/bin/platformio run

# Fazer upload
~/.platformio/penv/bin/platformio run -t upload

# Monitor Serial
~/.platformio/penv/bin/platformio device monitor

# Limpar build
~/.platformio/penv/bin/platformio run -t clean

# Listar portas seriais
~/.platformio/penv/bin/platformio device list
```

## 📚 Informações Técnicas

- **Plataforma:** ESP32 (espressif32@6.8.1)
- **Framework:** Arduino
- **Protocolo:** ESP-NOW (sem WiFi)
- **Baud Rate:** 115200
- **Alcance ESP-NOW:** ~200m em campo aberto

## ✅ Status da Compilação

| Módulo    | Status | RAM   | Flash |
| --------- | ------ | ----- | ----- |
| Módulo 1  | ✅     | 13.3% | 55.9% |
| ESP32-PAI | ✅     | 13.3% | 55.8% |
| Módulo 3  | ✅     | 13.3% | 55.6% |

---

**Desenvolvido com ESP32 + ESP-NOW + PlatformIO**
