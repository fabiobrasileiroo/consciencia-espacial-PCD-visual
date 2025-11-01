#!/bin/bash

# 🎮 Script de Teste - Comandos Remotos ESP32-PAI
# Testa o endpoint POST /api/esp32/command

BASE_URL="http://localhost:3000"
API_COMMAND="$BASE_URL/api/esp32/command"

echo "🎮 Testando Comandos Remotos ESP32-PAI"
echo "======================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar comando
test_command() {
  local cmd=$1
  local value=$2
  local description=$3
  
  echo -e "${YELLOW}📤 Enviando: $description${NC}"
  
  if [ -z "$value" ]; then
    # Comando sem valor
    response=$(curl -s -X POST "$API_COMMAND" \
      -H "Content-Type: application/json" \
      -d "{\"command\": \"$cmd\"}")
  else
    # Comando com valor
    response=$(curl -s -X POST "$API_COMMAND" \
      -H "Content-Type: application/json" \
      -d "{\"command\": \"$cmd\", \"value\": $value}")
  fi
  
  echo "$response" | jq .
  echo ""
  sleep 2
}

# Verificar se servidor está rodando
echo "🔍 Verificando servidor..."
if ! curl -s "$BASE_URL/health" > /dev/null; then
  echo -e "${RED}❌ Servidor não está rodando em $BASE_URL${NC}"
  echo "Execute: node --watch server-vision-streaming.js"
  exit 1
fi

echo -e "${GREEN}✅ Servidor online${NC}"
echo ""

# ===== TESTES =====

# 1. Teste de motor
test_command "test_motor" "" "Testar motor (3 pulsos)"

# 2. Definir vibração manual
test_command "set_vibration" 128 "Vibração 50% (128/255)"

# 3. Calibrar sensor
test_command "calibrate_sensor" "" "Calibrar sensor de distância"

# 4. Obter status completo
test_command "get_status" "" "Solicitar status de todos os módulos"

# 5. Comando inválido (deve falhar)
echo -e "${YELLOW}📤 Testando comando inválido (esperado erro)${NC}"
curl -s -X POST "$API_COMMAND" \
  -H "Content-Type: application/json" \
  -d '{"command": "comando_invalido"}' | jq .
echo ""

# 6. Sem campo command (deve falhar)
echo -e "${YELLOW}📤 Testando sem campo command (esperado erro)${NC}"
curl -s -X POST "$API_COMMAND" \
  -H "Content-Type: application/json" \
  -d '{"value": 123}' | jq .
echo ""

# ===== VERIFICAR STATUS =====
echo "🔍 Verificando status ESP32..."
curl -s "$BASE_URL/api/status" | jq '.esp32'
echo ""

# ===== INSTRUÇÕES FINAIS =====
echo "======================================"
echo -e "${GREEN}✅ Testes concluídos!${NC}"
echo ""
echo "📋 Logs do servidor:"
echo "   Verifique o terminal rodando server-vision-streaming.js"
echo ""
echo "🔌 Status WebSocket ESP32:"
echo "   - Se ESP32-PAI estiver conectado, comandos foram enviados"
echo "   - Se não conectado, retorna erro 503"
echo ""
echo "🧪 Testar manualmente:"
echo "   curl -X POST $API_COMMAND \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"command\": \"test_motor\"}'"
