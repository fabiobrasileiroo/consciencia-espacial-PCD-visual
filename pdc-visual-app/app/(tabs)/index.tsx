import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { hapticsService, ttsService } from '@/services/service-provider';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const [isTesting, setIsTesting] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleTestAudio = async () => {
    try {
      setIsTesting(true);
      await hapticsService.impact('medium');
      await ttsService.speak('Bem-vindo ao PDC Visual. Sistema de áudio funcionando corretamente!');
      await hapticsService.impact('light');
    } catch (error) {
      console.error('Erro ao testar áudio:', error);
    } finally {
      setTimeout(() => setIsTesting(false), 2000);
    }
  };

  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <IconSymbol name="eye.fill" size={80} color="#2196F3" />
        </View>
        <Text style={[styles.title, isDark && styles.textDark]}>PDC Visual</Text>
        <Text style={[styles.subtitle, isDark && styles.textSecondaryDark]}>
          Sistema de Detecção e Alertas
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.testButton, isTesting && styles.testButtonActive]}
        onPress={handleTestAudio}
        disabled={isTesting}
        activeOpacity={0.8}
      >
        <IconSymbol
          name={isTesting ? "speaker.wave.3.fill" : "speaker.wave.2.fill"}
          size={32}
          color="#fff"
        />
        <Text style={styles.testButtonText}>
          {isTesting ? 'Testando...' : 'Testar Áudio'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  containerDark: { backgroundColor: '#121212' },
  content: { padding: 20, paddingTop: 40 },
  header: { alignItems: 'center', marginBottom: 40 },
  iconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  textDark: { color: '#fff' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
  textSecondaryDark: { color: '#999' },
  testButton: { backgroundColor: '#2196F3', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 16, marginBottom: 32, gap: 12, shadowColor: '#2196F3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  testButtonActive: { backgroundColor: '#1976D2', transform: [{ scale: 0.98 }] },
  testButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
