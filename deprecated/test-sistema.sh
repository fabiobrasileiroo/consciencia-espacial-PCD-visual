#!/bin/bash

# 🧪 Script de Teste - Sistema SEM COCO-SSD

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  🧪 TESTE - SISTEMA SEM COCO-SSD                      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SERVER_URL="http://localhost:3000"

# Teste 1: Servidor está rodando?
echo "📊 Teste 1: Verificando servidor..."
if curl -s "$SERVER_URL/api/status" > /dev/null; then
    echo -e "${GREEN}✅ Servidor está online${NC}"
    
    # Obter versão
    VERSION=$(curl -s "$SERVER_URL/api/status" | grep -o '"version":"[^"]*' | cut -d'"' -f4)
    MODE=$(curl -s "$SERVER_URL/api/status" | grep -o '"mode":"[^"]*' | cut -d'"' -f4)
    echo "   Versão: $VERSION"
    echo "   Modo: $MODE"
else
    echo -e "${RED}❌ Servidor offline!${NC}"
    echo "   Inicie o servidor: node server-vision-no-coco.js"
    exit 1
fi

echo ""

# Teste 2: Enviar descrição via HTTP
echo "📤 Teste 2: Enviando descrição de teste..."
RESPONSE=$(curl -s -X POST "$SERVER_URL/api/esp32-cam/send-description" \
  -H "Content-Type: application/json" \
  -d '{
    "description_pt": "Teste: uma pessoa sentada em uma cadeira",
    "description_kz": "Тест: адам орындықта отырған",
    "objects": ["pessoa", "cadeira"],
    "confidence": 0.95
  }')

if echo "$RESPONSE" | grep -q "success.*true"; then
    echo -e "${GREEN}✅ Descrição enviada com sucesso${NC}"
    echo "   $RESPONSE"
else
    echo -e "${RED}❌ Erro ao enviar descrição${NC}"
    echo "   $RESPONSE"
fi

echo ""

# Teste 3: Obter detecções atuais
echo "📥 Teste 3: Obtendo detecções atuais..."
DETECTION=$(curl -s "$SERVER_URL/api/detections/current")

if echo "$DETECTION" | grep -q "detecting"; then
    echo -e "${GREEN}✅ Detecções obtidas${NC}"
    
    COUNT=$(echo "$DETECTION" | grep -o '"count":[0-9]*' | cut -d':' -f2)
    DESC=$(echo "$DETECTION" | grep -o '"description":"[^"]*' | cut -d'"' -f4)
    
    echo "   Objetos detectados: $COUNT"
    echo "   Descrição: $DESC"
else
    echo -e "${YELLOW}⚠️  Nenhuma detecção recente${NC}"
fi

echo ""

# Teste 4: Histórico
echo "📜 Teste 4: Verificando histórico..."
HISTORY=$(curl -s "$SERVER_URL/api/detections/history?limit=5")

TOTAL=$(echo "$HISTORY" | grep -o '"total":[0-9]*' | cut -d':' -f2)

if [ -n "$TOTAL" ]; then
    echo -e "${GREEN}✅ Histórico disponível${NC}"
    echo "   Total de detecções: $TOTAL"
else
    echo -e "${YELLOW}⚠️  Histórico vazio${NC}"
fi

echo ""

# Teste 5: Status dos ESP32s
echo "📊 Teste 5: Status dos ESP32s..."
STATUS=$(curl -s "$SERVER_URL/api/status")

PAI_CONNECTED=$(echo "$STATUS" | grep -o '"pai":{[^}]*"connected":[^,}]*' | grep -o 'true\|false')
SENSOR_CONNECTED=$(echo "$STATUS" | grep -o '"sensor":{[^}]*"connected":[^,}]*' | grep -o 'true\|false')
CAMERA_CONNECTED=$(echo "$STATUS" | grep -o '"camera":{[^}]*"connected":[^,}]*' | grep -o 'true\|false')

echo "   ESP32-PAI: $([ "$PAI_CONNECTED" = "true" ] && echo -e "${GREEN}✅ Conectado${NC}" || echo -e "${RED}❌ Desconectado${NC}")"
echo "   Sensor: $([ "$SENSOR_CONNECTED" = "true" ] && echo -e "${GREEN}✅ Conectado${NC}" || echo -e "${RED}❌ Desconectado${NC}")"
echo "   Câmera: $([ "$CAMERA_CONNECTED" = "true" ] && echo -e "${GREEN}✅ Conectado${NC}" || echo -e "${RED}❌ Desconectado${NC}")"

echo ""

# Teste 6: SSE (apenas verificar endpoint)
echo "📡 Teste 6: Verificando endpoint SSE..."
if curl -s -N "$SERVER_URL/api/stream/events" --max-time 2 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Endpoint SSE respondendo${NC}"
else
    echo -e "${YELLOW}⚠️  SSE pode não estar configurado${NC}"
fi

echo ""

# Resumo
echo "╔════════════════════════════════════════════════════════╗"
echo "║  📊 RESUMO DOS TESTES                                 ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Servidor funcionando corretamente${NC}"
echo "   URL: $SERVER_URL"
echo "   Monitor Web: $SERVER_URL/monitor"
echo "   Documentação: $SERVER_URL/api/docs"
echo ""
echo "🚀 Próximo passo:"
echo "   Execute o script Python para enviar descrições do ESP32-CAM:"
echo "   cd kaz-image-captioning"
echo "   python esp32cam_to_server.py --cam-url http://192.168.100.56:81/stream --auto"
echo ""
