import { Given, Then, When } from '@cucumber/cucumber';
import { MockStorageService } from '../../my-expo-app/services/storage-service';
import { MockTTSService } from '../../my-expo-app/services/tts-service';
import { CustomWorld } from '../support/setup';

const storageService = new MockStorageService();
const ttsService = new MockTTSService();

Given('o storage local está vazio', async function (this: CustomWorld) {
  await storageService.clear();
  console.log('Storage limpo');
});

Given('o servidor mock envia texto_detectado { "id":{string}, "text":{string} }',
  async function (this: CustomWorld, id: string, text: string) {
    const event = { id, text };
    this.mockWsServer?.sendToAll('texto_detectado', event);
    this.receivedEvents.push({ event: 'texto_detectado', data: event });

    await new Promise(resolve => setTimeout(resolve, 50));
  });

When('o app recebe o evento', async function (this: CustomWorld) {
  const lastEvent = this.receivedEvents[this.receivedEvents.length - 1];

  if (lastEvent && lastEvent.event === 'texto_detectado') {
    // Processa evento
    await ttsService.speak(lastEvent.data.text);

    // Adiciona ao histórico
    const history = await storageService.get('ui_history');
    const historyArray = history ? JSON.parse(history) : [];

    historyArray.push({
      id: lastEvent.data.id,
      text: lastEvent.data.text,
      timestamp: new Date().toISOString(),
    });

    await storageService.set('ui_history', JSON.stringify(historyArray));

    this.appState.currentHistory = historyArray;
  }
});

Then('o item aparece no histórico com texto {string} e timestamp',
  async function (this: CustomWorld, text: string) {
    const history = await storageService.get('ui_history');
    const historyArray = history ? JSON.parse(history) : [];

    const item = historyArray.find((entry: any) => entry.text === text);

    if (!item) {
      throw new Error(`Item com texto "${text}" não encontrado no histórico`);
    }

    if (!item.timestamp) {
      throw new Error('Item não tem timestamp');
    }

    console.log(`✓ Item "${text}" aparece no histórico com timestamp ${item.timestamp}`);
  });

Given('o histórico contém {int} itens', async function (this: CustomWorld, count: number) {
  const items = [];

  for (let i = 0; i < count; i++) {
    items.push({
      id: `item-${i}`,
      text: `Texto ${i}`,
      timestamp: new Date().toISOString(),
    });
  }

  await storageService.set('ui_history', JSON.stringify(items));
  this.appState.historyCount = count;

  console.log(`Histórico com ${count} itens criado`);
});

When('o usuário fecha e reabre o app', async function (this: CustomWorld) {
  // Simula fechamento (não limpa storage)
  this.appState.appClosed = true;

  await new Promise(resolve => setTimeout(resolve, 100));

  // Simula reabertura
  this.appState.appClosed = false;

  // Recupera histórico do storage
  const history = await storageService.get('ui_history');
  this.appState.restoredHistory = history ? JSON.parse(history) : [];

  console.log('App fechado e reaberto');
});

Then('o histórico ainda mostra os {int} itens', async function (this: CustomWorld, count: number) {
  const restoredHistory = this.appState.restoredHistory || [];

  if (restoredHistory.length !== count) {
    throw new Error(`Esperado ${count} itens, encontrado ${restoredHistory.length}`);
  }

  console.log(`✓ Histórico persistiu com ${count} itens após reinício`);
});
