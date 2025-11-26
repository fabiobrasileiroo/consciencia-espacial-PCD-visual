## Image Captioning Kazakh model (based on [ExpansioNet v2](https://github.com/jchenghu/expansionnet_v2))

#### Requirements

- python >= 3.7
- numpy
- Java 1.8.0
- pytorch 1.9.0
- h5py
- playsound
- scipy

### Model checkpoint

The checkpoint for the model is stored in [drive](https://drive.google.com/drive/folders/16PDZvoNs3P-O9Vr3zEb6bb-aaSDOiSY0?usp=sharing). Please, place the file into the `checkpoints` directory.

---

## 🇧🇷 GUIA EM PORTUGUÊS

**🎯 COMECE AQUI se você fala português!**

| Documento                                           | Descrição                            |
| --------------------------------------------------- | ------------------------------------ |
| **[📦 INSTALL.md](INSTALL.md)**                     | 🌟 **Manual de Instalação Completo** |
| **[🐳 DOCKER.md](DOCKER.md)**                       | Guia Docker e Docker Compose         |
| **[📖 GUIA_TESTE_PT.md](GUIA_TESTE_PT.md)**         | Guia completo de instalação e teste  |
| **[⚡ RESUMO_RAPIDO.md](RESUMO_RAPIDO.md)**         | Passo a passo rápido para começar    |
| **[📝 COMANDOS.md](COMANDOS.md)**                   | Comandos prontos para copiar e colar |
| **[❓ FAQ_PT.md](FAQ_PT.md)**                       | Perguntas frequentes                 |
| **[📂 ESTRUTURA_PROJETO.md](ESTRUTURA_PROJETO.md)** | Mapa visual dos arquivos             |

---

## 🚀 Quick Start

### Automated Installation (Recommended)

```bash
# Run automated installation script
bash install.sh
```

### Manual Installation

```bash
# 1. Create virtual environment
python3 -m venv venv

# 2. Activate and install dependencies
source venv/bin/activate
pip install -r requirements.txt

# 3. Download model (2.7GB)
# https://drive.google.com/drive/folders/16PDZvoNs3P-O9Vr3zEb6bb-aaSDOiSY0
# Place in: checkpoints/kaz_model.pth

# 4. Verify installation
python3 setup_check.py
```

---

## 🧪 Testing

### Webcam with Auto-Translation (Kazakh → English) ⭐

```bash
source venv/bin/activate
python3 test_webcam_translated.py
```

Press **'c'** to capture and generate caption, **'ESC'** to exit.

### Webcam (Kazakh only)

```bash
source venv/bin/activate
python3 test_webcam.py
```

---

## 🖥️ Windows & Linux - Passo a Passo (Detalhado)

Essas instruções cobrem os passos mínimos para configurar e executar o sistema em **Windows** (PowerShell ou CMD) e **Linux (bash)**. Elas assumem que você já possui Python 3.12+ instalado.

### 1) Preparar o projeto

```bash
# Clone ou copie o repositório
cd /path/to/consciencia-espacial-PCD-visual/kaz-image-captioning
```

### 2) Criar e ativar ambiente virtual

Linux (bash):

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Windows (PowerShell):

```powershell
python -m venv .venv
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser  # se necessário no PowerShell
.\.venv\Scripts\Activate.ps1
```

Windows (CMD):

```cmd
python -m venv .venv
.venv\Scripts\activate
```

> Observação: O `launcher.py` detecta automaticamente `.venv` e `venv`, mas recomendamos usar `.venv` para consistência com este guia.

### 3) Instalar dependências

Linux / Windows (após ativar `.venv`):

```bash
pip install --upgrade pip
pip install -r requirements.txt
# Instalar pacotes pesados (PyTorch/TensorFlow) explicitamente, dependendo do suporte da sua GPU
# PyTorch (CPU-only):
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
# Se tiver NVIDIA GPU, siga as instruções oficiais: https://pytorch.org/get-started/locally/
# TensorFlow (CPU):
pip install tensorflow
```

Se ocorrerem problemas: no Windows, instale os **Visual C++ Build Tools**; no Linux, instale `build-essential` e `python3-dev`.

### 4) Baixar o modelo e vocabulário

1. Baixe o checkpoint do modelo e coloque em `checkpoints/kaz_model.pth` (link no topo do README).
2. Verifique `vocabulary/` contém `vocab_kz.pickle` e `vocab_en.pickle` (geralmente já estão no repositório).

```bash
ls -la checkpoints/ vocabulary/
```

### 5) Teste básico (Webcam)

Linux:

```bash
source .venv/bin/activate
python3 launcher.py --source webcam --mode both --auto --interval 3
```

Windows (PowerShell):

```powershell
.\.venv\Scripts\Activate.ps1
python launcher.py --source webcam --mode both --auto --interval 3
```

Windows (CMD):

```cmd
.venv\Scripts\activate
python launcher.py --source webcam --mode both --auto --interval 3
```

### 6) Usar ESP32-CAM (exemplo)

```bash
python3 launcher.py --source esp32 --url http://192.168.x.x:81/stream --mode both --auto --interval 3
```

> Nota: o `launcher.py` foi criado para evitar problemas com PATH (por exemplo quando `/usr/bin` não está no PATH). Ele detecta automaticamente `.venv` ou `venv` na pasta do projeto e usa o Python do venv para executar o script. Se você ativar o venv manualmente, pode chamar o `src/unified_camera_detection.py` diretamente com `python src/unified_camera_detection.py ...`, mas usar `launcher.py` é mais resiliente.

### 7) Executando em headless (sem UI)

Se você quiser rodar sem interface OpenCV (por exemplo em servidor/headless), use:

```bash
python3 launcher.py --source webcam --mode both --auto --interval 3 --headless
```

### 8) Debug / Troubleshooting Rápido

- `ModuleNotFoundError: No module named 'torch'` — Ative `.venv` e rode `pip install torch torchvision` (verifique versão e CPU/GPU).
- `ModuleNotFoundError: No module named 'tensorflow'` — `pip install tensorflow`.
- `FileNotFoundError` ao abrir `vocabulary/vocab_*.pickle` — verifique o `BASE_DIR` e se os arquivos existem.
- `EADDRINUSE: address already in use :::3000` — o servidor Node.js (back-end) já está rodando na porta 3000; pare-o ou altere porta.
- `python3: command not found` — use o Python correto para seu sistema (`python` no Windows/ `python3` em Linux) ou corrija PATH.
- Se o `launcher.py` não encontrar venv, verifique se há `.venv` ou `venv` no diretório com `ls -la`.

### 9) Observações finais

- O modelo principal foi treinado em **Kazakh**. Use `test_webcam_translated.py` para obter tradução automática (KZ → EN → PT) se necessário.
- Para produção, considere converter o modelo para TensorRT (se tiver GPU NVIDIA) para reduzir latência.

### ESP32-CAM Streaming

```bash
source venv/bin/activate
python3 test_esp32cam.py --url http://192.168.1.100:81/stream
```

### Single Image

```bash
source venv/bin/activate
python3 test_single_image.py examples/image.jpg
```

---

## 🐳 Docker

### Build and Run

```bash
# Build image
docker-compose build

# Run with webcam + translation
docker-compose up webcam-translate

# Process single image
docker-compose run single-image
```

See [DOCKER.md](DOCKER.md) for complete Docker guide.

---

## 📁 Project Structure

```
kaz-image-captioning/
├── 📦 Installation
│   ├── INSTALL.md              # Installation manual
│   ├── install.sh              # Auto-install script
│   ├── requirements.txt        # Python dependencies
│   ├── Dockerfile              # Docker configuration
│   └── docker-compose.yml      # Docker Compose
│
├── 🧪 Testing Scripts
│   ├── test_webcam_translated.py    # Webcam (KZ + EN) ⭐
│   ├── test_webcam.py               # Webcam (KZ only)
│   ├── test_esp32cam.py             # ESP32-CAM streaming
│   ├── test_single_image.py         # Single image
│   └── setup_check.py               # Environment check
│
├── 🤖 Model & Data
│   ├── checkpoints/
│   │   └── kaz_model.pth            # Download required
│   ├── vocabulary/
│   │   ├── vocab_kz.pickle          # Kazakh vocab
│   │   └── vocab_en.pickle          # English vocab
│   └── examples/                     # Example images
│
├── 📚 Documentation
│   ├── INSTALL.md                   # Installation guide
│   ├── DOCKER.md                    # Docker guide
│   ├── GUIA_TESTE_PT.md            # Portuguese guide
│   ├── FAQ_PT.md                    # FAQ
│   └── COMANDOS.md                  # Command reference
│
└── 🏗️ Core Code
    ├── models/                      # Model architecture
    ├── utils/                       # Utilities
    └── data/                        # Data loaders
```

---

## 📝 Available Scripts

| Script                      | Description                         | Usage                                    |
| --------------------------- | ----------------------------------- | ---------------------------------------- |
| `test_webcam_translated.py` | **Webcam with auto-translation** ⭐ | `python3 test_webcam_translated.py`      |
| `test_webcam.py`            | Webcam (Kazakh captions)            | `python3 test_webcam.py`                 |
| `test_esp32cam.py`          | ESP32-CAM streaming                 | `python3 test_esp32cam.py --url URL`     |
| `test_single_image.py`      | Process single image                | `python3 test_single_image.py image.jpg` |
| `setup_check.py`            | Verify environment                  | `python3 setup_check.py`                 |
| `listar_guias.py`           | List all guides                     | `python3 listar_guias.py`                |

---

## 🔧 Hardware Support

### ESP32-CAM Setup

1. Upload `ESP32_CAM_Stream.ino` to ESP32-CAM
2. Configure WiFi in the code
3. Get IP from Serial Monitor
4. Test: `http://IP:81/stream`
5. Use: `python3 test_esp32cam.py --url http://IP:81/stream`

See [GUIA_TESTE_PT.md](GUIA_TESTE_PT.md) for detailed ESP32-CAM setup.

---

## 📚 Complete Documentation

- **[INSTALL.md](INSTALL.md)** - Step-by-step installation guide
- **[DOCKER.md](DOCKER.md)** - Docker setup and usage
- **[GUIA_TESTE_PT.md](GUIA_TESTE_PT.md)** - Complete Portuguese guide
- **[FAQ_PT.md](FAQ_PT.md)** - Frequently asked questions
- **[COMANDOS.md](COMANDOS.md)** - Ready-to-use commands
- **[ESTRUTURA_PROJETO.md](ESTRUTURA_PROJETO.md)** - Project structure

## 🚀 Quick Start

### 1️⃣ Verify Environment

```bash
python3 setup_check.py
# OR
bash verificar_ambiente.sh
```

### 2️⃣ Test with Different Sources

#### Test with Webcam

```bash
python3 test_webcam.py
```

Press **'c'** to capture and generate caption, **'ESC'** to exit.

#### Test with ESP32-CAM

```bash
python3 test_esp32cam.py --url http://192.168.1.100:81/stream
```

Replace `192.168.1.100` with your ESP32-CAM IP address.

#### Test with Single Image

```bash
python3 test_single_image.py path/to/image.jpg
```

---

## 📁 New Testing Scripts

| Script                  | Purpose                          | Usage                                    |
| ----------------------- | -------------------------------- | ---------------------------------------- |
| `test_webcam.py`        | Test with USB/notebook webcam    | `python3 test_webcam.py`                 |
| `test_esp32cam.py`      | Test with ESP32-CAM or IP camera | `python3 test_esp32cam.py --url URL`     |
| `test_single_image.py`  | Test with static image           | `python3 test_single_image.py image.jpg` |
| `setup_check.py`        | Verify environment setup         | `python3 setup_check.py`                 |
| `verificar_ambiente.sh` | Bash environment check           | `bash verificar_ambiente.sh`             |

---

## 🔧 ESP32-CAM Setup

1. Upload `ESP32_CAM_Stream.ino` to your ESP32-CAM
2. Configure WiFi credentials in the code
3. Note the IP address from Serial Monitor
4. Test stream in browser: `http://IP_ADDRESS:81/stream`
5. Use with Python: `python3 test_esp32cam.py --url http://IP:81/stream`

---

## 📚 Documentation Files

- `GUIA_TESTE_PT.md` - Complete Portuguese guide
- `RESUMO_RAPIDO.md` - Quick start in Portuguese
- `COMANDOS.md` - Ready-to-use commands
- `ESTRUTURA_PROJETO.md` - Project structure map
- `ESP32_CAM_Stream.ino` - Arduino code for ESP32-CAM

### Inference acceleration with NVIDIA's TensorRT deep learning library

- Convert Pytorch model to onnx using this [script](https://github.com/jchenghu/ExpansionNet_v2/blob/master/onnx4tensorrt/convert2onnx.py).
- Convert onnx to TensorRT format. The onnx model file can be converted to a TensorRT egnine using the trtexec tool.

```
trtexec --onnx=./model.onnx --saveEngine=./model_fp32.engine --workspace=200

```

- Inference using TensorRT engine

```
python3 infer_trt.py
```

### Inference time (sec) @384x384 pixel images: Pytorch (.pth) vs. TensorRT (.engine)

| № image | Pytorch model (model size:2.7GB) | TensorRT (FP32, model size: 986MB) |
| ------- | -------------------------------- | ---------------------------------- |
| 1       | 2.56                             | 0.53                               |
| 2       | 1.14                             | 0.48                               |
| 3       | 1.16                             | 0.47                               |
| 4       | 1.12                             | 0.49                               |
| 5       | 1.17                             | 0.46                               |
| 6       | 1.21                             | 0.48                               |
| 7       | 1.35                             | 0.5                                |
| 8       | 1.5                              | 0.5                                |
| 9       | 1.12                             | 0.46                               |
| 10      | 1.1                              | 0.5                                |

### Acknowledgements

The implementation of the model relies on https://github.com/jchenghu/expansionnet_v2. We thank the original authors for their open-sourcing.

### Preprint on TechRxiv

[Image Captioning for the Visually Impaired and Blind: A Recipe for Low-Resource Languages](https://www.techrxiv.org/articles/preprint/Image_Captioning_for_the_Visually_Impaired_and_Blind_A_Recipe_for_Low-Resource_Languages/22133894)

### BibTex

```
@article{Arystanbekov2023,
author = "Batyr Arystanbekov and Askat Kuzdeuov and Shakhizat Nurgaliyev and Hüseyin Atakan Varol",
title = "{Image Captioning for the Visually Impaired and Blind: A Recipe for Low-Resource Languages}",
year = "2023",
month = "2",
url = "https://www.techrxiv.org/articles/preprint/Image_Captioning_for_the_Visually_Impaired_and_Blind_A_Recipe_for_Low-Resource_Languages/22133894",
doi = "10.36227/techrxiv.22133894.v1"
}
```
