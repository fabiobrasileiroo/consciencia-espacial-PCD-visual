/**
 * 🧪 TESTE WEBSOCKET SIMPLES
 */

const WebSocket = require('ws');

console.log('🔌 Conectando ao WebSocket...\n');

// Criar cliente WebSocket
const ws = new WebSocket('ws://localhost:3000/esp32', {
  perMessageDeflate: false
});

ws.on('open', function open() {
  console.log('✅ CONECTADO AO SERVIDOR!\n');

  // Enviar identificação
  const msg = {
    type: 'identify',
    deviceId: 'NODE-TEST',
    mac: '00:00:00:00:00:00',
    timestamp: Date.now()
  };

  console.log('📤 Enviando:', JSON.stringify(msg, null, 2));
  ws.send(JSON.stringify(msg));
});

ws.on('message', function message(data) {
  console.log('\n📥 Recebido do servidor:');
  try {
    const parsed = JSON.parse(data.toString());
    console.log(JSON.stringify(parsed, null, 2));
  } catch (err) {
    console.log(data.toString());
  }

  // Fechar após receber primeira mensagem
  setTimeout(() => {
    console.log('\n✅ TESTE COMPLETO - WebSocket funcionando!\n');
    ws.close();
    process.exit(0);
  }, 2000);
});

ws.on('error', function error(err) {
  console.error('❌ ERRO:', err.message);
  process.exit(1);
});

ws.on('close', function close() {
  console.log('🔌 Conexão fechada');
});

// Timeout de segurança
setTimeout(() => {
  console.log('⏱️  Timeout - servidor não respondeu');
  process.exit(1);
}, 10000);
