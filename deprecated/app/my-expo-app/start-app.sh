#!/bin/bash

# 🚀 Script de Início Rápido - Lumi App

echo "🎯 Iniciando aplicativo Lumi..."
echo ""

# Navegar para o diretório do projeto
cd /home/fabiobrasileiro/estudos/consciencia-espacial-PCD-visual/app/my-expo-app

echo "📦 Verificando dependências..."
if [ ! -d "node_modules" ]; then
  echo "⚠️  Instalando dependências..."
  pnpm install
else
  echo "✅ Dependências já instaladas"
fi

echo ""
echo "🎨 Iniciando servidor Expo..."
echo ""
echo "📱 Opções disponíveis:"
echo "  - Pressione 'i' para abrir no iOS Simulator"
echo "  - Pressione 'a' para abrir no Android Emulator"
echo "  - Escaneie o QR Code com Expo Go no seu dispositivo"
echo ""
echo "🎤 Para melhor experiência de acessibilidade:"
echo "  iOS: Ative VoiceOver em Ajustes > Acessibilidade"
echo "  Android: Ative TalkBack em Configurações > Acessibilidade"
echo ""
echo "🔊 Recursos implementados:"
echo "  ✅ Text-to-Speech em todas as interações"
echo "  ✅ Feedback háptico diferenciado"
echo "  ✅ Navegação acessível entre telas"
echo "  ✅ Controles de volume com TTS"
echo ""

# Iniciar Expo
pnpm start
