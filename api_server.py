"""
==========================================
  Detection API - FastAPI
==========================================

Orientação:

1. Instale as dependências:
   pip install -r requirements.txt

2. Rode o servidor:
   python api_server.py
   # ou
   uvicorn api_server:app --reload --host 0.0.0.0 --port 8000

3. Endpoints disponíveis:
   - POST   /detections   : Recebe lote de detecções (JSON)
   - GET    /detections   : Consulta últimas detecções (param: limit)
   - GET    /stats        : Estatísticas gerais
   - DELETE /detections   : Limpa histórico

4. Documentação interativa:
   http://localhost:8000/docs

5. Webhook externo:
   Sempre que um POST /detections for recebido, um resumo é enviado para:
   http://included-mongoose-great.ngrok-free.app/api/esp32-cam/send-description

6. Exemplo de payload aceito em POST /detections:
   {
     "timestamp": "2025-11-15T22:09:12.347423",
     "detections": [
       {
         "class": "person",
         "confidence": 0.26,
         "hits": 9,
         "age": 0,
         "bbox": [16,158,97,239],
         "verified": true
       }
     ]
   }

7. Exemplo de payload enviado ao webhook externo:
   {
     "description_pt": "Detectado: person",
     "description_kz": "Анықталды: person",
     "objects": ["person"],
     "confidence": 0.26
   }

==========================================
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import json
import requests
from threading import Thread

app = FastAPI(title="Detection API", version="1.0")

EXTERNAL_API_URL = "http://included-mongoose-great.ngrok-free.app/api/esp32-cam/send-description"

class Detection(BaseModel):
    class_name: Optional[str] = Field(None, alias='class')
    confidence: float
    hits: int
    age: int
    bbox: List[int]
    verified: bool

    class Config:
        populate_by_name = True

class DetectionBatch(BaseModel):
    timestamp: str
    detections: List[Detection]

detection_history = []

def send_to_external_api(batch: DetectionBatch):
    """Envia para API externa em thread separada (não bloqueia)"""
    try:
        objects = list(set([det.class_name for det in batch.detections if det.class_name]))
        avg_confidence = sum(det.confidence for det in batch.detections) / len(batch.detections) if batch.detections else 0.0
        
        if objects:
            description_pt = f"Detectado: {', '.join(objects)}"
            description_kz = f"Анықталды: {', '.join(objects)}"  # tradução básica
        else:
            description_pt = "Nenhum objeto detectado"
        
        payload = {
            "description_pt": description_pt,
            "description_kz": description_kz,
            "objects": objects,
            "confidence": round(avg_confidence, 2)
        }
        
        print(f"Enviando para API externa: {payload}")
        response = requests.post(EXTERNAL_API_URL, json=payload, timeout=5)
        
        if response.status_code == 200 or response.status_code == 201:
            print(f"API externa respondeu: {response.status_code}")
        else:
            print(f"API externa retornou: {response.status_code} - {response.text}")
    
    except requests.exceptions.RequestException as e:
        print(f"Erro ao enviar para API externa: {e}")
    except Exception as e:
        print(f"Erro inesperado no envio externo: {e}")

@app.post("/detections")
async def receive_detections(batch: DetectionBatch):
    try:
        detection_history.append(batch.dict())
        if len(detection_history) > 1000:
            detection_history.pop(0)
        
        print(f"Recebido em {batch.timestamp}: {len(batch.detections)} detecções")
        for det in batch.detections:
            print(f"   - {det.class_name} ({det.confidence}) hits={det.hits}")
        
        Thread(target=send_to_external_api, args=(batch,), daemon=True).start()
        
        return {"status": "ok", "received": len(batch.detections)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/detections")
async def get_detections(limit: int = 10):
    """Retorna últimas N detecções"""
    return detection_history[-limit:]

@app.get("/stats")
async def get_stats():
    """Retorna estatísticas gerais"""
    if not detection_history:
        return {"total_batches": 0, "total_detections": 0}
    
    total_dets = sum(len(batch['detections']) for batch in detection_history)
    classes = {}
    for batch in detection_history:
        for det in batch['detections']:
            cls = det['class_name']
            classes[cls] = classes.get(cls, 0) + 1
    
    return {
        "total_batches": len(detection_history),
        "total_detections": total_dets,
        "classes": classes
    }

@app.delete("/detections")
async def clear_history():
    """Limpa histórico"""
    detection_history.clear()
    return {"status": "cleared"}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Iniciando servidor FastAPI em http://localhost:8000")
    print("📖 Docs interativa: http://localhost:8000/docs")
    print(f"🔗 Webhook externo: {EXTERNAL_API_URL}")
    uvicorn.run(app, host="0.0.0.0", port=8000)