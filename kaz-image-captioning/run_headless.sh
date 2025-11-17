#!/bin/bash

# Script para rodar ESP32-CAM → Servidor em modo headless
# Uso: ./run_headless.sh

# Configurações
ESP32_URL="http://192.168.100.57:81/stream"
SERVER_URL="http://192.168.100.11:3000/api/esp32-cam/send-description"
INTERVAL=5  # segundos entre capturas

echo "🚀 Iniciando ESP32-CAM → Servidor (HTTP POST)"
echo "════════════════════════════════════════════"
echo "ESP32-CAM: $ESP32_URL"
echo "Servidor: $SERVER_URL"
echo "Intervalo: ${INTERVAL}s"
echo "════════════════════════════════════════════"
echo ""

cd /workspaces/consciencia-espacial-PCD-visual/kaz-image-captioning
source venv/bin/activate

# Instalar requests se necessário
pip install requests > /dev/null 2>&1

python3 esp32_to_server.py \
  --esp32-url "$ESP32_URL" \
  --server-url "$SERVER_URL" \
  --interval "$INTERVAL"
