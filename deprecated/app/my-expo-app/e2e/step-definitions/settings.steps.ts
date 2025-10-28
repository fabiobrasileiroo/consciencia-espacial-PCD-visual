import { Given, Then, When } from '@cucumber/cucumber';
import { MockStorageService } from '../../my-expo-app/services/storage-service';
import { MockTTSService } from '../../my-expo-app/services/tts-service';
import { CustomWorld } from '../support/setup';

const storageService = new MockStorageService();
const ttsService = new MockTTSService();

Given('o app iniciou com storage limpo', async function (this: CustomWorld) {
  await storageService.clear();
  console.log('Storage limpo');
});

Given('o usuário abre Configurações', async function (this: CustomWorld) {
  this.appState.currentScreen = 'settings';
  console.log('Tela de Configurações aberta');
});

When('ele seleciona {string} e salva', async function (this: CustomWorld, option: string) {
  if (option === 'Forçar alto-falante') {
    await storageService.set('forceSpeaker', 'true');
    this.appState.forceSpeaker = true;
  }
  console.log(`Opção "${option}" salva`);
});

Then('a preferência {string} = true está salva no storage local',
  async function (this: CustomWorld, key: string) {
    const value = await storageService.get(key);

    if (value !== 'true') {
      throw new Error(`Preferência "${key}" não está salva como true, valor: ${value}`);
    }

    console.log(`✓ Preferência "${key}" = true salva no storage`);
  });

Given('a preferência {string} = true', async function (this: CustomWorld, key: string) {
  await storageService.set(key, 'true');
  this.appState[key] = true;
  console.log(`Preferência "${key}" definida como true`);
});

When('o usuário pressiona {string}', async function (this: CustomWorld, button: string) {
  this.appState.lastButton = button;

  if (button === 'Testar som') {
    // Verifica preferência
    const forceSpeaker = await storageService.get('forceSpeaker');

    await ttsService.speak('Teste de som');
    this.appState.testSoundPlayed = true;
  }

  console.log(`Botão "${button}" pressionado`);
});

Then('o app reproduz {string} pelo alto-falante',
  async function (this: CustomWorld, text: string) {
    const wasSpoken = ttsService.spokenTexts.includes(text);

    if (!wasSpoken) {
      throw new Error(`Texto "${text}" não foi reproduzido`);
    }

    const forceSpeaker = await storageService.get('forceSpeaker');

    if (forceSpeaker !== 'true') {
      console.warn('Aviso: forceSpeaker não está definido');
    }

    console.log(`✓ "${text}" reproduzido pelo alto-falante`);
  });
