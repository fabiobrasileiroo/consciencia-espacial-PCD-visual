export interface IBatteryService {
  getBatteryLevel(): Promise<number>;
  isCharging(): Promise<boolean>;
}

export class BatteryService implements IBatteryService {
  async getBatteryLevel(): Promise<number> {
    // Implementação real usaria expo-battery
    return 100;
  }

  async isCharging(): Promise<boolean> {
    return false;
  }
}

export class MockBatteryService implements IBatteryService {
  private batteryLevel: number = 100;
  private charging: boolean = false;

  async getBatteryLevel(): Promise<number> {
    return this.batteryLevel;
  }

  async isCharging(): Promise<boolean> {
    return this.charging;
  }

  // Mock helpers
  setBatteryLevel(level: number): void {
    this.batteryLevel = Math.max(0, Math.min(100, level));
  }

  setCharging(charging: boolean): void {
    this.charging = charging;
  }

  reset(): void {
    this.batteryLevel = 100;
    this.charging = false;
  }
}
