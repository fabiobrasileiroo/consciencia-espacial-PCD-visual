#!/bin/bash

# Script para rodar ESP32-CAM → Servidor em modo headless
# Uso: ./run_headless.sh

# Configurações
ESP32_URL="http://192.168.100.57:81/stream"
SERVER_URL="ws://192.168.100.11:3000/esp32-cam"
#cd /workspaces/consciencia-espacial-PCD-visual/kaz-image-captioning
#source venv/bin/activate

#python3 esp32_to_server.py \
#  --esp32-url http://192.168.100.57:81/stream \
#  --server-url ws://192.168.100.11:3000/esp32-cam \
#  --interval 5
INTERVAL=5  # segundos entre capturas

echo "🚀 Iniciando ESP32-CAM → Servidor (Headless)"
echo "════════════════════════════════════════════"
echo "ESP32-CAM: $ESP32_URL"
echo "Servidor: $SERVER_URL"
echo "Intervalo: ${INTERVAL}s"
echo "════════════════════════════════════════════"
echo ""

cd /workspaces/consciencia-espacial-PCD-visual/kaz-image-captioning
source venv/bin/activate

# Instalar websockets se necessário
pip install websockets > /dev/null 2>&1

python3 esp32_to_server.py \
  --esp32-url "$ESP32_URL" \
  --server-url "$SERVER_URL" \
  --interval "$INTERVAL"
