#!/usr/bin/env node
/**
 * 🧪 Script de Teste - SSE (Server-Sent Events)
 * 
 * Conecta ao servidor Node.js e monitora eventos em tempo real:
 * - Atualizações do sensor de distância
 * - Alertas de perigo
 * - Status dos módulos ESP32
 */

const EventSource = require('eventsource');
const chalk = require('chalk');

// Configuração
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const SSE_ENDPOINT = `${SERVER_URL}/api/stream/events`;

console.log(chalk.blue.bold('\n╔════════════════════════════════════════╗'));
console.log(chalk.blue.bold('║  🧪 TESTE SSE - Monitor de Eventos    ║'));
console.log(chalk.blue.bold('╚════════════════════════════════════════╝\n'));

console.log(chalk.cyan(`📡 Conectando a: ${SSE_ENDPOINT}\n`));

// Criar conexão SSE
const eventSource = new EventSource(SSE_ENDPOINT);

// Evento: Conexão estabelecida
eventSource.onopen = () => {
  console.log(chalk.green('✅ Conectado ao servidor!'));
  console.log(chalk.gray('   Aguardando eventos...\n'));
};

// Evento: sensor-update
eventSource.addEventListener('sensor-update', (event) => {
  try {
    const data = JSON.parse(event.data);

    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.yellow.bold('📏 SENSOR UPDATE'));
    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.white(`   Distância: ${chalk.bold(data.distance + ' cm')}`));
    console.log(chalk.white(`   Nível: ${getLevelColor(data.alertLevel)}`));
    console.log(chalk.white(`   Vibração: ${getVibrationBar(data.vibrationLevel)}`));
    console.log(chalk.white(`   Mensagem: ${data.alertMsg || 'N/A'}`));
    console.log(chalk.white(`   RSSI: ${data.rssi || 'N/A'} dBm`));
    console.log(chalk.gray(`   Timestamp: ${new Date(data.timestamp).toLocaleTimeString()}`));
    console.log('');
  } catch (err) {
    console.error(chalk.red('❌ Erro ao processar sensor-update:'), err);
  }
});

// Evento: alert
eventSource.addEventListener('alert', (event) => {
  try {
    const data = JSON.parse(event.data);

    console.log(chalk.red('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.red.bold('🚨 ALERTA'));
    console.log(chalk.red('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.white(`   Tipo: ${getAlertIcon(data.type)} ${chalk.bold(data.type.toUpperCase())}`));
    console.log(chalk.white(`   Mensagem: ${data.message}`));
    console.log(chalk.white(`   Distância: ${data.distance} cm`));
    console.log(chalk.gray(`   Timestamp: ${new Date(data.timestamp).toLocaleTimeString()}`));
    console.log('');
  } catch (err) {
    console.error(chalk.red('❌ Erro ao processar alert:'), err);
  }
});

// Evento: esp32-status
eventSource.addEventListener('esp32-status', (event) => {
  try {
    const data = JSON.parse(event.data);

    console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.blue.bold(`📊 STATUS - ${data.module.toUpperCase()}`));
    console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.white(`   Conectado: ${data.connected ? chalk.green('✅ SIM') : chalk.red('❌ NÃO')}`));

    if (data.distance !== undefined) {
      console.log(chalk.white(`   Distância: ${data.distance} cm`));
    }
    if (data.vibrationLevel !== undefined) {
      console.log(chalk.white(`   Vibração: ${getVibrationBar(data.vibrationLevel)}`));
    }
    if (data.rssi !== undefined) {
      console.log(chalk.white(`   RSSI: ${data.rssi} dBm`));
    }
    if (data.frameCount !== undefined) {
      console.log(chalk.white(`   Frames: ${data.frameCount}`));
    }

    console.log(chalk.gray(`   Timestamp: ${new Date(data.timestamp).toLocaleTimeString()}`));
    console.log('');
  } catch (err) {
    console.error(chalk.red('❌ Erro ao processar esp32-status:'), err);
  }
});

// Evento: detection (detecções de objetos)
eventSource.addEventListener('detection', (event) => {
  try {
    const data = JSON.parse(event.data);

    console.log(chalk.magenta('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.magenta.bold('🎯 DETECÇÃO DE OBJETOS'));
    console.log(chalk.magenta('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.white(`   Descrição: ${data.description || 'N/A'}`));
    console.log(chalk.white(`   Objetos: ${data.count || 0}`));

    if (data.objects && data.objects.length > 0) {
      data.objects.forEach((obj, i) => {
        console.log(chalk.white(`     ${i + 1}. ${obj.name} (${obj.confidence}%)`));
      });
    }

    console.log(chalk.gray(`   Timestamp: ${new Date(data.timestamp).toLocaleTimeString()}`));
    console.log('');
  } catch (err) {
    console.error(chalk.red('❌ Erro ao processar detection:'), err);
  }
});

// Evento: Erro
eventSource.onerror = (err) => {
  if (eventSource.readyState === EventSource.CLOSED) {
    console.error(chalk.red('\n❌ Conexão SSE fechada!'));
    console.log(chalk.yellow('   Tentando reconectar...\n'));
  } else {
    console.error(chalk.red('❌ Erro SSE:'), err);
  }
};

// Tratamento de sinais para encerramento
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 Encerrando monitor...'));
  eventSource.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  eventSource.close();
  process.exit(0);
});

// ===== FUNÇÕES AUXILIARES =====

function getLevelColor(level) {
  switch (level) {
    case 'danger':
      return chalk.red.bold('🔴 PERIGO');
    case 'warning':
      return chalk.yellow.bold('🟡 ATENÇÃO');
    case 'caution':
      return chalk.green('🟢 CUIDADO');
    case 'safe':
      return chalk.gray('⚪ SEGURO');
    default:
      return chalk.gray(level);
  }
}

function getVibrationBar(level) {
  const maxLevel = 3;
  const bars = '█'.repeat(level) + '░'.repeat(maxLevel - level);

  let color = chalk.gray;
  if (level === 3) color = chalk.red;
  else if (level === 2) color = chalk.yellow;
  else if (level === 1) color = chalk.green;

  return color(`${bars} (${level}/${maxLevel})`);
}

function getAlertIcon(type) {
  switch (type) {
    case 'danger':
      return '🔴';
    case 'warning':
      return '🟡';
    case 'info':
      return '🔵';
    default:
      return '⚪';
  }
}

console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
console.log(chalk.cyan('💡 Dica: Pressione Ctrl+C para encerrar\n'));
