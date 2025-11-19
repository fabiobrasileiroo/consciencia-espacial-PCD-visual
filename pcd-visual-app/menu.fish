#!/usr/bin/env fish

# 🎯 Comandos Úteis - Sistema de Detecção de Objetos

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  🚀 Sistema de Detecção de Objetos - Menu Rápido       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

function show_menu
    echo "Escolha uma opção:"
    echo ""
    echo "1) 🚀 Iniciar App + Servidor WebSocket"
    echo "2) 📡 Apenas Servidor WebSocket"
    echo "3) 📱 Apenas App React Native"
    echo "4) 🤖 App no Android"
    echo "5) 🍎 App no iOS"
    echo "6) 🔍 Ver logs do Android"
    echo "7) 🔍 Ver logs do iOS"
    echo "8) 📦 Instalar dependências"
    echo "9) 🧪 Testar WebSocket (wscat)"
    echo "10) 📊 Status do servidor"
    echo "11) 🌐 Descobrir IP local"
    echo "12) 🧹 Limpar cache do Metro"
    echo "13) ❌ Sair"
    echo ""
    read -P "Opção: " choice

    switch $choice
        case 1
            echo "🚀 Iniciando App + Servidor WebSocket..."
            pnpm run dev:ws
        case 2
            echo "📡 Iniciando apenas servidor WebSocket..."
            pnpm run ws-test
        case 3
            echo "📱 Iniciando apenas app React Native..."
            pnpm start
        case 4
            echo "🤖 Iniciando no Android..."
            pnpm run android
        case 5
            echo "🍎 Iniciando no iOS..."
            pnpm run ios
        case 6
            echo "🔍 Mostrando logs do Android..."
            npx react-native log-android
        case 7
            echo "🔍 Mostrando logs do iOS..."
            npx react-native log-ios
        case 8
            echo "📦 Instalando dependências..."
            pnpm install
        case 9
            echo "🧪 Testando WebSocket..."
            echo "Digite 'npm install -g wscat' se não tiver instalado"
            wscat -c ws://localhost:3001
        case 10
            echo "📊 Status do servidor:"
            curl http://localhost:3001/status 2>/dev/null | jq . || echo "Servidor não está rodando"
        case 11
            echo "🌐 Seu IP local é:"
            hostname -I | awk '{print $1}'
        case 12
            echo "🧹 Limpando cache..."
            rm -rf node_modules/.cache
            npx react-native start --reset-cache
        case 13
            echo "👋 Até logo!"
            exit 0
        case '*'
            echo "❌ Opção inválida!"
    end
    
    echo ""
    read -P "Pressione ENTER para voltar ao menu..."
    show_menu
end

# Verificar se está no diretório correto
if not test -f package.json
    echo "❌ Erro: Execute este script no diretório pdc-visual-app"
    exit 1
end

show_menu
