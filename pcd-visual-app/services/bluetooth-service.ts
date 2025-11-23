import { Platform, Alert, Linking, NativeModules } from 'react-native';

export interface BluetoothDevice {
  id: string;
  name: string;
  connected: boolean;
  type: 'audio' | 'esp32' | 'other';
}

export interface IBluetoothService {
  isConnected(): Promise<boolean>;
  getConnectedDevice(): Promise<string | null>;
  setAudioRoute(route: 'bluetooth' | 'speaker'): Promise<void>;
  isBluetoothEnabled(): Promise<boolean>;
  requestBluetoothPermission(): Promise<boolean>;
  connectToESP32(): Promise<boolean>;
  isConnectedToESP32(): Promise<boolean>;
  getConnectedDevices(): Promise<BluetoothDevice[]>;
  scanDevices(): Promise<BluetoothDevice[]>;
}

export class BluetoothService implements IBluetoothService {
  private esp32DeviceName = 'ESP32';
  private connectedToESP32 = false;
  private connectedDevices: BluetoothDevice[] = [];

  // Optional native modules (loaded dynamically if installed)
  private InCallManager: any = null;
  private BleManager: any = null;
  private BluetoothClassic: any = null;

  constructor() {
    // tentar carregar módulos nativos se estiverem instalados
    try {
      // react-native-incall-manager (audio route)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.InCallManager = require('react-native-incall-manager');
    } catch (e) {
      this.InCallManager = null;
    }

    try {
      // react-native-ble-manager (BLE)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.BleManager = require('react-native-ble-manager');
      if (this.BleManager && typeof this.BleManager.start === 'function') {
        // inicializa sem alertas caso esteja disponível
        this.BleManager.start({ showAlert: false }).catch(() => {});
      }
    } catch (e) {
      this.BleManager = null;
    }

    try {
      // react-native-bluetooth-classic (Android classic)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.BluetoothClassic = require('react-native-bluetooth-classic');
    } catch (e) {
      this.BluetoothClassic = null;
    }
  }
  async getConnectedDevices(): Promise<BluetoothDevice[]> {
    try {
      const devices: BluetoothDevice[] = [];

      // 1) Detectar rota de áudio (fones conectados) usando InCallManager, se disponível
      try {
        if (this.InCallManager && typeof this.InCallManager.getAudioRoute === 'function') {
          const route = await this.InCallManager.getAudioRoute();
          // route example: 'BLUETOOTH', 'SPEAKER', 'EARPIECE'
          if (route && String(route).toLowerCase().includes('bluetooth')) {
            devices.push({ id: 'system-audio', name: 'Dispositivo de Áudio (sistema)', connected: true, type: 'audio' });
          }
        }
      } catch (e) {
        // ignore
      }

      // 2) Detectar periféricos BLE conectados (ex.: ESP32 anunciando um service UUID)
      try {
        if (this.BleManager && typeof this.BleManager.getConnectedPeripherals === 'function') {
          // se a aplicação souber service UUIDs, deveria passá-los aqui.
          // Chamamos sem services como tentativa - algumas implementações aceitam lista vazia.
          let connected: any[] = [];
          try {
            connected = await this.BleManager.getConnectedPeripherals([]);
          } catch (err) {
            // algumas versões exigem serviceUUIDs; tentar fallback para scan + check
            connected = [];
          }

          connected.forEach(p => {
            devices.push({ id: p.id || p.deviceId || p.uuid, name: p.name || 'BLE Device', connected: true, type: 'esp32' });
          });
        }
      } catch (e) {
        // ignore
      }

      // 3) Android classic (pareados/conectados)
      try {
        if (Platform.OS === 'android' && this.BluetoothClassic && typeof this.BluetoothClassic.list === 'function') {
          const bonded: any[] = await this.BluetoothClassic.list();
          bonded.forEach(b => {
            devices.push({ id: b.id || b.address, name: b.name || 'Paired Device', connected: !!b.connected, type: 'other' });
          });
        }
      } catch (e) {
        // ignore
      }

      // Se não encontramos nenhum device via APIs nativas, manter parte do fallback mock para UX
      if (devices.length === 0) {
        devices.push({ id: 'esp32-1', name: 'LUMI - SmartGlasses v1.0', connected: this.connectedToESP32, type: 'esp32' });
        devices.push({ id: 'airpods-1', name: 'Apple - Airpods v1.0', connected: false, type: 'audio' });
        devices.push({ id: 'bracelet-1', name: 'LUMI - SmartBracelet v1.0', connected: false, type: 'other' });
      }

      this.connectedDevices = devices;
      return devices;
    } catch (error) {
      console.error('Erro ao obter dispositivos conectados:', error);
      return [];
    }
  }

  async scanDevices(): Promise<BluetoothDevice[]> {
    try {
      console.log('Escaneando dispositivos Bluetooth...');

      // Simular scan de dispositivos
      await new Promise(resolve => setTimeout(resolve, 2000));

      const availableDevices: BluetoothDevice[] = [
        {
          id: 'esp32-1',
          name: 'LUMI - SmartGlasses v1.0',
          connected: this.connectedToESP32,
          type: 'esp32',
        },
        {
          id: 'airpods-1',
          name: 'Apple - Airpods v1.0',
          connected: false,
          type: 'audio',
        },
        {
          id: 'bracelet-1',
          name: 'LUMI - SmartBracelet v1.0',
          connected: false,
          type: 'other',
        },
      ];

      return availableDevices;
    } catch (error) {
      console.error('Erro ao escanear dispositivos:', error);
      return [];
    }
  }

  async isBluetoothEnabled(): Promise<boolean> {
    // Implementação real verificaria o estado do Bluetooth no dispositivo
    // Por enquanto retorna true
    return true;
  }

  async requestBluetoothPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        // No Android, solicitar permissões de Bluetooth
        Alert.alert(
          'Permissão Bluetooth',
          'Este app precisa de permissão para acessar o Bluetooth e conectar ao fone.',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => false,
            },
            {
              text: 'Permitir',
              onPress: async () => {
                // Aqui você implementaria a solicitação real de permissão
                // usando expo-permissions ou react-native-permissions
                await Linking.openSettings();
                return true;
              },
            },
          ]
        );
      } else if (Platform.OS === 'ios') {
        // No iOS, solicitar permissões de Bluetooth
        Alert.alert(
          'Permissão Bluetooth',
          'Este app precisa de permissão para acessar o Bluetooth e conectar ao fone.',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => false,
            },
            {
              text: 'Configurações',
              onPress: async () => {
                await Linking.openSettings();
                return true;
              },
            },
          ]
        );
      }
      return true;
    } catch (error) {
      console.error('Erro ao solicitar permissão Bluetooth:', error);
      return false;
    }
  }

  async connectToESP32(): Promise<boolean> {
    try {
      const isEnabled = await this.isBluetoothEnabled();

      if (!isEnabled) {
        const hasPermission = await this.requestBluetoothPermission();
        if (!hasPermission) {
          return false;
        }
      }

      // Simulação de conexão com ESP32
      // Aqui você implementaria a lógica real de conexão
      console.log('Tentando conectar ao ESP32...');

      // Simulando delay de conexão
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.connectedToESP32 = true;
      console.log('Conectado ao ESP32 com sucesso!');

      return true;
    } catch (error) {
      console.error('Erro ao conectar ao ESP32:', error);
      Alert.alert(
        'Erro de Conexão',
        'Não foi possível conectar ao dispositivo ESP32. Verifique se ele está ligado e próximo.'
      );
      return false;
    }
  }

  async isConnectedToESP32(): Promise<boolean> {
    return this.connectedToESP32;
  }

  async isConnected(): Promise<boolean> {
    // Implementação real verificaria o estado do Bluetooth
    return this.connectedToESP32;
  }

  async getConnectedDevice(): Promise<string | null> {
    if (this.connectedToESP32) {
      return this.esp32DeviceName;
    }
    return null;
  }

  async setAudioRoute(route: 'bluetooth' | 'speaker'): Promise<void> {
    console.log(`Audio route set to: ${route}`);
  }
}

export class MockBluetoothService implements IBluetoothService {
  private connected: boolean = false;
  private deviceName: string | null = null;
  private audioRoute: 'bluetooth' | 'speaker' = 'speaker';
  private bluetoothEnabled: boolean = true;
  private esp32Connected: boolean = false;
  private devices: BluetoothDevice[] = [];

  async getConnectedDevices(): Promise<BluetoothDevice[]> {
    return this.devices.filter(d => d.connected);
  }

  async scanDevices(): Promise<BluetoothDevice[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    this.devices = [
      {
        id: 'mock-esp32',
        name: 'LUMI - SmartGlasses v1.0',
        connected: this.esp32Connected,
        type: 'esp32',
      },
      {
        id: 'mock-airpods',
        name: 'Apple - Airpods v1.0',
        connected: false,
        type: 'audio',
      },
      {
        id: 'mock-bracelet',
        name: 'LUMI - SmartBracelet v1.0',
        connected: false,
        type: 'other',
      },
    ];

    return this.devices;
  }

  async isBluetoothEnabled(): Promise<boolean> {
    return this.bluetoothEnabled;
  }

  async requestBluetoothPermission(): Promise<boolean> {
    console.log('Mock: Bluetooth permission granted');
    this.bluetoothEnabled = true;
    return true;
  }

  async connectToESP32(): Promise<boolean> {
    console.log('Mock: Connecting to ESP32...');
    await new Promise(resolve => setTimeout(resolve, 500));
    this.esp32Connected = true;
    this.connected = true;
    this.deviceName = 'ESP32';
    console.log('Mock: Connected to ESP32');
    return true;
  }

  async isConnectedToESP32(): Promise<boolean> {
    return this.esp32Connected;
  }

  async isConnected(): Promise<boolean> {
    return this.connected;
  }

  async getConnectedDevice(): Promise<string | null> {
    return this.deviceName;
  }

  async setAudioRoute(route: 'bluetooth' | 'speaker'): Promise<void> {
    console.log(`Mock: Audio route set to ${route}`);
    this.audioRoute = route;
  }

  // Mock helpers
  setConnected(connected: boolean, deviceName: string | null = null): void {
    this.connected = connected;
    this.deviceName = deviceName;
  }

  setBluetoothEnabled(enabled: boolean): void {
    this.bluetoothEnabled = enabled;
  }

  setESP32Connected(connected: boolean): void {
    this.esp32Connected = connected;
    if (connected) {
      this.connected = true;
      this.deviceName = 'ESP32';
    }
  }

  getAudioRoute(): 'bluetooth' | 'speaker' {
    return this.audioRoute;
  }

  reset(): void {
    this.connected = false;
    this.deviceName = null;
    this.audioRoute = 'speaker';
    this.bluetoothEnabled = true;
    this.esp32Connected = false;
  }
}
