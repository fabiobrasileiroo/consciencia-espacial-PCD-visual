import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { bluetoothService, hapticsService, storageService, ttsService } from '@/my-expo-app/services/service-provider';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HistoryItem {
  id: string;
  text: string;
  timestamp: string;
}

export default function MainScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [bluetoothConnected, setBluetoothConnected] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadHistory();
    checkBluetoothStatus();
    connectWebSocket();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await storageService.get('ui_history');
      if (data) {
        const parsed = JSON.parse(data);
        setHistory(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const checkBluetoothStatus = async () => {
    try {
      const connected = await bluetoothService.isConnected();
      setBluetoothConnected(connected);
    } catch (error) {
      console.error('Erro ao verificar Bluetooth:', error);
    }
  };

  const connectWebSocket = () => {
    // Use a mesma rede Wi-Fi! Troque pelo seu IP se necessário
    const wsUrl = process.env.EXPO_PUBLIC_WS_URL || 'ws://172.25.26.41:8080/ws';

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket conectado');
        setWsConnected(true);
        setIsListening(true);
      };

      ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.event === 'texto_detectado') {
            await handleTextDetected(message.data);
          } else if (message.event === 'alert_distance') {
            await handleDistanceAlert(message.data);
          }
        } catch (error) {
          console.error('Erro ao processar mensagem:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket desconectado');
        setWsConnected(false);
        setIsListening(false);

        // Reconectar após 2s
        setTimeout(() => connectWebSocket(), 2000);
      };

      ws.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
      };
    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error);
      setWsConnected(false);
    }
  };

  const handleTextDetected = async (data: { id: string; text: string }) => {
    // Verifica deduplicação
    const isDuplicate = history.some(item => item.id === data.id);

    if (!isDuplicate) {
      // Fala o texto
      await ttsService.speak(data.text);

      // Vibra levemente
      await hapticsService.impact('light');

      // Adiciona ao histórico
      const newItem: HistoryItem = {
        id: data.id,
        text: data.text,
        timestamp: new Date().toISOString(),
      };

      const updatedHistory = [newItem, ...history].slice(0, 50); // Limita a 50 itens
      setHistory(updatedHistory);

      // Persiste
      await storageService.set('ui_history', JSON.stringify(updatedHistory));
    }
  };

  const handleDistanceAlert = async (data: { id: string; level: string }) => {
    const { level } = data;

    switch (level) {
      case 'weak':
        await hapticsService.vibrate(100);
        break;
      case 'medium':
        await hapticsService.vibrate(300);
        await ttsService.speak('Atenção: objeto próximo');
        break;
      case 'strong':
        await hapticsService.vibratePattern([200, 100, 200]);
        await ttsService.speak('Alerta: objeto muito próximo');
        break;
    }
  };

  const testSound = async () => {
    try {
      await ttsService.speak('Teste de som. Sistema funcionando corretamente.');
      await hapticsService.impact('medium');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível reproduzir o som');
    }
  };

  const clearHistory = async () => {
    Alert.alert(
      'Limpar Histórico',
      'Deseja realmente limpar todo o histórico?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            setHistory([]);
            await storageService.remove('ui_history');
            await hapticsService.impact('light');
          },
        },
      ]
    );
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, isDark && styles.textDark]}>PDC Visual</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, wsConnected ? styles.statusOnline : styles.statusOffline]} />
            <Text style={[styles.statusText, isDark && styles.textDark]}>
              {wsConnected ? 'Conectado' : 'Desconectado'}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <IconSymbol name="ear" size={20} color={isDark ? '#fff' : '#000'} />
            <Text style={[styles.infoText, isDark && styles.textDark]}>
              {isListening ? 'Escutando' : 'Pausado'}
            </Text>
          </View>

          {bluetoothConnected && (
            <View style={styles.infoItem}>
              <IconSymbol name="speaker.wave.2" size={20} color="#4CAF50" />
              <Text style={[styles.infoText, isDark && styles.textDark, { color: '#4CAF50' }]}>
                Bluetooth
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={testSound}
        >
          <IconSymbol name="speaker.wave.3" size={24} color="#fff" />
          <Text style={styles.buttonText}>Testar Som</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={clearHistory}
          disabled={history.length === 0}
        >
          <IconSymbol name="trash" size={24} color="#fff" />
          <Text style={styles.buttonText}>Limpar</Text>
        </TouchableOpacity>
      </View>

      {/* History */}
      <View style={styles.historyContainer}>
        <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
          Histórico ({history.length})
        </Text>

        <ScrollView
          style={styles.historyScroll}
          showsVerticalScrollIndicator={false}
        >
          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="text.bubble" size={48} color={isDark ? '#666' : '#ccc'} />
              <Text style={[styles.emptyText, isDark && styles.textDark]}>
                Nenhum texto detectado ainda
              </Text>
            </View>
          ) : (
            history.map((item) => (
              <View
                key={item.id}
                style={[styles.historyItem, isDark && styles.historyItemDark]}
              >
                <Text style={[styles.historyText, isDark && styles.textDark]}>
                  {item.text}
                </Text>
                <Text style={[styles.historyTime, isDark && styles.historyTimeDark]}>
                  {formatTime(item.timestamp)}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerDark: {
    backgroundColor: '#1e1e1e',
    borderBottomColor: '#333',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  textDark: {
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusOnline: {
    backgroundColor: '#4CAF50',
  },
  statusOffline: {
    backgroundColor: '#f44336',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  buttonPrimary: {
    backgroundColor: '#2196F3',
  },
  buttonSecondary: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historyContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  historyScroll: {
    flex: 1,
  },
  historyItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  historyItemDark: {
    backgroundColor: '#1e1e1e',
  },
  historyText: {
    fontSize: 16,
    marginBottom: 6,
    color: '#000',
  },
  historyTime: {
    fontSize: 12,
    color: '#999',
  },
  historyTimeDark: {
    color: '#666',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
