# 🇧🇷 Guia Completo de Instalação e Teste - Image Captioning

Este guia te ajudará a configurar e testar o projeto de Image Captioning (geração automática de legendas para imagens) usando diferentes fontes de vídeo.

## 📋 Índice

1. [Requisitos](#requisitos)
2. [Instalação](#instalação)
3. [Download do Modelo](#download-do-modelo)
4. [Testes](#testes)
   - [Webcam do Notebook](#teste-1-webcam-do-notebook)
   - [ESP32-CAM via IP](#teste-2-esp32-cam-via-ip)
   - [Imagem Estática](#teste-3-imagem-estática)
5. [Solução de Problemas](#solução-de-problemas)

---

## 🔧 Requisitos

### Hardware

- **Computador**: CPU ou GPU NVIDIA (recomendado para melhor desempenho)
- **RAM**: Mínimo 8GB (recomendado 16GB)
- **Webcam**: Opcional, para testes com câmera do notebook
- **ESP32-CAM**: Opcional, para streaming via WiFi

### Software

- **Sistema Operacional**: Linux, Windows ou macOS
- **Python**: Versão 3.7 ou superior
- **CUDA**: Opcional (para uso de GPU NVIDIA)
- **OpenCV**: Para captura de vídeo
- **PyTorch**: Framework de deep learning

---

## 📥 Instalação

### Passo 1: Verificar Python

```bash
python3 --version
```

Deve retornar Python 3.7 ou superior.

### Passo 2: Criar Ambiente Virtual (Recomendado)

```bash
# Criar ambiente virtual
python3 -m venv venv

# Ativar ambiente virtual
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate
```

### Passo 3: Instalar Dependências

#### Opção A: Com GPU NVIDIA (CUDA)

```bash
# Instalar PyTorch com suporte CUDA
pip3 install torch==1.9.0+cu111 torchvision==0.10.0+cu111 -f https://download.pytorch.org/whl/torch_stable.html

# Instalar outras dependências
pip3 install h5py==3.2.1 numpy==1.20.1 Pillow==9.4.0 opencv-python scipy
```

#### Opção B: Apenas CPU (sem GPU)

```bash
# Instalar PyTorch apenas CPU
pip3 install torch==1.9.0+cpu torchvision==0.10.0+cpu -f https://download.pytorch.org/whl/torch_stable.html

# Instalar outras dependências
pip3 install h5py==3.2.1 numpy==1.20.1 Pillow==9.4.0 opencv-python scipy
```

### Passo 4: Verificar Instalação

```bash
python3 -c "import torch; print('PyTorch:', torch.__version__); print('CUDA disponível:', torch.cuda.is_available())"
```

---

## 📦 Download do Modelo

### Baixar o Checkpoint do Modelo

1. **Acesse o Google Drive**:
   https://drive.google.com/drive/folders/16PDZvoNs3P-O9Vr3zEb6bb-aaSDOiSY0

2. **Baixe o arquivo** `kaz_model.pth` (tamanho: ~2.7GB)

3. **Coloque o arquivo** na pasta `checkpoints/`:

   ```bash
   mkdir -p checkpoints
   mv ~/Downloads/kaz_model.pth checkpoints/
   ```

4. **Verifique**:
   ```bash
   ls -lh checkpoints/kaz_model.pth
   ```

---

## 🧪 Testes

### Teste 1: Webcam do Notebook

Este teste usa a webcam integrada do seu notebook.

```bash
python3 test_webcam.py
```

**Como usar:**

1. Uma janela mostrará o vídeo da webcam
2. Pressione **'c'** ou **'ESPAÇO'** para capturar e gerar legenda
3. Aguarde o processamento (alguns segundos)
4. A legenda aparecerá no terminal e em uma nova janela
5. Pressione **'ESC'** ou **'q'** para sair

**Saída esperada:**

```
🔄 Carregando dicionário...
✅ Dicionário carregado!
🔄 Inicializando modelo...
🖥️  Usando dispositivo: cuda
✅ Modelo carregado!
🎥 Tentando abrir a webcam...
✅ Webcam aberta com sucesso!

📸 Captura #1
💾 Imagem salva: captured_frame_1.jpg
🤖 Gerando legenda...
📝 Descrição: A person sitting at a desk with a laptop.
⏱️  Tempo: 1.2345s
```

---

### Teste 2: ESP32-CAM via IP

Este teste captura imagens de um ESP32-CAM conectado à rede WiFi.

#### A) Configurar o ESP32-CAM

1. **Abra o Arduino IDE**
2. **Instale a biblioteca ESP32** (Gerenciar Bibliotecas → ESP32)
3. **Carregue o código** `ESP32_CAM_Stream.ino` no ESP32-CAM
4. **Configure WiFi**:
   - Edite `ssid` e `password` no código
5. **Faça upload** para o ESP32-CAM
6. **Anote o IP** mostrado no Serial Monitor (ex: `192.168.1.100`)

#### B) Testar no Navegador

Antes de rodar o Python, teste se o stream funciona:

```
http://IP_DO_ESP32:81/stream
```

Exemplo: `http://192.168.1.100:81/stream`

Você deve ver o vídeo do ESP32-CAM no navegador.

#### C) Rodar o Script Python

```bash
python3 test_esp32cam.py --url http://192.168.1.100:81/stream
```

**Com rotação da imagem** (se necessário):

```bash
python3 test_esp32cam.py --url http://192.168.1.100:81/stream --rotate 180
```

**Como usar:**

1. Uma janela mostrará o stream do ESP32-CAM
2. Pressione **'c'** ou **'ESPAÇO'** para capturar e gerar legenda
3. Pressione **'ESC'** ou **'q'** para sair

---

### Teste 3: Imagem Estática

Para testar com uma imagem já existente:

```python
# Criar um script rápido
python3 -c "
import torch
import torchvision
import pickle
from PIL import Image
from models.End_ExpansionNet_v2 import End_ExpansionNet_v2
from utils.language_utils import convert_vector_idx2word
from argparse import Namespace

# Carregar modelo
with open('vocabulary/vocab_kz.pickle', 'rb') as f:
    coco_tokens = pickle.load(f)

drop_args = Namespace(enc=0.0, dec=0.0, enc_input=0.0, dec_input=0.0, other=0.0)
model_args = Namespace(model_dim=512, N_enc=3, N_dec=3, dropout=0.0, drop_args=drop_args)

model = End_ExpansionNet_v2(
    swin_img_size=384, swin_patch_size=4, swin_in_chans=3,
    swin_embed_dim=192, swin_depths=[2, 2, 18, 2], swin_num_heads=[6, 12, 24, 48],
    swin_window_size=12, swin_mlp_ratio=4., swin_qkv_bias=True, swin_qk_scale=None,
    swin_drop_rate=0.0, swin_attn_drop_rate=0.0, swin_drop_path_rate=0.0,
    swin_norm_layer=torch.nn.LayerNorm, swin_ape=False, swin_patch_norm=True,
    swin_use_checkpoint=False, final_swin_dim=1536,
    d_model=model_args.model_dim, N_enc=model_args.N_enc, N_dec=model_args.N_dec,
    num_heads=8, ff=2048, num_exp_enc_list=[32, 64, 128, 256, 512], num_exp_dec=16,
    output_word2idx=coco_tokens['word2idx_dict'],
    output_idx2word=coco_tokens['idx2word_list'],
    max_seq_len=63, drop_args=model_args.drop_args, rank=0
)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model.to(device)
checkpoint = torch.load('checkpoints/kaz_model.pth', map_location=device)
model.load_state_dict(checkpoint['model_state_dict'])
model.eval()

# Processar imagem
img = Image.open('example_images/test.jpg').convert('RGB')
transf = torchvision.transforms.Compose([
    torchvision.transforms.Resize((384, 384)),
    torchvision.transforms.ToTensor(),
    torchvision.transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])
img_tensor = transf(img).unsqueeze(0).to(device)

# Gerar legenda
with torch.no_grad():
    pred, _ = model(enc_x=img_tensor, enc_x_num_pads=[0], mode='beam_search',
                    beam_size=5, beam_max_seq_len=63, sample_or_max='max',
                    how_many_outputs=1,
                    sos_idx=coco_tokens['word2idx_dict'][coco_tokens['sos_str']],
                    eos_idx=coco_tokens['word2idx_dict'][coco_tokens['eos_str']])

caption = convert_vector_idx2word(pred[0][0], coco_tokens['idx2word_list'])[1:-1]
print(' '.join(caption).capitalize() + '.')
"
```

---

## 🐛 Solução de Problemas

### Problema: "Checkpoint não encontrado"

**Solução:**

```bash
# Verificar se o arquivo existe
ls -la checkpoints/kaz_model.pth

# Se não existir, baixe do Google Drive
# Link: https://drive.google.com/drive/folders/16PDZvoNs3P-O9Vr3zEb6bb-aaSDOiSY0
```

### Problema: "CUDA out of memory"

**Solução:**

- Use CPU em vez de GPU: mude `device = torch.device('cpu')`
- Feche outros programas que usam GPU
- Reduza o tamanho do batch

### Problema: "Webcam não abre"

**Solução:**

```bash
# Listar dispositivos de vídeo (Linux)
ls /dev/video*

# Testar webcam com OpenCV
python3 -c "import cv2; cap = cv2.VideoCapture(0); print('Webcam OK' if cap.isOpened() else 'Webcam ERRO')"

# Tentar índices diferentes (0, 1, 2...)
# Edite test_webcam.py e mude: cap = cv2.VideoCapture(1)
```

### Problema: "ESP32-CAM não conecta"

**Solução:**

1. Verifique se o ESP32 está na mesma rede WiFi
2. Ping no IP do ESP32: `ping 192.168.1.100`
3. Teste no navegador primeiro: `http://IP:81/stream`
4. Verifique firewall
5. Use o IP correto (veja no Serial Monitor do Arduino)

### Problema: "Import Error: No module named 'models'"

**Solução:**

```bash
# Certifique-se de estar na pasta raiz do projeto
cd /home/fabiobrasileiro/estudos/kaz-image-captioning

# Execute os scripts a partir desta pasta
python3 test_webcam.py
```

### Problema: Imagem muito escura/clara

**Solução:**

- Ajuste a iluminação do ambiente
- O modelo foi treinado com imagens normalizadas
- Evite ambientes com muita luz ou muito escuros

### Problema: Legendas em Kazakh

**Observação:**

- O modelo foi treinado para gerar legendas em **Kazakh** (língua do Cazaquistão)
- As legendas NÃO estarão em português ou inglês
- Se quiser legendas em português, precisaria treinar um novo modelo

---

## 📊 Performance Esperada

| Dispositivo          | Tempo por imagem |
| -------------------- | ---------------- |
| CPU Intel i7         | ~5-10 segundos   |
| GPU GTX 1060         | ~1-2 segundos    |
| GPU RTX 3080         | ~0.5-1 segundo   |
| TensorRT (otimizado) | ~0.5 segundos    |

---

## 🚀 Próximos Passos

### Otimização com TensorRT (Avançado)

Para inferência mais rápida em GPUs NVIDIA:

```bash
# Instalar TensorRT
# Seguir instruções em: https://developer.nvidia.com/tensorrt

# Converter modelo
python3 infer_trt.py
```

### Adicionar Text-to-Speech (TTS)

O projeto original tem suporte para converter legendas em áudio. Veja `camera2tts.py` para referência.

---

## 📝 Arquivos Importantes

```
kaz-image-captioning/
├── test_webcam.py          # Teste com webcam (NOVO)
├── test_esp32cam.py        # Teste com ESP32-CAM (NOVO)
├── checkpoints/
│   └── kaz_model.pth       # Modelo treinado (BAIXAR)
├── vocabulary/
│   └── vocab_kz.pickle     # Dicionário Kazakh
├── models/                 # Arquitetura do modelo
├── utils/                  # Utilitários
└── example_images/         # Imagens de exemplo
```

---

## 🆘 Suporte

Se encontrar problemas:

1. **Verifique as dependências**:

   ```bash
   pip3 list | grep -E "torch|opencv|numpy|Pillow"
   ```

2. **Teste o ambiente**:

   ```bash
   bash verificar_ambiente.sh
   ```

3. **Verifique logs de erro** e procure a mensagem específica

4. **Issues do GitHub**:
   https://github.com/IS2AI/kaz-image-captioning/issues

---

## 📚 Referências

- **Paper**: [Image Captioning for the Visually Impaired and Blind](https://www.techrxiv.org/articles/preprint/Image_Captioning_for_the_Visually_Impaired_and_Blind_A_Recipe_for_Low-Resource_Languages/22133894)
- **Modelo Base**: [ExpansionNet v2](https://github.com/jchenghu/expansionnet_v2)
- **Repositório Original**: https://github.com/IS2AI/kaz-image-captioning

---

## ✅ Checklist Rápido

- [ ] Python 3.7+ instalado
- [ ] PyTorch instalado
- [ ] OpenCV instalado
- [ ] Modelo baixado em `checkpoints/kaz_model.pth`
- [ ] Webcam funcionando (opcional)
- [ ] ESP32-CAM configurado (opcional)
- [ ] Scripts de teste criados

**Pronto para testar! 🎉**
