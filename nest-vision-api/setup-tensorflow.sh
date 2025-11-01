#!/bin/bash

# 🎯 Script de Setup do Vision API com TensorFlow
# Instala todas as dependências e configura o ambiente

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║         🎯 Vision API - Setup com TensorFlow                   ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na pasta nest-vision-api"
    exit 1
fi

# 1. Verificar Node.js
echo -e "${BLUE}[1/6]${NC} Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+ primeiro."
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅${NC} Node.js $NODE_VERSION encontrado"

# 2. Verificar pnpm
echo -e "${BLUE}[2/6]${NC} Verificando pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "📦 Instalando pnpm..."
    npm install -g pnpm
fi
PNPM_VERSION=$(pnpm -v)
echo -e "${GREEN}✅${NC} pnpm $PNPM_VERSION encontrado"

# 3. Instalar dependências do sistema (Ubuntu/Debian)
echo -e "${BLUE}[3/6]${NC} Verificando dependências do sistema..."
if command -v apt-get &> /dev/null; then
    echo "📦 Instalando dependências para Canvas (pode solicitar sudo)..."
    sudo apt-get update
    sudo apt-get install -y \
        build-essential \
        libcairo2-dev \
        libpango1.0-dev \
        libjpeg-dev \
        libgif-dev \
        librsvg2-dev \
        pkg-config
    echo -e "${GREEN}✅${NC} Dependências do sistema instaladas"
elif command -v brew &> /dev/null; then
    echo "📦 Instalando dependências para Canvas (macOS)..."
    brew install pkg-config cairo pango libpng jpeg giflib librsvg
    echo -e "${GREEN}✅${NC} Dependências do sistema instaladas"
else
    echo -e "${YELLOW}⚠️${NC}  Sistema não reconhecido. Instale manualmente as dependências do Canvas."
fi

# 4. Instalar dependências do Node
echo -e "${BLUE}[4/6]${NC} Instalando dependências do Node.js..."
pnpm install
echo -e "${GREEN}✅${NC} Dependências instaladas"

# 5. Configurar .env
echo -e "${BLUE}[5/6]${NC} Configurando variáveis de ambiente..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✅${NC} Arquivo .env criado"
    echo -e "${YELLOW}⚠️${NC}  Configure o IP do ESP32-CAM no arquivo .env"
else
    echo -e "${YELLOW}⚠️${NC}  Arquivo .env já existe"
fi

# 6. Criar diretório public se não existir
echo -e "${BLUE}[6/6]${NC} Verificando estrutura de diretórios..."
mkdir -p public
echo -e "${GREEN}✅${NC} Estrutura de diretórios OK"

# Informações finais
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║                   ✅ Setup Concluído!                          ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1️⃣  Configure o IP do ESP32-CAM:"
echo "   nano .env"
echo ""
echo "2️⃣  Inicie o servidor em modo desenvolvimento:"
echo "   pnpm start:dev"
echo ""
echo "3️⃣  Acesse o visualizador web:"
echo "   http://localhost:3000/viewer/viewer.html"
echo ""
echo "4️⃣  Acesse a documentação da API:"
echo "   http://localhost:3000/api/docs"
echo ""
echo "📚 Para mais informações, leia:"
echo "   cat README_TENSORFLOW.md"
echo ""
