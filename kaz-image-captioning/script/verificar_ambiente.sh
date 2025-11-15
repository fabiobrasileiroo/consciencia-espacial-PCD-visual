#!/bin/bash

# Script para verificar se o ambiente está configurado corretamente
# Para executar: bash verificar_ambiente.sh

echo "========================================"
echo "🔍 Verificação do Ambiente"
echo "========================================"
echo ""

# Verificar Python
echo "1️⃣  Verificando Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "   ✅ $PYTHON_VERSION"
else
    echo "   ❌ Python3 não encontrado!"
    exit 1
fi
echo ""

# Verificar pip
echo "2️⃣  Verificando pip..."
if command -v pip3 &> /dev/null; then
    PIP_VERSION=$(pip3 --version)
    echo "   ✅ $PIP_VERSION"
else
    echo "   ❌ pip3 não encontrado!"
    exit 1
fi
echo ""

# Verificar PyTorch
echo "3️⃣  Verificando PyTorch..."
TORCH_CHECK=$(python3 -c "import torch; print(torch.__version__)" 2>&1)
if [ $? -eq 0 ]; then
    echo "   ✅ PyTorch versão: $TORCH_CHECK"
    
    # Verificar CUDA
    CUDA_CHECK=$(python3 -c "import torch; print('CUDA disponível' if torch.cuda.is_available() else 'CUDA não disponível')" 2>&1)
    echo "   ℹ️  $CUDA_CHECK"
else
    echo "   ❌ PyTorch não instalado!"
    echo "   💡 Instale com: pip3 install torch torchvision"
fi
echo ""

# Verificar OpenCV
echo "4️⃣  Verificando OpenCV..."
OPENCV_CHECK=$(python3 -c "import cv2; print(cv2.__version__)" 2>&1)
if [ $? -eq 0 ]; then
    echo "   ✅ OpenCV versão: $OPENCV_CHECK"
else
    echo "   ❌ OpenCV não instalado!"
    echo "   💡 Instale com: pip3 install opencv-python"
fi
echo ""

# Verificar outras dependências
echo "5️⃣  Verificando outras dependências..."

deps=("numpy" "PIL" "h5py" "scipy")
for dep in "${deps[@]}"; do
    CHECK=$(python3 -c "import $dep; print($dep.__version__ if hasattr($dep, '__version__') else 'OK')" 2>&1)
    if [ $? -eq 0 ]; then
        echo "   ✅ $dep: $CHECK"
    else
        echo "   ❌ $dep não instalado!"
    fi
done
echo ""

# Verificar estrutura de diretórios
echo "6️⃣  Verificando estrutura de diretórios..."
dirs=("checkpoints" "vocabulary" "models" "utils" "data")
for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "   ✅ $dir/"
    else
        echo "   ⚠️  $dir/ não encontrado"
    fi
done
echo ""

# Verificar arquivos importantes
echo "7️⃣  Verificando arquivos importantes..."

if [ -f "checkpoints/kaz_model.pth" ]; then
    SIZE=$(du -h checkpoints/kaz_model.pth | cut -f1)
    echo "   ✅ checkpoints/kaz_model.pth ($SIZE)"
else
    echo "   ❌ checkpoints/kaz_model.pth NÃO ENCONTRADO!"
    echo "   💡 Baixe de: https://drive.google.com/drive/folders/16PDZvoNs3P-O9Vr3zEb6bb-aaSDOiSY0"
fi

if [ -f "vocabulary/vocab_kz.pickle" ]; then
    echo "   ✅ vocabulary/vocab_kz.pickle"
else
    echo "   ❌ vocabulary/vocab_kz.pickle não encontrado!"
fi

if [ -f "test_webcam.py" ]; then
    echo "   ✅ test_webcam.py"
else
    echo "   ⚠️  test_webcam.py não encontrado"
fi

if [ -f "test_esp32cam.py" ]; then
    echo "   ✅ test_esp32cam.py"
else
    echo "   ⚠️  test_esp32cam.py não encontrado"
fi
echo ""

# Verificar webcam (Linux)
echo "8️⃣  Verificando webcam..."
if [ -e "/dev/video0" ]; then
    echo "   ✅ Webcam detectada em /dev/video0"
    
    # Listar todos os dispositivos de vídeo
    VIDEO_DEVICES=$(ls /dev/video* 2>/dev/null | wc -l)
    if [ $VIDEO_DEVICES -gt 1 ]; then
        echo "   ℹ️  $VIDEO_DEVICES dispositivos de vídeo encontrados:"
        ls /dev/video*
    fi
else
    echo "   ⚠️  Nenhuma webcam detectada em /dev/video0"
    echo "   💡 Isso é normal se você não tiver webcam ou estiver no Windows/Mac"
fi
echo ""

# Resumo
echo "========================================"
echo "📊 Resumo"
echo "========================================"
echo ""

# Contar problemas
PROBLEMS=0

if ! command -v python3 &> /dev/null; then
    ((PROBLEMS++))
fi

if ! python3 -c "import torch" &> /dev/null; then
    ((PROBLEMS++))
fi

if ! python3 -c "import cv2" &> /dev/null; then
    ((PROBLEMS++))
fi

if [ ! -f "checkpoints/kaz_model.pth" ]; then
    ((PROBLEMS++))
fi

if [ $PROBLEMS -eq 0 ]; then
    echo "✅ Ambiente configurado corretamente!"
    echo ""
    echo "🚀 Você pode executar:"
    echo "   • python3 test_webcam.py (testar com webcam)"
    echo "   • python3 test_esp32cam.py --url http://IP:81/stream (testar com ESP32-CAM)"
else
    echo "⚠️  $PROBLEMS problema(s) encontrado(s)"
    echo ""
    echo "📖 Consulte o arquivo GUIA_TESTE_PT.md para instruções de instalação"
fi

echo ""
echo "========================================"
