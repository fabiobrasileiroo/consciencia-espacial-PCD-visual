import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useWebSocket, WebSocketMessage } from '@/hooks/use-websocket';
import { Platform } from 'react-native';

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

interface ToastConfig {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface AppContextType {
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
  lastDetection: WebSocketMessage | null;
  detectionHistory: DetectionHistory[];
  sendWebSocketMessage: (message: any) => boolean;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  currentTranscription: string;
  testWithHistoryItem: (item: DetectionHistory) => void;

  // Stats
  stats: Stats;

  // Toast
  toast: ToastConfig;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  hideToast: () => void;
}const AppContext = createContext<AppContextType | undefined>(undefined);

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
  const [toast, setToast] = useState<ToastConfig>({
    visible: false,
    message: '',
    type: 'info',
  });

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

  // WebSocket - ajuste a URL conforme seu servidor
  const {
    isConnected: wsConnected,
    lastMessage: lastDetection,
    sendMessage: sendWebSocketMessage,
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
  } = useWebSocket({
    url: 'ws://192.168.1.100:3001', // Ajuste conforme necessário
    autoConnect: true, // Conectar automaticamente
  });

  // Monitorar conexão WebSocket e mostrar toast
  useEffect(() => {
    if (wsConnected) {
      showToast('Conectado ao servidor!', 'success');
    }
  }, [wsConnected]);

  // Atualizar histórico quando receber nova detecção
  useEffect(() => {
    if (lastDetection && lastDetection.type === 'detection') {
      const newItem: DetectionHistory = {
        id: Date.now().toString(),
        text: lastDetection.data.text || 'Objeto detectado',
        timestamp: lastDetection.timestamp || new Date().toISOString(),
      };

      setDetectionHistory(prev => [newItem, ...prev].slice(0, 50)); // Manter apenas 50 itens
      setCurrentTranscription(newItem.text);

      // Mostrar toast para nova detecção
      showToast(`Detectado: ${newItem.text}`, 'info');
    } else if (lastDetection && lastDetection.type === 'transcription') {
      setCurrentTranscription(lastDetection.data.text || '');
    }
  }, [lastDetection]); const testWithHistoryItem = (item: DetectionHistory) => {
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