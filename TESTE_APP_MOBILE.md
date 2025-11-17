# 📱 Guia de Teste - Controle de Modo pelo App Mobile

## 🎯 O que foi implementado

O **app mobile** agora controla completamente o modo de operação:

### ✅ Funcionalidades no App

1. **Botão de Alternância de Modo**

   - 🟢 **REALTIME** → Captura automática a cada 5 segundos
   - 🔵 **MANUAL** → Captura apenas quando você clicar

2. **Botão "📸 Capturar Agora"**

   - Só aparece quando está em **modo MANUAL**
   - Solicita captura imediata ao Python

3. **Indicadores Visuais**
   - Ícone **Play** ▶️ quando REALTIME está ativo
   - Ícone **Pause** ⏸️ quando MANUAL está ativo

## 🚀 Como Testar

### Passo 1: Certifique-se que tudo está rodando

```bash
# Terminal 1 - Backend Node.js
cd back-end
node teste-web.js

# Terminal 2 - Script Python (REINICIE COM AS CORREÇÕES!)
cd kaz-image-captioning
source venv/bin/activate
python esp32_to_server.py \
  --esp32-url http://172.25.26.65:81/stream \
  --server-url http://localhost:3000/api/esp32-cam/send-description

# Terminal 3 - App Mobile
cd pdc-visual-app
pnpm run start
```

### Passo 2: No App Mobile

#### A) Conectar ao WebSocket

1. Abra o app no celular/emulador
2. Clique em **"🔗 Conectar WebSocket"**
3. Aguarde até ver **"WS Ativo"** em verde

#### B) Testar Modo REALTIME

1. Verifique se o card **"Modo de Operação"** mostra:

   ```
   ▶️ Tempo Real
   ```

2. No terminal Python, você verá:

   ```
   🔍 Consultando modo em: http://localhost:3000/api/operation-mode
   📦 Resposta completa: {'state': {'mode': 'realtime', ...}}
   ✅ Modo recebido do servidor: realtime

   📸 Captura #1 (frame 123) [REALTIME]
   ⏰ 12:20:05
   🤖 Gerando legenda...
   📝 Descrição (Português): ...
   📤 ✅ Enviado: ...
   ✅ Detecção #1 processada
   ```

3. **Capturas ocorrem automaticamente a cada 5 segundos** ✅

#### C) Mudar para Modo MANUAL

1. No app, clique em:

   ```
   [ Mudar para Manual ]
   ```

2. Você verá:

   - Toast: **"Modo Manual ativado"**
   - Indicador mudou para: **⏸️ Manual**
   - Botão **"📸 Capturar Agora"** apareceu!

3. No terminal Python, você verá:

   ```
   🔍 Consultando modo em: http://localhost:3000/api/operation-mode
   📦 Resposta completa: {'state': {'mode': 'manual', ...}}
   ✅ Modo recebido do servidor: manual

   🔄 Modo alterado: MANUAL
   ⏸️  Captura automática pausada. Aguardando comando manual...
   ```

4. **Capturas automáticas PARAM** ✅
   - Python não gera mais descrições automaticamente
   - Aguarda você clicar no botão

#### D) Capturar Manualmente

1. No app, clique em:

   ```
   [ 📸 Capturar Agora ]
   ```

2. Você verá:

   - Toast: **"Captura solicitada! Aguardando..."**
   - Botão mostra: **"Capturando..."** temporariamente

3. No terminal Python (após ~0.5-1 segundo):

   ```
   ✅ Captura manual solicitada! Timestamp: 1763396550289

   📸 Captura #2 (frame 456) [MANUAL]
   ⏰ 12:25:42
   🤖 Gerando legenda...
   📝 Descrição (Português): ...
   📤 ✅ Enviado: ...
   ✅ Detecção #2 processada
   ```

4. No app:

   - Recebe a descrição via WebSocket
   - Mostra no **"Transcrição em Tempo Real"**
   - Adiciona ao **"Histórico de Detecções"**

5. **Clique novamente** para capturar outra imagem ✅

#### E) Voltar para REALTIME

1. No app, clique em:

   ```
   [ Mudar para Tempo Real ]
   ```

2. Você verá:

   - Toast: **"Modo Tempo Real ativado"**
   - Indicador: **▶️ Tempo Real**
   - Botão **"📸 Capturar Agora"** desaparece

3. No Python:

   ```
   🔄 Modo alterado: REALTIME
   ▶️  Captura automática ativada (intervalo: 5s)

   📸 Captura #3 (frame 789) [REALTIME]
   ...
   ```

4. **Capturas automáticas retomam** ✅

## 🔍 Verificações Importantes

### ✅ Checklist de Funcionamento

- [ ] Python mostra logs **"🔍 Consultando modo"** a cada 2s
- [ ] Python mostra **"📦 Resposta completa"** com estrutura JSON
- [ ] Python identifica corretamente: **"✅ Modo recebido: realtime/manual"**
- [ ] Modo REALTIME: Capturas a cada 5s com tag **[REALTIME]**
- [ ] Modo MANUAL: Mensagem **"⏸️ Captura automática pausada"**
- [ ] Captura manual: Tag **[MANUAL]** quando você clica no app
- [ ] App recebe descrições via WebSocket em ambos os modos

### ❌ Se não funcionar

#### Problema: Python não detecta mudança de modo

**Causa**: Script antigo ainda rodando

**Solução**:

```bash
# 1. Parar o Python (Ctrl+C no terminal)
# 2. Verificar se realmente parou
ps aux | grep esp32_to_server.py

# 3. Se ainda estiver rodando, matar o processo
pkill -f esp32_to_server.py

# 4. Reiniciar com o código atualizado
cd kaz-image-captioning
source venv/bin/activate
python esp32_to_server.py \
  --esp32-url http://172.25.26.65:81/stream \
  --server-url http://localhost:3000/api/esp32-cam/send-description
```

#### Problema: App não conecta ao WebSocket

**Solução**:

```bash
# Verificar se backend está rodando
curl http://localhost:3000/api/operation-mode

# Deve retornar JSON com "state": {"mode": "..."}
```

#### Problema: Modo não muda

**Debug**:

```bash
# Ver logs do backend
# Terminal do Node.js deve mostrar:
# POST /api/operation-mode
# Mode changed: realtime -> manual
```

## 📊 Logs Esperados

### Backend (Node.js)

```
POST /api/operation-mode
Body: { mode: 'manual', triggeredBy: 'mobile-app' }
✅ Mode changed: realtime → manual
Broadcasting mode state to ESP32 connections...
```

### Python

```
🔍 Consultando modo em: http://localhost:3000/api/operation-mode
📦 Resposta completa: {'success': True, 'state': {'mode': 'manual', 'updatedAt': 1763396328486, 'triggeredBy': 'mobile-app', 'source': 'http-api'}, 'availableModes': ['realtime', 'manual']}
✅ Modo recebido do servidor: manual

🔄 Modo alterado: MANUAL
⏸️  Captura automática pausada. Aguardando comando manual...

[... aguardando você clicar no app ...]

✅ Captura manual solicitada! Timestamp: 1763396550289

📸 Captura #1 (frame 456) [MANUAL]
⏰ 12:25:42
🤖 Gerando legenda...
📝 Descrição (Cazaque): ...
⏱️  Tempo: 0.16s
🌐 Traduzindo...
📝 Descrição (Português): Uma pessoa caminhando na rua
📤 ✅ Enviado: Uma pessoa caminhando na rua...
✅ Detecção #1 processada
```

### App Mobile (Console/Toast)

```
✅ Conectado ao WebSocket
📱 Modo Manual ativado
📸 Captura solicitada! Aguardando...
📥 Detecção recebida: Uma pessoa caminhando na rua
```

## 🎯 Resumo

| Ação                | App              | Backend                | Python                   | Resultado                  |
| ------------------- | ---------------- | ---------------------- | ------------------------ | -------------------------- |
| **Conectar WS**     | Clica "Conectar" | Aceita conexão         | -                        | WS Ativo ✅                |
| **Modo → Manual**   | Clica botão      | Recebe POST, muda modo | Detecta em 2s, pausa     | Capturas param ⏸️          |
| **Capturar Agora**  | Clica "📸"       | Define flag            | Detecta em 0.5s, captura | Gera descrição [MANUAL] ✅ |
| **Modo → Realtime** | Clica botão      | Recebe POST, muda modo | Detecta em 2s, retoma    | Capturas a cada 5s ▶️      |

---

## 💡 Dica

Use o script bash **`control-mode.sh`** apenas para **debug/testes rápidos** sem abrir o app:

```bash
./control-mode.sh
# Opção 1: Ver modo atual
# Opção 3: Ativar manual
# Opção 4: Capturar agora
```

Mas em **produção/uso normal**, sempre use o **app mobile** para controlar! 📱
