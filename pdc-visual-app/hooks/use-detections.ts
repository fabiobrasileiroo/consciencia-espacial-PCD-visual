import { useEffect, useState, useCallback, useRef } from 'react';
import * as Speech from 'expo-speech';

export interface DetectionItem {
  class_name: string;
  confidence: number;
  hits: number;
  age: number;
  bbox: [number, number, number, number];
  verified: boolean;
}

export interface Detection {
  timestamp: string;
  detections: DetectionItem[];
}

interface UseDetectionsOptions {
  url: string;
  pollingInterval?: number; 
  autoStart?: boolean;
}

export function useDetections(options: UseDetectionsOptions) {
  const { url, pollingInterval = 0, autoStart = false } = options;
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectionsRef = useRef<Detection[]>([]); 

  useEffect(() => {
    detectionsRef.current = detections;
  }, [detections]);

  const fetchDetections = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: Detection[] = await response.json();
      setDetections(data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar detecções:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  const startPolling = useCallback(() => {
    if (pollingInterval <= 0 || intervalRef.current) return;
    setIsPolling(true);
    fetchDetections();
    intervalRef.current = setInterval(fetchDetections, pollingInterval);
  }, [fetchDetections, pollingInterval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const translateObject = (name: string) => {
    const translations: Record<string, string> = {
      person: 'pessoa',
      car: 'carro',
      dog: 'cachorro',
      cat: 'gato',
      airplane: 'avião',
      bicycle: 'bicicleta',

    };
    return translations[name] ?? name;
  };

  const speakDetections = useCallback(() => {
    const currentDetections = detectionsRef.current;
    
    if (currentDetections.length === 0) {
      Speech.speak('Nenhuma detecção disponível', { language: 'pt-BR' });
      return;
    }

    setIsSpeaking(true);

    const allObjects = new Set<string>();
    for (const detection of currentDetections) {
      for (const item of detection.detections) {
        allObjects.add(item.class_name);
      }
    }

    const objectsList = Array.from(allObjects);
    let currentIndex = 0;

    const speakNext = () => {
      if (currentIndex >= objectsList.length) {
        setIsSpeaking(false);
        return;
      }

      const objectName = objectsList[currentIndex];
      const translatedName = translateObject(objectName);
      
      Speech.speak(translatedName, {
        language: 'pt-BR',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => {
          currentIndex++;
          speakNext();
        },
        onStopped: () => {
          setIsSpeaking(false);
        },
      });
    };

    speakNext();
  }, []);

  const stopSpeaking = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    if (autoStart && pollingInterval > 0) {
      startPolling();
    }
    return () => stopPolling();
  }, [autoStart, pollingInterval, startPolling, stopPolling]);

  return {
    detections,
    isLoading,
    isPolling,
    isSpeaking,
    error,
    startPolling,
    stopPolling,
    refresh: fetchDetections,
    speakDetections,
    stopSpeaking,
  };
}