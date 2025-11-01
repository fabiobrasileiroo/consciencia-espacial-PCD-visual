import React, { useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { storageService, ttsService } from '../services/service-provider';

/**
 * Exemplo de integração dos serviços mockáveis no app
 * 
 * Este componente demonstra como usar os serviços de forma
 * que funcionem tanto em produção quanto em testes.
 */

interface HistoryItem {
  id: string;
  text: string;
  timestamp: string;
}

export default function ExampleScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  // Carrega histórico ao montar
  useEffect(() => {
    loadHistory();
    connectWebSocket();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await storageService.get('ui_history');
      if (data) {
        setHistory(JSON.parse(data));
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const connectWebSocket = () => {
    // URL do WebSocket (use env var para diferenciar mock/prod)
    const wsUrl = process.env.WS_URL || 'ws://localhost:8080/ws';

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket conectado');
      setWsConnected(true);
    };

    ws.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.event === 'texto_detectado') {
          await handleTextDetected(message.data);
        }
      } catch (error) {
        console.error('Erro ao processar mensagem:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket desconectado');
      setWsConnected(false);

      // Reconectar após 1s (backoff simples)
      setTimeout(() => connectWebSocket(), 1000);
    };

    ws.onerror = (error) => {
      console.error('Erro no WebSocket:', error);
    };
  };

  const handleTextDetected = async (data: { id: string; text: string }) => {
    // Verifica deduplicação
    const isDuplicate = history.some(item => item.id === data.id);

    if (!isDuplicate) {
      // Fala o texto
      await ttsService.speak(data.text);

      // Adiciona ao histórico
      const newItem: HistoryItem = {
        id: data.id,
        text: data.text,
        timestamp: new Date().toISOString(),
      };

      const updatedHistory = [...history, newItem];
      setHistory(updatedHistory);

      // Persiste
      await storageService.set('ui_history', JSON.stringify(updatedHistory));
    }
  };

  const testSound = async () => {
    await ttsService.speak('Teste de som');
  };

  const clearHistory = async () => {
    setHistory([]);
    await storageService.remove('ui_history');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PDC Visual</Text>
        <Text style={styles.status}>
          WebSocket: {wsConnected ? '🟢 Conectado' : '🔴 Desconectado'}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button title="Testar Som" onPress={testSound} />
        <Button title="Limpar Histórico" onPress={clearHistory} color="red" />
      </View>

      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Histórico</Text>
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.historyItem}>
              <Text style={styles.historyText}>{item.text}</Text>
              <Text style={styles.historyTime}>
                {new Date(item.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum item no histórico</Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  historyContainer: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  historyItem: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  historyText: {
    fontSize: 16,
    marginBottom: 4,
  },
  historyTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
});
