import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  mode: string;
  setMode: (mode: string) => void;
  connectionStatus: string;
  setConnectionStatus: (status: string) => void;
  volume: number;
  setVolume: (volume: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [mode, setMode] = useState('som');
  const [connectionStatus, setConnectionStatus] = useState('desconectado');
  const [volume, setVolume] = useState(50);

  const value = {
    mode,
    setMode,
    connectionStatus,
    setConnectionStatus,
    volume,
    setVolume
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};