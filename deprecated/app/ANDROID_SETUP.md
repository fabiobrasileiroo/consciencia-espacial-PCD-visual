# Configuração do Android SDK

## Problema

```
Failed to resolve the Android SDK path. Default install location not found: /home/fabiobrasileiro/Android/sdk
Error: spawn adb ENOENT
```

## Soluções

### Opção 1: Usar Expo Go (Recomendado para desenvolvimento)

**Mais fácil e rápido para começar!**

1. Instale o app Expo Go no seu celular Android:

   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Execute o projeto:

   ```bash
   pnpm start
   ```

3. Escaneie o QR Code que aparece no terminal com o app Expo Go

**Vantagens:**

- ✅ Não precisa configurar Android SDK
- ✅ Não precisa emulador
- ✅ Hot reload funciona perfeitamente
- ✅ Testa no dispositivo real

---

### Opção 2: Instalar Android Studio (Para builds nativos)

Necessário apenas se você precisar testar funcionalidades nativas ou fazer builds APK.

#### Passo 1: Instalar Android Studio

```bash
# Download do site oficial
# https://developer.android.com/studio

# Ou via snap (Ubuntu/Linux)
sudo snap install android-studio --classic
```

#### Passo 2: Instalar SDK através do Android Studio

1. Abra Android Studio
2. Vá em **Tools → SDK Manager**
3. Na aba **SDK Platforms**, instale:

   - Android 14.0 (API 34)
   - Android 13.0 (API 33)

4. Na aba **SDK Tools**, instale:
   - Android SDK Build-Tools
   - Android SDK Command-line Tools
   - Android Emulator
   - Android SDK Platform-Tools

#### Passo 3: Configurar variáveis de ambiente

Adicione ao seu `~/.config/fish/config.fish`:

```bash
# Android SDK
set -gx ANDROID_HOME $HOME/Android/Sdk
set -gx PATH $PATH $ANDROID_HOME/emulator
set -gx PATH $PATH $ANDROID_HOME/platform-tools
set -gx PATH $PATH $ANDROID_HOME/cmdline-tools/latest/bin
```

Ou se o Android Studio instalou em outro local:

```bash
set -gx ANDROID_HOME $HOME/.local/share/android/sdk
set -gx PATH $PATH $ANDROID_HOME/emulator
set -gx PATH $PATH $ANDROID_HOME/platform-tools
```

Recarregue o shell:

```bash
source ~/.config/fish/config.fish
```

#### Passo 4: Verificar instalação

```bash
# Verificar se adb está disponível
adb version

# Listar dispositivos conectados
adb devices
```

#### Passo 5: Criar um emulador (opcional)

```bash
# Listar AVDs disponíveis
emulator -list-avds

# Ou criar pelo Android Studio:
# Tools → Device Manager → Create Device
```

#### Passo 6: Executar o app

```bash
pnpm run android
```

---

### Opção 3: Configuração manual do SDK (Linux)

Se você não quer instalar todo o Android Studio:

```bash
# Criar diretório
mkdir -p $HOME/Android/Sdk

# Download do command line tools
cd $HOME/Android/Sdk
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip

# Extrair
unzip commandlinetools-linux-9477386_latest.zip
mkdir -p cmdline-tools/latest
mv cmdline-tools/* cmdline-tools/latest/

# Configurar PATH (adicione ao ~/.config/fish/config.fish)
set -gx ANDROID_HOME $HOME/Android/Sdk
set -gx PATH $PATH $ANDROID_HOME/cmdline-tools/latest/bin
set -gx PATH $PATH $ANDROID_HOME/platform-tools

# Instalar componentes necessários
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
sdkmanager --licenses
```

---

## Atualizar dependências

O projeto também precisa atualizar o jest-expo:

```bash
pnpm add -D jest-expo@~54.0.12
```

---

## Comandos disponíveis

```bash
# Expo Go (recomendado)
pnpm start                 # Inicia Metro Bundler e mostra QR Code

# Com dispositivo físico via Expo Go
pnpm start                 # Depois escaneie o QR Code com o app

# Com emulador/dispositivo Android (requer Android SDK)
pnpm run android           # Compila e instala no dispositivo

# Web (funciona sem Android SDK)
pnpm run web               # Testa no navegador

# Limpar cache (se tiver problemas)
pnpm start --clear         # Limpa cache do Metro Bundler
```

---

## Recomendação

Para desenvolvimento rápido, use a **Opção 1 (Expo Go)**. Só instale o Android SDK completo se você realmente precisar de:

- Builds APK customizados
- Módulos nativos não suportados pelo Expo Go
- Testes em emulador específico

O Expo Go suporta todas as funcionalidades do seu projeto:

- ✅ WebSocket
- ✅ AsyncStorage
- ✅ Haptics
- ✅ TTS
- ✅ Bluetooth (parcialmente)
- ✅ Battery info

---

## Troubleshooting

### "adb: command not found"

```bash
# Verifique se ANDROID_HOME está configurado
echo $ANDROID_HOME

# Verifique se platform-tools está no PATH
which adb
```

### "No devices/emulators found"

```bash
# Listar dispositivos
adb devices

# Reiniciar adb server
adb kill-server
adb start-server
```

### Metro Bundler não conecta

```bash
# Limpar cache
pnpm start --clear

# Ou deletar cache manualmente
rm -rf node_modules/.cache
rm -rf .expo
```

### Erro de permissão USB (Linux)

```bash
# Adicionar regras udev para Android
sudo usermod -aG plugdev $USER
sudo apt-get install android-sdk-platform-tools-common
```
