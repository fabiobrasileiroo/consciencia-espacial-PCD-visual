# 📖 Índice de Documentação - PDC Visual E2E

## 📚 Documentos Principais

### 🚀 Para Começar

1. **[QUICK_START.md](QUICK_START.md)** - Comece aqui! Guia rápido para rodar os testes
2. **[SUMMARY.md](SUMMARY.md)** - Resumo completo de tudo que foi criado
3. **[COMMANDS.md](COMMANDS.md)** - Lista de comandos úteis
4. **[CHECKLIST.md](CHECKLIST.md)** - Checklist de implementação

### 📖 Documentação Detalhada

5. **[e2e/README.md](e2e/README.md)** - Documentação completa dos testes E2E

### 💻 Exemplos

6. **[examples/app-integration.tsx](examples/app-integration.tsx)** - Como integrar no app

### 🔧 Scripts

7. **[validate.fish](validate.fish)** - Script de validação da estrutura
8. **[scripts/run-e2e.js](scripts/run-e2e.js)** - Script para executar testes E2E

---

## 🎯 Por Caso de Uso

### "Quero rodar os testes agora!"

1. Leia: [QUICK_START.md](QUICK_START.md)
2. Execute: `npm install && npm run test:e2e`
3. Abra: `e2e/reports/cucumber-report.html`

### "Como funciona a estrutura?"

1. Leia: [SUMMARY.md](SUMMARY.md)
2. Explore: `e2e/features/` para ver os cenários
3. Veja: `e2e/step-definitions/` para as implementações

### "Como usar no meu app?"

1. Leia: [examples/app-integration.tsx](examples/app-integration.tsx)
2. Use: `services/service-provider.ts` para injeção
3. Implemente: Lógica real nos serviços

### "Quais comandos posso usar?"

1. Leia: [COMMANDS.md](COMMANDS.md)
2. Ou execute: `npm run` para ver scripts

### "Como validar se está tudo OK?"

1. Execute: `./validate.fish`
2. Ou: `fish validate.fish`

---

## 📂 Estrutura de Arquivos

```
📁 pdc-visual/
│
├── 📄 INDEX.md                    ← Você está aqui!
├── 📄 QUICK_START.md              ← Comece por aqui
├── 📄 SUMMARY.md                  ← Visão geral completa
├── 📄 COMMANDS.md                 ← Comandos úteis
├── 📄 README.md                   ← README do projeto
│
├── 📁 e2e/                        ← Testes E2E
│   ├── 📄 README.md              ← Doc dos testes
│   ├── 📁 features/              ← 8 arquivos .feature
│   ├── 📁 step-definitions/      ← Implementações
│   ├── 📁 mocks/                 ← Mock servers
│   ├── 📁 support/               ← Setup e hooks
│   └── 📁 __tests__/             ← Testes unitários
│
├── 📁 services/                   ← Serviços mockáveis
│   ├── tts-service.ts
│   ├── bluetooth-service.ts
│   ├── battery-service.ts
│   ├── storage-service.ts
│   ├── haptics-service.ts
│   └── service-provider.ts
│
├── 📁 examples/                   ← Exemplos
│   └── app-integration.tsx
│
├── 📁 scripts/                    ← Scripts
│   └── run-e2e.js
│
├── 🐚 validate.fish              ← Validação
├── 📄 cucumber.js                 ← Config Cucumber
├── 📄 jest.config.js              ← Config Jest
└── 📄 package.json                ← Dependências
```

---

## 🎓 Fluxo de Aprendizado Recomendado

### Nível 1: Iniciante

1. ✅ Leia [QUICK_START.md](QUICK_START.md)
2. ✅ Execute `npm install`
3. ✅ Execute `npm run test:e2e`
4. ✅ Abra um arquivo `.feature` em `e2e/features/`
5. ✅ Veja o relatório em `e2e/reports/`

### Nível 2: Intermediário

1. ✅ Leia [SUMMARY.md](SUMMARY.md)
2. ✅ Explore um step definition em `e2e/step-definitions/`
3. ✅ Veja como funciona um mock em `e2e/mocks/`
4. ✅ Entenda os serviços em `services/`
5. ✅ Leia [e2e/README.md](e2e/README.md)

### Nível 3: Avançado

1. ✅ Estude [examples/app-integration.tsx](examples/app-integration.tsx)
2. ✅ Implemente lógica real nos serviços
3. ✅ Adicione novos cenários nas features
4. ✅ Crie novos serviços mockáveis
5. ✅ Configure CI/CD para os testes

---

## 🔍 Busca Rápida

| Procurando...  | Vá para...                        |
| -------------- | --------------------------------- |
| Como começar   | [QUICK_START.md](QUICK_START.md)  |
| Visão geral    | [SUMMARY.md](SUMMARY.md)          |
| Comandos       | [COMMANDS.md](COMMANDS.md)        |
| Features       | `e2e/features/*.feature`          |
| Implementações | `e2e/step-definitions/*.steps.ts` |
| Mocks          | `e2e/mocks/*.ts`                  |
| Serviços       | `services/*.ts`                   |
| Exemplos       | `examples/*.tsx`                  |
| Configuração   | `cucumber.js`, `jest.config.js`   |
| Dependências   | `package.json`                    |

---

## ✨ Features Disponíveis

| #   | Feature    | Arquivo                    | Descrição                       |
| --- | ---------- | -------------------------- | ------------------------------- |
| 1   | TTS        | `01-tts.feature`           | Text-to-Speech com deduplicação |
| 2   | Audio      | `02-audio-routing.feature` | Roteamento Bluetooth/Speaker    |
| 3   | Settings   | `03-settings.feature`      | Configurações persistentes      |
| 4   | Haptics    | `04-haptics.feature`       | Vibração do celular             |
| 5   | Status     | `05-status.feature`        | Status do dispositivo           |
| 6   | Logs       | `06-logs.feature`          | Logs e diagnóstico              |
| 7   | Connection | `07-connection.feature`    | WebSocket com reconexão         |
| 8   | History    | `08-ui-history.feature`    | Histórico de textos             |

---

## 🤝 Contribuindo

1. Leia a documentação
2. Explore os exemplos
3. Adicione novos cenários
4. Execute os testes
5. Envie PR

---

## 📞 Suporte

- **Issues**: Problemas técnicos
- **Discussions**: Perguntas gerais
- **Wiki**: Documentação adicional

---

**Última atualização:** 21/10/2025  
**Versão:** 1.0.0
