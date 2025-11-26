import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HistoryItemCardProps {
  id: string;
  text: string;
  timestamp: string;
  objects?: string[];
  confidence?: number;
  onPress?: () => void;
  onDelete?: () => void;
  onTest?: () => void;
  onReplay?: () => void;
}

export function HistoryItemCard({ text, timestamp, objects, confidence, onPress, onDelete, onTest, onReplay }: HistoryItemCardProps) {
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

          {/* Objetos detectados */}
          {objects && objects.length > 0 && (
            <View style={styles.objectsContainer}>
              {objects.slice(0, 5).map((obj, index) => (
                <View key={index} style={[styles.objectTag, isDark && styles.objectTagDark]}>
                  <Text style={[styles.objectText, isDark && styles.objectTextDark]}>
                    {obj}
                  </Text>
                </View>
              ))}
              {objects.length > 5 && (
                <Text style={[styles.moreObjects, isDark && styles.textSecondaryDark]}>
                  +{objects.length - 5}
                </Text>
              )}
            </View>
          )}

          <View style={styles.footer}>
            <IconSymbol name="clock" size={14} color="#999" />
            <Text style={[styles.time, isDark && styles.textSecondaryDark]}>
              {formatTime(timestamp)}
            </Text>
            {confidence && (
              <>
                <Text style={[styles.separator, isDark && styles.textSecondaryDark]}>•</Text>
                <Text style={[styles.confidence, isDark && styles.textSecondaryDark]}>
                  {(confidence * 100).toFixed(0)}%
                </Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          {onReplay && (
            <TouchableOpacity
              style={styles.testButton}
              onPress={onReplay}
              accessibilityLabel="Reproduzir TTS"
              accessibilityHint="Pressione para reproduzir esta detecção em voz sintética"
            >
              <IconSymbol name="play.circle.fill" size={24} color="#4CAF50" />
            </TouchableOpacity>
          )}

          {onTest && (
            <TouchableOpacity
              style={styles.testButton}
              onPress={onTest}
              accessibilityLabel="Testar transcrição"
              accessibilityHint="Pressione para enviar esta detecção para teste"
            >
              <IconSymbol name="paperplane.fill" size={20} color="#3B82F6" />
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={onDelete}
              accessibilityLabel="Deletar"
              accessibilityHint="Pressione para remover este item do histórico"
            >
              <IconSymbol name="trash" size={20} color="#f44336" />
            </TouchableOpacity>
          )}
        </View>
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
  objectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 8,
  },
  objectTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  objectTagDark: {
    backgroundColor: '#1a3a52',
    borderColor: '#2196F3',
  },
  objectText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  objectTextDark: {
    color: '#64B5F6',
  },
  moreObjects: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'center',
  },
  separator: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 4,
  },
  confidence: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
});
