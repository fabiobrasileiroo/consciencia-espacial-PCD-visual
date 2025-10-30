# 🚀 Vision API - Sistema de Detecção de Objetos

API NestJS profissional para receber e processar dados de detecção de objetos do ESP32-CAM em tempo real. Sistema desenvolvido para auxiliar pessoas com deficiência visual (PCD visual).

## ✨ Características

- 🎯 **API RESTful** completa com NestJS
- 📡 **Server-Sent Events (SSE)** para streaming de dados em tempo real
- 📚 **Documentação Swagger** interativa e completa
- ✅ **Validação de dados** com class-validator
- 🐳 **Docker e Docker Compose** para deploy simplificado
- 📊 **Histórico de detecções** com estatísticas
- 🔍 **Health checks** e monitoramento
- 🎨 **TypeScript** com tipagem forte
- 🧪 **Estrutura preparada para testes**

## 📋 Pré-requisitos

- Node.js 18+ ou Docker
- pnpm (recomendado) ou npm
- ESP32-CAM configurado

## 🚀 Instalação

### Método 1: Desenvolvimento Local

```bash
# Instalar dependências
pnpm install

# Copiar arquivo de ambiente
cp .env.example .env

# Iniciar em modo desenvolvimento
pnpm start:dev
```

### Método 2: Docker (Recomendado para Produção)

```bash
# Construir e iniciar containers
pnpm docker:up

# Ver logs em tempo real
pnpm docker:logs

# Parar containers
pnpm docker:down
```

### Método 3: Docker Manual

```bash
# Construir imagem
docker build -t vision-api:latest .

# Executar container
docker run -p 3000:3000 --env-file .env vision-api:latest
```

## 📖 Endpoints da API

### 🎯 Vision (Detecção de Objetos)

#### POST /api/vision

Recebe detecção do ESP32-CAM e processa os dados.

**Parâmetros do Body (JSON):**

| Campo       | Tipo   | Obrigatório | Descrição                                                                                  |
| ----------- | ------ | ----------- | ------------------------------------------------------------------------------------------ |
| `moduleId`  | string | ✅ Sim      | Identificador único do módulo ESP32 que enviou os dados (ex: "module-2", "cam-01")         |
| `objects`   | array  | ✅ Sim      | Lista de objetos detectados pela câmera. Cada objeto contém name, confidence e description |
| `timestamp` | string | ❌ Não      | Data/hora da detecção no formato ISO 8601. Se não informado, usa o horário do servidor     |
| `metrics`   | object | ❌ Não      | Métricas de performance do ESP32 para monitoramento                                        |

**Estrutura do objeto em `objects[]`:**

- `name` (string, obrigatório): Nome do objeto em português (ex: "pessoa", "cadeira", "porta")
- `confidence` (number, obrigatório): Nível de confiança de 0 a 100 (ex: 95 = 95% de certeza)
- `description` (string, opcional): Descrição contextual do objeto (ex: "Uma pessoa à frente")

**Métricas disponíveis em `metrics`:**

- `captureTime`: Tempo em ms para capturar a imagem da câmera
- `detectionTime`: Tempo em ms para processar e detectar objetos
- `sendTime`: Tempo em ms para enviar dados ao servidor
- `totalTime`: Tempo total do ciclo completo em ms
- `freeHeap`: Memória RAM livre no ESP32 em bytes
- `rssi`: Força do sinal WiFi em dBm (valores negativos, quanto mais próximo de 0, melhor)
- `fps`: Taxa de frames por segundo (quantas detecções por segundo)

**Exemplo de requisição:**

```json
{
  "moduleId": "module-2",
  "objects": [
    {
      "name": "pessoa",
      "confidence": 95,
      "description": "Uma pessoa à frente"
    }
  ],
  "timestamp": "2025-10-29T15:30:00.000Z",
  "metrics": {
    "captureTime": 245,
    "detectionTime": 1823,
    "sendTime": 156,
    "totalTime": 2224,
    "freeHeap": 89456,
    "rssi": -67,
    "fps": 0.45
  }
}
```

**Resposta:**

```json
{
  "status": "success",
  "message": "Detecção recebida e processada com sucesso",
  "timestamp": "2025-10-29T15:30:00.000Z",
  "data": {
    "detectionId": "uuid-here",
    "objectsDetected": 1,
    "moduleId": "module-2"
  }
}
```

#### GET /api/vision/stream

Stream SSE de detecções em tempo real. Mantém uma conexão aberta e envia eventos sempre que uma nova detecção é processada.

**Tipos de eventos:**

- `detection`: Emitido quando uma nova detecção é recebida do ESP32
- `keepalive`: Ping enviado a cada 30 segundos para manter a conexão ativa

**Uso com curl:**

```bash
curl -N http://localhost:3000/api/vision/stream
```

**Uso com JavaScript:**

```javascript
const eventSource = new EventSource("http://localhost:3000/api/vision/stream");

eventSource.addEventListener("detection", (event) => {
  const detection = JSON.parse(event.data);
  console.log("Nova detecção:", detection);
});

eventSource.addEventListener("keepalive", (event) => {
  console.log("Keepalive:", event.data);
});
```

#### GET /api/vision/history

Retorna histórico de detecções armazenadas no servidor.

**Query Parameters:**

| Parâmetro  | Tipo   | Obrigatório | Descrição                                                             |
| ---------- | ------ | ----------- | --------------------------------------------------------------------- |
| `limit`    | number | ❌ Não      | Quantas detecções retornar (padrão: 100, máximo configurável via env) |
| `moduleId` | string | ❌ Não      | Filtrar apenas detecções de um módulo específico (ex: "module-2")     |

**Exemplos:**

```bash
# Últimas 50 detecções de todos os módulos
curl http://localhost:3000/api/vision/history?limit=50

# Todas detecções do module-2
curl http://localhost:3000/api/vision/history?moduleId=module-2

# Últimas 10 detecções do module-2
curl http://localhost:3000/api/vision/history?limit=10&moduleId=module-2
```

#### GET /api/vision/statistics

Retorna estatísticas gerais do sistema de detecção.

**Dados retornados:**

- `totalDetections`: Total de detecções processadas desde que o servidor iniciou
- `activeModules`: Número de módulos ESP32 diferentes que enviaram detecções
- `modules`: Lista com IDs de todos os módulos ativos
- `lastDetection`: Informações sobre a última detecção recebida
- `averages`: Médias calculadas de objetos por detecção, FPS e memória livre

**Resposta:**

```json
{
  "status": "success",
  "data": {
    "totalDetections": 1234,
    "activeModules": 2,
    "modules": ["module-1", "module-2"],
    "lastDetection": {
      "timestamp": "2025-10-29T15:30:00.000Z",
      "moduleId": "module-2",
      "objectsCount": 3
    },
    "averages": {
      "objectsPerDetection": 2.5,
      "fps": 0.45,
      "freeHeap": 89456
    }
  }
}
```

#### DELETE /api/vision/history

Limpa todo o histórico de detecções armazenado na memória do servidor. Útil para resetar os dados durante testes ou manutenção.

**Resposta:** HTTP 204 No Content (sem corpo de resposta)

### 💚 Health Check

#### GET /api/health

Verifica status do servidor.

**Resposta:**

```json
{
  "status": "ok",
  "timestamp": "2025-10-29T15:30:00.000Z",
  "uptime": 3600,
  "memory": {
    "used": 45678901,
    "total": 536870912,
    "percentage": "8.51%"
  },
  "nodeVersion": "v20.11.0",
  "platform": "linux"
}
```

## 📚 Documentação Swagger

Acesse a documentação interativa em:

- **Local:** http://localhost:3000/api/docs
- **Rede:** http://192.168.100.11:3000/api/docs

A documentação Swagger permite testar todos os endpoints diretamente no navegador.

## 🔧 Configuração do ESP32

Configure o ESP32 para enviar dados para:

```cpp
const char* serverUrl = "http://192.168.100.11:3000/api/vision";
```

## 🎮 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm start:dev        # Modo watch com hot reload
pnpm start:debug      # Modo debug

# Produção
pnpm build            # Build da aplicação
pnpm start:prod       # Executar build de produção

# Docker
pnpm docker:build     # Construir imagem Docker
pnpm docker:up        # Subir containers
pnpm docker:down      # Parar containers
pnpm docker:logs      # Ver logs

# Testes
pnpm test             # Executar testes
pnpm test:watch       # Testes em modo watch
pnpm test:cov         # Cobertura de testes
```

## 🌍 Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```env
# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=*

# Application
APP_NAME=Vision API
APP_VERSION=1.0.0

# ESP32
ESP32_MAX_DETECTIONS_HISTORY=100
ESP32_STREAM_KEEPALIVE_INTERVAL=30000
```

## 📁 Estrutura do Projeto

```
nest-vision-api/
├── src/
│   ├── main.ts                 # Inicialização da aplicação
│   ├── app.module.ts           # Módulo principal
│   ├── vision/                 # Módulo de visão/detecção
│   │   ├── vision.module.ts
│   │   ├── vision.controller.ts
│   │   ├── vision.service.ts
│   │   ├── dto/                # Data Transfer Objects
│   │   │   ├── vision-detection.dto.ts
│   │   │   └── vision-response.dto.ts
│   │   └── entities/           # Entidades
│   │       └── vision-detection.entity.ts
│   └── health/                 # Módulo de health check
│       ├── health.module.ts
│       └── health.controller.ts
├── test/                       # Testes
├── dist/                       # Build de produção
├── Dockerfile                  # Imagem Docker
├── docker-compose.yml          # Orquestração Docker
├── tsconfig.json              # Configuração TypeScript
├── nest-cli.json              # Configuração NestJS
├── package.json               # Dependências
└── README.md                  # Documentação
```

## 🧪 Testando a API

### Teste com curl

```bash
# Health check
curl http://localhost:3000/api/health

# Enviar detecção
curl -X POST http://localhost:3000/api/vision \
  -H "Content-Type: application/json" \
  -d '{
    "moduleId": "module-2",
    "objects": [
      {
        "name": "pessoa",
        "confidence": 95,
        "description": "Uma pessoa à frente"
      }
    ],
    "metrics": {
      "freeHeap": 89456,
      "rssi": -67,
      "fps": 0.45
    }
  }'

# Ver histórico
curl http://localhost:3000/api/vision/history

# Ver estatísticas
curl http://localhost:3000/api/vision/statistics

# Streaming SSE
curl -N http://localhost:3000/api/vision/stream
```

### Teste com HTTPie

```bash
# Enviar detecção
http POST localhost:3000/api/vision \
  moduleId=module-2 \
  objects:='[{"name":"pessoa","confidence":95}]'

# Ver histórico
http GET localhost:3000/api/vision/history limit==10
```

## 🐛 Debugging

### Logs Docker

```bash
# Ver logs do container
docker-compose logs -f vision-api

# Logs das últimas 100 linhas
docker-compose logs --tail=100 vision-api
```

### Logs Aplicação

A aplicação usa o logger do NestJS. Configure o nível de log:

```typescript
// Em main.ts
app.useLogger(["log", "error", "warn", "debug", "verbose"]);
```

## 🔒 Segurança

Para produção, considere:

1. **CORS:** Configure origins específicas no `.env`

   ```env
   CORS_ORIGIN=https://seu-dominio.com
   ```

2. **Rate Limiting:** Adicione throttle para limitar requisições

3. **HTTPS:** Use nginx ou Caddy como proxy reverso

4. **Authentication:** Adicione JWT ou API keys se necessário

## 📊 Monitoramento

O sistema inclui:

- Health check endpoint (`/api/health`)
- Docker healthcheck automático
- Estatísticas de uso (`/api/vision/statistics`)
- Logs estruturados

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Autor

**Fabio Brasileiro**

## 🙏 Agradecimentos

Sistema desenvolvido para auxiliar pessoas com deficiência visual (PCD visual) através de tecnologia de detecção de objetos com ESP32-CAM.

---

**Dúvidas?** Consulte a [documentação Swagger](http://localhost:3000/api/docs) ou abra uma issue!
