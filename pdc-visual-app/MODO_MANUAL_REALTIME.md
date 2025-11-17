# Modo Manual/Realtime - Documentação

## 🎯 Funcionalidades Implementadas

### 1. **Alternância entre Modo Realtime e Manual**

- ✅ Botão para alternar entre modo "Tempo Real" e "Manual"
- ✅ Sincronização com servidor backend (Node.js)
- ✅ Indicador visual do modo ativo com ícones Lucide

### 2. **Captura Manual**

- ✅ Botão "📸 Capturar Agora" (visível apenas no modo Manual)
- ✅ Integração com servidor Python (`http://localhost:5000/api/capture`)
- ✅ Feedback visual durante captura (loading spinner)
- ✅ Notificações toast de sucesso/erro

### 3. **Indicadores Dinâmicos**

- ✅ **Status da Câmera**: Ícone dinâmico (Camera do Lucide quando conectada)
- ✅ **Badge de Conexão**: Muda cor baseado no status (verde=conectado, cinza=desconectado)
- ✅ **Estatísticas**: Aparecem apenas quando conectado ao servidor
- ✅ **Ícones Contextuais**: Ícones Lucide baseados no conteúdo da transcrição

### 4. **Ícones Dinâmicos por Palavra-Chave**

Função `getIconForObject()` mapeia palavras nas descrições para ícones:

| Palavra-chave         | Ícone         | Cor                |
| --------------------- | ------------- | ------------------ |
| câmera, camera        | Camera        | Verde (#22C55E)    |
| som, áudio, audio     | Volume2       | Azul (#3B82F6)     |
| microfone, mic        | Mic           | Roxo (#8B5CF6)     |
| alerta, aviso, perigo | AlertTriangle | Vermelho (#EF4444) |
| energia, bateria      | Zap           | Laranja (#F59E0B)  |
| Outros                | Info          | Cinza (#64748B)    |

## 🔧 Endpoints Utilizados

### Backend Node.js (localhost:3000)

#### GET /api/status

Verifica status de conexão da câmera ESP32-CAM

```json
{
  "esp32Status": {
    "camera": {
      "connected": true,
      "lastSeen": "2025-11-17T..."
    }
  }
}
```

#### POST /api/mode

Altera modo de operação

```json
{
  "mode": "manual" | "realtime",
  "triggeredBy": "mobile-app"
}
```

### Servidor Python (localhost:5000)

#### POST /api/capture

Solicita captura manual de imagem da ESP32-CAM

```json
{
  "success": true,
  "message": "Captura solicitada"
}
```

## 📱 Componentes de UI

### Card de Modo de Operação

```tsx
{wsConnected && cameraConnected && (
  <View style={styles.card}>
    {/* Badge do modo atual */}
    <View style={[styles.wsStatusTag, ...]}>
      {operationMode === 'realtime' ? <Play /> : <Pause />}
      <Text>{operationMode === 'realtime' ? 'Tempo Real' : 'Manual'}</Text>
    </View>

    {/* Botão de alternância */}
    <TouchableOpacity onPress={toggleOperationMode}>...</TouchableOpacity>

    {/* Botão de captura (apenas modo manual) */}
    {operationMode === 'manual' && (
      <TouchableOpacity onPress={captureManualDetection}>...</TouchableOpacity>
    )}
  </View>
)}
```

### Indicador de Câmera

```tsx
{cameraConnected ? (
  <Camera size={32} color="#22C55E" />
) : (
  <Image source={Glasses} /> {/* Fallback */}
)}
```

### Badge de Conexão Dinâmico

```tsx
<View
  style={[
    styles.connectedTag,
    connectionStatus === "conectado"
      ? styles.connectedTagActive
      : styles.connectedTagInactive,
  ]}
>
  <View
    style={{
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: connectionStatus === "conectado" ? "#22C55E" : "#64748B",
    }}
  />
  <Text>{connectionStatus === "conectado" ? "Conectado" : "Desconectado"}</Text>
</View>
```

## 🎨 Ícones Lucide Usados

```tsx
import {
  Camera, // Câmera/captura
  Mic, // Microfone
  Volume2, // Som/áudio
  Wifi, // Conexão ativa
  WifiOff, // Sem conexão
  Play, // Modo realtime
  Pause, // Modo manual
  Zap, // Energia/bateria
  AlertTriangle, // Alertas
  Info, // Informação geral
} from "lucide-react-native";
```

## 🔄 Fluxo de Funcionamento

### Modo Realtime

1. Usuário mantém modo "Tempo Real" ativo
2. ESP32-CAM envia detecções automaticamente
3. Backend processa e traduz (se necessário)
4. App recebe via WebSocket e exibe instantaneamente

### Modo Manual

1. Usuário alterna para "Modo Manual"
2. Servidor interrompe envio automático
3. Usuário pressiona "📸 Capturar Agora"
4. Requisição POST enviada ao servidor Python
5. Python solicita captura da ESP32-CAM
6. Imagem é processada e descrição gerada
7. Resultado enviado via WebSocket para o app

## 🛠️ Instalação

### 1. Instalar dependências

```bash
cd pdc-visual-app
npm install lucide-react-native
# ou
pnpm add lucide-react-native
```

### 2. Configurar servidores

#### Backend Node.js

```bash
cd back-end
npm install
node teste-web.js
```

#### Servidor Python (Kaz Image Captioning)

```bash
cd kaz-image-captioning
source venv/bin/activate
python test_esp32cam.py --url http://<IP_ESP32>:81/stream
```

## 📋 Checklist de Funcionalidades

- [x] Alternância de modo Realtime/Manual
- [x] Integração com backend Node.js
- [x] Integração com servidor Python
- [x] Botão de captura manual
- [x] Indicadores visuais de status
- [x] Ícones dinâmicos baseados em conteúdo
- [x] Badge de conexão reativo
- [x] Estatísticas condicionais (apenas quando conectado)
- [x] Feedback visual (toasts, loading)
- [x] Tratamento de erros

## 🐛 Troubleshooting

### Câmera não conecta

- Verificar se ESP32-CAM está ligada e na mesma rede
- Conferir IP correto em `test_esp32cam.py`
- Verificar firewall/porta 81

### Modo não alterna

- Verificar se backend está rodando (localhost:3000)
- Conferir logs do servidor
- Testar endpoint com curl: `curl -X POST http://localhost:3000/api/mode -H "Content-Type: application/json" -d '{"mode":"manual"}'`

### Captura manual não funciona

- Verificar se servidor Python está ativo (localhost:5000)
- Confirmar que câmera está conectada
- Verificar modo está em "Manual"

## 📖 Referências

- [Lucide React Native Icons](https://lucide.dev/guide/packages/lucide-react-native)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
