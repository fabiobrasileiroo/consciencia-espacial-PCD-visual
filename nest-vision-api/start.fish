#!/usr/bin/env fish

# Script para iniciar o servidor Vision API

set NODE_PATH /home/fabiotrocados/.local/share/nvm/v22.12.0/bin/node
set PNPM_PATH /home/fabiotrocados/.local/share/nvm/v22.12.0/bin/pnpm

cd (dirname (status -f))

echo "🚀 Iniciando Vision API..."
echo ""

$PNPM_PATH start:dev
