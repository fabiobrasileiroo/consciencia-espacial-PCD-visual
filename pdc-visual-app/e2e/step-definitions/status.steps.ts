import { Given, Then, When } from '@cucumber/cucumber';
import { MockBatteryService } from '../../services/battery-service';
import { MockBluetoothService } from '../../services/bluetooth-service';
import { CustomWorld } from '../support/setup';

const batteryService = new MockBatteryService();
const bluetoothService = new MockBluetoothService();

Given('o sistema mock informa batteryLevel = {int}', async function (this: CustomWorld, level: number) {
  batteryService.setBatteryLevel(level);
  this.appState.batteryLevel = level;
  console.log(`Nível de bateria: ${level}%`);
});

When('o usuário abre a tela Status', async function (this: CustomWorld) {
  this.appState.currentScreen = 'status';

  // Coleta informações do sistema
  this.appState.statusInfo = {
    batteryLevel: await batteryService.getBatteryLevel(),
    isCharging: await batteryService.isCharging(),
    bluetoothConnected: await bluetoothService.isConnected(),
    bluetoothDevice: await bluetoothService.getConnectedDevice(),
  };

  console.log('Tela Status aberta', this.appState.statusInfo);
});

Then('o app exibe {string} e sugestão {string}',
  async function (this: CustomWorld, message: string, suggestion: string) {
    const batteryLevel = this.appState.statusInfo?.batteryLevel;

    if (batteryLevel === undefined || batteryLevel > 15) {
      throw new Error(`Nível de bateria não está crítico: ${batteryLevel}%`);
    }

    // Simula UI mostrando mensagem
    this.appState.displayedMessage = message;
    this.appState.displayedSuggestion = suggestion;

    console.log(`✓ Exibindo: "${message}" com sugestão: "${suggestion}"`);
  });

Given('o sistema mock informa bluetoothConnected = true e deviceName = {string}',
  async function (this: CustomWorld, deviceName: string) {
    bluetoothService.setConnected(true, deviceName);
    this.appState.bluetoothDevice = deviceName;
    console.log(`Bluetooth conectado: ${deviceName}`);
  });

Then('o app exibe {string}', async function (this: CustomWorld, message: string) {
  const bluetoothDevice = this.appState.statusInfo?.bluetoothDevice;

  if (!bluetoothDevice) {
    throw new Error('Nenhum dispositivo Bluetooth conectado');
  }

  // Simula UI
  this.appState.displayedMessage = message;

  console.log(`✓ Exibindo: "${message}"`);
});
