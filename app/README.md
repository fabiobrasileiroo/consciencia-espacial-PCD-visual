# PCD Visual 👁️

App de auxílio visual com detecção de objetos por câmera, feedback por voz (TTS) e vibração háptica.

Este projeto usa [Expo](https://expo.dev) com [file-based routing](https://docs.expo.dev/router/introduction) e inclui uma **estrutura completa de testes E2E** usando Cucumber/Gherkin.

---

## 📖 Documentação

- **[INDEX.md](INDEX.md)** - Índice completo da documentação
- **[QUICK_START.md](QUICK_START.md)** - Guia rápido para começar
- **[SUMMARY.md](SUMMARY.md)** - Resumo da estrutura E2E
- **[COMMANDS.md](COMMANDS.md)** - Lista de comandos úteis
- **[e2e/README.md](e2e/README.md)** - Documentação dos testes E2E

---

## 🚀 Quick Start

### 1. Instalar dependências

```bash
npm install
```

### 2. Iniciar o app

```bash
npx expo start
```

Opções disponíveis:

- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go)
- Web browser

### 3. Executar testes E2E

```bash
npm run test:e2e
```

### 4. Ver relatórios

```bash
open e2e/reports/cucumber-report.html
```

---

## ✨ Features

### 🎯 Funcionalidades Principais

- 🗣️ **TTS (Text-to-Speech)** - Feedback por voz
- 📳 **Haptics** - Vibração para alertas
- 🔊 **Audio Routing** - Bluetooth e alto-falante
- ⚙️ **Settings** - Configurações persistentes
- 🔋 **Status** - Monitoramento do dispositivo
- 📜 **History** - Histórico de textos
- 🔄 **Auto-reconnect** - Reconexão WebSocket automática
- 📊 **Logs** - Sistema de diagnóstico

### 🧪 Features de Teste (8 arquivos .feature)

1. **01-tts.feature** - Text-to-Speech com deduplicação
2. **02-audio-routing.feature** - Roteamento de áudio
3. **03-settings.feature** - Configurações
4. **04-haptics.feature** - Vibração
5. **05-status.feature** - Status do dispositivo
6. **06-logs.feature** - Logs e diagnóstico
7. **07-connection.feature** - Conexão WebSocket
8. **08-ui-history.feature** - Histórico de UI

---

## 📂 Estrutura do Projeto

```
pdc-visual/
├── app/                      # Aplicação (file-based routing)
├── components/               # Componentes React
├── services/                 # Serviços mockáveis
│   ├── tts-service.ts
│   ├── bluetooth-service.ts
│   ├── battery-service.ts
│   ├── storage-service.ts
│   ├── haptics-service.ts
│   └── service-provider.ts
├── e2e/                      # Testes E2E
│   ├── features/            # Arquivos .feature (Gherkin)
│   ├── step-definitions/    # Implementações dos steps
│   ├── mocks/               # Mock servers (WS + HTTP)
│   ├── support/             # Setup e hooks
│   └── __tests__/           # Testes unitários
├── examples/                 # Exemplos de integração
└── scripts/                  # Scripts utilitários
```

---

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm start              # Iniciar Expo
npm run android        # Abrir no Android
npm run ios            # Abrir no iOS
npm run web            # Abrir no navegador

# Testes
npm run test:e2e       # Testes E2E (Cucumber)
npm test               # Testes unitários (Jest)
npm run test:watch     # Testes em watch mode
npm run test:coverage  # Cobertura de código

# Utilitários
npm run lint           # Verificar código
./validate.fish        # Validar estrutura
```

---

## 🧪 Testes E2E

Este projeto possui uma estrutura completa de testes E2E usando:

- **Cucumber.js** - Framework BDD com Gherkin
- **Jest** - Test runner e assertions
- **Mock Servers** - WebSocket e HTTP
- **Serviços Mockáveis** - TTS, Bluetooth, Battery, Storage, Haptics

### Executar Testes

```bash
# Todos os testes
npm run test:e2e

# Feature específica
npx cucumber-js e2e/features/01-tts.feature

# Com tags
npm run test:e2e -- --tags "@smoke"
```

### Validar Estrutura

```bash
./validate.fish
# ou
fish validate.fish
```

---

## 📦 Tecnologias

- **[Expo](https://expo.dev)** - Framework React Native
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Cucumber.js](https://cucumber.io/)** - BDD testing
- **[Jest](https://jestjs.io/)** - Unit testing
- **[WebSocket](https://github.com/websockets/ws)** - Real-time communication
- **[AsyncStorage](https://react-native-async-storage.github.io/async-storage/)** - Data persistence

---

## 🎓 Aprendendo

### Para Desenvolvedores

- Edite arquivos em `app/` para modificar a UI
- Use `services/service-provider.ts` para injeção de dependência
- Veja `examples/app-integration.tsx` para padrões

### Para Testers

- Crie cenários em `e2e/features/*.feature`
- Implemente steps em `e2e/step-definitions/*.steps.ts`
- Use mocks em `e2e/mocks/` para simular servidores

### Recursos

- [Expo documentation](https://docs.expo.dev/)
- [Cucumber documentation](https://cucumber.io/docs/cucumber/)
- [Jest documentation](https://jestjs.io/)

---

## 🤝 Contribuindo

1. Clone o repositório
2. Instale dependências: `npm install`
3. Crie uma branch: `git checkout -b feature/nome`
4. Faça suas alterações
5. Execute os testes: `npm run test:e2e`
6. Commit: `git commit -m "feat: descrição"`
7. Push: `git push origin feature/nome`
8. Abra um Pull Request

---

## 📝 Licença

MIT

---

## 🌟 Status do Projeto

- ✅ Estrutura E2E completa (8 features)
- ✅ Mock servers (WebSocket + HTTP)
- ✅ Serviços mockáveis (5 serviços)
- ✅ Step definitions completas
- ✅ Documentação detalhada
- ⏳ Implementação real dos serviços
- ⏳ Integração com câmera
- ⏳ Deploy

---

**Versão:** 1.0.0  
**Última atualização:** 21/10/2025
