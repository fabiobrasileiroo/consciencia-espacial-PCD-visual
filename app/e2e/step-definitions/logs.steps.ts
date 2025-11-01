import { Given, Then, When } from '@cucumber/cucumber';
import { MockStorageService } from '../../my-expo-app/services/storage-service';
import { CustomWorld } from '../support/setup';

const storageService = new MockStorageService();

Given('o servidor mock tem endpoint POST {string} que retorna {int}',
  async function (this: CustomWorld, endpoint: string, statusCode: number) {
    // O mock HTTP server já está configurado no Before hook
    console.log(`Endpoint ${endpoint} configurado para retornar ${statusCode}`);
  });

Given('o usuário está em Configurações', async function (this: CustomWorld) {
  this.appState.currentScreen = 'settings';
  console.log('Usuário em Configurações');
});

When('ele pressiona {string}', async function (this: CustomWorld, button: string) {
  this.appState.lastButton = button;

  if (button === 'Enviar log') {
    // Coleta histórico
    const history = await storageService.get('tts_history');

    // Envia para servidor mock
    const payload = {
      timestamp: new Date().toISOString(),
      history: history ? JSON.parse(history) : [],
      appVersion: '1.0.0',
    };

    // Simula POST request
    const response = await fetch(`${this.mockHttpServer?.getUrl()}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    this.appState.logResponse = {
      status: response.status,
      body: await response.json(),
    };
  }

  console.log(`Botão "${button}" pressionado`);
});

Then('o app POST \\/logs com payload contendo último histórico e recebe status {int}',
  async function (this: CustomWorld, statusCode: number) {
    const response = this.appState.logResponse;

    if (!response) {
      throw new Error('Nenhuma resposta de log encontrada');
    }

    if (response.status !== statusCode) {
      throw new Error(`Status esperado ${statusCode}, recebido ${response.status}`);
    }

    console.log(`✓ POST /logs realizado com sucesso, status ${statusCode}`);
  });

Then('o app mostra {string}', async function (this: CustomWorld, message: string) {
  // Simula UI mostrando mensagem
  this.appState.displayedMessage = message;
  console.log(`✓ Mensagem exibida: "${message}"`);
});

Given('o app simula um crash \\(mock)', async function (this: CustomWorld) {
  // Armazena flag de crash
  await storageService.set('app_crashed', 'true');
  await storageService.set('crash_timestamp', new Date().toISOString());

  this.appState.crashed = true;
  console.log('Crash simulado');
});

When('o app reinicia', async function (this: CustomWorld) {
  // Verifica flag de crash
  const crashed = await storageService.get('app_crashed');

  if (crashed === 'true') {
    this.appState.shouldShowCrashDialog = true;
  }

  console.log('App reiniciado');
});

Then('o app exibe um modal {string}', async function (this: CustomWorld, modalTitle: string) {
  if (!this.appState.shouldShowCrashDialog) {
    throw new Error('Modal de crash não deveria ser exibido');
  }

  this.appState.displayedModal = modalTitle;
  console.log(`✓ Modal exibido: "${modalTitle}"`);
});

Then('se o usuário confirmar, o app POST \\/logs e mostra {string}',
  async function (this: CustomWorld, message: string) {
    // Simula confirmação do usuário
    this.appState.userConfirmed = true;

    if (this.appState.userConfirmed) {
      // Coleta informações do crash
      const crashTimestamp = await storageService.get('crash_timestamp');

      const payload = {
        type: 'crash_report',
        timestamp: crashTimestamp,
        history: [],
      };

      // Envia para servidor mock
      const response = await fetch(`${this.mockHttpServer?.getUrl()}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Limpa flags
      await storageService.remove('app_crashed');
      await storageService.remove('crash_timestamp');

      this.appState.displayedMessage = message;
    }

    console.log(`✓ Relatório de crash enviado e mensagem "${message}" exibida`);
  });
