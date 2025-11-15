# 🎨 Guia Visual de Arquivos do Projeto

## 📁 Estrutura do Projeto

```
kaz-image-captioning/
│
├── 📖 DOCUMENTAÇÃO (LEIA PRIMEIRO!)
│   ├── README.md              # Documentação principal (inglês)
│   ├── GUIA_TESTE_PT.md      # 🇧🇷 Guia completo em português
│   ├── RESUMO_RAPIDO.md      # ⚡ Resumo rápido para começar
│   ├── COMANDOS.md           # 📝 Comandos prontos para copiar
│   └── ESTRUTURA_PROJETO.md  # 📂 Este arquivo
│
├── 🧪 SCRIPTS DE TESTE (NOVOS!)
│   ├── test_webcam.py         # Testar com webcam do notebook
│   ├── test_esp32cam.py       # Testar com ESP32-CAM via IP
│   ├── test_single_image.py   # Testar com uma imagem
│   ├── setup_check.py         # Verificar configuração inicial
│   └── verificar_ambiente.sh  # Script bash de verificação
│
├── 🔧 HARDWARE (ESP32)
│   └── ESP32_CAM_Stream.ino   # Código Arduino para ESP32-CAM
│
├── 🤖 MODELO E CONFIGURAÇÃO
│   ├── checkpoints/
│   │   └── kaz_model.pth      # ⚠️ BAIXAR (2.7GB)
│   ├── vocabulary/
│   │   └── vocab_kz.pickle    # Dicionário Kazakh
│   └── requirements.txt       # Dependências Python
│
├── 🏗️ CÓDIGO DO MODELO
│   ├── models/                # Arquitetura do modelo
│   │   ├── End_ExpansionNet_v2.py
│   │   ├── ExpansionNet_v2.py
│   │   ├── captioning_model.py
│   │   └── ...
│   ├── utils/                 # Utilitários
│   │   ├── language_utils.py
│   │   ├── args_utils.py
│   │   └── ...
│   └── losses/                # Funções de perda
│
├── 📊 AVALIAÇÃO E DADOS
│   ├── eval/                  # Scripts de avaliação
│   ├── data/                  # Loaders de dados
│   └── example_images/        # Imagens de exemplo
│
└── 🚀 SCRIPTS AVANÇADOS (ORIGINAIS)
    ├── train.py              # Treinar modelo
    ├── test.py               # Teste avançado
    ├── infer_trt.py          # Inferência com TensorRT
    ├── camera2tts.py         # Câmera + Text-to-Speech
    └── inference_examples.ipynb  # Jupyter notebook
```

---

## 🎯 Arquivos por Caso de Uso

### ✅ Primeiro Uso (COMECE AQUI!)

```
1. GUIA_TESTE_PT.md           ← Leia este primeiro
2. setup_check.py              ← Execute para verificar tudo
3. COMANDOS.md                 ← Comandos prontos
```

### 🎥 Testar com Webcam

```
test_webcam.py                 ← Script principal
↓ requer
checkpoints/kaz_model.pth      ← Modelo (baixar)
vocabulary/vocab_kz.pickle     ← Dicionário
models/                        ← Código do modelo
utils/                         ← Utilitários
```

### 📡 Testar com ESP32-CAM

```
ESP32_CAM_Stream.ino           ← Upload para ESP32 primeiro
↓ depois
test_esp32cam.py               ← Script Python
↓ requer
checkpoints/kaz_model.pth      ← Modelo
vocabulary/vocab_kz.pickle     ← Dicionário
```

### 🖼️ Testar com Imagem

```
test_single_image.py           ← Script
↓ requer
sua_imagem.jpg                 ← Qualquer imagem
checkpoints/kaz_model.pth      ← Modelo
vocabulary/vocab_kz.pickle     ← Dicionário
```

---

## 📥 Arquivos que você PRECISA baixar

### ⚠️ CRÍTICO (não funciona sem isso!)

```
📦 kaz_model.pth (2.7GB)
   ↓ Baixar de:
   https://drive.google.com/drive/folders/16PDZvoNs3P-O9Vr3zEb6bb-aaSDOiSY0
   ↓ Colocar em:
   checkpoints/kaz_model.pth
```

### ✅ Já incluído no repositório

```
✓ vocabulary/vocab_kz.pickle
✓ models/ (código do modelo)
✓ utils/ (utilitários)
✓ Todos os scripts .py
```

---

## 🔄 Fluxo de Trabalho Típico

### 1️⃣ Configuração Inicial

```bash
# Verificar tudo
python3 setup_check.py

# OU
bash verificar_ambiente.sh
```

### 2️⃣ Primeiro Teste

```bash
# Com webcam
python3 test_webcam.py

# OU com ESP32
python3 test_esp32cam.py --url http://192.168.1.100:81/stream

# OU com imagem
python3 test_single_image.py imagem.jpg
```

### 3️⃣ Uso Contínuo

```bash
# Capturar frames e gerar legendas
# Pressionar 'c' para capturar
# Pressionar 'ESC' para sair
```

---

## 🎨 Tipos de Arquivo

### Python (.py)

```python
# Scripts executáveis
test_webcam.py         # Execute: python3 test_webcam.py
test_esp32cam.py       # Execute: python3 test_esp32cam.py --url URL
test_single_image.py   # Execute: python3 test_single_image.py image.jpg
```

### Arduino (.ino)

```cpp
// Código para ESP32-CAM
ESP32_CAM_Stream.ino   // Abrir no Arduino IDE e fazer upload
```

### Markdown (.md)

```markdown
# Documentação

GUIA_TESTE_PT.md # Ler no editor ou GitHub
RESUMO_RAPIDO.md # Ler no editor ou GitHub
COMANDOS.md # Copiar e colar comandos
```

### Bash (.sh)

```bash
# Scripts shell
verificar_ambiente.sh  # Execute: bash verificar_ambiente.sh
```

### Binários

```
kaz_model.pth          # Modelo PyTorch (NÃO editar!)
vocab_kz.pickle        # Dicionário pickle (NÃO editar!)
```

---

## 📊 Tamanhos de Arquivo Esperados

| Arquivo            | Tamanho | Obrigatório      |
| ------------------ | ------- | ---------------- |
| `kaz_model.pth`    | ~2.7 GB | ✅ SIM           |
| `vocab_kz.pickle`  | ~200 KB | ✅ SIM           |
| `test_webcam.py`   | ~8 KB   | ✅ SIM           |
| `test_esp32cam.py` | ~9 KB   | ⚠️ Se usar ESP32 |
| Todos os `.py`     | ~500 KB | ✅ SIM           |

---

## 🌐 Dependências Externas

### Python Packages

```
torch==1.9.0           # Deep Learning framework
torchvision==0.10.0    # Visão computacional
opencv-python          # Processamento de imagem/vídeo
numpy==1.20.1          # Computação numérica
Pillow==9.4.0          # Manipulação de imagens
h5py==3.2.1            # Formato HDF5
scipy                  # Computação científica
```

### Hardware (Opcional)

```
Webcam USB ou integrada
ESP32-CAM módulo
GPU NVIDIA (opcional, mas recomendado)
```

---

## 🎯 Mapa de Resolução de Problemas

```
Problema encontrado?
    │
    ├─ Modelo não encontrado
    │  └─→ GUIA_TESTE_PT.md (seção "Download do Modelo")
    │
    ├─ Webcam não funciona
    │  └─→ COMANDOS.md (seção "Diagnóstico")
    │
    ├─ ESP32 não conecta
    │  └─→ GUIA_TESTE_PT.md (seção "ESP32-CAM")
    │
    ├─ Biblioteca faltando
    │  └─→ COMANDOS.md (seção "Instalação")
    │
    └─ Outro problema
       └─→ GUIA_TESTE_PT.md (seção "Solução de Problemas")
```

---

## 📱 Atalhos Rápidos

### Ler documentação

```bash
cat GUIA_TESTE_PT.md | less
```

### Verificar setup

```bash
python3 setup_check.py
```

### Testar rapidamente

```bash
python3 test_webcam.py
```

### Ver comandos prontos

```bash
cat COMANDOS.md
```

---

## 🎓 Níveis de Conhecimento

### 👶 Iniciante

Leia primeiro:

1. `RESUMO_RAPIDO.md`
2. `GUIA_TESTE_PT.md`
3. Execute: `python3 setup_check.py`
4. Execute: `python3 test_webcam.py`

### 🧑 Intermediário

Explore:

- `test_esp32cam.py` com ESP32-CAM
- `ESP32_CAM_Stream.ino` para hardware
- `COMANDOS.md` para comandos avançados

### 👨‍💻 Avançado

Mergulhe em:

- `models/` para entender a arquitetura
- `train.py` para treinar modelo
- `infer_trt.py` para otimização TensorRT
- `camera2tts.py` para integração TTS

---

## 💾 Backup Recomendado

### O que fazer backup

```
✅ checkpoints/kaz_model.pth     (se já baixou)
✅ Suas modificações em .py
✅ Imagens capturadas
✅ Configurações do ESP32-CAM
```

### O que NÃO precisa backup

```
❌ models/ (código original)
❌ utils/ (código original)
❌ eval/ (código original)
```

---

## 🚀 Próximos Passos

Depois de dominar o básico:

1. **Otimização**: Explore `infer_trt.py` para inferência mais rápida
2. **TTS**: Veja `camera2tts.py` para adicionar voz
3. **Treinamento**: Use `train.py` para treinar com seus dados
4. **Customização**: Modifique os scripts de teste para suas necessidades

---

**💡 Dica Final**: Sempre consulte `GUIA_TESTE_PT.md` para informações detalhadas!
