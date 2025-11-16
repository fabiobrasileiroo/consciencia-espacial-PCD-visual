/**
 * 🧪 TESTE WEBSOCKET - Verificar se servidor está respondendo
 * 
 * Execute: node test-websocket.js
 */

const WebSocket = require('ws');

console.log('🧪 Iniciando teste de WebSocket...\n');

// Configurar endereços para testar
const endpoints = [
  'ws://192.168.100.11:3000/esp32',
  'ws://localhost:3000/esp32',
  'ws://127.0.0.1:3000/esp32'
];

let testIndex = 0;

function testEndpoint(url) {
  console.log(`\n📡 Testando: ${url}`);
  console.log('═'.repeat(50));

  const ws = new WebSocket(url);

  const timeout = setTimeout(() => {
    console.log('⏱️  Timeout: Servidor não respondeu em 5s');
    ws.close();
    testNext();
  }, 5000);

  ws.on('open', () => {
    clearTimeout(timeout);
    console.log('✅ CONECTADO ao servidor!');

    // Enviar mensagem de identificação
    const message = {
      type: 'identify',
      deviceId: 'TEST-CLIENT',
      mac: '00:00:00:00:00:00',
      timestamp: Date.now()
    };

    console.log('📤 Enviando:', JSON.stringify(message));
    ws.send(JSON.stringify(message));
  });

  ws.on('message', (data) => {
    console.log('📥 Resposta recebida:', data.toString());

    // Enviar comando de teste
    setTimeout(() => {
      const testCommand = {
        type: 'test',
        message: 'Teste de comunicação bidirecional'
      };
      console.log('📤 Enviando teste:', JSON.stringify(testCommand));
      ws.send(JSON.stringify(testCommand));

      // Fechar após 2s
      setTimeout(() => {
        console.log('\n✅ TESTE COMPLETO - WebSocket funcionando perfeitamente!');
        ws.close();
        process.exit(0);
      }, 2000);
    }, 1000);
  });

  ws.on('error', (err) => {
    clearTimeout(timeout);
    console.log('❌ ERRO:', err.message);
    testNext();
  });

  ws.on('close', () => {
    console.log('🔌 Conexão fechada');
  });
}

function testNext() {
  testIndex++;
  if (testIndex < endpoints.length) {
    testEndpoint(endpoints[testIndex]);
  } else {
    console.log('\n\n❌ TODOS OS ENDPOINTS FALHARAM');
    console.log('═'.repeat(50));
    console.log('\n🔧 Possíveis problemas:');
    console.log('   1. Servidor não está rodando');
    console.log('   2. Porta 3000 bloqueada por firewall');
    console.log('   3. Servidor rodando em IP diferente\n');
    console.log('💡 Solução:');
    console.log('   - Certifique-se que o servidor está rodando:');
    console.log('     node server-vision-no-coco.js\n');
    console.log('   - Verifique os logs do servidor para ver o IP correto\n');
    process.exit(1);
  }
}

// Iniciar teste
testEndpoint(endpoints[testIndex]);
