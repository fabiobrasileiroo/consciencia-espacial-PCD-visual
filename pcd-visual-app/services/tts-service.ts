export interface ITTSService {
  speak(text: string): Promise<void>;
  stop(): Promise<void>;
  isSpeaking(): Promise<boolean>;
}

export class TTSService implements ITTSService {
  private speaking: boolean = false;

  async speak(text: string): Promise<void> {
    console.log(`TTS: Speaking "${text}"`);
    this.speaking = true;

    // Simula tempo de fala (100ms por palavra)
    const words = text.split(' ').length;
    await new Promise(resolve => setTimeout(resolve, words * 100));

    this.speaking = false;
  }

  async stop(): Promise<void> {
    console.log('TTS: Stopped');
    this.speaking = false;
  }

  async isSpeaking(): Promise<boolean> {
    return this.speaking;
  }
}

export class MockTTSService implements ITTSService {
  public spokenTexts: string[] = [];
  private speaking: boolean = false;

  async speak(text: string): Promise<void> {
    console.log(`Mock TTS: Speaking "${text}"`);
    this.spokenTexts.push(text);
    this.speaking = true;

    // Simula tempo de fala instantâneo para testes
    await new Promise(resolve => setTimeout(resolve, 10));

    this.speaking = false;
  }

  async stop(): Promise<void> {
    console.log('Mock TTS: Stopped');
    this.speaking = false;
  }

  async isSpeaking(): Promise<boolean> {
    return this.speaking;
  }

  reset(): void {
    this.spokenTexts = [];
    this.speaking = false;
  }
}
