# 🚨 Solução de Problemas

Guia completo para resolver problemas comuns do sistema de detecção de objetos.

## 📋 Índice Rápido

- [Problemas de Compilação](#-problemas-de-compilação)
- [Problemas de Upload](#-problemas-de-upload)
- [Sensor HC-SR04](#-sensor-hc-sr04)
- [Comunicação ESP-NOW](#-comunicação-esp-now)
- [Motor de Vibração](#-motor-de-vibração)
- [Serial Monitor](#-serial-monitor)

---

## 🔧 Problemas de Compilação

### ❌ `esp_wifi_types.h` não encontrado

**Sintoma:**

```
fatal error: esp_wifi_types.h: No such file or directory
```

**Solução:**

```bash
# Reinstalar plataforma ESP32
pio platform uninstall espressif32
cd seu_modulo
pio run
```

### ❌ `freertos/FreeRTOS.h` não encontrado

**Causa:** Framework ESP32 corrompido

**Solução:**

```bash
# Limpar cache e recompilar
pio run -t clean
rm -rf .pio
pio run
```

### ❌ Erro de versão do PlatformIO

**Solução:**

```bash
# Atualizar PlatformIO
pip install --upgrade platformio
pio upgrade
```

---

## 📤 Problemas de Upload

### ❌ `Failed to connect to ESP32`

**Soluções:**

1. **Pressione o botão BOOT** durante upload
2. **Verifique a porta:**
   ```bash
   pio device list
   ```
3. **Instale drivers CH340/CP2102:**

   - [Driver CH340](https://sparks.gogo.co.nz/ch340.html)
   - [Driver CP2102](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers)

4. **Permissões Linux:**
   ```bash
   sudo usermod -a -G dialout $USER
   # Faça logout e login novamente
   ```

### ❌ `Device or resource busy`

**Causa:** Monitor serial ainda aberto

**Solução:**

```bash
# Feche todos os monitores seriais
# Ou especifique a porta no upload:
pio run -t upload --upload-port /dev/ttyUSB0
```

---

## 📡 Sensor HC-SR04

### ❌ "Erro na leitura ou fora de alcance"

**Checklist:**

- [ ] **VCC está em 5V?** (não 3.3V)
- [ ] **Pinos corretos?** TRIG=GPIO33, ECHO=GPIO25
- [ ] **Objeto muito perto?** (mín. 2cm)
- [ ] **Objeto muito longe?** (máx. 400cm)
- [ ] **Superfície reflete ultrassom?** (tecido/espuma absorvem)

**Teste rápido:**

```cpp
void loop() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);

  Serial.print("Duration: ");
  Serial.println(duration);
  delay(500);
}
```

Se `duration` sempre retorna 0 → **Problema de conexão**  
Se `duration` varia mas distância está errada → **Problema de cálculo**

### ❌ Leituras inconsistentes

**Soluções:**

1. **Adicione filtro de média móvel:**

   ```cpp
   int medirDistanciaFiltrada() {
     int sum = 0;
     for(int i = 0; i < 5; i++) {
       sum += measureDistance();
       delay(10);
     }
     return sum / 5;
   }
   ```

2. **Aumente timeout:**
   ```cpp
   long duration = pulseIn(ECHO_PIN, HIGH, 50000); // 50ms
   ```

---

## 📡 Comunicação ESP-NOW

### ❌ "Falha ao adicionar peer"

**Causa:** Interface WiFi inválida

**Solução:**

```cpp
esp_now_peer_info_t peerInfo;
memset(&peerInfo, 0, sizeof(esp_now_peer_info_t)); // ← IMPORTANTE!
memcpy(peerInfo.peer_addr, macAddress, 6);
peerInfo.channel = 0;
peerInfo.encrypt = false;
peerInfo.ifidx = WIFI_IF_STA; // ← IMPORTANTE!

esp_now_add_peer(&peerInfo);
```

### ❌ "Erro ao enviar dados"

**Checklist:**

- [ ] **MAC configurado corretamente?**
  ```cpp
  // Formato correto:
  uint8_t mac[] = {0xEC, 0x64, 0xC9, 0x7C, 0x38, 0x30};
  ```
- [ ] **Peer adicionado?** Verifique `esp_now_add_peer()`
- [ ] **WiFi em modo STA?** `WiFi.mode(WIFI_STA);`
- [ ] **ESP-NOW inicializado?** `esp_now_init()`

**Teste de comunicação:**

```cpp
// No transmissor
void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  Serial.print("Send Status: ");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Success" : "Fail");
}
```

### ❌ Dados não são recebidos

**Checklist:**

- [ ] **Callback registrado?** `esp_now_register_recv_cb(OnDataRecv);`
- [ ] **Estruturas iguais?** Transmissor e receptor devem usar mesmo struct
- [ ] **Distância?** ESP-NOW alcança ~200m em campo aberto
- [ ] **Interferência WiFi?** Desligue roteadores próximos para testar

**Teste de recepção:**

```cpp
void OnDataRecv(const uint8_t *mac, const uint8_t *data, int len) {
  Serial.println("=== DADOS RECEBIDOS ===");
  Serial.print("Bytes: ");
  Serial.println(len);
  Serial.print("MAC: ");
  for(int i=0; i<6; i++) {
    Serial.printf("%02X", mac[i]);
    if(i<5) Serial.print(":");
  }
  Serial.println();
}
```

---

## 🔊 Motor de Vibração

### ❌ Motor não vibra

**Checklist:**

- [ ] **Usando transistor?** NUNCA conecte direto no GPIO!
- [ ] **Transistor correto?** Base no GPIO via resistor 1kΩ
- [ ] **Motor funciona?** Teste direto no 3.3V
- [ ] **GPIO correto?** GPIO 4 configurado como saída
- [ ] **Callback funcionando?** Adicione logs no `OnDataRecv`

**Teste direto:**

```cpp
void loop() {
  digitalWrite(MOTOR_PIN, HIGH);
  Serial.println("Motor: HIGH");
  delay(500);
  digitalWrite(MOTOR_PIN, LOW);
  Serial.println("Motor: LOW");
  delay(500);
}
```

### ❌ Motor vibra fraco

**Soluções:**

1. **Aumente duty cycle do PWM:**

   ```cpp
   ledcWrite(PWM_CHANNEL, 255); // 100%
   ```

2. **Verifique alimentação:**

   - Use fonte externa 3.7V para motor
   - ESP32 fornece max ~40mA por GPIO

3. **Transistor adequado:**
   - Use transistor com ganho maior (hFE > 100)
   - BC547 é melhor que 2N2222 para motores pequenos

---

## 💻 Serial Monitor

### ❌ Caracteres corrompidos

**Causa:** Baud rate incorreto

**Solução:**

```bash
# Todos os módulos usam 115200
pio device monitor --baud 115200
```

### ❌ "Device busy"

**Causa:** Outro programa usando a porta

**Solução:**

```bash
# Linux: encontre processos
lsof | grep ttyUSB

# Ou force fechamento
fuser -k /dev/ttyUSB0
```

### ❌ Não mostra nada

**Checklist:**

- [ ] **Porta correta?** `pio device list`
- [ ] **Cabo USB com dados?** (não só alimentação)
- [ ] **Serial.begin(115200)?** No setup()
- [ ] **Pressione RESET** após abrir monitor

---

## 🔍 Debugging Avançado

### Habilitar logs detalhados

**platformio.ini:**

```ini
[env:esp32dev]
build_flags =
    -DCORE_DEBUG_LEVEL=5
```

Níveis:

- 0 = Nenhum
- 1 = Erro
- 2 = Warning
- 3 = Info
- 4 = Debug
- 5 = Verbose

### Monitorar memória

```cpp
void printMemory() {
  Serial.print("Heap livre: ");
  Serial.print(ESP.getFreeHeap());
  Serial.println(" bytes");
}
```

### Verificar MAC Address

```cpp
void setup() {
  WiFi.mode(WIFI_STA);
  Serial.print("MAC: ");
  Serial.println(WiFi.macAddress());
}
```

---

## 📞 Ainda com problemas?

1. **Verifique os logs:** Procure mensagens de erro específicas
2. **Teste isoladamente:** Teste cada módulo separadamente
3. **Reset de fábrica:** Apague a flash e refaça upload
   ```bash
   esptool.py erase_flash
   pio run -t upload
   ```
4. **Abra uma issue:** [GitHub Issues](https://github.com/fabiobrasileiroo/sistema_de_dectacao_de_objetos/issues)

---

## 🛠 Comandos Úteis

```bash
# Listar dispositivos
pio device list

# Compilar sem upload
pio run

# Upload sem compilar
pio run -t upload --upload-port /dev/ttyUSB0

# Monitor serial
pio device monitor --baud 115200

# Limpar build
pio run -t clean

# Ver tamanho do firmware
pio run -t size

# Atualizar dependências
pio pkg update
```

---

**Última atualização:** 26/10/2025  
**Precisa de mais ajuda?** Abra uma issue no GitHub!
