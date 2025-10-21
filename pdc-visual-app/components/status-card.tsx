import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface StatusCardProps {
  title: string;
  icon: string;
  status: 'online' | 'offline' | 'warning';
  value?: string;
  description?: string;
  onPress?: () => void;
}

export function StatusCard({ title, icon, status, value, description, onPress }: StatusCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return '#4CAF50';
      case 'offline':
        return '#f44336';
      case 'warning':
        return '#FF9800';
      default:
        return '#999';
    }
  };

  const Content = (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconSymbol name={icon as any} size={32} color={getStatusColor()} />
          <Text style={[styles.title, isDark && styles.textDark]}>{title}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
      </View>

      {value && (
        <Text style={[styles.value, isDark && styles.textDark, { color: getStatusColor() }]}>
          {value}
        </Text>
      )}

      {description && (
        <Text style={[styles.description, isDark && styles.textSecondaryDark]}>
          {description}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {Content}
      </TouchableOpacity>
    );
  }

  return Content;
}

const styles = StyleSheet.create({
  container: {
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
  containerDark: {
    backgroundColor: '#1e1e1e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  textDark: {
    color: '#fff',
  },
  textSecondaryDark: {
    color: '#999',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  value: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
});
