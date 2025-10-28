import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HistoryItemCardProps {
  id: string;
  text: string;
  timestamp: string;
  onPress?: () => void;
  onDelete?: () => void;
}

export function HistoryItemCard({ text, timestamp, onPress, onDelete }: HistoryItemCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <TouchableOpacity
      style={[styles.container, isDark && styles.containerDark]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <IconSymbol name="text.bubble" size={24} color="#2196F3" />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.text, isDark && styles.textDark]} numberOfLines={2}>
            {text}
          </Text>
          <View style={styles.footer}>
            <IconSymbol name="clock" size={14} color="#999" />
            <Text style={[styles.time, isDark && styles.textSecondaryDark]}>
              {formatTime(timestamp)}
            </Text>
          </View>
        </View>

        {onDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
            <IconSymbol name="trash" size={20} color="#f44336" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    overflow: 'hidden',
  },
  containerDark: {
    backgroundColor: '#1e1e1e',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  text: {
    fontSize: 16,
    marginBottom: 6,
    color: '#000',
    lineHeight: 22,
  },
  textDark: {
    color: '#fff',
  },
  textSecondaryDark: {
    color: '#999',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
  },
});
