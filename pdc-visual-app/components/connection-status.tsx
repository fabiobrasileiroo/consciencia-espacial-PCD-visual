import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface ConnectionStatusProps {
  isConnected: boolean;
  isReconnecting?: boolean;
  serverUrl?: string;
}

export function ConnectionStatus({ isConnected, isReconnecting, serverUrl }: ConnectionStatusProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getStatusText = () => {
    if (isReconnecting) return 'Reconectando...';
    return isConnected ? 'Conectado' : 'Desconectado';
  };

  const getStatusColor = () => {
    if (isReconnecting) return '#FF9800';
    return isConnected ? '#4CAF50' : '#f44336';
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.content}>
        <View style={styles.statusIndicator}>
          {isReconnecting ? (
            <ActivityIndicator size="small" color="#FF9800" />
          ) : (
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          )}
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.statusText, isDark && styles.textDark, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
          {serverUrl && (
            <Text style={[styles.urlText, isDark && styles.textSecondaryDark]} numberOfLines={1}>
              {serverUrl}
            </Text>
          )}
        </View>

        <IconSymbol
          name={isConnected ? "checkmark.circle.fill" : "xmark.circle.fill"}
          size={24}
          color={getStatusColor()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  containerDark: {
    backgroundColor: '#1e1e1e',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  textDark: {
    color: '#fff',
  },
  textSecondaryDark: {
    color: '#999',
  },
  urlText: {
    fontSize: 12,
    color: '#666',
  },
});
