import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { ttsService, hapticsService } from '@/services/service-provider';
import { StorageService } from '@/services/storage-service';

const storageService = new StorageService();
const API_URL_STORAGE_KEY = '@lucoi:api_url';

interface DetectionHistory {
  id: string;
  text: string;
  timestamp: string;
}

interface Stats {
  temperature: number;
  warnings: number;
  usageTime: string;
}

interface ConnectedDevicesSummary {
  app: number;
  esp32Pai: number;
  esp32Cam: number;
}

interface ESP32ModuleStatus {
  connected: boolean;
  lastSeen: string | null;
  distance?: number | null;
  level?: string | null;
  temperature?: number | null;
  humidity?: number | null;
  sensorOk?: boolean | null;
  rssi?: number | null;
  vibrationLevel?: number | null;
  lastUpdate?: number | null;
}

interface ESP32StatusMap {
  pai: ESP32ModuleStatus;
  sensor: ESP32ModuleStatus;
  motor: ESP32ModuleStatus;
  camera: ESP32ModuleStatus;
}

interface SystemsHealth {
  pai: boolean;
  sensor: boolean;
  vibracall: boolean;
  camera: boolean;
}

interface ToastConfig {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface AppContextType {
  allSystemsConnected: boolean;
  mode: string;
  setMode: (mode: string) => void;
  connectionStatus: string;
  setConnectionStatus: (status: string) => void;
  volume: number;
  setVolume: (volume: number) => void;
  setSystemVolume: (volume: number) => Promise<void>;
  getSystemVolume: () => Promise<number>;

  // WebSocket
  wsConnected: boolean;
  lastDetection: any | null;
  detectionHistory: DetectionHistory[];
  sendWebSocketMessage: (message: any) => boolean;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  currentTranscription: string;
  testWithHistoryItem: (item: DetectionHistory) => void;

  // Stats
  stats: Stats;

  // Status do servidor
  serverOnline: boolean;
  connectedDevices: ConnectedDevicesSummary;
  esp32Status: ESP32StatusMap | null;
  systemsHealth: SystemsHealth | null;
  detectedObjectDistance: number | null; // Distância do objeto detectado

  // API URL customizada
  apiUrl: string;
  setApiUrl: (url: string) => Promise<void>;

  // Toast
  toast: ToastConfig;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  hideToast: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [mode, setMode] = useState('som');
  const [connectionStatus, setConnectionStatus] = useState('desconectado');
  const [volume, setVolume] = useState(50);
  const [detectionHistory, setDetectionHistory] = useState<DetectionHistory[]>([]);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [stats, setStats] = useState<Stats>({
    temperature: 32,
    warnings: 3,
    usageTime: '5h 0min',
  });
  const [serverOnline, setServerOnline] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevicesSummary>({
    app: 0,
    esp32Pai: 0,
    esp32Cam: 0,
  });
  const [esp32Status, setEsp32Status] = useState<ESP32StatusMap | null>(null);
  const [systemsHealth, setSystemsHealth] = useState<SystemsHealth | null>(null);
  const [detectedObjectDistance, setDetectedObjectDistance] = useState<number | null>(null);
  const [apiUrl, setApiUrlState] = useState<string>(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000');
  console.log('API URL atual:', apiUrl);
  const [toast, setToast] = useState<ToastConfig>({
    visible: false,
    message: '',
    type: 'info',
  });

  // Carregar URL customizada do AsyncStorage ao iniciar
  useEffect(() => {
    async function loadCustomApiUrl() {
      try {
        const savedUrl = await storageService.get(API_URL_STORAGE_KEY);
        if (savedUrl) {
          setApiUrlState(savedUrl);
          console.log('URL da API carregada do storage:', savedUrl);
        }
      } catch (error) {
        console.error('Erro ao carregar URL customizada:', error);
      }
    }
    loadCustomApiUrl();
  }, []);

  // Função para salvar URL customizada
  const setApiUrl = async (url: string) => {
    try {
      await storageService.set(API_URL_STORAGE_KEY, url);
      setApiUrlState(url);
      console.log('URL da API salva:', url);

      // Reconectar WebSocket com nova URL
      disconnectWebSocket();
      setTimeout(() => {
        connectWebSocket();
        showToast('URL atualizada! Reconectando...', 'info');
      }, 500);
    } catch (error) {
      console.error('Erro ao salvar URL:', error);
      showToast('Erro ao salvar URL da API', 'error');
    }
  };

  // Controle de volume do sistema
  const setSystemVolume = async (newVolume: number) => {
    try {
      // No React Native, você precisaria de um módulo nativo ou expo-av
      // Por enquanto, apenas atualizamos o estado local
      setVolume(newVolume);
      console.log(`Volume do sistema ajustado para: ${newVolume}%`);

      // TODO: Implementar controle real do volume usando:
      // import { Audio } from 'expo-av';
      // await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    } catch (error) {
      console.error('Erro ao ajustar volume do sistema:', error);
    }
  };

  const getSystemVolume = async (): Promise<number> => {
    try {
      // TODO: Implementar leitura real do volume do sistema
      return volume;
    } catch (error) {
      console.error('Erro ao obter volume do sistema:', error);
      return volume;
    }
  };

  // Toast
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  // WebSocket - conecta no servidor Vision API (/ws)
  const {
    isConnected: wsConnected,
    lastMessage: lastDetection,
    sendMessage: sendWebSocketMessage,
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
  } = useWebSocket({
    url: process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000/ws',
    autoConnect: true, // Conectar automaticamente
  });

  // Monitorar conexão WebSocket e mostrar toast
  useEffect(() => {
    if (wsConnected) {
      showToast('Conectado ao servidor!', 'success');
    }
  }, [wsConnected]);

  // Buscar status HTTP periodicamente para uptime e dispositivos conectados
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(`${apiUrl}/api/status`);
        if (!res.ok) throw new Error('Status HTTP não OK');
        const json = await res.json();

        setServerOnline(true);

        // uptime em segundos vindo do servidor
        const uptimeSeconds: number = json.uptime ?? 0;
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const usageTimeStr = `${hours}h ${minutes}min`;

        setStats(prev => ({
          temperature: prev.temperature,
          warnings: prev.warnings,
          usageTime: usageTimeStr,
        }));

        if (json.connectedClients) {
          setConnectedDevices({
            app: json.connectedClients.app ?? 0,
            esp32Pai: json.connectedClients.esp32Pai ?? 0,
            esp32Cam: json.connectedClients.esp32Cam ?? 0,
          });
        }

        // Atualizar status dos módulos ESP32
        if (json.esp32Status) {
          setEsp32Status(json.esp32Status);
        }

        // Atualizar systemsHealth
        if (json.systemsHealth) {
          setSystemsHealth(json.systemsHealth);
        }

        // Capturar distância do objeto detectado mais recente (via HTTP)
        // NOTA: Os dados do sensor (distância, temperatura, umidade) também vêm via WebSocket
        // através de mensagens 'sensor-update', processadas no useEffect abaixo.
        // Este HTTP polling captura o histórico de detecções armazenado no servidor.
        if (json.lastDetections && Array.isArray(json.lastDetections) && json.lastDetections.length > 0) {
          const mostRecent = json.lastDetections[0];
          if (typeof mostRecent.distance === 'number') {
            setDetectedObjectDistance(mostRecent.distance);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar /api/status:', error);
        setServerOnline(false);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  // Atualizar histórico quando receber nova detecção
  useEffect(() => {
    if (!lastDetection) return;

    try {
      const { type, data } = lastDetection as any;

      // Histórico inicial vindo do servidor
      if (type === 'history' && Array.isArray(data)) {
        const items: DetectionHistory[] = data
          .map((d: any, index: number) => ({
            id: (d.timestamp || Date.now() + index).toString(),
            text: d.description || 'Objeto detectado',
            timestamp: new Date(d.timestamp || Date.now()).toISOString(),
          }))
          .reverse();
        if (items.length > 0) {
          setDetectionHistory(items.slice(0, 50));
          setCurrentTranscription(items[0].text);
        }
        return;
      }

      // Última detecção atual
      if (type === 'current' && data) {
        setCurrentTranscription(data.description || '');
        return;
      }

      // Nova detecção em tempo real
      if (type === 'detection' && data) {
        const newItem: DetectionHistory = {
          id: (data.timestamp || Date.now()).toString(),
          text: data.description || 'Objeto detectado',
          timestamp: new Date(data.timestamp || Date.now()).toISOString(),
        };

        setDetectionHistory(prev => [newItem, ...prev].slice(0, 50));
        setCurrentTranscription(newItem.text);

        // Capturar distância do objeto detectado via WebSocket (tempo real)
        if (typeof data.distance === 'number') {
          setDetectedObjectDistance(data.distance);
        }

        // Falar a descrição
        ttsService.speak(newItem.text).catch(err => {
          console.error('Erro no TTS:', err);
        });

        // Vibração básica em qualquer detecção
        hapticsService.impact('medium').catch(err => {
          console.error('Erro no haptics:', err);
        });

        showToast(`Detectado: ${newItem.text}`, 'info');
        return;
      }

      // Atualização de sensor -> pode influenciar stats / avisos
      // NOTA: Os dados do sensor (distância, temperatura) vêm via WebSocket em tempo real
      if (type === 'sensor-update' && data) {
        const { alertLevel, temperature, distance } = data;

        setStats(prev => ({
          temperature: typeof temperature === 'number' ? temperature : prev.temperature,
          warnings: alertLevel === 'warning' || alertLevel === 'danger' ? prev.warnings + 1 : prev.warnings,
          usageTime: prev.usageTime,
        }));

        // Atualizar distância do objeto em tempo real via WebSocket
        if (typeof distance === 'number') {
          setDetectedObjectDistance(distance);
        }

        if (alertLevel === 'danger') {
          hapticsService.vibratePattern([200, 100, 200, 100, 300]).catch(err => {
            console.error('Erro ao vibrar padrão:', err);
          });
          showToast('Perigo! Objeto muito próximo.', 'warning');
        }

        return;
      }
    } catch (error) {
      console.error('Erro ao processar mensagem WebSocket:', error);
    }
  }, [lastDetection]);

  const testWithHistoryItem = (item: DetectionHistory) => {
    console.log('Testando com item do histórico:', item);
    setCurrentTranscription(item.text);

    // Enviar para ESP32 via WebSocket se conectado
    if (wsConnected) {
      sendWebSocketMessage({
        type: 'test',
        data: {
          text: item.text,
          timestamp: item.timestamp,
        },
      });
    }
  };

  const value = {
    allSystemsConnected: false,
    mode,
    setMode,
    connectionStatus,
    setConnectionStatus,
    volume,
    setVolume,
    setSystemVolume,
    getSystemVolume,
    wsConnected,
    lastDetection,
    detectionHistory,
    sendWebSocketMessage,
    connectWebSocket,
    disconnectWebSocket,
    currentTranscription,
    testWithHistoryItem,
    stats,
    toast,
    showToast,
    hideToast,
    serverOnline,
    connectedDevices,
    esp32Status,
    systemsHealth,
    detectedObjectDistance,
    apiUrl,
    setApiUrl,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};