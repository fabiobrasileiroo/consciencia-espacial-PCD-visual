# 📸 Resumo Rápido - Como Testar o Projeto

## 🎯 O que este projeto faz?

Este projeto **gera automaticamente legendas/descrições** para imagens usando Deep Learning. Ele foi treinado para gerar legendas em **Kazakh** (língua do Cazaquistão).

## 🚀 Passo a Passo Rápido

### 1️⃣ Instalar Dependências

```bash
# Com GPU NVIDIA
pip3 install torch==1.9.0+cu111 torchvision==0.10.0+cu111 -f https://download.pytorch.org/whl/torch_stable.html

# Sem GPU (apenas CPU)
pip3 install torch==1.9.0+cpu torchvision==0.10.0+cpu -f https://download.pytorch.org/whl/torch_stable.html

# Outras dependências
pip3 install opencv-python numpy Pillow h5py scipy
```

### 2️⃣ Baixar o Modelo

📥 **Link**: https://drive.google.com/drive/folders/16PDZvoNs3P-O9Vr3zEb6bb-aaSDOiSY0

Coloque o arquivo `kaz_model.pth` na pasta `checkpoints/`

### 3️⃣ Verificar Ambiente

```bash
bash verificar_ambiente.sh
```

### 4️⃣ Testar!

#### Opção A: Webcam do Notebook

```bash
python3 test_webcam.py
```

- Abre sua webcam
- Pressione **'c'** para capturar e gerar legenda
- Pressione **'ESC'** para sair

#### Opção B: ESP32-CAM

```bash
python3 test_esp32cam.py --url http://192.168.1.100:81/stream
```

- Conecta ao ESP32-CAM via WiFi
- Pressione **'c'** para capturar e gerar legenda

#### Opção C: Imagem Única

```bash
python3 test_single_image.py minha_imagem.jpg
```

---

## 📂 Arquivos Criados

| Arquivo                 | Descrição                          |
| ----------------------- | ---------------------------------- |
| `test_webcam.py`        | 🎥 Testa com webcam do notebook    |
| `test_esp32cam.py`      | 📡 Testa com ESP32-CAM via IP      |
| `test_single_image.py`  | 🖼️ Testa com uma imagem estática   |
| `ESP32_CAM_Stream.ino`  | 🔧 Código Arduino para ESP32-CAM   |
| `GUIA_TESTE_PT.md`      | 📖 Guia completo em português      |
| `verificar_ambiente.sh` | ✅ Verifica se tudo está instalado |

---

## 🎬 Fluxo de Uso

```
┌─────────────────┐
│  Fonte de Vídeo │
│  (Webcam/ESP32) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Captura Frame   │
│ (Pressionar 'c')│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Modelo Deep     │
│ Learning        │
│ (ExpansionNet)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Legenda Gerada  │
│ (Texto Kazakh)  │
└─────────────────┘
```

---

## 🔧 Configuração do ESP32-CAM

1. **Abrir Arduino IDE**
2. **Instalar biblioteca ESP32**
3. **Abrir** `ESP32_CAM_Stream.ino`
4. **Editar WiFi**:
   ```cpp
   const char* ssid = "SEU_WIFI_AQUI";
   const char* password = "SUA_SENHA_AQUI";
   ```
5. **Fazer upload** para o ESP32-CAM
6. **Ver o IP** no Serial Monitor (115200 baud)
7. **Testar no navegador**: `http://IP_DO_ESP32:81/stream`
8. **Usar no Python**: `python3 test_esp32cam.py --url http://IP:81/stream`

---

## ⚡ Performance Esperada

| Dispositivo    | Tempo por Imagem |
| -------------- | ---------------- |
| CPU (Intel i7) | ~5-10 segundos   |
| GPU (GTX 1060) | ~1-2 segundos    |
| GPU (RTX 3080) | ~0.5-1 segundo   |

---

## 🐛 Problemas Comuns

### ❌ "Checkpoint não encontrado"

**Solução**: Baixe o modelo do Google Drive e coloque em `checkpoints/kaz_model.pth`

### ❌ "Webcam não abre"

**Solução**:

```bash
# Linux - Verificar dispositivos
ls /dev/video*

# Testar com diferentes índices
# Em test_webcam.py, mude: cv2.VideoCapture(0) para cv2.VideoCapture(1)
```

### ❌ "ESP32-CAM não conecta"

**Solução**:

1. Verifique o IP do ESP32
2. Ping: `ping 192.168.1.100`
3. Teste no navegador primeiro
4. Verifique se está na mesma rede WiFi

### ❌ "CUDA out of memory"

**Solução**: Use CPU em vez de GPU ou feche outros programas

---

## 📊 Exemplo de Uso

```bash
# Terminal 1: Verificar ambiente
$ bash verificar_ambiente.sh
✅ Ambiente configurado corretamente!

# Terminal 2: Testar com webcam
$ python3 test_webcam.py
🔄 Carregando dicionário...
✅ Dicionário carregado!
🔄 Inicializando modelo...
🖥️  Usando dispositivo: cuda
✅ Modelo carregado!
🎥 Webcam aberta com sucesso!

# Pressione 'c' para capturar
📸 Captura #1
💾 Imagem salva: captured_frame_1.jpg
🤖 Gerando legenda...
📝 Descrição: A person sitting at a desk with a laptop.
⏱️  Tempo: 1.2345s
```

---

## 🌐 Links Úteis

- **Modelo**: https://drive.google.com/drive/folders/16PDZvoNs3P-O9Vr3zEb6bb-aaSDOiSY0
- **Paper**: https://www.techrxiv.org/articles/preprint/Image_Captioning_for_the_Visually_Impaired_and_Blind_A_Recipe_for_Low-Resource_Languages/22133894
- **Repositório Original**: https://github.com/IS2AI/kaz-image-captioning
- **ExpansionNet v2**: https://github.com/jchenghu/expansionnet_v2

---

## 💡 Dicas

✅ **Sempre rode os scripts a partir da pasta raiz do projeto**  
✅ **Use GPU se disponível (muito mais rápido)**  
✅ **Boa iluminação melhora os resultados**  
✅ **As legendas serão em Kazakh, não em português**  
✅ **Teste primeiro com uma imagem estática antes de usar vídeo**

---

## 📞 Suporte

Consulte o **[GUIA_TESTE_PT.md](GUIA_TESTE_PT.md)** para informações detalhadas!
