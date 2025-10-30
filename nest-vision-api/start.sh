#!/bin/bash

# Script para iniciar o servidor Vision API

NODE_PATH="/home/fabiotrocados/.local/share/nvm/v22.12.0/bin/node"
PNPM_PATH="/home/fabiotrocados/.local/share/nvm/v22.12.0/bin/pnpm"

cd "$(dirname "$0")"

echo "🚀 Iniciando Vision API..."
echo ""

$PNPM_PATH start:dev
