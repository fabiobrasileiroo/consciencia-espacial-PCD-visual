import { BatteryService, MockBatteryService } from './battery-service';
import { BluetoothService, MockBluetoothService } from './bluetooth-service';
import { HapticsService, MockHapticsService } from './haptics-service';
import { MockStorageService, StorageService } from './storage-service';
import { MockTTSService, TTSService } from './tts-service';

/**
 * Service Provider
 * 
 * Exporta instâncias dos serviços baseado no ambiente.
 * Em testes, usa mocks. Em produção, usa implementações reais.
 */

const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

// TTS Service
export const ttsService = isTest ? new MockTTSService() : new TTSService();

// Bluetooth Service
export const bluetoothService = isTest ? new MockBluetoothService() : new BluetoothService();

// Battery Service
export const batteryService = isTest ? new MockBatteryService() : new BatteryService();

// Storage Service
export const storageService = isTest ? new MockStorageService() : new StorageService();

// Haptics Service
export const hapticsService = isTest ? new MockHapticsService() : new HapticsService();

/**
 * Reset all mock services (usado em testes)
 */
export function resetAllMocks(): void {
  if (isTest) {
    (ttsService as MockTTSService).reset();
    (bluetoothService as MockBluetoothService).reset();
    (batteryService as MockBatteryService).reset();
    (storageService as MockStorageService).reset();
    (hapticsService as MockHapticsService).reset();
  }
}
