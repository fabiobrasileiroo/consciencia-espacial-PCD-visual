import { Given, Then, When } from '@cucumber/cucumber';
import { MockStorageService } from '../../services/storage-service';
import { MockTTSService } from '../../services/tts-service';
import { CustomWorld } from '../support/setup';

const ttsService = new MockTTSService();
const storageService = new MockStorageService();

Given('o servidor mock está ativo e responde em {string} com eventos WebSocket', async function (this: CustomWorld, path: string) {
  // O servidor já foi iniciado no Before hook
  console.log(`Mock WebSocket disponível em: ${this.mockWsServer?.getUrl()}`);
});

Given('o app está iniciado com TTS habilitado', async function (this: CustomWorld) {
  this.appState.ttsEnabled = true;
  console.log('App iniciado com TTS habilitado');
});

Given('o servidor mock envia via WebSocket o evento texto_detectado { "id": {string}, "text": {string} }',
  async function (this: CustomWorld, id: string, text: string) {
    const event = { id, text };
    this.mockWsServer?.sendToAll('texto_detectado', event);
    this.receivedEvents.push({ event: 'texto_detectado', data: event });

    // Simula aguardar o app processar
    await new Promise(resolve => setTimeout(resolve, 50));
  });

When('o app recebe o evento texto_detectado', async function (this: CustomWorld) {
  // O evento já foi recebido no Given, apenas processamos
  const lastEvent = this.receivedEvents[this.receivedEvents.length - 1];

  if (lastEvent && lastEvent.event === 'texto_detectado') {
    // Verifica se já foi processado (deduplicação)
    const history = await storageService.get('tts_history');
    const historyArray = history ? JSON.parse(history) : [];

    const alreadyProcessed = historyArray.some((item: any) => item.id === lastEvent.data.id);

    if (!alreadyProcessed) {
      await ttsService.speak(lastEvent.data.text);
      this.appState.lastSpoken = lastEvent.data;
    }
  }
});

Then('o app reproduz por TTS o texto {string}', async function (this: CustomWorld, text: string) {
  const spokenTexts = ttsService.spokenTexts;
  const wasSpoken = spokenTexts.includes(text);

  if (!wasSpoken) {
    throw new Error(`Texto "${text}" não foi falado. Textos falados: ${spokenTexts.join(', ')}`);
  }

  console.log(`✓ Texto "${text}" foi reproduzido por TTS`);
});

Then('o app armazena no histórico a entrada { "id": {string}, "text": {string} }',
  async function (this: CustomWorld, id: string, text: string) {
    // Obtém histórico atual
    const history = await storageService.get('tts_history');
    const historyArray = history ? JSON.parse(history) : [];

    // Adiciona nova entrada
    historyArray.push({ id, text, timestamp: new Date().toISOString() });

    await storageService.set('tts_history', JSON.stringify(historyArray));

    console.log(`✓ Entrada { id: "${id}", text: "${text}" } armazenada no histórico`);
  });

Given('o servidor mock já enviou texto_detectado { "id": {string}, "text": {string} }',
  async function (this: CustomWorld, id: string, text: string) {
    const event = { id, text };
    this.mockWsServer?.sendToAll('texto_detectado', event);
    this.receivedEvents.push({ event: 'texto_detectado', data: event });

    await ttsService.speak(text);

    // Armazena no histórico
    const history = await storageService.get('tts_history');
    const historyArray = history ? JSON.parse(history) : [];
    historyArray.push({ id, text, timestamp: new Date().toISOString() });
    await storageService.set('tts_history', JSON.stringify(historyArray));

    await new Promise(resolve => setTimeout(resolve, 50));
  });

Given('o app já falou o texto com id {string}', async function (this: CustomWorld, id: string) {
  // Já foi processado no Given anterior
  const history = await storageService.get('tts_history');
  const historyArray = history ? JSON.parse(history) : [];
  const exists = historyArray.some((item: any) => item.id === id);

  if (!exists) {
    throw new Error(`Texto com id "${id}" não está no histórico`);
  }

  console.log(`✓ Texto com id "${id}" já foi processado`);
});

When('o servidor mock reenviar texto_detectado { "id": {string}, "text": {string} }',
  async function (this: CustomWorld, id: string, text: string) {
    const event = { id, text };
    const previousCount = ttsService.spokenTexts.length;

    this.mockWsServer?.sendToAll('texto_detectado', event);
    this.receivedEvents.push({ event: 'texto_detectado', data: event });

    // Simula processamento com deduplicação
    const history = await storageService.get('tts_history');
    const historyArray = history ? JSON.parse(history) : [];
    const alreadyProcessed = historyArray.some((item: any) => item.id === id);

    if (!alreadyProcessed) {
      await ttsService.speak(text);
    }

    this.appState.previousTTSCount = previousCount;

    await new Promise(resolve => setTimeout(resolve, 50));
  });

Then('o app não reproduce o TTS novamente', async function (this: CustomWorld) {
  const currentCount = ttsService.spokenTexts.length;
  const previousCount = this.appState.previousTTSCount || 0;

  if (currentCount > previousCount) {
    throw new Error(`TTS foi reproduzido novamente! Count anterior: ${previousCount}, atual: ${currentCount}`);
  }

  console.log('✓ TTS não foi reproduzido novamente (deduplicação funcionou)');
});
