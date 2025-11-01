import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: 'detection' | 'transcription' | 'status' | 'error';
  data: any;
  timestamp: string;
}

interface UseWebSocketOptions {
  url: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const {
    url,
    autoConnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    try {
      console.log('Conectando ao WebSocket:', url);

      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('WebSocket conectado');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          // Verificar se a mensagem não está vazia
          if (!event.data || typeof event.data !== 'string') {
            console.warn('Mensagem WebSocket vazia ou inválida');
            return;
          }

          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('Mensagem recebida do WebSocket:', message);
          setLastMessage(message);
        } catch (err) {
          console.error('Erro ao processar mensagem do WebSocket:', err);
          console.error('Dados recebidos:', event.data);
          // Não setar erro aqui para não desconectar por mensagens malformadas
        }
      };

      ws.onerror = (event) => {
        console.error('Erro no WebSocket:', event);
        setError(new Error('Erro na conexão WebSocket'));
      };

      ws.onclose = () => {
        console.log('WebSocket desconectado');
        setIsConnected(false);
        wsRef.current = null;

        // Tentar reconectar
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          console.log(
            `Tentando reconectar (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          console.error('Número máximo de tentativas de reconexão atingido');
          setError(new Error('Não foi possível conectar ao servidor'));
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Erro ao criar WebSocket:', err);
      setError(err as Error);
    }
  }, [url, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    reconnectAttemptsRef.current = maxReconnectAttempts; // Impedir reconexão automática
  }, [maxReconnectAttempts]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      wsRef.current.send(messageString);
      console.log('Mensagem enviada:', messageString);
      return true;
    } else {
      console.error('WebSocket não está conectado');
      return false;
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    error,
    connect,
    disconnect,
    sendMessage,
  };
}
