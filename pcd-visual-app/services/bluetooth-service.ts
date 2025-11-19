import { Platform, Alert, Linking } from 'react-native';

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

  async getConnectedDevices(): Promise<BluetoothDevice[]> {
    try {
      // Em produção, você usaria react-native-ble-manager ou similar
      // Por enquanto, retornamos devices mockados baseados no estado real

      const devices: BluetoothDevice[] = [];

      // Verificar dispositivos de áudio conectados
      // Nota: Isso requer módulos nativos específicos
      // Por enquanto, mockamos baseado em padrões comuns

      // Dispositivo principal de óculos (representa ESP32 + servidor OK)
      devices.push({
        id: 'esp32-1',
        name: 'LUMI - SmartGlasses v1.0',
        connected: this.connectedToESP32,
        type: 'esp32',
      });

      // Fones de ouvido Bluetooth (sempre listados, conexão controlada em outra tela)
      devices.push({
        id: 'airpods-1',
        name: 'Apple - Airpods v1.0',
        connected: false,
        type: 'audio',
      });

      // Pulseira / acessório complementar
      devices.push({
        id: 'bracelet-1',
        name: 'LUMI - SmartBracelet v1.0',
        connected: false,
        type: 'other',
      });

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
