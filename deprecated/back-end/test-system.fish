#!/usr/bin/env fish
# Script de teste para ESP32-CAM

set ESP32_IP "10.178.228.139"
set SERVER_URL "http://localhost:3000"

echo "╔══════════════════════════════════════════╗"
echo "║  🧪 TESTE ESP32-CAM + SERVIDOR          ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Cores
set GREEN '\033[0;32m'
set RED '\033[0;31m'
set YELLOW '\033[1;33m'
set NC '\033[0m' # No Color

function test_step
    set -l name $argv[1]
    set -l url $argv[2]
    
    echo -n "🔍 $name... "
    
    if curl -s --max-time 3 $url > /dev/null 2>&1
        echo -e "$GREEN✅ OK$NC"
        return 0
    else
        echo -e "$RED❌ FALHOU$NC"
        return 1
    end
end

echo "📡 Testando ESP32-CAM..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Teste 1: Ping
echo -n "🌐 Ping no ESP32... "
if ping -c 1 -W 1 $ESP32_IP > /dev/null 2>&1
    echo -e "$GREEN✅ OK$NC"
else
    echo -e "$RED❌ ESP32 não responde!$NC"
    echo ""
    echo "⚠️  Verifique:"
    echo "   1. ESP32 está ligado?"
    echo "   2. Conectado ao WiFi?"
    echo "   3. IP correto? $ESP32_IP"
    exit 1
end

# Teste 2: Status ESP32
test_step "Status ESP32" "http://$ESP32_IP/status"

# Teste 3: Captura
test_step "Captura de foto" "http://$ESP32_IP/capture"

# Teste 4: Stream
test_step "Stream (porta 81)" "http://$ESP32_IP:81/stream"

echo ""
echo "🖥️  Testando Servidor Node.js..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Teste 5: Servidor rodando?
echo -n "🚀 Servidor rodando? "
if curl -s --max-time 2 $SERVER_URL > /dev/null 2>&1
    echo -e "$GREEN✅ OK$NC"
else
    echo -e "$YELLOW⚠️  Servidor não está rodando$NC"
    echo ""
    echo "💡 Inicie com:"
    echo "   npm start              # Modo captura"
    echo "   npm run start:streaming  # Modo streaming"
    exit 1
end

# Teste 6: Status do servidor
test_step "Status do servidor" "$SERVER_URL/api/status"

# Teste 7: Teste de conexão ESP32 <-> Servidor
test_step "Conexão ESP32 <-> Servidor" "$SERVER_URL/api/esp32/test"

# Teste 8: Captura via servidor
test_step "Captura via servidor" "$SERVER_URL/api/esp32/capture"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "$GREEN✅ Todos os testes passaram!$NC"
echo ""
echo "📊 Informações:"
curl -s "$SERVER_URL/api/status" | grep -E '"(status|mode|modelLoaded|streamActive)"'
echo ""
echo "🌐 URLs úteis:"
echo "   ESP32-CAM:     http://$ESP32_IP"
echo "   Stream:        http://$ESP32_IP:81/stream"
echo "   Servidor:      $SERVER_URL"
echo "   Status:        $SERVER_URL/api/status"
echo "   WebSocket:     ws://localhost:8080"
echo ""
echo "✅ Sistema funcionando! 🎉"
