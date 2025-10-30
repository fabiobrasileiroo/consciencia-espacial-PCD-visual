export interface VisionDetection {
  id: string;
  moduleId: string;
  objects: Array<{
    name: string;
    confidence: number;
    description?: string;
  }>;
  timestamp: Date;
  metrics?: {
    captureTime?: number;
    detectionTime?: number;
    sendTime?: number;
    totalTime?: number;
    freeHeap?: number;
    rssi?: number;
    fps?: number;
  };
}
