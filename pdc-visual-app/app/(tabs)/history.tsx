import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { useDetections, Detection, DetectionItem } from '@/hooks/use-detections';
import { useApp } from '@/contexts/AppContext';

export default function HistoryScreen() {
  const { showToast } = useApp();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const {
    detections,
    isLoading,
    isSpeaking,
    error,
    refresh,
    speakDetections,
    stopSpeaking,
  } = useDetections({
    url: process.env.EXPO_PUBLIC_API_URL_DETECTIONS ?? '',
    pollingInterval: 0,
    autoStart: false,
  });

  useEffect(() => {
    if (isSpeaking) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => {
        pulse.stop();
        pulseAnim.setValue(1);
      };
    } else {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isSpeaking, pulseAnim]);

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (error) {
      showToast('Erro ao carregar histórico', 'error');
    }
  }, [error]);

  const renderDetectionItem = (det: DetectionItem) => (
    <View key={`${det.class_name}-${det.confidence}`} style={styles.detectionRow}>
      <Text style={styles.detectionClass}>{det.class_name}</Text>
      <Text style={styles.detectionConfidence}>
        {(det.confidence * 100).toFixed(0)}%
      </Text>
      <Text style={styles.detectionHits}>Hits: {det.hits}</Text>
      {det.verified && <Text style={styles.verifiedBadge}>✓</Text>}
    </View>
  );

  const renderItem = ({ item }: { item: Detection }) => {
    const date = new Date(item.timestamp);
    const formattedDate = date.toLocaleString('pt-BR');

    return (
      <View style={styles.card}>
        <Text style={styles.timestamp}>{formattedDate}</Text>
        <View style={styles.detectionsContainer}>
          {item.detections.map(renderDetectionItem)}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.fullScreenButton,
          isSpeaking && styles.fullScreenButtonActive
        ]}
        onPress={() => {
          if (isSpeaking) {
            stopSpeaking();
          } else {
            speakDetections();
          }
        }}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel={isSpeaking ? "Parar leitura" : "Ouvir detecções"}
        accessibilityHint="Toque em qualquer lugar da tela para ouvir os objetos detectados. Toque novamente para parar"
      >
        <View style={styles.fullScreenContent}>
          <Animated.View
            style={[
              styles.iconCircle,
              isSpeaking && styles.iconCircleActive,
              {
                transform: [{ scale: pulseAnim }],
              }
            ]}
          >
            <Ionicons 
              name={isSpeaking ? "volume-mute" : "volume-high"} 
              size={70} 
              color="#FFFFFF"
            />
          </Animated.View>
          
          <Text style={styles.fullScreenText}>
            {isSpeaking ? 'Toque para parar' : 'Toque para ouvir'}
          </Text>
          {detections.length === 0 && !isLoading && !isSpeaking && (
            <Text style={styles.fullScreenSubtext}>
              Nenhuma detecção disponível
            </Text>
          )}
          {isLoading && (
            <Text style={styles.fullScreenSubtext}>
              Carregando...
            </Text>
          )}
        </View>

        {}
        <TouchableOpacity
          style={styles.refreshButtonOverlay}
          onPress={(e) => {
            e.stopPropagation();
            refresh();
          }}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Atualizar detecções"
        >
          <Ionicons 
            name={isLoading ? "hourglass" : "refresh"} 
            size={28} 
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </Pressable>

      {}
      {detections.length > 0 && (
        <View style={styles.listOverlay}>
          <FlatList
            data={detections}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.timestamp}-${index}`}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refresh}
                tintColor="#22C55E"
                colors={['#22C55E']}
              />
            }
          />
        </View>
      )}

      {error && (
        <View style={styles.errorOverlay}>
          {}
          <View style={styles.errorHeader}>
            <Ionicons name="warning" size={24} color="#EF4444" />
            <Text style={styles.errorText}>{error.message}</Text>
          </View>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  
  fullScreenButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  fullScreenButtonActive: {
    backgroundColor: '#22C55E',
  },
  fullScreenContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  fullScreenText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  fullScreenSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  iconCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 4,
    borderColor: '#475569',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  iconCircleActive: {
    backgroundColor: '#22C55E',
    borderColor: '#16A34A',
  },

  refreshButtonOverlay: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#334155',
    padding: 15,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#475569',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },

  listOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 2,
    borderTopColor: '#334155',
    zIndex: 2,
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  timestamp: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  detectionsContainer: {
    gap: 6,
  },
  detectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  detectionClass: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  detectionConfidence: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
  },
  detectionHits: {
    fontSize: 10,
    color: '#64748B',
  },
  verifiedBadge: {
    fontSize: 14,
    color: '#22C55E',
  },

  errorOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EF4444',
    zIndex: 3,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  errorText: {
    flex: 1,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'left', 
  },
  retryButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});