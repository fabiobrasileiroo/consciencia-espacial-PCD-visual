export interface IBluetoothService {
  isConnected(): Promise<boolean>;
  getConnectedDevice(): Promise<string | null>;
  setAudioRoute(route: 'bluetooth' | 'speaker'): Promise<void>;
}

export class BluetoothService implements IBluetoothService {
  async isConnected(): Promise<boolean> {
    // Implementação real verificaria o estado do Bluetooth
    return false;
  }

  async getConnectedDevice(): Promise<string | null> {
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

  getAudioRoute(): 'bluetooth' | 'speaker' {
    return this.audioRoute;
  }

  reset(): void {
    this.connected = false;
    this.deviceName = null;
    this.audioRoute = 'speaker';
  }
}
