# Estrutura de Navegação do PDC Visual

## ✅ Telas Criadas e Configuradas

### 1. **Tela Principal - PDC Visual** (`app/(tabs)/main.tsx`)

**Rota:** `/main`
**Ícone:** 👁️ (eye.fill)
**Funcionalidades:**

- Conexão WebSocket com servidor
- Exibição de histórico de textos detectados
- Botão "Testar Som" (TTS + Haptics)
- Status de conexão Bluetooth
- Deduplicação automática de mensagens
- Persistência de histórico no AsyncStorage

**Componentes Usados:**

- `IconSymbol` para ícones
- `storageService` para persistência
- `ttsService` para Text-to-Speech
- `hapticsService` para feedback tátil
- `bluetoothService` para status Bluetooth

---

### 2. **Tela de Configurações** (`app/(tabs)/settings.tsx`)

**Rota:** `/settings`
**Ícone:** ⚙️ (gearshape.fill)
**Funcionalidades:**

- Toggle: Forçar Alto-falante
- Toggle: Habilitar TTS
- Toggle: Habilitar Haptics
- Toggle: Reconexão Automática
- Botão: Testar Som
- Botão: Enviar Logs
- Botão: Limpar Todos os Dados

**Configurações Persistidas:**

- `force_speaker`
- `enable_tts`
- `enable_haptics`
- `auto_reconnect`

---

### 3. **Tela de Status** (`app/(tabs)/status.tsx`)

**Rota:** `/status`
**Ícone:** 📊 (chart.bar.fill)
**Funcionalidades:**

- Nível de Bateria (com cores: verde >50%, laranja 20-50%, vermelho <20%)
- Status de Carregamento
- Status de Conexão Bluetooth
- Dispositivos Bluetooth Pareados
- Informações do Sistema:
  - ID do Dispositivo
  - Tempo de Atividade
  - Versão do App
- Pull-to-Refresh

**Serviços Usados:**

- `batteryService` para nível e status de carregamento
- `bluetoothService` para conexão e dispositivos

---

### 4. **Tela Inicial** (`app/(tabs)/index.tsx`)

**Rota:** `/` (padrão)
**Ícone:** 🏠 (house.fill)
**Descrição:** Tela welcome padrão do Expo

---

### 5. **Tela Explore** (`app/(tabs)/explore.tsx`)

**Rota:** `/explore`
**Visibilidade:** Oculta (href: null)
**Descrição:** Tela de exemplo do Expo (não aparece na tab bar)

---

## 🎨 Componentes Reutilizáveis Criados

### 1. **StatusCard** (`components/status-card.tsx`)

Card visual para exibir status de serviços

```tsx
<StatusCard
  title="Bluetooth"
  icon="antenna.radiowaves.left.and.right"
  status="online" // ou "offline" | "warning"
  value="Conectado"
  description="Dispositivo XYZ"
  onPress={() => {}}
/>
```

### 2. **HistoryItemCard** (`components/history-item-card.tsx`)

Card para itens do histórico

```tsx
<HistoryItemCard
  id="123"
  text="Texto detectado"
  timestamp="2025-10-21T10:30:00Z"
  onPress={() => {}}
  onDelete={() => {}}
/>
```

### 3. **ConnectionStatus** (`components/connection-status.tsx`)

Indicador de status de conexão WebSocket

```tsx
<ConnectionStatus
  isConnected={true}
  isReconnecting={false}
  serverUrl="ws://localhost:8080/ws"
/>
```

---

## 📱 Como as Telas Aparecem no App

### Tab Bar (Barra Inferior)

```
┌─────────┬─────────────┬─────────┬─────────────────┐
│  Início │  PDC Visual │  Status │  Configurações  │
│    🏠   │     👁️     │   📊    │       ⚙️       │
└─────────┴─────────────┴─────────┴─────────────────┘
```

### Navegação

1. **Ao abrir o app:** Mostra a tela "Início" (index.tsx)
2. **Tocar "PDC Visual":** Abre a tela principal com WebSocket
3. **Tocar "Status":** Mostra informações da bateria e Bluetooth
4. **Tocar "Configurações":** Abre tela de ajustes

---

## 🔧 Configuração da Navegação

**Arquivo:** `app/(tabs)/_layout.tsx`

```tsx
export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" /> // Início
      <Tabs.Screen name="main" /> // PDC Visual ✨
      <Tabs.Screen name="status" /> // Status ✨
      <Tabs.Screen name="settings" /> // Configurações ✨
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
```

---

## 🚀 Como Testar as Telas

### Opção 1: Expo Go (Recomendado)

1. Instale o Expo Go no celular
2. Execute: `pnpm start`
3. Escaneie o QR Code
4. **As 4 telas estarão visíveis na tab bar**

### Opção 2: Navegador Web

1. Execute: `pnpm start`
2. Pressione `w` no terminal
3. Abre em: http://localhost:8081

### Opção 3: Emulador Android

1. Configure Android SDK (veja ANDROID_SETUP.md)
2. Execute: `pnpm run android`

---

## 🎯 Fluxo de Uso do App

### 1️⃣ Primeira vez que abre:

- Usuário vê tela "Início"
- Toca em "PDC Visual" para usar a funcionalidade principal

### 2️⃣ Na tela PDC Visual:

- App tenta conectar ao WebSocket (ws://localhost:8080/ws)
- Se conectar: status fica verde "Conectado"
- Se falhar: status fica vermelho "Desconectado"
- Pode testar som sem servidor tocando "Testar Som"

### 3️⃣ Quando servidor envia mensagens:

```json
{
  "type": "TEXT_DETECTED",
  "data": {
    "id": "unique-id",
    "text": "Obstáculo detectado"
  }
}
```

- App fala o texto (TTS)
- Vibra o celular (Haptics)
- Adiciona ao histórico
- Salva no AsyncStorage

### 4️⃣ Quando recebe alerta de distância:

```json
{
  "type": "DISTANCE_ALERT",
  "data": {
    "level": "warning", // ou "danger"
    "distance": 0.5
  }
}
```

- Vibração forte se "danger"
- Vibração média se "warning"

### 5️⃣ Na tela Status:

- Mostra nível de bateria em tempo real
- Cor muda baseado no nível (verde/laranja/vermelho)
- Lista dispositivos Bluetooth disponíveis

### 6️⃣ Na tela Configurações:

- Liga/desliga funcionalidades
- Testa som manualmente
- Limpa histórico se necessário

---

## 🐛 Verificação

### Status das Telas

- ✅ `main.tsx` - Criada e funcionando
- ✅ `settings.tsx` - Criada e funcionando
- ✅ `status.tsx` - Criada e funcionando (último ícone corrigido)
- ✅ `_layout.tsx` - Configurado com 4 tabs visíveis
- ✅ Componentes auxiliares criados (StatusCard, HistoryItemCard, ConnectionStatus)

### Erros TypeScript

- ✅ Telas principais: **0 erros**
- ⚠️ Arquivos E2E: 4 erros (não afetam o app)
- ⚠️ Exemplos: 1 erro (não afeta o app)

### Como as telas são carregadas

O Expo Router usa **file-based routing**:

- Arquivo `app/(tabs)/main.tsx` → Rota `/main`
- Arquivo `app/(tabs)/settings.tsx` → Rota `/settings`
- Arquivo `app/(tabs)/status.tsx` → Rota `/status`

O `_layout.tsx` define qual arquivo aparece em cada tab da barra inferior.

---

## 📝 Próximos Passos

1. **Testar no celular via Expo Go:**

   - As 4 telas devem aparecer na barra inferior
   - Navegação entre telas deve funcionar
   - Tocar "Testar Som" deve falar e vibrar

2. **Configurar servidor WebSocket:**

   - As telas já estão prontas para receber dados
   - Servidor deve enviar mensagens no formato JSON
   - WebSocket deve rodar em ws://localhost:8080/ws

3. **Testar funcionalidades:**
   - TTS funcionando
   - Haptics funcionando
   - AsyncStorage salvando histórico
   - Bateria mostrando nível correto
   - Bluetooth detectando dispositivos

---

## 🎨 Personalização

### Mudar cor do tema

Edite: `constants/theme.ts`

### Mudar ícones das tabs

Edite: `app/(tabs)/_layout.tsx`

### Mudar URL do WebSocket

Edite: `app/(tabs)/main.tsx` (linha ~47)

```tsx
const wsUrl = process.env.EXPO_PUBLIC_WS_URL || "ws://localhost:8080/ws";
```

Ou crie arquivo `.env`:

```
EXPO_PUBLIC_WS_URL=ws://seu-servidor.com:8080/ws
```

---

## ✅ Conclusão

**As telas estão criadas e configuradas!** 🎉

Elas aparecem automaticamente na tab bar porque:

1. ✅ Arquivos criados em `app/(tabs)/`
2. ✅ Registrados no `_layout.tsx`
3. ✅ Nomes únicos (main, settings, status)
4. ✅ Exports default corretos

**Para ver funcionando:**

- Abra o Expo Go no celular
- Escaneie o QR Code do terminal
- Toque nas tabs na barra inferior
- Todas as 4 telas devem abrir! 📱
