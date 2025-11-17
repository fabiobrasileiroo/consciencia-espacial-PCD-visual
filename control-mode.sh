#!/bin/bash

echo "🎮 Controle do Modo de Operação"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SERVER="http://localhost:3000"

function get_mode() {
    echo ""
    echo "📊 Modo Atual:"
    curl -s "$SERVER/api/operation-mode" | jq -r '.state.mode' | awk '{print "   🔹 " toupper($0)}'
    echo ""
}

function set_realtime() {
    echo "⏱️  Ativando REALTIME..."
    curl -s -X POST "$SERVER/api/operation-mode" \
        -H "Content-Type: application/json" \
        -d '{"mode": "realtime", "triggeredBy": "bash-script"}' | jq .
    get_mode
}

function set_manual() {
    echo "👆 Ativando MANUAL..."
    curl -s -X POST "$SERVER/api/operation-mode" \
        -H "Content-Type: application/json" \
        -d '{"mode": "manual", "triggeredBy": "bash-script"}' | jq .
    get_mode
}

function capture_now() {
    echo "📸 Solicitando captura manual..."
    curl -s -X POST "$SERVER/api/esp32-cam/capture-now" | jq .
    echo ""
}

# Menu
while true; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "1) 📊 Ver modo atual"
    echo "2) ▶️  Ativar REALTIME (automático 5s)"
    echo "3) ⏸️  Ativar MANUAL (sob demanda)"
    echo "4) 📸 Capturar agora (modo manual)"
    echo "5) ❌ Sair"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    read -p "Escolha uma opção: " opcao

    case $opcao in
        1) get_mode ;;
        2) set_realtime ;;
        3) set_manual ;;
        4) capture_now ;;
        5) echo "👋 Até logo!"; exit 0 ;;
        *) echo "❌ Opção inválida" ;;
    esac
done
