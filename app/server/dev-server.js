#!/usr/bin/env node

/**
 * Servidor WebSocket de Desenvolvimento para PDC Visual
 * 
 * Este servidor simula o backend do PDC Visual para testes.
 * Envia mensagens de exemplo para testar TTS, haptics e histórico.
 */

const WebSocket = require('ws');
const http = require('http');

const PORT = 8080;

// Criar servidor HTTP
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('PDC Visual WebSocket Server está rodando!\n');
});

// Criar servidor WebSocket
const wss = new WebSocket.Server({ server });

let clientCounter = 0;

wss.on('connection', (ws) => {
  const clientId = ++clientCounter;
  console.log(`\n[${new Date().toLocaleTimeString()}] ✅ Cliente #${clientId} conectado`);
  console.log(`Total de clientes conectados: ${wss.clients.size}`);

  // Enviar mensagem de boas-vindas
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    data: {
      message: 'Conectado ao servidor PDC Visual!',
      timestamp: new Date().toISOString()
    }
  }));

  // Enviar mensagens de teste periodicamente
  const intervals = [];

  // 1. Enviar texto detectado a cada 10 segundos
  const textInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      const texts = [
        'Obstáculo à frente',
        'Atenção: Pedestre próximo',
        'Cuidado: Buraco na via',
        'Alerta: Veículo aproximando',
        'Aviso: Mudança de elevação',
        'Perigo: Objeto na pista'
      ];

      const randomText = texts[Math.floor(Math.random() * texts.length)];
      const message = {
        type: 'TEXT_DETECTED',
        data: {
          id: `msg-${Date.now()}`,
          text: randomText,
          confidence: 0.95,
          timestamp: new Date().toISOString()
        }
      };

      ws.send(JSON.stringify(message));
      console.log(`[${new Date().toLocaleTimeString()}] 📤 Enviado para #${clientId}: "${randomText}"`);
    }
  }, 10000);
  intervals.push(textInterval);

  // 2. Enviar alertas de distância a cada 15 segundos
  const distanceInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      const levels = ['warning', 'danger'];
      const level = levels[Math.floor(Math.random() * levels.length)];
      const distance = level === 'danger' ? 0.3 : 0.8;

      const message = {
        type: 'DISTANCE_ALERT',
        data: {
          level: level,
          distance: distance,
          timestamp: new Date().toISOString()
        }
      };

      ws.send(JSON.stringify(message));
      console.log(`[${new Date().toLocaleTimeString()}] ⚠️  Enviado para #${clientId}: Alerta ${level.toUpperCase()} (${distance}m)`);
    }
  }, 15000);
  intervals.push(distanceInterval);

  // 3. Enviar status de bateria a cada 20 segundos
  const batteryInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      const level = Math.floor(Math.random() * 100);
      const isCharging = Math.random() > 0.5;

      const message = {
        type: 'BATTERY_STATUS',
        data: {
          level: level,
          isCharging: isCharging,
          timestamp: new Date().toISOString()
        }
      };

      ws.send(JSON.stringify(message));
      console.log(`[${new Date().toLocaleTimeString()}] 🔋 Enviado para #${clientId}: Bateria ${level}% ${isCharging ? '(carregando)' : ''}`);
    }
  }, 20000);
  intervals.push(batteryInterval);

  // Receber mensagens do cliente
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`[${new Date().toLocaleTimeString()}] 📥 Recebido de #${clientId}:`, message);

      // Responder ao cliente
      ws.send(JSON.stringify({
        type: 'ACK',
        data: {
          received: message.type,
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error(`[${new Date().toLocaleTimeString()}] ❌ Erro ao processar mensagem de #${clientId}:`, error.message);
    }
  });

  // Tratar desconexão
  ws.on('close', () => {
    console.log(`[${new Date().toLocaleTimeString()}] 👋 Cliente #${clientId} desconectado`);
    console.log(`Total de clientes conectados: ${wss.clients.size}`);

    // Limpar intervalos
    intervals.forEach(interval => clearInterval(interval));
  });

  // Tratar erros
  ws.on('error', (error) => {
    console.error(`[${new Date().toLocaleTimeString()}] ❌ Erro no cliente #${clientId}:`, error.message);
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚀 PDC Visual - Servidor WebSocket de Desenvolvimento');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`\n✅ Servidor rodando na porta ${PORT}`);
  console.log(`\n📡 URLs disponíveis:`);
  console.log(`   - HTTP:      http://localhost:${PORT}`);
  console.log(`   - WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`\n📱 Para conectar do celular na mesma rede Wi-Fi:`);

  // Listar IPs locais
  const os = require('os');
  const interfaces = os.networkInterfaces();
  Object.keys(interfaces).forEach(name => {
    interfaces[name].forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`   - ws://${iface.address}:${PORT}/ws`);
      }
    });
  });

  console.log(`\n📋 Mensagens enviadas automaticamente:`);
  console.log(`   - Texto detectado: a cada 10 segundos`);
  console.log(`   - Alerta de distância: a cada 15 segundos`);
  console.log(`   - Status da bateria: a cada 20 segundos`);
  console.log(`\n⏹  Pressione Ctrl+C para parar o servidor\n`);
  console.log('═══════════════════════════════════════════════════════════════\n');
});

// Tratar encerramento gracioso
process.on('SIGINT', () => {
  console.log('\n\n🛑 Encerrando servidor...');
  wss.clients.forEach((client) => {
    client.close();
  });
  server.close(() => {
    console.log('✅ Servidor encerrado com sucesso!');
    process.exit(0);
  });
});

// Tratar erros não capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
});
