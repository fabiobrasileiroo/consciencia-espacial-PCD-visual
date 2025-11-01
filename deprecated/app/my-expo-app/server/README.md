# 🚀 Servidor WebSocket de Desenvolvimento

## O que é?

Um servidor WebSocket simples que simula o backend do PDC Visual para testes. Ele envia mensagens automáticas para testar todas as funcionalidades do app.

---

## 🎯 Funcionalidades

O servidor envia automaticamente:

1. **📝 Textos Detectados** (a cada 10 segundos)

   - "Obstáculo à frente"
   - "Atenção: Pedestre próximo"
   - "Cuidado: Buraco na via"
   - "Alerta: Veículo aproximando"
   - Outros...

2. **⚠️ Alertas de Distância** (a cada 15 segundos)

   - Warning: distância > 0.5m (vibração média)
   - Danger: distância < 0.5m (vibração forte)

3. **🔋 Status de Bateria** (a cada 20 segundos)
   - Nível aleatório (0-100%)
   - Status de carregamento

---

## 🏃 Como usar

### Opção 1: Apenas o servidor (para testar com app já rodando)

```bash
pnpm run server
```

### Opção 2: Servidor + Expo juntos (mais prático)

```bash
pnpm run dev
```

---

## 📱 Conectar do celular

### 1. Certifique-se que está na mesma rede Wi-Fi

### 2. Inicie o servidor:

```bash
pnpm run server
```

### 3. O servidor mostrará os IPs disponíveis:

```
📡 URLs disponíveis:
   - WebSocket: ws://localhost:8080/ws

📱 Para conectar do celular na mesma rede Wi-Fi:
   - ws://192.168.1.100:8080/ws  ← Use este IP!
```

### 4. Configure o IP no app:

Edite `app/(tabs)/main.tsx` linha ~47:

```typescript
// Troque localhost pelo IP que apareceu no terminal
const wsUrl = "ws://192.168.1.100:8080/ws";
```

Ou use variável de ambiente criando arquivo `.env`:

```
EXPO_PUBLIC_WS_URL=ws://192.168.1.100:8080/ws
```

---

## 🧪 Testando

### 1. Inicie o servidor:

```bash
pnpm run server
```

Você verá:

```
═══════════════════════════════════════════════════════════════
🚀 PDC Visual - Servidor WebSocket de Desenvolvimento
═══════════════════════════════════════════════════════════════

✅ Servidor rodando na porta 8080

📡 URLs disponíveis:
   - HTTP:      http://localhost:8080
   - WebSocket: ws://localhost:8080/ws
```

### 2. Abra o app no Expo Go

A tela "PDC Visual" deve mostrar:

- 🟢 Status: "Conectado" (verde)
- WebSocket URL aparecendo

### 3. Aguarde as mensagens

A cada 10-20 segundos você verá:

- ✅ Texto sendo falado (TTS)
- ✅ Celular vibrando (Haptics)
- ✅ Histórico sendo preenchido
- ✅ Logs no terminal do servidor

---

## 📋 Logs do Servidor

O servidor mostra logs detalhados:

```
[10:30:15] ✅ Cliente #1 conectado
Total de clientes conectados: 1

[10:30:25] 📤 Enviado para #1: "Obstáculo à frente"
[10:30:40] ⚠️  Enviado para #1: Alerta DANGER (0.3m)
[10:30:45] 🔋 Enviado para #1: Bateria 78% (carregando)

[10:31:00] 👋 Cliente #1 desconectado
Total de clientes conectados: 0
```

---

## 🔧 Estrutura das Mensagens

### 1. Texto Detectado

```json
{
  "type": "TEXT_DETECTED",
  "data": {
    "id": "msg-1729512345678",
    "text": "Obstáculo à frente",
    "confidence": 0.95,
    "timestamp": "2025-10-21T10:30:45.678Z"
  }
}
```

### 2. Alerta de Distância

```json
{
  "type": "DISTANCE_ALERT",
  "data": {
    "level": "danger",
    "distance": 0.3,
    "timestamp": "2025-10-21T10:30:45.678Z"
  }
}
```

### 3. Status da Bateria

```json
{
  "type": "BATTERY_STATUS",
  "data": {
    "level": 78,
    "isCharging": true,
    "timestamp": "2025-10-21T10:30:45.678Z"
  }
}
```

### 4. Conexão Estabelecida

```json
{
  "type": "CONNECTED",
  "data": {
    "message": "Conectado ao servidor PDC Visual!",
    "timestamp": "2025-10-21T10:30:45.678Z"
  }
}
```

---

## 🛠️ Personalização

### Alterar a frequência das mensagens

Edite `server/dev-server.js`:

```javascript
// Textos a cada 10 segundos (10000ms)
const textInterval = setInterval(() => {
  // ...
}, 10000); // ← Mude este valor

// Alertas a cada 15 segundos
const distanceInterval = setInterval(() => {
  // ...
}, 15000); // ← Mude este valor

// Bateria a cada 20 segundos
const batteryInterval = setInterval(() => {
  // ...
}, 20000); // ← Mude este valor
```

### Adicionar novos tipos de mensagem

```javascript
// Adicione no servidor
const customInterval = setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    const message = {
      type: "CUSTOM_MESSAGE",
      data: {
        // seus dados aqui
      },
    };
    ws.send(JSON.stringify(message));
  }
}, 5000);
intervals.push(customInterval);
```

---

## 🐛 Troubleshooting

### Erro: "EADDRINUSE: address already in use"

A porta 8080 já está sendo usada. Opções:

1. **Matar o processo que está usando a porta:**

```bash
# Encontrar o processo
lsof -i :8080

# Ou matar diretamente (Linux/Mac)
pkill -f dev-server

# No fish shell
kill (lsof -ti:8080)
```

2. **Mudar a porta no servidor:**

Edite `server/dev-server.js`:

```javascript
const PORT = 8081; // ou outra porta livre
```

E no app `app/(tabs)/main.tsx`:

```typescript
const wsUrl = "ws://localhost:8081/ws";
```

### Servidor não conecta do celular

1. ✅ Verifique se está na mesma rede Wi-Fi
2. ✅ Use o IP correto que aparece no terminal
3. ✅ Desative firewall temporariamente
4. ✅ Verifique se o roteador permite comunicação entre dispositivos

### App não recebe mensagens

1. ✅ Verifique os logs do servidor (deve mostrar cliente conectado)
2. ✅ Verifique o status na tela (deve estar verde "Conectado")
3. ✅ Abra o console do Expo: pressione `j` no terminal e veja os logs
4. ✅ Teste com: `pnpm start -- --clear` (limpa cache)

### Mensagens não aparecem no histórico

1. ✅ Verifique se TTS está habilitado nas Configurações
2. ✅ Verifique se o AsyncStorage está funcionando
3. ✅ Tente limpar dados: tela Configurações → "Limpar Todos os Dados"

---

## 📝 Scripts Disponíveis

```bash
# Apenas servidor WebSocket
pnpm run server

# Servidor + Expo juntos
pnpm run dev

# Apenas Expo (sem servidor)
pnpm start

# Parar o servidor
Ctrl+C
```

---

## 🎯 Próximos Passos

1. **Testar TTS:**

   - Inicie servidor
   - Abra app
   - Aguarde mensagens
   - Deve falar os textos em voz alta

2. **Testar Haptics:**

   - Aguarde alertas de distância
   - Deve vibrar: fraco (warning) ou forte (danger)

3. **Testar Histórico:**

   - Mensagens devem aparecer na lista
   - Ao fechar e reabrir, histórico deve persistir

4. **Testar Configurações:**
   - Desabilite TTS → não deve mais falar
   - Desabilite Haptics → não deve mais vibrar
   - Limpe dados → histórico deve ser apagado

---

## 🚀 Modo Avançado

### Integrar com servidor real

Quando tiver um servidor de produção, apenas mude a URL:

```typescript
// app/(tabs)/main.tsx
const wsUrl = process.env.EXPO_PUBLIC_WS_URL || "ws://seu-servidor.com/ws";
```

O código do app já está pronto para receber os mesmos tipos de mensagens!

---

## ✅ Checklist

- [x] Servidor criado
- [x] Scripts adicionados ao package.json
- [x] Tipos de mensagem documentados
- [x] Logs detalhados implementados
- [x] Tratamento de múltiplos clientes
- [x] Desconexão gracioso
- [x] IPs locais listados automaticamente
- [x] Mensagens automáticas funcionando
- [x] Pronto para usar! 🎉
