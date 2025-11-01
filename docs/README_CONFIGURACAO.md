# ⚙️ Configuração Detalhada

Guia completo para configurar o sistema de detecção de objetos.

## 📋 Índice

- [Instalação do Ambiente](#-instalação-do-ambiente)
- [Configuração Inicial](#-configuração-inicial)
- [Descobrir MACs](#-descobrir-macs)
- [Upload Final](#-upload-final)
- [Teste do Sistema](#-teste-do-sistema)

---

## 🔧 Instalação do Ambiente

### Linux (Ubuntu/Debian)

```bash
# Instalar Python e pip
sudo apt update
sudo apt install python3 python3-pip python3-venv

# Instalar PlatformIO
pip3 install --user platformio

# Adicionar ao PATH
echo 'export PATH=$PATH:~/.local/bin' >> ~/.bashrc
source ~/.bashrc

# Verificar instalação
pio --version
```

### macOS

```bash
# Instalar Homebrew (se não tiver)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Python
brew install python3

# Instalar PlatformIO
pip3 install platformio

# Verificar instalação
pio --version
```

### Windows

1. Baixe e instale [Python 3.x](https://www.python.org/downloads/)
   - ✅ Marque "Add Python to PATH"
2. Abra o PowerShell e execute:
   ```powershell
   pip install platformio
   pio --version
   ```

### VS Code + PlatformIO

1. Instale [VS Code](https://code.visualstudio.com/)
2. Abra VS Code
3. Vá em Extensions (Ctrl+Shift+X)
4. Procure por "PlatformIO IDE"
5. Clique em "Install"

---

## 🎯 Configuração Inicial

### 1. Clone o Repositório

```bash
git clone https://github.com/fabiobrasileiroo/sistema_de_dectacao_de_objetos.git
cd sistema_de_dectacao_de_objetos
```

### 2. Conecte os ESP32

Conecte os 3 ESP32 ao computador via USB. Para identificar as portas:

```bash
# Linux
ls /dev/ttyUSB*

# macOS
ls /dev/cu.*

# Windows (PowerShell)
mode
```

Anote qual porta é cada ESP32:

- `/dev/ttyUSB0` → ?
- `/dev/ttyUSB1` → ?
- `/dev/ttyUSB2` → ?

### 3. Permissões Linux/macOS

```bash
# Adicionar usuário ao grupo dialout
sudo usermod -a -G dialout $USER

# ou para macOS
sudo dseditgroup -o edit -a $USER -t user wheel

# Faça logout e login novamente
```

---

## 🔍 Descobrir MACs

Vamos fazer upload inicial em cada ESP32 para descobrir seus endereços MAC.

### Passo 1: ESP32-PAI (Mestre)

```bash
cd firmware/esp32-pai-mestre

# Compile
pio run

# Upload (ajuste a porta)
pio run -t upload --upload-port /dev/ttyUSB1

# Monitor Serial
pio device monitor --port /dev/ttyUSB1 --baud 115200
```

**Output esperado:**

```
=================================
ESP32-PAI - MESTRE (BROADCAST)
=================================
MAC Address do PAI: EC:64:C9:7C:38:30
IMPORTANTE: Use este MAC no Módulo 1!
```

📝 **Anote o MAC do PAI:** `EC:64:C9:7C:38:30`

Pressione **Ctrl+C** para sair.

### Passo 2: Módulo 1 (Sensor)

```bash
cd ../modulo1-sensor

# Upload
pio run -t upload --upload-port /dev/ttyUSB2

# Monitor Serial
pio device monitor --port /dev/ttyUSB2 --baud 115200
```

**Output esperado:**

```
MÓDULO 1 - SENSOR HC-SR04
MAC Address: D0:EF:76:15:8F:04
```

📝 **Anote o MAC do Módulo 1:** `D0:EF:76:15:8F:04`

Pressione **Ctrl+C** para sair.

### Passo 3: Módulo 3 (Motor)

```bash
cd ../modulo3-motor

# Upload
pio run -t upload --upload-port /dev/ttyUSB0

# Monitor Serial
pio device monitor --port /dev/ttyUSB0 --baud 115200
```

**Output esperado:**

```
=================================
MÓDULO 3 - MOTOR DE VIBRAÇÃO
=================================
MAC Address do Módulo 3: EC:64:C9:7B:99:8C
```

📝 **Anote o MAC do Módulo 3:** `EC:64:C9:7B:99:8C`

Pressione **Ctrl+C** para sair.

---

## 🔨 Configurar MACs no Código

Agora que temos todos os MACs, vamos configurá-los no código.

### 1. Módulo 1 → Precisa do MAC do PAI

Edite: `firmware/modulo1-sensor/src/main.cpp`

```cpp
// Linha ~11
uint8_t broadcastAddress[] = {0xEC, 0x64, 0xC9, 0x7C, 0x38, 0x30};
//                             ^^^^  ^^^^  ^^^^  ^^^^  ^^^^  ^^^^
//                             Substitua pelo MAC do PAI que você anotou
```

**Exemplo com seu MAC:**

```cpp
// Se o MAC do PAI é: AA:BB:CC:DD:EE:FF
uint8_t broadcastAddress[] = {0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF};
```

### 2. ESP32-PAI → Precisa do MAC do Módulo 1 e Módulo 3

Edite: `firmware/esp32-pai-mestre/src/main.cpp`

```cpp
// Linha ~7
uint8_t modulo1Address[] = {0xD0, 0xEF, 0x76, 0x15, 0x8F, 0x04};
//                          ^^^^  ^^^^  ^^^^  ^^^^  ^^^^  ^^^^
//                          Substitua pelo MAC do Módulo 1

// Linha ~13
uint8_t modulo3Address[] = {0xEC, 0x64, 0xC9, 0x7B, 0x99, 0x8C};
//                          ^^^^  ^^^^  ^^^^  ^^^^  ^^^^  ^^^^
//                          Substitua pelo MAC do Módulo 3
```

### 3. Módulo 3 → NÃO PRECISA configurar

O Módulo 3 apenas recebe, não precisa saber o MAC de ninguém! ✅

---

## 📤 Upload Final

Agora vamos fazer o upload final com os MACs configurados.

### Módulo 1

```bash
cd firmware/modulo1-sensor
pio run -t upload --upload-port /dev/ttyUSB2
```

✅ **Sucesso esperado:**

```
=================== [SUCCESS] Took X.XX seconds ===================
```

### ESP32-PAI

```bash
cd ../esp32-pai-mestre
pio run -t upload --upload-port /dev/ttyUSB1
```

✅ **Sucesso esperado:**

```
=================== [SUCCESS] Took X.XX seconds ===================
```

### Módulo 3 (não precisa recompilar, mas pode se quiser)

```bash
cd ../modulo3-motor
pio run -t upload --upload-port /dev/ttyUSB0
```

---

## 🧪 Teste do Sistema

### Abrir 3 Monitores Seriais

**Opção 1: VS Code (Recomendado)**

1. Abra VS Code na pasta `sistema_de_dectacao_de_objetos`
2. Abra 3 terminais (Terminal → New Terminal)
3. Em cada terminal:

```bash
# Terminal 1 - Módulo 1
cd firmware/modulo1-sensor && pio device monitor --port /dev/ttyUSB2 --baud 115200

# Terminal 2 - ESP32-PAI
cd firmware/esp32-pai-mestre && pio device monitor --port /dev/ttyUSB1 --baud 115200

# Terminal 3 - Módulo 3
cd firmware/modulo3-motor && pio device monitor --port /dev/ttyUSB0 --baud 115200
```

**Opção 2: Terminal**

Abra 3 terminais e execute um comando em cada:

```bash
# Terminal 1
cd ~/sistema_de_dectacao_de_objetos/firmware/modulo1-sensor
pio device monitor --port /dev/ttyUSB2 --baud 115200

# Terminal 2
cd ~/sistema_de_dectacao_de_objetos/firmware/esp32-pai-mestre
pio device monitor --port /dev/ttyUSB1 --baud 115200

# Terminal 3
cd ~/sistema_de_dectacao_de_objetos/firmware/modulo3-motor
pio device monitor --port /dev/ttyUSB0 --baud 115200
```

### Testar Comunicação

1. **Módulo 1** deve mostrar:

   ```
   Distância: 85 cm
   Status do envio: Sucesso
   ```

2. **ESP32-PAI** deve mostrar:

   ```
   === DADOS RECEBIDOS ===
   Módulo ID: 1
   Distância: 85 cm
   Intensidade: BAIXA
   Comando enviado ao Módulo 3 com sucesso!
   ```

3. **Módulo 3** deve mostrar:
   ```
   === COMANDO RECEBIDO ===
   Módulo ID: 3
   Nível de Vibração: 1
   BAIXO
   currentLevel atualizado para: 1
   ```

### Verificar Vibração

Aproxime um objeto do sensor e veja a vibração mudar:

| Distância | Vibração Esperada       |
| --------- | ----------------------- |
| 5cm       | 🔴 Forte (contínua)     |
| 30cm      | 🟠 Média (pulsa rápido) |
| 70cm      | 🟡 Baixa (pulsa lento)  |
| 150cm     | ⚪ Parado               |

---

## ✅ Checklist Final

- [ ] PlatformIO instalado e funcionando
- [ ] 3 ESP32 conectados e reconhecidos
- [ ] MACs anotados de todos os módulos
- [ ] MACs configurados no código
- [ ] Upload feito com sucesso nos 3 módulos
- [ ] Serial Monitor mostrando dados
- [ ] Comunicação ESP-NOW funcionando
- [ ] Motor vibrando conforme distância

---

## 🔄 Resetar Configuração

Se precisar começar do zero:

```bash
# Apagar flash de cada ESP32
esptool.py --port /dev/ttyUSB0 erase_flash
esptool.py --port /dev/ttyUSB1 erase_flash
esptool.py --port /dev/ttyUSB2 erase_flash

# Limpar builds
cd firmware/modulo1-sensor && pio run -t clean
cd ../esp32-pai-mestre && pio run -t clean
cd ../modulo3-motor && pio run -t clean

# Recompilar tudo
cd ../../
./scripts/build-all.sh  # (se existir)
```

---

## 📞 Precisa de Ajuda?

- [Solução de Problemas](TROUBLESHOOTING.md)
- [Hardware e Conexões](README_HARDWARE.md)
- [Abrir Issue no GitHub](https://github.com/fabiobrasileiroo/sistema_de_dectacao_de_objetos/issues)

---

**Última atualização:** 26/10/2025
