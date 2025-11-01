const WebSocket = require('ws');
const express = require('express');

const app = express();
const PORT = 3001;

// Criar servidor HTTP
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor HTTP rodando na porta ${PORT}`);
});

// Criar servidor WebSocket
const wss = new WebSocket.Server({ server });

// Lista de clientes conectados
const clients = new Set();

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`✅ Cliente conectado: ${clientIp}`);

  clients.add(ws);

  // Enviar mensagem de boas-vindas
  ws.send(JSON.stringify({
    type: 'status',
    data: {
      message: 'Conectado ao servidor de detecção de objetos',
      clientCount: clients.size
    },
    timestamp: new Date().toISOString()
  }));

  // Contadores para estatísticas
  let temperatureValue = 25;
  let warningCount = 0;
  let usageTime = 0;

  // Função auxiliar para enviar mensagem com segurança
  const safeSend = (message) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        const jsonString = JSON.stringify(message);
        ws.send(jsonString);
        return true;
      } catch (error) {
        console.error(`Erro ao enviar mensagem:`, error.message);
        return false;
      }
    }
    return false;
  };

  // Simular detecções periódicas (mock) - a cada 5 segundos
  const detectionInterval = setInterval(() => {
    const mockObjects = [
      'Pessoa à frente',
      'Carro se aproximando',
      'Obstáculo baixo detectado',
      'Poste à direita',
      'Escada à esquerda',
      'Porta aberta',
      'Cadeira próxima',
      'Mesa ao lado',
      'Parede à frente',
      'Degrau detectado',
      'Bicicleta se aproximando',
      'Cachorro próximo',
      'Moto na calçada',
      'Buraco à frente',
      'Árvore bloqueando caminho'
    ];

    const randomObject = mockObjects[Math.floor(Math.random() * mockObjects.length)];
    const randomDistance = (Math.random() * 5 + 0.5).toFixed(2);
    const randomConfidence = (Math.random() * 0.3 + 0.7).toFixed(2);

    const detection = {
      type: 'detection',
      data: {
        text: randomObject,
        distance: parseFloat(randomDistance),
        confidence: parseFloat(randomConfidence),
        direction: Math.random() > 0.5 ? 'front' : 'side'
      },
      timestamp: new Date().toISOString()
    };

    if (safeSend(detection)) {
      console.log(`📡 Enviado para ${clientIp}: ${randomObject}`);
    }
  }, 5000); // Enviar a cada 5 segundos

  // Atualizar estatísticas - a cada 3 segundos (envia TODAS as stats juntas)
  const statsInterval = setInterval(() => {
    // Variar temperatura entre 20°C e 40°C
    temperatureValue = Math.floor(Math.random() * 20 + 20);

    // Incrementar avisos aleatoriamente (0 a 2 novos avisos)
    const newWarnings = Math.floor(Math.random() * 3);
    if (newWarnings > 0) {
      warningCount += newWarnings;
    }

    // Incrementar tempo de uso em minutos
    usageTime += Math.floor(Math.random() * 3 + 1); // 1-3 minutos a cada atualização
    const hours = Math.floor(usageTime / 60);
    const minutes = usageTime % 60;

    const statsUpdate = {
      type: 'stats-temp',
      data: {
        temperature: temperatureValue
      },
      timestamp: new Date().toISOString()
    };

    const warningUpdate = {
      type: 'stats-warnings',
      data: {
        warnings: warningCount
      },
      timestamp: new Date().toISOString()
    };

    const timeUpdate = {
      type: 'stats-usage',
      data: {
        usageTime: `${hours}h ${minutes}min`
      },
      timestamp: new Date().toISOString()
    };

    // Enviar cada stat separadamente para processamento individual
    if (safeSend(statsUpdate)) {
      console.log(`🌡️  Temperatura para ${clientIp}: ${temperatureValue}°C`);
    }

    if (safeSend(warningUpdate)) {
      console.log(`⚠️  Avisos para ${clientIp}: ${warningCount}`);
    }

    if (safeSend(timeUpdate)) {
      console.log(`⏱️  Tempo de uso para ${clientIp}: ${hours}h ${minutes}min`);
    }
  }, 3000);

  // Receber mensagens do cliente
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`📥 Mensagem recebida de ${clientIp}:`, data);

      // Se for um teste, responder com confirmação
      if (data.type === 'test') {
        safeSend({
          type: 'transcription',
          data: {
            text: `Teste recebido: "${data.data.text}"`,
            status: 'processed'
          },
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error.message);
    }
  });

  // Cliente desconectou
  ws.on('close', () => {
    clearInterval(detectionInterval);
    clearInterval(statsInterval);
    clients.delete(ws);
    console.log(`❌ Cliente desconectado: ${clientIp}`);
    console.log(`👥 Clientes ativos: ${clients.size}`);
  });

  // Erro na conexão
  ws.on('error', (error) => {
    console.error(`⚠️ Erro com cliente ${clientIp}:`, error.message);
  });
});

// Rota de status HTTP
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    clients: clients.size,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

console.log(`
╔══════════════════════════════════════════════════════════╗
║  🌐 Servidor WebSocket de Teste                         ║
║                                                          ║
║  WebSocket: ws://localhost:${PORT}                        ║
║  HTTP Status: http://localhost:${PORT}/status             ║
║  Health: http://localhost:${PORT}/health                  ║
║                                                          ║
║  💡 Dica: Use o IP da sua máquina para testar no app   ║
║  Exemplo: ws://192.168.1.100:${PORT}                      ║
╚══════════════════════════════════════════════════════════╝
`);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Desligando servidor...');
  wss.close(() => {
    server.close(() => {
      console.log('✅ Servidor encerrado');
      process.exit(0);
    });
  });
});
