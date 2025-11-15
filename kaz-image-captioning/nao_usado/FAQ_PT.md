# ❓ FAQ - Perguntas Frequentes

## 📋 Índice

- [Geral](#geral)
- [Instalação](#instalação)
- [Webcam](#webcam)
- [ESP32-CAM](#esp32-cam)
- [Performance](#performance)
- [Erros Comuns](#erros-comuns)
- [Hardware](#hardware)

---

## Geral

### ❓ O que este projeto faz?

Este projeto gera automaticamente legendas/descrições textuais para imagens usando Deep Learning (modelo ExpansionNet v2 treinado em Kazakh).

### ❓ Em qual idioma são as legendas?

As legendas são geradas em **Kazakh** (казақ тілі), língua oficial do Cazaquistão. O modelo foi especificamente treinado para este idioma.

### ❓ Posso usar para legendas em português/inglês?

Não diretamente. O modelo está treinado para Kazakh. Para outros idiomas, seria necessário retreinar o modelo com um dataset diferente.

### ❓ Preciso de GPU?

Não é obrigatório, mas **altamente recomendado**. Com GPU o processamento é 5-10x mais rápido.

- **Com GPU**: ~0.5-2 segundos por imagem
- **Sem GPU (CPU)**: ~5-10 segundos por imagem

### ❓ Quanto espaço em disco preciso?

- Modelo (kaz_model.pth): ~2.7 GB
- Dependências Python: ~2-3 GB
- Total: ~5 GB de espaço livre recomendado

---

## Instalação

### ❓ Qual versão do Python devo usar?

Python **3.7 ou superior**. Recomendado: Python 3.8 ou 3.9.

### ❓ Como verifico se tudo está instalado corretamente?

```bash
python3 setup_check.py
# OU
bash verificar_ambiente.sh
```

### ❓ Onde baixo o modelo?

**Link**: https://drive.google.com/drive/folders/16PDZvoNs3P-O9Vr3zEb6bb-aaSDOiSY0

Baixe `kaz_model.pth` e coloque em `checkpoints/kaz_model.pth`

### ❓ A instalação está muito lenta

Isso é normal. O PyTorch é grande (~2GB). Use uma boa conexão de internet.

### ❓ Devo usar ambiente virtual?

**Sim, recomendado!** Evita conflitos com outras instalações Python.

```bash
python3 -m venv venv
source venv/bin/activate
```

---

## Webcam

### ❓ Erro "Webcam não abre"

**Soluções:**

1. Verifique se a webcam está conectada
2. Feche outros programas usando a webcam (Zoom, Skype, etc.)
3. Tente índice diferente:

   ```bash
   # Linux: ver dispositivos
   ls /dev/video*

   # Testar outros índices
   # Edite test_webcam.py: cv2.VideoCapture(1) em vez de (0)
   ```

### ❓ Como saber qual índice usar para minha webcam?

```bash
python3 -c "import cv2; [print(f'Video{i}: OK') for i in range(5) if cv2.VideoCapture(i).isOpened()]"
```

### ❓ A imagem da webcam está invertida/espelhada

Adicione rotação no código:

```python
# No test_webcam.py, após capturar o frame:
frame = cv2.flip(frame, 1)  # Espelhar horizontal
frame = cv2.rotate(frame, cv2.ROTATE_180)  # Rotar 180°
```

### ❓ Posso usar webcam externa USB?

Sim! Funciona com qualquer webcam compatível com OpenCV.

---

## ESP32-CAM

### ❓ Como configuro o ESP32-CAM?

1. Abra `ESP32_CAM_Stream.ino` no Arduino IDE
2. Configure WiFi:
   ```cpp
   const char* ssid = "SEU_WIFI";
   const char* password = "SUA_SENHA";
   ```
3. Selecione placa: **AI Thinker ESP32-CAM**
4. Faça upload
5. Abra Serial Monitor (115200 baud) para ver o IP

### ❓ Como descubro o IP do ESP32-CAM?

- **Método 1**: Serial Monitor do Arduino (após upload)
- **Método 2**: Verifique no roteador os dispositivos conectados
- **Método 3**: Use apps como "Fing" no celular

### ❓ Erro "ESP32-CAM não conecta"

**Checklist:**

1. ✅ ESP32 e computador na mesma rede WiFi?
2. ✅ IP correto? (veja no Serial Monitor)
3. ✅ Teste no navegador primeiro: `http://IP:81/stream`
4. ✅ Firewall bloqueando? (desative temporariamente)
5. ✅ ESP32 está ligado e com LED aceso?

### ❓ Stream funciona no navegador mas não no Python

```bash
# Teste ping
ping SEU_IP_ESP32

# Teste com curl
curl http://SEU_IP_ESP32:81/stream

# Verifique a URL (deve ter :81/stream)
python3 test_esp32cam.py --url http://192.168.1.100:81/stream
```

### ❓ Imagem do ESP32 está escura

Ajuste o flash no código Arduino ou adicione iluminação ambiente.

### ❓ Posso usar ESP8266 em vez de ESP32?

Não. O ESP8266 não tem câmera. Use especificamente o **ESP32-CAM**.

---

## Performance

### ❓ Está muito lento, como acelerar?

1. **Use GPU** (mais importante):
   ```bash
   python3 -c "import torch; print(torch.cuda.is_available())"
   ```
2. **Feche programas pesados** (navegador, jogos)
3. **Use TensorRT** (avançado): `infer_trt.py`
4. **Reduza resolução** da imagem

### ❓ Como sei se estou usando GPU?

Ao executar os scripts, veja a mensagem:

```
🖥️  Usando dispositivo: cuda    ← GPU
🖥️  Usando dispositivo: cpu     ← CPU
```

### ❓ Erro "CUDA out of memory"

**Soluções:**

1. Feche outros programas que usam GPU
2. Force uso de CPU:
   ```python
   # Edite o script e adicione no início:
   device = torch.device('cpu')
   ```

### ❓ Quantas imagens por minuto posso processar?

| Hardware     | Imagens/minuto |
| ------------ | -------------- |
| CPU i7       | ~6-10          |
| GPU GTX 1060 | ~30-60         |
| GPU RTX 3080 | ~60-120        |

---

## Erros Comuns

### ❓ "ModuleNotFoundError: No module named 'torch'"

```bash
pip3 install torch torchvision
```

### ❓ "ModuleNotFoundError: No module named 'cv2'"

```bash
pip3 install opencv-python
```

### ❓ "FileNotFoundError: checkpoints/kaz_model.pth"

Baixe o modelo:
https://drive.google.com/drive/folders/16PDZvoNs3P-O9Vr3zEb6bb-aaSDOiSY0

### ❓ "ImportError: cannot import name 'End_ExpansionNet_v2'"

Certifique-se de estar na pasta raiz do projeto:

```bash
cd ~/estudos/kaz-image-captioning
python3 test_webcam.py
```

### ❓ "RuntimeError: CUDA error"

Seu driver NVIDIA pode estar desatualizado. Opções:

1. Atualize o driver NVIDIA
2. Use CPU: force `device = torch.device('cpu')`

### ❓ Janelas OpenCV não aparecem

No WSL2/Linux sem interface gráfica, isso é normal. Use:

- VNC/Remote Desktop
- X11 forwarding
- Ou processe imagens sem exibir janela

---

## Hardware

### ❓ Qual ESP32 devo comprar?

Procure por: **"ESP32-CAM AI-Thinker"** ou **"ESP32-CAM MB"** (com módulo USB)

### ❓ Preciso de um programador USB-TTL?

Se comprar o módulo **ESP32-CAM MB**, não precisa (já tem USB integrado).
Senão, sim, precisa de um adaptador USB-TTL ou Arduino como programador.

### ❓ Que GPU é recomendada?

Qualquer GPU NVIDIA com pelo menos:

- 4GB VRAM
- Compute Capability 3.5+
- Exemplos: GTX 1050 Ti, RTX 2060, RTX 3060

### ❓ Funciona em Raspberry Pi?

Sim, mas será **muito lento** (apenas CPU). Considere:

- Jetson Nano (tem GPU)
- Coral TPU
- Ou processar no PC e só capturar no Pi

---

## Uso Avançado

### ❓ Como salvar as legendas automaticamente?

Edite os scripts e adicione:

```python
with open('legendas.txt', 'a', encoding='utf-8') as f:
    f.write(f"{caption}\n")
```

### ❓ Posso integrar com outros sistemas?

Sim! Os scripts podem ser modificados para:

- Enviar legendas via API REST
- Salvar em banco de dados
- Enviar por MQTT/WebSocket
- Integrar com Home Assistant

### ❓ Como retreinar o modelo para português?

É um projeto complexo que requer:

1. Dataset grande (milhares de imagens + legendas em PT)
2. GPU potente (16GB+ VRAM)
3. Dias/semanas de treinamento
4. Conhecimento em Deep Learning

Veja `train.py` como ponto de partida.

### ❓ Posso usar com vídeo gravado?

Sim! Modifique para usar:

```python
cap = cv2.VideoCapture('video.mp4')
```

### ❓ Como adicionar Text-to-Speech?

Veja o arquivo `camera2tts.py` como referência (usa ESPnet2-TTS).

---

## Troubleshooting

### ❓ Nada funciona, o que fazer?

1. **Leia o guia completo**: `GUIA_TESTE_PT.md`
2. **Verifique o ambiente**: `python3 setup_check.py`
3. **Teste passo a passo**:

   ```bash
   # 1. Teste Python
   python3 --version

   # 2. Teste PyTorch
   python3 -c "import torch; print(torch.__version__)"

   # 3. Teste modelo
   ls -lh checkpoints/kaz_model.pth

   # 4. Teste webcam
   python3 -c "import cv2; print(cv2.VideoCapture(0).isOpened())"
   ```

### ❓ Onde pedir ajuda?

1. **Issues do GitHub**: https://github.com/IS2AI/kaz-image-captioning/issues
2. **Releia a documentação**: `GUIA_TESTE_PT.md`
3. **Verifique erros**: Copie a mensagem de erro completa

---

## Licença e Créditos

### ❓ Posso usar comercialmente?

Verifique a licença do projeto original. Geralmente, projetos acadêmicos são para pesquisa.

### ❓ Quem desenvolveu isso?

- **Modelo Original**: IS2AI Research Lab
- **ExpansionNet v2**: jchenghu
- **Scripts de teste**: Criados para facilitar uso

### ❓ Como citar este trabalho?

Veja o BibTeX no README.md principal.

---

## Dicas Finais

💡 **Sempre execute os scripts a partir da pasta raiz do projeto**

💡 **Use GPU para melhor performance**

💡 **Boa iluminação melhora os resultados**

💡 **Teste primeiro com imagens estáticas antes de usar vídeo**

💡 **Leia a documentação completa em `GUIA_TESTE_PT.md`**

---

**❓ Sua dúvida não está aqui?**

Consulte:

1. `GUIA_TESTE_PT.md` - Guia completo
2. `COMANDOS.md` - Comandos prontos
3. Issues do GitHub - Problemas conhecidos
