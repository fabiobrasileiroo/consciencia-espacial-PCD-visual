/**
 * 🧪 TESTE WEBSOCKET COM DEBUG COMPLETO
 */

const WebSocket = require('ws');

console.log('🔌 Testando WebSocket...\n');

const ws = new WebSocket('ws://localhost:3000/esp32');

ws.on('open', () => {
  console.log('✅ CONECTADO!');

  const msg = JSON.stringify({
    type: 'identify',
    deviceId: 'TEST',
    mac: '00:00:00:00:00:00',
    timestamp: Date.now()
  });

  console.log('📤 Enviando:', msg);
  ws.send(msg);
});

ws.on('message', (data) => {
  console.log('📥 Recebido:', data.toString());
  setTimeout(() => {
    console.log('\n✅ SUCESSO! WebSocket funcionando perfeitamente!\n');
    process.exit(0);
  }, 1000);
});

ws.on('error', (err) => {
  console.error('❌ ERRO:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

ws.on('close', () => {
  console.log('🔌 Fechado');
});

setTimeout(() => {
  console.log('⏱️  Timeout');
  process.exit(1);
}, 5000);
