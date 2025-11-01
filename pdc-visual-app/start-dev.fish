#!/usr/bin/env fish

# Script para iniciar o servidor WebSocket de teste e o app React Native

echo "🚀 Iniciando servidor WebSocket de teste e app..."
echo ""

# Verificar se as dependências estão instaladas
if not test -d node_modules
    echo "📦 Instalando dependências..."
    pnpm install
end

# Iniciar servidor WebSocket e app em paralelo
echo "✅ Iniciando em modo desenvolvimento com WebSocket..."
pnpm run dev:ws
