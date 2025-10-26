import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { hapticsService, storageService, ttsService } from '@/services/service-provider';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const [forceSpeaker, setForceSpeaker] = useState(false);
  const [enableHaptics, setEnableHaptics] = useState(true);
  const [enableTTS, setEnableTTS] = useState(true);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const forceSpeakerValue = await storageService.get('forceSpeaker');
      const enableHapticsValue = await storageService.get('enableHaptics');
      const enableTTSValue = await storageService.get('enableTTS');
      const autoReconnectValue = await storageService.get('autoReconnect');

      setForceSpeaker(forceSpeakerValue === 'true');
      setEnableHaptics(enableHapticsValue !== 'false'); // Default true
      setEnableTTS(enableTTSValue !== 'false'); // Default true
      setAutoReconnect(autoReconnectValue !== 'false'); // Default true
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const toggleForceSpeaker = async (value: boolean) => {
    setForceSpeaker(value);
    await storageService.set('forceSpeaker', value.toString());
    await hapticsService.impact('light');
  };

  const toggleEnableHaptics = async (value: boolean) => {
    setEnableHaptics(value);
    await storageService.set('enableHaptics', value.toString());
    if (value) {
      await hapticsService.impact('medium');
    }
  };

  const toggleEnableTTS = async (value: boolean) => {
    setEnableTTS(value);
    await storageService.set('enableTTS', value.toString());
    if (value) {
      await ttsService.speak('Text to Speech ativado');
    }
  };

  const toggleAutoReconnect = async (value: boolean) => {
    setAutoReconnect(value);
    await storageService.set('autoReconnect', value.toString());
    await hapticsService.impact('light');
  };

  const testSound = async () => {
    try {
      await ttsService.speak('Teste de som. Sistema funcionando corretamente.');
      await hapticsService.impact('medium');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível reproduzir o som');
    }
  };

  const sendLogs = async () => {
    Alert.alert(
      'Enviar Logs',
      'Deseja enviar os logs de diagnóstico?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            try {
              // Coleta histórico
              const history = await storageService.get('ui_history');

              const payload = {
                timestamp: new Date().toISOString(),
                history: history ? JSON.parse(history) : [],
                settings: {
                  forceSpeaker,
                  enableHaptics,
                  enableTTS,
                  autoReconnect,
                },
                appVersion: '1.0.0',
              };

              const url = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
              const response = await fetch(`${url}/logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });

              if (response.ok) {
                Alert.alert('Sucesso', 'Logs enviados com sucesso!');
                await hapticsService.impact('light');
              } else {
                throw new Error('Falha ao enviar logs');
              }
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível enviar os logs');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const clearAllData = async () => {
    Alert.alert(
      'Limpar Dados',
      'Isso irá apagar todo o histórico e configurações. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar Tudo',
          style: 'destructive',
          onPress: async () => {
            await storageService.clear();
            loadSettings();
            Alert.alert('Sucesso', 'Todos os dados foram apagados');
            await hapticsService.impact('medium');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Audio Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
            🔊 Áudio
          </Text>

          <View style={[styles.card, isDark && styles.cardDark]}>
            <View style={styles.setting}>
              <View style={styles.settingLeft}>
                <IconSymbol name="speaker.wave.2" size={24} color={isDark ? '#fff' : '#000'} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, isDark && styles.textDark]}>
                    Forçar Alto-falante
                  </Text>
                  <Text style={[styles.settingDescription, isDark && styles.textSecondaryDark]}>
                    Sempre usar o alto-falante do celular
                  </Text>
                </View>
              </View>
              <Switch
                value={forceSpeaker}
                onValueChange={toggleForceSpeaker}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={forceSpeaker ? '#2196F3' : '#f4f3f4'}
              />
            </View>

            <View style={styles.separator} />

            <View style={styles.setting}>
              <View style={styles.settingLeft}>
                <IconSymbol name="text.bubble" size={24} color={isDark ? '#fff' : '#000'} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, isDark && styles.textDark]}>
                    Text-to-Speech
                  </Text>
                  <Text style={[styles.settingDescription, isDark && styles.textSecondaryDark]}>
                    Ler textos detectados em voz alta
                  </Text>
                </View>
              </View>
              <Switch
                value={enableTTS}
                onValueChange={toggleEnableTTS}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={enableTTS ? '#2196F3' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Haptics Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
            📳 Vibração
          </Text>

          <View style={[styles.card, isDark && styles.cardDark]}>
            <View style={styles.setting}>
              <View style={styles.settingLeft}>
                <IconSymbol name="iphone.radiowaves.left.and.right" size={24} color={isDark ? '#fff' : '#000'} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, isDark && styles.textDark]}>
                    Feedback Háptico
                  </Text>
                  <Text style={[styles.settingDescription, isDark && styles.textSecondaryDark]}>
                    Vibrar ao detectar objetos
                  </Text>
                </View>
              </View>
              <Switch
                value={enableHaptics}
                onValueChange={toggleEnableHaptics}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={enableHaptics ? '#2196F3' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Connection Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
            🌐 Conexão
          </Text>

          <View style={[styles.card, isDark && styles.cardDark]}>
            <View style={styles.setting}>
              <View style={styles.settingLeft}>
                <IconSymbol name="arrow.clockwise" size={24} color={isDark ? '#fff' : '#000'} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, isDark && styles.textDark]}>
                    Reconexão Automática
                  </Text>
                  <Text style={[styles.settingDescription, isDark && styles.textSecondaryDark]}>
                    Reconectar ao servidor automaticamente
                  </Text>
                </View>
              </View>
              <Switch
                value={autoReconnect}
                onValueChange={toggleAutoReconnect}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={autoReconnect ? '#2196F3' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
            ⚙️ Ações
          </Text>

          <TouchableOpacity
            style={[styles.actionButton, isDark && styles.actionButtonDark]}
            onPress={testSound}
          >
            <IconSymbol name="speaker.wave.3" size={24} color="#2196F3" />
            <Text style={[styles.actionButtonText, isDark && styles.textDark]}>
              Testar Som
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, isDark && styles.actionButtonDark]}
            onPress={sendLogs}
          >
            <IconSymbol name="arrow.up.doc" size={24} color="#FF9800" />
            <Text style={[styles.actionButtonText, isDark && styles.textDark]}>
              Enviar Logs de Diagnóstico
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDanger, isDark && styles.actionButtonDangerDark]}
            onPress={clearAllData}
          >
            <IconSymbol name="trash" size={24} color="#f44336" />
            <Text style={[styles.actionButtonText, styles.actionButtonDangerText]}>
              Limpar Todos os Dados
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, isDark && styles.textSecondaryDark]}>
            PDC Visual v1.0.0
          </Text>
          <Text style={[styles.footerText, isDark && styles.textSecondaryDark]}>
            Sistema de Auxílio Visual
          </Text>
        </View>
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
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  textDark: {
    color: '#fff',
  },
  textSecondaryDark: {
    color: '#999',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardDark: {
    backgroundColor: '#1e1e1e',
  },
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginLeft: 52,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonDark: {
    backgroundColor: '#1e1e1e',
  },
  actionButtonDanger: {
    borderWidth: 1,
    borderColor: '#f44336',
  },
  actionButtonDangerDark: {
    borderColor: '#f44336',
    backgroundColor: '#1e1e1e',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  actionButtonDangerText: {
    color: '#f44336',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
});
