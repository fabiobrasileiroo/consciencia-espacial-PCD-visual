import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './screens/HomeScreen';
import ConfiguracoesScreen from './screens/ConfiguracoesScreen';

import './global.css';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' }, // Ocultamos a tab bar padrão pois já temos uma customizada
          }}
        >
          <Tab.Screen 
            name="Home" 
            component={HomeScreen}
            options={{
              tabBarAccessibilityLabel: 'Tela inicial',
            }}
          />
          <Tab.Screen 
            name="Configuracoes" 
            component={ConfiguracoesScreen}
            options={{
              tabBarAccessibilityLabel: 'Tela de configurações',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </>
  );
}

