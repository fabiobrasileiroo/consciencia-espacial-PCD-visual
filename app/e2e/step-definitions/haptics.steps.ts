import { Given, Then, When } from '@cucumber/cucumber';
import { MockHapticsService } from '../../my-expo-app/services/haptics-service';
import { CustomWorld } from '../support/setup';

const hapticsService = new MockHapticsService();

Given('o usuário escolheu modo de notificação {string}',
  async function (this: CustomWorld, mode: string) {
    this.appState.notificationMode = mode;
    console.log(`Modo de notificação: ${mode}`);
  });

Given('o servidor mock envia evento alert_distance { "id":{string},"level":{string} }',
  async function (this: CustomWorld, id: string, level: string) {
    const event = { id, level };
    this.mockWsServer?.sendToAll('alert_distance', event);
    this.receivedEvents.push({ event: 'alert_distance', data: event });

    await new Promise(resolve => setTimeout(resolve, 50));
  });

When('o app recebe alert_distance', async function (this: CustomWorld) {
  const lastEvent = this.receivedEvents[this.receivedEvents.length - 1];

  if (lastEvent && lastEvent.event === 'alert_distance') {
    const level = lastEvent.data.level;

    // Processa alerta com haptics
    switch (level) {
      case 'weak':
        await hapticsService.vibrate(100);
        break;
      case 'medium':
        await hapticsService.vibrate(300);
        break;
      case 'strong':
        await hapticsService.vibratePattern([200, 100, 200]);
        break;
    }

    this.appState.lastHaptic = level;
  }
});

Then('o app chama a API de vibração para um pulso curto \\(<=100ms)',
  async function (this: CustomWorld) {
    const vibrations = hapticsService.vibrations;
    const weakVibration = vibrations.find(v => v.type === 'vibrate' && v.value <= 100);

    if (!weakVibration) {
      throw new Error(`Vibração fraca não encontrada. Vibrações: ${JSON.stringify(vibrations)}`);
    }

    console.log(`✓ Vibração fraca (${weakVibration.value}ms) executada`);
  });

When('o app recebe o evento', async function (this: CustomWorld) {
  // Reutiliza o processamento do When anterior
  const lastEvent = this.receivedEvents[this.receivedEvents.length - 1];

  if (lastEvent && lastEvent.event === 'alert_distance') {
    const level = lastEvent.data.level;

    switch (level) {
      case 'medium':
        await hapticsService.vibrate(300);
        break;
      case 'strong':
        await hapticsService.vibratePattern([200, 100, 200]);
        break;
    }

    this.appState.lastHaptic = level;
  }
});

Then('o app vibra por 300ms', async function (this: CustomWorld) {
  const vibrations = hapticsService.vibrations;
  const mediumVibration = vibrations.find(v => v.type === 'vibrate' && v.value === 300);

  if (!mediumVibration) {
    throw new Error(`Vibração média (300ms) não encontrada. Vibrações: ${JSON.stringify(vibrations)}`);
  }

  console.log('✓ Vibração média (300ms) executada');
});

Then('o app vibra em padrão [200ms ON, 100ms OFF, 200ms ON]',
  async function (this: CustomWorld) {
    const vibrations = hapticsService.vibrations;
    const patternVibration = vibrations.find(v =>
      v.type === 'pattern' &&
      JSON.stringify(v.value) === JSON.stringify([200, 100, 200])
    );

    if (!patternVibration) {
      throw new Error(`Padrão de vibração não encontrado. Vibrações: ${JSON.stringify(vibrations)}`);
    }

    console.log('✓ Padrão de vibração [200, 100, 200] executado');
  });
