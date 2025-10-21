#!/usr/bin/env fish

# Script para validar a instalação e estrutura E2E
# Execute: ./validate.fish ou fish validate.fish

echo "🔍 Validando estrutura E2E do PDC Visual..."
echo ""

# Cores
set GREEN "\033[0;32m"
set RED "\033[0;31m"
set YELLOW "\033[1;33m"
set NC "\033[0m" # No Color

# Contador
set total 0
set passed 0

function check_file
    set total (math $total + 1)
    if test -f $argv[1]
        echo "$GREEN✓$NC $argv[1]"
        set passed (math $passed + 1)
    else
        echo "$RED✗$NC $argv[1] (NÃO ENCONTRADO)"
    end
end

function check_dir
    set total (math $total + 1)
    if test -d $argv[1]
        echo "$GREEN✓$NC $argv[1]/"
        set passed (math $passed + 1)
    else
        echo "$RED✗$NC $argv[1]/ (NÃO ENCONTRADO)"
    end
end

echo "📂 Verificando diretórios..."
check_dir "e2e"
check_dir "e2e/features"
check_dir "e2e/step-definitions"
check_dir "e2e/mocks"
check_dir "e2e/support"
check_dir "e2e/__tests__"
check_dir "services"
check_dir "examples"
echo ""

echo "📝 Verificando features..."
check_file "e2e/features/01-tts.feature"
check_file "e2e/features/02-audio-routing.feature"
check_file "e2e/features/03-settings.feature"
check_file "e2e/features/04-haptics.feature"
check_file "e2e/features/05-status.feature"
check_file "e2e/features/06-logs.feature"
check_file "e2e/features/07-connection.feature"
check_file "e2e/features/08-ui-history.feature"
echo ""

echo "🔧 Verificando step definitions..."
check_file "e2e/step-definitions/tts.steps.ts"
check_file "e2e/step-definitions/audio-routing.steps.ts"
check_file "e2e/step-definitions/settings.steps.ts"
check_file "e2e/step-definitions/haptics.steps.ts"
check_file "e2e/step-definitions/status.steps.ts"
check_file "e2e/step-definitions/logs.steps.ts"
check_file "e2e/step-definitions/connection.steps.ts"
check_file "e2e/step-definitions/ui-history.steps.ts"
echo ""

echo "🎭 Verificando mocks..."
check_file "e2e/mocks/websocket-server.ts"
check_file "e2e/mocks/http-server.ts"
echo ""

echo "⚙️ Verificando serviços..."
check_file "services/tts-service.ts"
check_file "services/bluetooth-service.ts"
check_file "services/battery-service.ts"
check_file "services/storage-service.ts"
check_file "services/haptics-service.ts"
check_file "services/service-provider.ts"
echo ""

echo "📋 Verificando configurações..."
check_file "cucumber.js"
check_file "jest.config.js"
check_file "package.json"
check_file "e2e/support/setup.ts"
echo ""

echo "📚 Verificando documentação..."
check_file "e2e/README.md"
check_file "QUICK_START.md"
check_file "SUMMARY.md"
check_file "examples/app-integration.tsx"
echo ""

echo "═══════════════════════════════════════════"
echo "$GREEN$passed$NC/$total arquivos/diretórios verificados"
echo "═══════════════════════════════════════════"
echo ""

if test $passed -eq $total
    echo "$GREEN✅ Estrutura completa! Tudo OK.$NC"
    echo ""
    echo "🚀 Próximos passos:"
    echo "   1. npm install"
    echo "   2. npm run test:e2e"
    echo "   3. Abra e2e/reports/cucumber-report.html"
else
    set missing (math $total - $passed)
    echo "$RED❌ $missing arquivo(s) faltando!$NC"
end

echo ""
