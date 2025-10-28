# Testes E2E - Guia Rápido

## 🚀 Quick Start

```bash
# 1. Instalar dependências
npm install

# 2. Executar todos os testes E2E
npm run test:e2e

# 3. Executar feature específica
npx cucumber-js e2e/features/01-tts.feature

# 4. Ver relatórios
open e2e/reports/cucumber-report.html
```

## 📋 Checklist de Implementação

### ✅ Estrutura Criada

- [x] 8 arquivos .feature (01-08)
- [x] 8 arquivos de step definitions
- [x] 2 mock servers (WebSocket + HTTP)
- [x] 5 serviços mockáveis (TTS, Bluetooth, Battery, Storage, Haptics)
- [x] Setup com hooks Before/After
- [x] Configuração Cucumber e Jest
- [x] Service Provider para injeção de dependência

### 📝 Próximos Passos

1. **Instalar dependências**

   ```bash
   npm install
   ```

2. **Testar uma feature**

   ```bash
   npm run test:e2e -- e2e/features/01-tts.feature
   ```

3. **Integrar no app**

   - Copiar exemplo de `examples/app-integration.tsx`
   - Usar `services/service-provider.ts` para injeção de dependência
   - Implementar lógica real substituindo mocks

4. **Adicionar testes unitários**
   ```bash
   npm test
   ```

## 🎯 Features Disponíveis

| Feature       | Arquivo                    | Status    |
| ------------- | -------------------------- | --------- |
| TTS           | `01-tts.feature`           | ✅ Pronto |
| Audio Routing | `02-audio-routing.feature` | ✅ Pronto |
| Settings      | `03-settings.feature`      | ✅ Pronto |
| Haptics       | `04-haptics.feature`       | ✅ Pronto |
| Status        | `05-status.feature`        | ✅ Pronto |
| Logs          | `06-logs.feature`          | ✅ Pronto |
| Connection    | `07-connection.feature`    | ✅ Pronto |
| UI History    | `08-ui-history.feature`    | ✅ Pronto |

## 🔧 Comandos Úteis

```bash
# Executar com tags
npm run test:e2e -- --tags "@smoke"

# Executar em modo dry-run (apenas valida sintaxe)
npx cucumber-js --dry-run

# Listar steps não implementados
npx cucumber-js --dry-run --format snippets

# Executar testes unitários
npm test

# Com cobertura
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📚 Documentação

Veja `e2e/README.md` para documentação completa.

## 🐛 Troubleshooting

### Erro: "Cannot find module '@cucumber/cucumber'"

```bash
npm install
```

### Erro: "Port already in use"

Os mock servers usam portas 8080 (WS) e 3000 (HTTP). Certifique-se de que estão livres.

### Testes não passam

Verifique os logs no console e os relatórios gerados em `e2e/reports/`.

## 💡 Dicas

1. Use `console.log` nos step definitions para debug
2. Inspecione `this.appState` e `this.receivedEvents` no World
3. Verifique os mocks em `e2e/mocks/`
4. Os hooks limpam AsyncStorage automaticamente entre cenários
