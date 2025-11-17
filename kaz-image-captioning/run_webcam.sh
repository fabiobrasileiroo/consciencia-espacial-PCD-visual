#!/bin/bash

# Script para rodar com WEBCAM ao invés do ESP32-CAM
# Mantém todas as funcionalidades de modo REALTIME/MANUAL

cd "$(dirname "$0")"

echo "╔════════════════════════════════════════════════════════╗"
echo "║  📹 INICIANDO CAPTURA COM WEBCAM                      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Ativar ambiente virtual
if [ -d "venv" ]; then
    echo "🔄 Ativando ambiente virtual..."
    source venv/bin/activate
else
    echo "❌ Ambiente virtual não encontrado!"
    echo "   Execute: python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Configurações
CAMERA_ID=${1:-0}  # ID da câmera (0 = padrão)
SERVER_URL=${2:-"http://localhost:3000/api/esp32-cam/send-description"}
INTERVAL=${3:-5}   # Intervalo em segundos
SHOW_PREVIEW=${4:-""}  # --show-preview para ativar preview

echo "📹 Câmera ID: $CAMERA_ID"
echo "📡 Servidor: $SERVER_URL"
echo "⏱️  Intervalo: ${INTERVAL}s"
echo ""

# Executar
if [ "$SHOW_PREVIEW" == "--show-preview" ]; then
    echo "👁️  Modo: COM PREVIEW (pressione 'q' na janela para sair)"
    echo ""
    python webcam_to_server.py \
        --camera-id "$CAMERA_ID" \
        --server-url "$SERVER_URL" \
        --interval "$INTERVAL" \
        --show-preview
else
    echo "👁️  Modo: HEADLESS (sem janela de preview)"
    echo "   Use --show-preview como 4º argumento para ver a câmera"
    echo ""
    python webcam_to_server.py \
        --camera-id "$CAMERA_ID" \
        --server-url "$SERVER_URL" \
        --interval "$INTERVAL"
fi
