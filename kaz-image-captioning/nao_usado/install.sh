#!/bin/bash

# Script de instalação rápida - Image Captioning
# Executa todos os passos necessários automaticamente

set -e  # Parar em caso de erro

echo "======================================"
echo "🚀 Image Captioning - Instalação Automática"
echo "======================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para log
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Verificar Python
echo "1️⃣  Verificando Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    log_success "Python encontrado: $PYTHON_VERSION"
else
    log_error "Python3 não encontrado! Instale Python 3.7+"
    exit 1
fi
echo ""

# 2. Criar ambiente virtual
echo "2️⃣  Criando ambiente virtual..."
if [ -d "venv" ]; then
    log_warning "Ambiente virtual já existe. Pulando..."
else
    python3 -m venv venv
    log_success "Ambiente virtual criado"
fi
echo ""

# 3. Ativar e atualizar pip
echo "3️⃣  Atualizando pip..."
source venv/bin/activate
pip install --upgrade pip --quiet
log_success "pip atualizado"
echo ""

# 4. Instalar dependências
echo "4️⃣  Instalando dependências..."
echo "   Isso pode levar 5-10 minutos..."
pip install torch torchvision opencv-python h5py scipy --quiet
log_success "Dependências principais instaladas"
echo ""

# 5. Instalar tradutor
echo "5️⃣  Instalando tradutor automático..."
pip install deep-translator --quiet
log_success "Tradutor instalado"
echo ""

# 6. Verificar modelo
echo "6️⃣  Verificando modelo..."
if [ -f "checkpoints/kaz_model.pth" ]; then
    SIZE=$(du -h checkpoints/kaz_model.pth | cut -f1)
    log_success "Modelo encontrado: $SIZE"
else
    log_error "Modelo não encontrado!"
    echo ""
    echo "📥 Baixe o modelo (2.7GB) em:"
    echo "   https://drive.google.com/drive/folders/16PDZvoNs3P-O9Vr3zEb6bb-aaSDOiSY0"
    echo ""
    echo "   Coloque em: checkpoints/kaz_model.pth"
    echo ""
    exit 1
fi
echo ""

# 7. Verificar vocabulário
echo "7️⃣  Verificando vocabulário..."
if [ -f "vocabulary/vocab_kz.pickle" ]; then
    log_success "Vocabulário Kazakh encontrado"
else
    log_error "Vocabulário não encontrado!"
    exit 1
fi
echo ""

# 8. Teste final
echo "8️⃣  Executando verificação final..."
python3 setup_check.py
echo ""

# Sucesso
echo "======================================"
echo "🎉 Instalação Concluída!"
echo "======================================"
echo ""
echo "📝 Para usar:"
echo ""
echo "   # Ativar ambiente virtual"
echo "   source venv/bin/activate"
echo ""
echo "   # Teste com webcam (Kazakh + English)"
echo "   python3 test_webcam_translated.py"
echo ""
echo "   # Teste com imagem única"
echo "   python3 test_single_image.py examples/imagem.jpg"
echo ""
echo "======================================"
echo ""
