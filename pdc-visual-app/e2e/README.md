# PDC Visual - Testes E2E

Este projeto contém testes end-to-end (E2E) usando Cucumber/Gherkin para o aplicativo PDC Visual.

## 📁 Estrutura

```
e2e/
├── features/              # Arquivos .feature com cenários Gherkin
│   ├── 01-tts.feature
│   ├── 02-audio-routing.feature
│   ├── 03-settings.feature
│   ├── 04-haptics.feature
│   ├── 05-status.feature
│   ├── 06-logs.feature
│   ├── 07-connection.feature
│   └── 08-ui-history.feature
├── step-definitions/      # Implementação dos steps
│   ├── tts.steps.ts
│   ├── audio-routing.steps.ts
│   ├── settings.steps.ts
│   ├── haptics.steps.ts
│   ├── status.steps.ts
│   ├── logs.steps.ts
│   ├── connection.steps.ts
│   └── ui-history.steps.ts
├── mocks/                 # Servidores mock
│   ├── websocket-server.ts
│   └── http-server.ts
├── support/               # Setup e hooks
│   └── setup.ts
└── reports/               # Relatórios gerados

services/                  # Serviços mockáveis
├── tts-service.ts
├── bluetooth-service.ts
├── battery-service.ts
├── storage-service.ts
└── haptics-service.ts
```

## 🚀 Instalação

```bash
npm install
```

Isso instalará todas as dependências, incluindo:

- `@cucumber/cucumber` - Framework de testes BDD
- `jest` - Test runner
- `ws` - WebSocket server para mocks
- `express` - HTTP server para mocks
- `@react-native-async-storage/async-storage` - Storage persistente

## 🧪 Executando os Testes

### Executar todos os testes E2E

```bash
npm run test:e2e
```

### Executar feature específica

```bash
npx cucumber-js e2e/features/01-tts.feature
```

### Executar com tags

```bash
npx cucumber-js --tags "@smoke"
```

### Executar testes unitários (Jest)

```bash
npm test
```

### Modo watch

```bash
npm run test:watch
```

### Com cobertura

```bash
npm run test:coverage
```

## 📝 Features Implementadas

### 1. TTS (Text-to-Speech) - `01-tts.feature`

- Receber texto do servidor mock via WebSocket
- Reproduzir texto por voz automaticamente
- Evitar repetição do mesmo texto (deduplicação por ID)

### 2. Roteamento de Áudio - `02-audio-routing.feature`

- Rotear áudio para fone Bluetooth quando conectado
- Fallback para alto-falante quando fone desconecta

### 3. Configurações - `03-settings.feature`

- Salvar preferências locais (persistência)
- Testar saída de áudio configurada

### 4. Haptics (Vibração) - `04-haptics.feature`

- Vibração local do celular
- Diferentes intensidades: fraco (≤100ms), médio (300ms), forte (padrão)

### 5. Status do Dispositivo - `05-status.feature`

- Exibir nível de bateria
- Mostrar dispositivos Bluetooth conectados
- Alertas de bateria crítica

### 6. Logs e Diagnóstico - `06-logs.feature`

- Enviar logs manualmente
- Relatório de erro após crash
- Endpoint POST /logs no servidor mock

### 7. Conexão WebSocket - `07-connection.feature`

- Reconexão automática com backoff exponencial
- Deduplicação de mensagens ao reconectar
- Recuperação de eventos pendentes

### 8. Histórico de UI - `08-ui-history.feature`

- Mostrar histórico de textos recebidos
- Persistência após reinício do app

## 🛠️ Serviços Mockáveis

Todos os serviços possuem duas implementações:

1. **Implementação real**: Para uso no app
2. **Mock**: Para uso nos testes

### TTSService

```typescript
import { TTSService, MockTTSService } from "./services/tts-service";

// Produção
const tts = new TTSService();

// Testes
const mockTts = new MockTTSService();
await mockTts.speak("Teste");
console.log(mockTts.spokenTexts); // ['Teste']
```

### BluetoothService

```typescript
import { MockBluetoothService } from "./services/bluetooth-service";

const mockBt = new MockBluetoothService();
mockBt.setConnected(true, "FoneXY");
const device = await mockBt.getConnectedDevice(); // 'FoneXY'
```

### StorageService

```typescript
import { MockStorageService } from "./services/storage-service";

const storage = new MockStorageService();
await storage.set("key", "value");
const value = await storage.get("key"); // 'value'
```

## 🔄 Hooks de Teste

Os hooks são executados automaticamente antes/depois de cada cenário:

### Before (Antes de cada cenário)

- Limpa AsyncStorage
- Reseta estado dos mocks
- Inicia servidores mock (WebSocket e HTTP)

### After (Depois de cada cenário)

- Para servidores mock
- Limpa AsyncStorage novamente
- Reseta variáveis de estado

## 📊 Relatórios

Os relatórios são gerados automaticamente em `e2e/reports/`:

- `cucumber-report.json` - Relatório JSON
- `cucumber-report.html` - Relatório HTML visual

## 🧩 Integrando no App

Para usar os serviços mockáveis no app, use injeção de dependência:

```typescript
// app/services/service-provider.tsx
import { TTSService, MockTTSService } from "../services/tts-service";

const isTest = process.env.NODE_ENV === "test";

export const ttsService = isTest ? new MockTTSService() : new TTSService();
```

Veja `examples/app-integration.tsx` para exemplo completo.

## 🐛 Debug

### Ver logs dos mocks

Os mocks imprimem logs no console durante os testes:

```
Mock WebSocket disponível em: ws://localhost:8080/ws
Mock TTS: Speaking "Teste"
Mock Haptics: Vibrate for 100ms
```

### Inspecionar estado do World

```typescript
When("o app recebe evento", async function (this: CustomWorld) {
  console.log("Estado atual:", this.appState);
  console.log("Eventos recebidos:", this.receivedEvents);
});
```

## 📚 Recursos Adicionais

- [Cucumber.js Documentation](https://cucumber.io/docs/cucumber/)
- [Jest Documentation](https://jestjs.io/)
- [Expo Testing](https://docs.expo.dev/develop/unit-testing/)
- [React Native Testing](https://reactnative.dev/docs/testing-overview)

## 🤝 Contribuindo

1. Crie uma nova feature em `e2e/features/`
2. Implemente os steps em `e2e/step-definitions/`
3. Adicione mocks necessários
4. Execute os testes
5. Verifique os relatórios

## 📄 Licença

MIT
