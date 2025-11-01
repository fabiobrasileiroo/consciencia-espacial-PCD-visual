import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { batteryService, bluetoothService } from '@/my-expo-app/services/service-provider';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function StatusScreen() {
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isCharging, setIsCharging] = useState(false);
  const [bluetoothConnected, setBluetoothConnected] = useState(false);
  const [bluetoothDevice, setBluetoothDevice] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadStatus();

    // Atualiza a cada 30 segundos
    const interval = setInterval(loadStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      // Battery
      const level = await batteryService.getBatteryLevel();
      const charging = await batteryService.isCharging();
      setBatteryLevel(level);
      setIsCharging(charging);

      // Bluetooth
      const btConnected = await bluetoothService.isConnected();
      const btDevice = await bluetoothService.getConnectedDevice();
      setBluetoothConnected(btConnected);
      setBluetoothDevice(btDevice);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStatus();
    setRefreshing(false);
  };

  const getBatteryColor = () => {
    if (isCharging) return '#4CAF50';
    if (batteryLevel <= 10) return '#f44336';
    if (batteryLevel <= 30) return '#FF9800';
    return '#4CAF50';
  };

  const getBatteryIcon = () => {
    if (isCharging) return 'bolt.fill';
    if (batteryLevel <= 10) return 'battery.0';
    if (batteryLevel <= 30) return 'battery.25';
    if (batteryLevel <= 60) return 'battery.50';
    if (batteryLevel <= 90) return 'battery.75';
    return 'battery.100';
  };

  const getBatteryStatus = () => {
    if (isCharging) return 'Carregando';
    if (batteryLevel <= 10) return 'Bateria crítica';
    if (batteryLevel <= 30) return 'Bateria baixa';
    return 'Bateria boa';
  };

  const getBatterySuggestion = () => {
    if (isCharging) return 'Dispositivo conectado à energia';
    if (batteryLevel <= 10) return 'Conecte o dispositivo à energia urgentemente';
    if (batteryLevel <= 30) return 'Recomendado ativar modo de economia';
    return 'Nenhuma ação necessária';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.textDark]}>
            Status do Dispositivo
          </Text>
          <Text style={[styles.subtitle, isDark && styles.textSecondaryDark]}>
            Última atualização: {formatTime(lastUpdate)}
          </Text>
        </View>

        {/* Battery Status */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <IconSymbol
                name={getBatteryIcon()}
                size={32}
                color={getBatteryColor()}
              />
              <Text style={[styles.cardTitle, isDark && styles.textDark]}>
                Bateria
              </Text>
            </View>
            <Text
              style={[
                styles.batteryPercentage,
                { color: getBatteryColor() }
              ]}
            >
              {batteryLevel}%
            </Text>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, isDark && styles.textSecondaryDark]}>
                Status:
              </Text>
              <Text
                style={[
                  styles.statusValue,
                  isDark && styles.textDark,
                  { color: getBatteryColor() }
                ]}
              >
                {getBatteryStatus()}
              </Text>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${batteryLevel}%`,
                    backgroundColor: getBatteryColor()
                  }
                ]}
              />
            </View>

            <View style={[styles.suggestionBox, { borderLeftColor: getBatteryColor() }]}>
              <IconSymbol
                name="lightbulb"
                size={20}
                color={getBatteryColor()}
              />
              <Text style={[styles.suggestionText, isDark && styles.textSecondaryDark]}>
                {getBatterySuggestion()}
              </Text>
            </View>
          </View>
        </View>

        {/* Bluetooth Status */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <IconSymbol
                name="antenna.radiowaves.left.and.right"
                size={32}
                color={bluetoothConnected ? '#2196F3' : '#999'}
              />
              <Text style={[styles.cardTitle, isDark && styles.textDark]}>
                Bluetooth
              </Text>
            </View>
            <View style={[
              styles.statusBadge,
              bluetoothConnected ? styles.statusBadgeOnline : styles.statusBadgeOffline
            ]}>
              <Text style={styles.statusBadgeText}>
                {bluetoothConnected ? 'Conectado' : 'Desconectado'}
              </Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            {bluetoothConnected && bluetoothDevice ? (
              <View style={styles.deviceInfo}>
                <IconSymbol name="headphones" size={48} color="#2196F3" />
                <Text style={[styles.deviceName, isDark && styles.textDark]}>
                  {bluetoothDevice}
                </Text>
                <Text style={[styles.deviceDescription, isDark && styles.textSecondaryDark]}>
                  Dispositivo de áudio conectado
                </Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <IconSymbol name="antenna.radiowaves.left.and.right.slash" size={48} color="#999" />
                <Text style={[styles.emptyText, isDark && styles.textSecondaryDark]}>
                  Nenhum dispositivo conectado
                </Text>
                <Text style={[styles.emptyHint, isDark && styles.textSecondaryDark]}>
                  O áudio será reproduzido pelo alto-falante
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* System Info */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <IconSymbol name="info.circle" size={32} color="#FF9800" />
              <Text style={[styles.cardTitle, isDark && styles.textDark]}>
                Informações do Sistema
              </Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDark && styles.textSecondaryDark]}>
                Versão do App:
              </Text>
              <Text style={[styles.infoValue, isDark && styles.textDark]}>
                1.0.0
              </Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDark && styles.textSecondaryDark]}>
                Plataforma:
              </Text>
              <Text style={[styles.infoValue, isDark && styles.textDark]}>
                React Native / Expo
              </Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDark && styles.textSecondaryDark]}>
                Status do Servidor:
              </Text>
              <View style={styles.serverStatus}>
                <View style={[styles.statusDot, styles.statusDotOnline]} />
                <Text style={[styles.infoValue, isDark && styles.textDark]}>
                  Online
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Refresh Button */}
        <TouchableOpacity
          style={[styles.refreshButton, isDark && styles.refreshButtonDark]}
          onPress={onRefresh}
        >
          <IconSymbol name="arrow.clockwise" size={24} color="#2196F3" />
          <Text style={styles.refreshButtonText}>
            Atualizar Status
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  content: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 180,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  textDark: {
    color: '#fff',
  },
  textSecondaryDark: {
    color: '#999',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: '#1e1e1e',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  cardBody: {
    gap: 12,
  },
  batteryPercentage: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  suggestionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeOnline: {
    backgroundColor: '#E3F2FD',
  },
  statusBadgeOffline: {
    backgroundColor: '#f5f5f5',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
  },
  deviceInfo: {
    alignItems: 'center',
    padding: 20,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    color: '#000',
  },
  deviceDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    color: '#666',
  },
  emptyHint: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  serverStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotOnline: {
    backgroundColor: '#4CAF50',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  refreshButtonDark: {
    backgroundColor: '#1e1e1e',
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
});
