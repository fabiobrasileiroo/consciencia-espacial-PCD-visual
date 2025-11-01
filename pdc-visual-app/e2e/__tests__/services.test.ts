/**
 * Exemplo de teste unitário usando os serviços mockáveis
 * 
 * Este arquivo mostra como testar componentes/funções que usam os serviços
 */

import { MockBluetoothService } from '../services/bluetooth-service';
import { MockHapticsService } from '../services/haptics-service';
import { MockStorageService } from '../services/storage-service';
import { MockTTSService } from '../services/tts-service';

describe('TTS Service', () => {
  let ttsService: MockTTSService;

  beforeEach(() => {
    ttsService = new MockTTSService();
  });

  it('deve falar o texto fornecido', async () => {
    await ttsService.speak('Olá mundo');

    expect(ttsService.spokenTexts).toContain('Olá mundo');
    expect(ttsService.spokenTexts).toHaveLength(1);
  });

  it('deve armazenar múltiplos textos falados', async () => {
    await ttsService.speak('Primeiro');
    await ttsService.speak('Segundo');
    await ttsService.speak('Terceiro');

    expect(ttsService.spokenTexts).toEqual(['Primeiro', 'Segundo', 'Terceiro']);
  });

  it('deve resetar os textos falados', async () => {
    await ttsService.speak('Teste');
    ttsService.reset();

    expect(ttsService.spokenTexts).toHaveLength(0);
  });
});

describe('Storage Service', () => {
  let storageService: MockStorageService;

  beforeEach(() => {
    storageService = new MockStorageService();
  });

  it('deve salvar e recuperar dados', async () => {
    await storageService.set('chave', 'valor');
    const valor = await storageService.get('chave');

    expect(valor).toBe('valor');
  });

  it('deve retornar null para chave inexistente', async () => {
    const valor = await storageService.get('nao_existe');

    expect(valor).toBeNull();
  });

  it('deve remover dados', async () => {
    await storageService.set('chave', 'valor');
    await storageService.remove('chave');
    const valor = await storageService.get('chave');

    expect(valor).toBeNull();
  });

  it('deve limpar todos os dados', async () => {
    await storageService.set('chave1', 'valor1');
    await storageService.set('chave2', 'valor2');
    await storageService.clear();

    const all = storageService.getAll();
    expect(Object.keys(all)).toHaveLength(0);
  });
});

describe('Bluetooth Service', () => {
  let bluetoothService: MockBluetoothService;

  beforeEach(() => {
    bluetoothService = new MockBluetoothService();
  });

  it('deve iniciar desconectado', async () => {
    const isConnected = await bluetoothService.isConnected();

    expect(isConnected).toBe(false);
  });

  it('deve conectar a um dispositivo', async () => {
    bluetoothService.setConnected(true, 'FoneXY');

    const isConnected = await bluetoothService.isConnected();
    const device = await bluetoothService.getConnectedDevice();

    expect(isConnected).toBe(true);
    expect(device).toBe('FoneXY');
  });

  it('deve desconectar', async () => {
    bluetoothService.setConnected(true, 'FoneXY');
    bluetoothService.setConnected(false);

    const isConnected = await bluetoothService.isConnected();
    const device = await bluetoothService.getConnectedDevice();

    expect(isConnected).toBe(false);
    expect(device).toBeNull();
  });

  it('deve configurar rota de áudio', async () => {
    await bluetoothService.setAudioRoute('bluetooth');

    expect(bluetoothService.getAudioRoute()).toBe('bluetooth');
  });
});

describe('Haptics Service', () => {
  let hapticsService: MockHapticsService;

  beforeEach(() => {
    hapticsService = new MockHapticsService();
  });

  it('deve vibrar por duração específica', async () => {
    await hapticsService.vibrate(100);

    expect(hapticsService.vibrations).toHaveLength(1);
    expect(hapticsService.vibrations[0]).toEqual({ type: 'vibrate', value: 100 });
  });

  it('deve vibrar em padrão', async () => {
    await hapticsService.vibratePattern([200, 100, 200]);

    expect(hapticsService.vibrations).toHaveLength(1);
    expect(hapticsService.vibrations[0]).toEqual({
      type: 'pattern',
      value: [200, 100, 200]
    });
  });

  it('deve fazer impacto', async () => {
    await hapticsService.impact('heavy');

    expect(hapticsService.vibrations).toHaveLength(1);
    expect(hapticsService.vibrations[0]).toEqual({ type: 'impact', value: 'heavy' });
  });
});

describe('Integração - TTS + Storage', () => {
  let ttsService: MockTTSService;
  let storageService: MockStorageService;

  beforeEach(() => {
    ttsService = new MockTTSService();
    storageService = new MockStorageService();
  });

  it('deve processar texto e armazenar histórico', async () => {
    const texto = 'Objeto detectado';
    const id = 'msg1';

    // Fala o texto
    await ttsService.speak(texto);

    // Armazena no histórico
    const history = [];
    history.push({ id, text: texto, timestamp: new Date().toISOString() });
    await storageService.set('history', JSON.stringify(history));

    // Verifica
    expect(ttsService.spokenTexts).toContain(texto);

    const savedHistory = await storageService.get('history');
    const parsedHistory = JSON.parse(savedHistory!);

    expect(parsedHistory).toHaveLength(1);
    expect(parsedHistory[0].text).toBe(texto);
  });

  it('deve evitar duplicação usando histórico', async () => {
    const id = 'msg1';
    const texto = 'Teste';

    // Primeira vez
    await ttsService.speak(texto);
    let history = [{ id, text: texto, timestamp: new Date().toISOString() }];
    await storageService.set('history', JSON.stringify(history));

    // Tenta processar novamente
    const savedHistory = await storageService.get('history');
    const parsedHistory = JSON.parse(savedHistory!);
    const isDuplicate = parsedHistory.some((item: any) => item.id === id);

    if (!isDuplicate) {
      await ttsService.speak(texto);
    }

    // Deve ter falado apenas uma vez
    expect(ttsService.spokenTexts).toEqual([texto]);
  });
});
