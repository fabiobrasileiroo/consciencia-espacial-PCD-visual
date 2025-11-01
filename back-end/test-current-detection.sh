#!/bin/bash

# Script para testar SSE - Current Detection
# Mostra apenas o evento current-detection sendo recebido

echo "📡 Conectando ao SSE..."
echo "⏳ Aguardando evento 'current-detection' (a cada 2s)..."
echo ""

curl -N http://localhost:3000/api/stream/events 2>/dev/null | while IFS= read -r line; do
  # Verificar se é um evento current-detection
  if [[ $line == "event: current-detection" ]]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎯 EVENTO: current-detection"
    
    # Ler próxima linha (data)
    read -r dataline
    
    # Extrair JSON
    json=$(echo "$dataline" | sed 's/^data: //')
    
    # Parsear com jq se disponível
    if command -v jq &> /dev/null; then
      echo "$json" | jq '{
        detecting: .detecting,
        count: .count,
        description: .description,
        secondsAgo: .secondsAgo,
        objects: .objects | map({name: .name, confidence: .confidence, position: .position})
      }'
    else
      echo "$json"
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
  fi
done
