# Makefile para facilitar comandos Docker
# Sistema de Detecção de Objetos - InovaTech 2025

.PHONY: help build up down restart logs ps clean test health shell

# Variáveis
COMPOSE = docker-compose
SERVICE = vision-streaming
SERVICE_BASIC = vision-basic

help: ## Mostrar esta ajuda
	@echo "📋 Comandos disponíveis:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

build: ## Construir imagem Docker
	@echo "🔨 Construindo imagem..."
	$(COMPOSE) build

up: ## Iniciar servidor principal (vision-streaming)
	@echo "🚀 Iniciando vision-streaming..."
	$(COMPOSE) up -d $(SERVICE)
	@echo "✅ Servidor rodando em http://localhost:3000"
	@echo "📚 Swagger: http://localhost:3000/api/docs"
	@echo "📡 SSE: http://localhost:3000/api/stream/events"

up-all: ## Iniciar todos os servidores (streaming + basic)
	@echo "🚀 Iniciando todos os servidores..."
	$(COMPOSE) --profile full up -d
	@echo "✅ vision-streaming: http://localhost:3000"
	@echo "✅ vision-basic: http://localhost:3001"

down: ## Parar e remover containers
	@echo "🛑 Parando containers..."
	$(COMPOSE) down

stop: ## Parar containers (sem remover)
	@echo "⏸️  Parando containers..."
	$(COMPOSE) stop

start: ## Iniciar containers existentes
	@echo "▶️  Iniciando containers..."
	$(COMPOSE) start

restart: ## Reiniciar containers
	@echo "🔄 Reiniciando containers..."
	$(COMPOSE) restart $(SERVICE)

rebuild: ## Reconstruir e reiniciar
	@echo "🔨 Reconstruindo..."
	$(COMPOSE) build --no-cache
	@echo "🚀 Reiniciando..."
	$(COMPOSE) up -d $(SERVICE)

logs: ## Ver logs (Ctrl+C para sair)
	@echo "📜 Logs do vision-streaming:"
	$(COMPOSE) logs -f $(SERVICE)

logs-all: ## Ver logs de todos os servidores
	@echo "📜 Logs de todos os servidores:"
	$(COMPOSE) logs -f

logs-basic: ## Ver logs do vision-basic
	@echo "📜 Logs do vision-basic:"
	$(COMPOSE) logs -f $(SERVICE_BASIC)

ps: ## Ver status dos containers
	@echo "📊 Status dos containers:"
	$(COMPOSE) ps

stats: ## Ver uso de CPU/RAM
	@echo "📈 Uso de recursos:"
	docker stats vision-streaming

health: ## Verificar saúde do servidor
	@echo "🏥 Verificando saúde..."
	@curl -s http://localhost:3000/health && echo "" || echo "❌ Servidor não respondeu"
	@echo ""
	@echo "📊 Status completo:"
	@curl -s http://localhost:3000/api/system/status | jq '.' 2>/dev/null || curl -s http://localhost:3000/api/system/status

test: ## Testar endpoints principais
	@echo "🧪 Testando endpoints..."
	@echo ""
	@echo "1️⃣ Health:"
	@curl -s http://localhost:3000/health && echo "" || echo "❌ Falhou"
	@echo ""
	@echo "2️⃣ ESP32-CAM:"
	@curl -s http://localhost:3000/api/esp32/test | jq '.status' 2>/dev/null || echo "⚠️  Não conectado"
	@echo ""
	@echo "3️⃣ Detecções atuais:"
	@curl -s http://localhost:3000/api/detections/current | jq '.count' 2>/dev/null || echo "⚠️  Erro"
	@echo ""

test-sse: ## Testar SSE (Ctrl+C para sair)
	@echo "📡 Conectando ao SSE..."
	@echo "Aguardando eventos..."
	curl -N http://localhost:3000/api/stream/events

shell: ## Abrir bash no container
	@echo "🐚 Abrindo shell no container..."
	docker exec -it vision-streaming bash

node: ## Abrir Node REPL no container
	@echo "📝 Abrindo Node REPL..."
	docker exec -it vision-streaming node

clean: ## Remover containers, imagens e volumes
	@echo "🧹 Limpando..."
	$(COMPOSE) down -v
	docker image prune -f

clean-all: ## Limpeza completa (CUIDADO!)
	@echo "⚠️  LIMPEZA COMPLETA - Removendo TUDO..."
	@read -p "Tem certeza? [y/N] " -n 1 -r; \
	echo ""; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		$(COMPOSE) down -v; \
		docker system prune -af --volumes; \
		echo "✅ Limpeza completa realizada"; \
	else \
		echo "❌ Cancelado"; \
	fi

swagger: ## Abrir Swagger UI no navegador
	@echo "📚 Abrindo Swagger UI..."
	xdg-open http://localhost:3000/api/docs 2>/dev/null || open http://localhost:3000/api/docs 2>/dev/null || echo "Abra: http://localhost:3000/api/docs"

viewer: ## Abrir interface HTML
	@echo "🖥️  Abrindo viewer..."
	xdg-open http://localhost:3000/viewer.html 2>/dev/null || open http://localhost:3000/viewer.html 2>/dev/null || echo "Abra: http://localhost:3000/viewer.html"

sse-html: ## Abrir teste SSE HTML
	@echo "📡 Abrindo teste SSE..."
	xdg-open http://localhost:3000/test-sse.html 2>/dev/null || open http://localhost:3000/test-sse.html 2>/dev/null || echo "Abra: http://localhost:3000/test-sse.html"

backup-logs: ## Fazer backup dos logs
	@echo "💾 Fazendo backup dos logs..."
	@mkdir -p backups
	$(COMPOSE) logs --no-color > backups/logs-$(shell date +%Y%m%d-%H%M%S).log
	@echo "✅ Backup salvo em backups/"

install-docker: ## Instalar Docker e Docker Compose (Ubuntu)
	@echo "📦 Instalando Docker..."
	sudo apt update
	sudo apt install -y docker.io docker-compose
	sudo usermod -aG docker $$USER
	@echo "✅ Docker instalado!"
	@echo "⚠️  Faça logout e login novamente para usar Docker sem sudo"

update: ## Atualizar código e reiniciar
	@echo "🔄 Atualizando..."
	git pull
	$(COMPOSE) build
	$(COMPOSE) up -d $(SERVICE)
	@echo "✅ Atualizado!"

# Atalhos rápidos
start-streaming: up ## Alias para 'up'
start-all: up-all ## Alias para 'up-all'
l: logs ## Atalho para logs
h: health ## Atalho para health
s: shell ## Atalho para shell

# Default
.DEFAULT_GOAL := help
