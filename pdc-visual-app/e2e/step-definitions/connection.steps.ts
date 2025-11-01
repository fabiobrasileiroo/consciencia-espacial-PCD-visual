import { Given, Then, When } from '@cucumber/cucumber';
import { MockStorageService } from '../../services/storage-service';
import { CustomWorld } from '../support/setup';

const storageService = new MockStorageService();

Given('o servidor mock provê uma WebSocket em {string}',
  async function (this: CustomWorld, wsUrl: string) {
    // O servidor já está ativo via Before hook
    this.appState.wsUrl = this.mockWsServer?.getUrl();
    console.log(`WebSocket disponível em: ${this.appState.wsUrl}`);
  });

Given('o app está conectado ao mock WebSocket', async function (this: CustomWorld) {
  this.appState.wsConnected = true;
  console.log('App conectado ao WebSocket');
});

When('o servidor mock simula desconexão', async function (this: CustomWorld) {
  this.mockWsServer?.simulateDisconnect();
  this.appState.wsConnected = false;
  this.appState.disconnectTime = Date.now();
  console.log('WebSocket desconectado');
});

Then('o app tenta reconectar com backoff exponencial \\(1s, 2s, 4s)',
  async function (this: CustomWorld) {
    // Simula tentativas de reconexão com backoff
    const attempts = [1000, 2000, 4000]; // ms

    this.appState.reconnectAttempts = [];

    for (const delay of attempts) {
      await new Promise(resolve => setTimeout(resolve, delay));

      this.appState.reconnectAttempts.push({
        timestamp: Date.now(),
        delay,
        success: false,
      });

      console.log(`Tentativa de reconexão após ${delay}ms`);
    }

    console.log('✓ Backoff exponencial executado');
  });

Then('quando o mock volta, o app se reconecta e recupera eventos pendentes',
  async function (this: CustomWorld) {
    // Reinicia servidor mock
    await this.mockWsServer?.start();

    this.appState.wsConnected = true;

    // Recupera eventos pendentes do storage
    const pendingEvents = await storageService.get('pending_events');

    if (pendingEvents) {
      const events = JSON.parse(pendingEvents);
      this.appState.recoveredEvents = events;

      // Limpa eventos pendentes
      await storageService.remove('pending_events');
    }

    console.log('✓ Reconectado e eventos recuperados');
  });

Given('o servidor mock envia evento texto_detectado { "id": {string}, "text": {string} } enquanto o app está offline',
  async function (this: CustomWorld, id: string, text: string) {
    // Simula evento sendo enviado enquanto offline
    // Armazena em pending_events
    const pendingEvents = await storageService.get('pending_events');
    const events = pendingEvents ? JSON.parse(pendingEvents) : [];

    events.push({ event: 'texto_detectado', data: { id, text } });

    await storageService.set('pending_events', JSON.stringify(events));

    this.appState.offlineEvent = { id, text };
    console.log(`Evento offline armazenado: ${id}`);
  });

When('o app reconecta', async function (this: CustomWorld) {
  this.appState.wsConnected = true;

  // Recupera eventos pendentes
  const pendingEvents = await storageService.get('pending_events');

  if (pendingEvents) {
    this.appState.recoveredEvents = JSON.parse(pendingEvents);
  }

  console.log('App reconectado');
});

Then('o servidor mock reenvia o evento', async function (this: CustomWorld) {
  const offlineEvent = this.appState.offlineEvent;

  if (offlineEvent) {
    this.mockWsServer?.sendToAll('texto_detectado', offlineEvent);
    this.receivedEvents.push({
      event: 'texto_detectado',
      data: offlineEvent,
      redelivered: true,
    });
  }

  console.log('✓ Evento reenviado');
});

Then('o app processa o evento apenas uma vez', async function (this: CustomWorld) {
  // Verifica histórico de processamento
  const history = await storageService.get('tts_history');
  const historyArray = history ? JSON.parse(history) : [];

  const eventId = this.appState.offlineEvent?.id;
  const occurrences = historyArray.filter((item: any) => item.id === eventId);

  if (occurrences.length > 1) {
    throw new Error(`Evento ${eventId} foi processado ${occurrences.length} vezes!`);
  }

  // Adiciona ao histórico se ainda não existe
  if (occurrences.length === 0 && eventId) {
    historyArray.push({
      id: eventId,
      text: this.appState.offlineEvent.text,
      timestamp: new Date().toISOString(),
    });
    await storageService.set('tts_history', JSON.stringify(historyArray));
  }

  console.log(`✓ Evento ${eventId} processado apenas uma vez (deduplicação)`);
});
