import { useMemo, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';

import * as ExpoDevice from 'expo-device';

export interface BluetoothApi {
  requestPermissions(): Promise<boolean>;
  scanForPeripherals(): void;
  allDevices: Device[];
  connectToDevice?: (deviceId: Device) => Promise<void>;
  connectedDevice: Device | null;
}


function useBLE(): BluetoothApi {


  const manager = useMemo(() => new BleManager(), []);
  const [allDevices, setallDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  const requestAndroid31Permissions = async (): Promise<boolean> => {
    const bluetoothScamPermissions = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: 'Permissão para escanear dispositivos Bluetooth',
        message: 'Este aplicativo precisa escanear dispositivos Bluetooth para funcionar corretamente.',
        buttonPositive: 'OK',
      },
    )

    const bluetoothConnectPermissions = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: 'Permissão para conectar a dispositivos Bluetooth',
        message: 'Este aplicativo precisa conectar a dispositivos Bluetooth para funcionar corretamente.',
        buttonPositive: 'OK',
      },
    )

    const bluetoothFineLocationPermissions = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Permissão para acessar a localização',
        message: 'Este aplicativo precisa acessar a localização para funcionar corretamente.',
        buttonPositive: 'OK',
      },
    )

    return (
      bluetoothScamPermissions === 'granted' &&
      bluetoothConnectPermissions === 'granted' &&
      bluetoothFineLocationPermissions === 'granted'
    ) 
  }

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permissão para acessar a localização',
            message: 'Este aplicativo precisa acessar a localização para funcionar corretamente.',
            buttonPositive: 'OK',
          },
        );

        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const isAndroid31PermissionsGranted = await requestAndroid31Permissions();
        return isAndroid31PermissionsGranted;
      }
    } else {
      return true;
    }
  }

  const isDuplicateDevice = (device: Device[], nextDevice: Device) => 
    device.findIndex((device) => nextDevice.id === device.id) > -1


  const scanForPeripherals = () => {
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log('BluetoothService: Error while scanning for peripherals', error);
        return;
      }

      if (device && device.name?.includes("ESP")) {
        setallDevices((prevState) => {
          if (!isDuplicateDevice(prevState, device)) {
            return [...prevState, device];
          }
          return prevState;
        });
      }
    });
  }

  const connectToDevice = async(device: Device) => {
    try{
      const deviceConnection = await manager.connectToDevice(device.id)
      setConnectedDevice(deviceConnection);
      await deviceConnection.discoverAllServicesAndCharacteristics();
      manager.stopDeviceScan();
      
    } catch (e) {
      console.log('BluetoothService: Error while connecting to device', e);
    }
  }

  return {
    requestPermissions,
    scanForPeripherals,
    allDevices,
    connectedDevice,
    connectToDevice
  };
}

export default useBLE;

export interface IBluetoothService {
  requestPermissions(): Promise<boolean>;
  isConnected(): Promise<boolean>;
  getConnectedDevice(): Promise<string | null>;
  setAudioRoute(route: 'bluetooth' | 'speaker'): Promise<void>;
}


export class MockBluetoothService implements IBluetoothService {
  private connected: boolean = false;
  private deviceName: string | null = null;
  private audioRoute: 'bluetooth' | 'speaker' = 'speaker';

  async requestPermissions(): Promise<boolean> {
    return true;
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

  getAudioRoute(): 'bluetooth' | 'speaker' {
    return this.audioRoute;
  }

  reset(): void {
    this.connected = false;
    this.deviceName = null;
    this.audioRoute = 'speaker';
  }
}
