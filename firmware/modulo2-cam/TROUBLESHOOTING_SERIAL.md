# 🔧 Troubleshooting - Monitor Serial não mostra nada

## ✅ Checklist de Verificação

### 1. **Baud Rate (Taxa de Transmissão)**

O código está configurado para **115200 baud**.

**Na IDE Arduino:**

- Abra o Monitor Serial: `Ferramentas > Monitor Serial` ou `Ctrl+Shift+M`
- No canto inferior direito, selecione: **115200 baud**
- Verifique se está selecionado: **Both NL & CR** ou **Newline**

### 2. **Porta Serial Correta**

- Vá em `Ferramentas > Porta` e verifique qual porta está selecionada
- No Linux, geralmente aparece como: `/dev/ttyUSB0` ou `/dev/ttyACM0`
- Desconecte e reconecte o cabo USB para ver qual porta aparece/desaparece

### 3. **Drivers USB-Serial**

O ESP32-CAM usa um adaptador USB-Serial (geralmente CP2102 ou CH340).

**Para instalar drivers no Linux:**

```bash
# CP2102
sudo apt-get install brltty
sudo systemctl stop brltty-udev.service
sudo systemctl disable brltty-udev.service

# CH340
sudo apt-get install ch341-uart-source
```

### 4. **Permissões de Porta Serial (Linux)**

```bash
# Adiciona seu usuário ao grupo dialout
sudo usermod -a -G dialout $USER

# Dá permissão à porta
sudo chmod 666 /dev/ttyUSB0

# IMPORTANTE: Faça logout/login para aplicar as mudanças
```

### 5. **Teste Manual da Porta**

```bash
# Lista dispositivos USB
lsusb

# Monitora mensagens do kernel ao conectar/desconectar
dmesg | grep tty

# Teste direto com screen
screen /dev/ttyUSB0 115200

# Ou com minicom
minicom -D /dev/ttyUSB0 -b 115200
```

### 6. **Configuração da Placa**

Na IDE Arduino, verifique:

- **Placa:** `ESP32 Wrover Module` ou `AI Thinker ESP32-CAM`
- **Upload Speed:** `115200`
- **Flash Frequency:** `80MHz`
- **Flash Mode:** `QIO`
- **Partition Scheme:** `Huge APP (3MB No OTA/1MB SPIFFS)`
- **Core Debug Level:** `Verbose` (para ver mais detalhes)

### 7. **Reset Manual**

Após fazer upload:

1. **Desconecte o GPIO 0 do GND** (se estiver conectado para upload)
2. Pressione o botão **RST** (reset) no ESP32-CAM
3. Aguarde 2-3 segundos
4. Abra o Monitor Serial

### 8. **Cabo USB**

- Use um cabo USB **com dados** (não apenas de carga)
- Teste com outro cabo USB se disponível
- Alguns cabos baratos só servem para carregar

### 9. **Teste de Hardware**

Adicione este código simples para testar se o Serial funciona:

```cpp
void setup() {
  Serial.begin(115200);
  delay(2000);
}

void loop() {
  Serial.println("TESTE - ESP32-CAM está vivo!");
  delay(1000);
}
```

Se isso funcionar, o problema está em alguma parte do código principal.

### 10. **Mensagens de Boot**

Ao ligar o ESP32, você deve ver caracteres "estranhos" (garbage) por um breve momento - isso é normal, é o bootloader rodando a 74880 baud. Depois vem o código a 115200 baud.

## 🎯 Ordem de Teste Recomendada

1. ✅ Verifique baud rate (115200)
2. ✅ Verifique porta selecionada
3. ✅ Adicione permissões (`sudo usermod -a -G dialout $USER`)
4. ✅ Faça logout/login
5. ✅ Reconecte o cabo USB
6. ✅ Pressione RESET no ESP32-CAM
7. ✅ Abra o Monitor Serial

## 📋 Output Esperado

Ao iniciar, você deve ver:

```
========================================
=== ESP32-CAM com Captive Portal ===
========================================
🔧 Iniciando configuração da câmera...
📷 Configurando sensor da câmera...
✅ Sensor da câmera inicializado com sucesso!
✅ Câmera configurada!
💾 Iniciando sistema de preferências...
✅ Preferences iniciado com sucesso!
🔍 Verificando credenciais salvas...
   SSID salvo: (vazio)
   Senha salva: (vazio)
📝 Nenhuma credencial salva. Abrindo portal de configuração...

📶 Nenhuma rede configurada encontrada.
🔐 Abrindo portal para configurar Wi-Fi do ESP32-CAM
   SSID do AP: ESP32-CAM-SETUP
   Senha: camsetup
   Acesse: http://192.168.4.1 para configurar
```

## 🆘 Ainda não funciona?

Se nada aparecer:

1. Teste com o código de teste simples acima
2. Verifique se o LED vermelho do ESP32-CAM está aceso (indica alimentação)
3. Tente outro adaptador USB-Serial (FTDI, CP2102, CH340)
4. Verifique as conexões: TX do adaptador → RX do ESP32, RX do adaptador → TX do ESP32, GND comum
