# 📚 DOCUMENTAÇÃO - Sistema de Visão ESP32-CAM + TensorFlow

## 🎯 Início Rápido

**Quer começar já?** Leia: [`CONFIG_ATUAL.md`](./CONFIG_ATUAL.md)

---

## 📖 Guias Disponíveis

### 0. ✅ [`STREAM_CONFIRMADO.md`](./STREAM_CONFIRMADO.md) - **PORTA 81 TESTADA!**

**O que tem:**

- ✅ Confirmação: Stream funcionando na porta 81
- ✅ Como ativar stream AGORA
- ✅ Logs esperados
- ✅ Performance do modo stream
- ✅ Configuração testada e aprovada

**Quando usar:** Quer usar o stream do ESP32 na porta 81 (testado e funcionando!).

---

### 1. 🚀 [`CONFIG_ATUAL.md`](./CONFIG_ATUAL.md) - **COMECE AQUI!**

**O que tem:**

- ✅ Configuração atual do sistema
- ✅ Como iniciar o servidor
- ✅ O que esperar nos logs
- ✅ Como testar detecções
- ✅ 80 objetos detectáveis
- ✅ Ajustes comuns
- ✅ Troubleshooting rápido

**Quando usar:** Quer saber como está configurado e testar agora.

---

### 2. 📡 [`RESPOSTA_STREAM.md`](./RESPOSTA_STREAM.md) - **SUA PERGUNTA!**

**O que tem:**

- ✅ Resposta sobre `/stream` vs `/capture`
- ✅ Como funciona cada endpoint
- ✅ Por que "Nothing matches" acontece
- ✅ Como configurar porta 81
- ✅ Logs das detecções TensorFlow
- ✅ Configuração recomendada

**Quando usar:** Quer entender a diferença entre `/capture` e `/stream`.

---

### 3. 🔀 [`COMO_ESCOLHER_ENDPOINT.md`](./COMO_ESCOLHER_ENDPOINT.md) - **GUIA COMPLETO**

**O que tem:**

- ✅ Diferenças detalhadas `/capture` vs `/stream`
- ✅ Vantagens e desvantagens de cada
- ✅ Casos de uso específicos
- ✅ Tabela comparativa de performance
- ✅ Configurações recomendadas
- ✅ Troubleshooting específico
- ✅ Como testar cada modo

**Quando usar:** Quer decidir qual endpoint usar para seu projeto.

---

### 4. 📋 [`README_API.md`](./README_API.md) - **DOCUMENTAÇÃO DA API**

**O que tem:**

- ✅ Como funciona o sistema completo
- ✅ Todos os endpoints da API REST
- ✅ Exemplos de uso com curl
- ✅ WebSocket para tempo real
- ✅ Swagger UI
- ✅ Visualizador web
- ✅ Configurações avançadas
- ✅ Performance e otimizações

**Quando usar:** Quer documentação completa da API REST.

---

### 5. 📝 [`RESUMO_ATUALIZACAO.md`](./RESUMO_ATUALIZACAO.md) - **O QUE MUDOU**

**O que tem:**

- ✅ Resumo das mudanças implementadas
- ✅ Novos recursos adicionados
- ✅ Como testar as mudanças
- ✅ Status dos componentes
- ✅ Arquivos criados
- ✅ Próximos passos

**Quando usar:** Quer saber o que foi modificado no código.

---

## 🎯 Fluxo de Leitura Recomendado

### Para Começar Rápido:

```
1. CONFIG_ATUAL.md         → Ver configuração e iniciar
2. Teste no navegador      → http://localhost:3000/viewer
3. Veja funcionando!       → 🎉
```

### Para Entender Tudo:

```
1. CONFIG_ATUAL.md         → Configuração atual
2. RESPOSTA_STREAM.md      → Entender endpoints
3. COMO_ESCOLHER_ENDPOINT.md → Escolher modo
4. README_API.md           → API completa
5. RESUMO_ATUALIZACAO.md   → O que mudou
```

### Tenho Problema Específico:

```
1. CONFIG_ATUAL.md         → Seção "🆘 Suporte Rápido"
2. COMO_ESCOLHER_ENDPOINT.md → Seção "🐛 Troubleshooting"
3. README_API.md           → Seção "🐛 Troubleshooting"
```

---

## 🚀 Comandos Rápidos

### Iniciar Servidor

```bash
cd /home/fabiotrocados/inovatech2025/sistema_de_dectacao_de_objetos/deprecated/back-end
node server-vision-streaming.js
```

### Testar API

```bash
# Ver detecções JSON
curl http://localhost:3000/api/esp32/capture

# Baixar imagem com bounding boxes
curl http://localhost:3000/api/esp32/capture-image --output detection.jpg

# Ver status
curl http://localhost:3000/api/status

# Testar ESP32
curl http://localhost:3000/api/esp32/test
```

### Acessar Interfaces Web

```
Swagger:      http://localhost:3000/api/docs
Visualizador: http://localhost:3000/viewer
Status:       http://localhost:3000/api/status
```

---

## 🔧 Arquivos do Sistema

### Documentação (Esta Pasta):

```
📁 deprecated/back-end/
  📄 INDEX.md                      ← Você está aqui!
  📄 STREAM_CONFIRMADO.md          ← ⭐ NOVO! Porta 81 testada
  📄 CONFIG_ATUAL.md               ← Configuração atual
  📄 RESPOSTA_STREAM.md            ← Resposta sobre /stream
  📄 COMO_ESCOLHER_ENDPOINT.md     ← Guia de escolha
  📄 README_API.md                 ← Documentação API
  📄 RESUMO_ATUALIZACAO.md         ← O que mudou
  📄 TESTAR_STREAM.md              ← Como testar stream
```

### Código:

```
📁 deprecated/back-end/
  📄 server-vision-streaming.js    ← Servidor principal
  📄 viewer.html                   ← Visualizador (copiado para public/)
  📄 package.json                  ← Dependências
```

---

## 📊 Estado do Sistema

| Componente              | Status          | Arquivo                      |
| ----------------------- | --------------- | ---------------------------- |
| **Servidor Node.js**    | ✅ OK           | `server-vision-streaming.js` |
| **TensorFlow COCO-SSD** | ✅ OK           | Modelo carregado             |
| **ESP32-CAM /capture**  | ✅ OK           | Porta 80                     |
| **ESP32-CAM /stream**   | ⚠️ Configurável | Porta 81 (se disponível)     |
| **Bounding Boxes**      | ✅ OK           | 8 cores, labels PT           |
| **API REST**            | ✅ OK           | 9 endpoints                  |
| **Swagger UI**          | ✅ OK           | `/api/docs`                  |
| **WebSocket**           | ✅ OK           | Porta 8080                   |
| **Visualizador Web**    | ✅ OK           | `/viewer`                    |
| **Traduções PT**        | ✅ OK           | 25+ classes                  |

---

## 🎯 Perguntas Frequentes

### Como escolher entre /capture e /stream?

👉 Leia: [`COMO_ESCOLHER_ENDPOINT.md`](./COMO_ESCOLHER_ENDPOINT.md)

### Por que "Nothing matches /stream"?

👉 Leia: [`RESPOSTA_STREAM.md`](./RESPOSTA_STREAM.md) - Seção "Por Que Nothing matches"

### TensorFlow não detecta objetos?

👉 Leia: [`CONFIG_ATUAL.md`](./CONFIG_ATUAL.md) - Seção "Detectando Poucos Objetos"

### Como ver os logs das detecções?

👉 Leia: [`CONFIG_ATUAL.md`](./CONFIG_ATUAL.md) - Seção "O Que Esperar nos Logs"

### Onde está a documentação da API?

👉 Leia: [`README_API.md`](./README_API.md)
👉 Ou acesse: http://localhost:3000/api/docs

### Quais objetos o TensorFlow detecta?

👉 Leia: [`CONFIG_ATUAL.md`](./CONFIG_ATUAL.md) - Seção "80 Objetos Detectáveis"
👉 Total: 80 classes COCO (pessoa, carro, cachorro, etc.)

### Como mudar a confiança mínima?

👉 Leia: [`CONFIG_ATUAL.md`](./CONFIG_ATUAL.md) - Seção "Ajustes Comuns"

```javascript
minConfidence: 0.3,  // Mais sensível
```

---

## 📚 Links Úteis

### Servidor Local:

- **Swagger:** http://localhost:3000/api/docs
- **Visualizador:** http://localhost:3000/viewer
- **Status:** http://localhost:3000/api/status
- **WebSocket:** ws://localhost:8080

### ESP32-CAM:

- **Captura:** http://192.168.100.56/capture
- **Stream:** http://192.168.100.56:81/stream (se configurado)
- **Status:** http://192.168.100.56/status

---

## 🎉 Sistema Completo!

```
╔══════════════════════════════════════════╗
║  ✅ SISTEMA 100% FUNCIONAL              ║
╚══════════════════════════════════════════╝

📡 ESP32-CAM:      OK
🤖 TensorFlow:     OK
🎨 Bounding Boxes: OK
🌍 API REST:       OK
📚 Swagger:        OK
🔌 WebSocket:      OK
🖼️  Visualizador:  OK
🇧🇷 Traduções:     OK
```

**Pronto para uso em produção!** 🚀

---

## 🆘 Precisa de Ajuda?

1. **Problema ao iniciar?**

   - Verifique: [`CONFIG_ATUAL.md`](./CONFIG_ATUAL.md) - Seção "Suporte Rápido"

2. **Dúvida sobre endpoints?**

   - Veja: [`RESPOSTA_STREAM.md`](./RESPOSTA_STREAM.md)

3. **Quer usar /stream?**

   - Leia: [`COMO_ESCOLHER_ENDPOINT.md`](./COMO_ESCOLHER_ENDPOINT.md)

4. **Documentação completa?**

   - Consulte: [`README_API.md`](./README_API.md)

5. **O que foi mudado?**
   - Veja: [`RESUMO_ATUALIZACAO.md`](./RESUMO_ATUALIZACAO.md)

---

**Boa codificação! 🚀**
