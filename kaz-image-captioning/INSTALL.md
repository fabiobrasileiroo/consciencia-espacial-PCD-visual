# 🚀 Manual de Instalação e Uso - Image Captioning

## 📋 Pré-requisitos

- Python 3.7 ou superior
- Webcam (para teste com câmera)
- 8GB RAM (mínimo)
- GPU NVIDIA (opcional, mas recomendado)

---

## 🔧 Instalação Passo a Passo

### 1️⃣ Verificar Ambiente

```bash
python3 setup_check.py
```

Este comando verifica se todas as dependências estão instaladas.

---

### 2️⃣ Criar Ambiente Virtual

```bash
python3 -m venv venv
```

**Por quê?** Isola as dependências do projeto, evitando conflitos.

---

### 3️⃣ Ativar Ambiente Virtual e Atualizar pip

```bash
source venv/bin/activate && pip install --upgrade pip
```

**Nota Windows:** Use `venv\Scripts\activate` em vez de `source venv/bin/activate`

---

### 4️⃣ Instalar Dependências

```bash
source venv/bin/activate && pip install torch torchvision opencv-python h5py scipy
```

```bash
source venv/bin/activate
pip install googletrans==4.0.0rc1
```

Este comando instala:

- **PyTorch**: Framework de Deep Learning (~900MB)
- **TorchVision**: Processamento de imagens
- **OpenCV**: Captura de vídeo
- **h5py**: Manipulação de dados HDF5
- **scipy**: Computação científica

⏱️ **Tempo estimado:** 5-10 minutos (depende da conexão)

---

### 5️⃣ Instalar Tradutor Automático

```bash
source venv/bin/activate && pip install deep-translator
```

Instala a biblioteca para tradução automática Kazakh → English.

---

### 6️⃣ Baixar o Modelo

📥 **Link:** https://drive.google.com/drive/folders/16PDZvoNs3P-O9Vr3zEb6bb-aaSDOiSY0

1. Baixe o arquivo `kaz_model.pth` (~2.7GB)
2. Coloque em `checkpoints/kaz_model.pth`

```bash
# Verificar se foi baixado corretamente
ls -lh checkpoints/kaz_model.pth
```

---

## 🧪 Testes

### Teste 1: Webcam com Legendas em Kazakh

```bash
source venv/bin/activate && python3 test_webcam.py
```

- Abre a webcam
- Pressione **'c'** para capturar
- Legenda em **Kazakh**
- Pressione **'ESC'** para sair

---

### Teste 2: Webcam com Tradução para Inglês ⭐

```bash
source venv/bin/activate && python3 test_webcam_translated.py
```

- Abre a webcam
- Pressione **'c'** para capturar
- Legenda em **Kazakh + English** (tradução automática)
- Pressione **'ESC'** para sair

**Este é o mais recomendado!**

---

### Teste 4: ESP32-CAM Simples (sem modelo)

```bash
source venv/bin/activate && python3 test_esp32cam_simple.py --url http://SEU_IP_ESP32:81/stream
```

- **Apenas captura imagens** (sem IA)
- Mais rápido e leve
- Ideal para testar conectividade
- Pressione **'c'** para capturar
- Pressione **'ESC'** para sair

---

### Teste 5: ESP32-CAM com IA (com ou sem modelo) ⭐

```bash
source venv/bin/activate && python3 test_esp32cam.py --url http://SEU_IP_ESP32:81/stream
```

- Funciona **com ou sem** o modelo baixado
- **Com modelo**: Gera legendas em português e cazaque
- **Sem modelo**: Apenas captura e salva imagens
- Pressione **'c'** para capturar
- Pressione **'ESC'** para sair

**Este é o mais recomendado para testar com ESP32!**

---

## 🐳 Usando Docker

### Build da Imagem

```bash
docker-compose build
```

### Executar com Webcam

```bash
docker-compose up webcam
```

### Executar com Tradução

```bash
docker-compose up webcam-translate
```

---

## 📁 Estrutura de Arquivos

```
kaz-image-captioning/
├── checkpoints/
│   └── kaz_model.pth              # Modelo (BAIXAR)
├── vocabulary/
│   ├── vocab_kz.pickle            # Vocabulário Kazakh
│   └── vocab_en.pickle            # Vocabulário English
├── examples/                       # ← Exemplos de uso
│   ├── example_1.jpg
│   ├── example_2.jpg
│   └── README_EXAMPLES.md
├── venv/                          # Ambiente virtual
├── test_webcam.py                 # Teste webcam (Kazakh)
├── test_webcam_translated.py      # Teste webcam (KZ + EN) ⭐
├── test_esp32cam_simple.py        # Teste ESP32 simples (sem IA)
├── test_esp32cam.py               # Teste ESP32 com IA (opcional)
├── test_single_image.py           # Teste imagem única
├── setup_check.py                 # Verificação
├── Dockerfile                     # Docker config
├── docker-compose.yml             # Docker Compose
└── INSTALL.md                     # Este arquivo
```

---

## ⚡ Comandos Rápidos

### Sempre ative o ambiente virtual primeiro:

```bash
source venv/bin/activate
```

### Depois execute o script desejado:

```bash
# ESP32 simples (recomendado para começar)
python3 test_esp32cam_simple.py --url http://SEU_IP_ESP32:81/stream

# ESP32 com IA (se tiver o modelo)
python3 test_esp32cam.py --url http://SEU_IP_ESP32:81/stream

# Webcam com tradução (recomendado)
python3 test_webcam_translated.py

# Webcam em Kazakh
python3 test_webcam.py

# Processar imagem
python3 test_single_image.py image.jpg
```

---

## 🐛 Solução de Problemas

### Erro: "ModuleNotFoundError: No module named 'torch'"

**Solução:** Ative o ambiente virtual

```bash
source venv/bin/activate
```

### Erro: "Checkpoint não encontrado"

**Solução 1 (Recomendada):** O script agora funciona sem o modelo!

```bash
# Funciona mesmo sem baixar o modelo
python3 test_esp32cam.py --url http://SEU_IP_ESP32:81/stream
```

**Solução 2:** Baixar o modelo completo

```bash
# Verificar se existe
ls checkpoints/kaz_model.pth

# Se não existir, baixe do Google Drive
# Link: https://drive.google.com/drive/folders/16PDZvoNs3P-O9Vr3zEb6bb-aaSDOiSY0
# Arquivo: kaz_model.pth (~2.7GB)
```

### Erro: "Webcam não abre"

**Solução:**

```bash
# Verificar dispositivos de vídeo (Linux)
ls /dev/video*

# Testar webcam
python3 -c "import cv2; print('OK' if cv2.VideoCapture(0).isOpened() else 'ERRO')"
```

### Erro: "externally-managed-environment"

**Solução:** Use ambiente virtual

```bash
python3 -m venv venv
source venv/bin/activate
pip install ...
```

---

## 📊 Performance

| Hardware     | Tempo por Imagem |
| ------------ | ---------------- |
| CPU Intel i7 | ~5-10 segundos   |
| GPU GTX 1060 | ~1-2 segundos    |
| GPU RTX 3080 | ~0.5-1 segundo   |

---

## 🔄 Desativar Ambiente Virtual

Quando terminar:

```bash
deactivate
```

---

## 📝 Notas Importantes

⚠️ **O modelo foi treinado em Kazakh**, não em inglês/português

✅ Use `test_webcam_translated.py` para ter traduções automáticas em inglês

✅ **O script `test_esp32cam.py` funciona com ou sem o modelo!**

✅ GPU é **altamente recomendada** (5-10x mais rápido)

✅ Execute sempre a partir da pasta raiz do projeto

---

## 🆘 Suporte

- **Documentação completa:** `GUIA_TESTE_PT.md`
- **FAQ:** `FAQ_PT.md`
- **Comandos prontos:** `COMANDOS.md`
- **Issues:** https://github.com/IS2AI/kaz-image-captioning/issues

---

**Pronto para começar! 🚀**
