import * as Haptics from 'expo-haptics';

export interface IHapticsService {
  vibrate(duration: number): Promise<void>;
  vibratePattern(pattern: number[]): Promise<void>;
  impact(style: 'light' | 'medium' | 'heavy'): Promise<void>;
}

export class HapticsService implements IHapticsService {
  async vibrate(duration: number): Promise<void> {
    // React Native não tem vibração com duração, usa padrões
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  async vibratePattern(pattern: number[]): Promise<void> {
    // Simula padrão com múltiplos impactos
    for (let i = 0; i < pattern.length; i += 2) {
      const onTime = pattern[i];
      const offTime = pattern[i + 1] || 0;

      if (onTime > 0) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }

      if (offTime > 0) {
        await new Promise(resolve => setTimeout(resolve, offTime));
      }
    }
  }

  async impact(style: 'light' | 'medium' | 'heavy'): Promise<void> {
    const styleMap = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    };

    await Haptics.impactAsync(styleMap[style]);
  }
}

export class MockHapticsService implements IHapticsService {
  public vibrations: Array<{ type: string; value: any }> = [];

  async vibrate(duration: number): Promise<void> {
    console.log(`Mock Haptics: Vibrate for ${duration}ms`);
    this.vibrations.push({ type: 'vibrate', value: duration });
  }

  async vibratePattern(pattern: number[]): Promise<void> {
    console.log(`Mock Haptics: Vibrate pattern ${pattern.join(', ')}`);
    this.vibrations.push({ type: 'pattern', value: pattern });
  }

  async impact(style: 'light' | 'medium' | 'heavy'): Promise<void> {
    console.log(`Mock Haptics: Impact ${style}`);
    this.vibrations.push({ type: 'impact', value: style });
  }

  reset(): void {
    this.vibrations = [];
  }
}
