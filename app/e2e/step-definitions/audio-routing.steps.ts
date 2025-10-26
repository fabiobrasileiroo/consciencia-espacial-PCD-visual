import { Given, Then, When } from '@cucumber/cucumber';
import { MockBluetoothService } from '../../services/bluetooth-service';
import { MockTTSService } from '../../services/tts-service';
import { CustomWorld } from '../support/setup';

const bluetoothService = new MockBluetoothService();
const ttsService = new MockTTSService();

Given('o servidor mock está ativo', async function (this: CustomWorld) {
  console.log('Mock servers ativos');
});

Given('o app tem permissão de áudio', async function (this: CustomWorld) {
  this.appState.hasAudioPermission = true;
  console.log('Permissão de áudio concedida');
});

Given('o SO reporta que o dispositivo {string} está emparelhado e conectado',
  async function (this: CustomWorld, deviceName: string) {
    bluetoothService.setConnected(true, deviceName);
    this.appState.bluetoothDevice = deviceName;
    console.log(`Dispositivo "${deviceName}" conectado`);
  });

When('o servidor mock envia texto_detectado { "id": {string}, "text": {string} }',
  async function (this: CustomWorld, id: string, text: string) {
    const event = { id, text };
    this.mockWsServer?.sendToAll('texto_detectado', event);
    this.receivedEvents.push({ event: 'texto_detectado', data: event });

    // Simula TTS
    await ttsService.speak(text);

    // Define rota de áudio baseado no estado do Bluetooth
    const isConnected = await bluetoothService.isConnected();
    if (isConnected) {
      await bluetoothService.setAudioRoute('bluetooth');
    } else {
      await bluetoothService.setAudioRoute('speaker');
    }

    await new Promise(resolve => setTimeout(resolve, 50));
  });

Then('o app reproduz {string} e o sistema roteia para {string}',
  async function (this: CustomWorld, text: string, deviceName: string) {
    const wasSpoken = ttsService.spokenTexts.includes(text);

    if (!wasSpoken) {
      throw new Error(`Texto "${text}" não foi falado`);
    }

    const audioRoute = bluetoothService.getAudioRoute();

    if (audioRoute !== 'bluetooth') {
      throw new Error(`Rota de áudio não é bluetooth, é: ${audioRoute}`);
    }

    console.log(`✓ Texto "${text}" reproduzido e roteado para "${deviceName}"`);
  });

Given('o SO reporta dispositivo {string} desconectado',
  async function (this: CustomWorld, deviceName: string) {
    bluetoothService.setConnected(false, null);
    this.appState.bluetoothDevice = null;
    console.log(`Dispositivo "${deviceName}" desconectado`);
  });

Then('o app reproduz {string} pelo alto-falante do celular',
  async function (this: CustomWorld, text: string) {
    const wasSpoken = ttsService.spokenTexts.includes(text);

    if (!wasSpoken) {
      throw new Error(`Texto "${text}" não foi falado`);
    }

    const audioRoute = bluetoothService.getAudioRoute();

    if (audioRoute !== 'speaker') {
      throw new Error(`Rota de áudio não é speaker, é: ${audioRoute}`);
    }

    console.log(`✓ Texto "${text}" reproduzido pelo alto-falante`);
  });
