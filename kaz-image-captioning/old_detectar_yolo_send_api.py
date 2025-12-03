import cv2
import numpy as np
import requests
import tensorflow as tf
import time
import os
from collections import deque
from datetime import datetime

URL = 'http://192.168.0.139:81/stream'

TFLITE_MODEL = 'tflite_learn_810340_10.tflite'
tflite_interpreter = tf.lite.Interpreter(model_path=TFLITE_MODEL)
tflite_interpreter.allocate_tensors()
t_in = tflite_interpreter.get_input_details()[0]
t_out = tflite_interpreter.get_output_details()[0]
IN_H, IN_W = t_in['shape'][1], t_in['shape'][2]
in_scale, in_zero = t_in.get('quantization', (1.0, 0))
out_scale, out_zero = t_out.get('quantization', (1.0, 0))

COCO_LABELS = [
    'person','bicycle','car','motorcycle','airplane','bus','train','truck','boat','traffic light',
    'fire hydrant','stop sign','parking meter','bench','bird','cat','dog','horse','sheep','cow',
    'elephant','bear','zebra','giraffe','backpack','umbrella','handbag','tie','suitcase','frisbee',
    'skis','snowboard','sports ball','kite','baseball bat','baseball glove','skateboard','surfboard',
    'tennis racket','bottle','wine glass','cup','fork','knife','spoon','bowl','banana','apple',
    'sandwich','orange','broccoli','carrot','hot dog','pizza','donut','cake','chair','couch',
    'potted plant','bed','dining table','toilet','tv','laptop','mouse','remote','keyboard','cell phone',
    'microwave','oven','toaster','sink','refrigerator','book','clock','vase','scissors','teddy bear',
    'hair drier','toothbrush'
]

COCO_LABELS_PT = {
    'person': 'pessoa',
    'bicycle': 'bicicleta',
    'car': 'carro',
    'motorcycle': 'moto',
    'airplane': 'avião',
    'bus': 'ônibus',
    'train': 'trem',
    'truck': 'caminhão',
    'boat': 'barco',
    'traffic light': 'semáforo',
    'fire hydrant': 'hidrante',
    'stop sign': 'placa de pare',
    'parking meter': 'parquímetro',
    'bench': 'banco',
    'bird': 'pássaro',
    'cat': 'gato',
    'dog': 'cachorro',
    'horse': 'cavalo',
    'sheep': 'ovelha',
    'cow': 'vaca',
    'elephant': 'elefante',
    'bear': 'urso',
    'zebra': 'zebra',
    'giraffe': 'girafa',
    'backpack': 'mochila',
    'umbrella': 'guarda-chuva',
    'handbag': 'bolsa',
    'tie': 'gravata',
    'suitcase': 'mala',
    'frisbee': 'frisbee',
    'skis': 'esquis',
    'snowboard': 'snowboard',
    'sports ball': 'bola',
    'kite': 'pipa',
    'baseball bat': 'taco de beisebol',
    'baseball glove': 'luva de beisebol',
    'skateboard': 'skate',
    'surfboard': 'prancha de surf',
    'tennis racket': 'raquete de tênis',
    'bottle': 'garrafa',
    'wine glass': 'taça de vinho',
    'cup': 'copo',
    'fork': 'garfo',
    'knife': 'faca',
    'spoon': 'colher',
    'bowl': 'tigela',
    'banana': 'banana',
    'apple': 'maçã',
    'sandwich': 'sanduíche',
    'orange': 'laranja',
    'broccoli': 'brócolis',
    'carrot': 'cenoura',
    'hot dog': 'cachorro-quente',
    'pizza': 'pizza',
    'donut': 'rosquinha',
    'cake': 'bolo',
    'chair': 'cadeira',
    'couch': 'sofá',
    'potted plant': 'planta em vaso',
    'bed': 'cama',
    'dining table': 'mesa de jantar',
    'toilet': 'vaso sanitário',
    'tv': 'televisão',
    'laptop': 'notebook',
    'mouse': 'mouse',
    'remote': 'controle remoto',
    'keyboard': 'teclado',
    'cell phone': 'celular',
    'microwave': 'micro-ondas',
    'oven': 'forno',
    'toaster': 'torradeira',
    'sink': 'pia',
    'refrigerator': 'geladeira',
    'book': 'livro',
    'clock': 'relógio',
    'vase': 'vaso',
    'scissors': 'tesoura',
    'teddy bear': 'urso de pelúcia',
    'hair drier': 'secador de cabelo',
    'toothbrush': 'escova de dentes'
}

CONF_THRESHOLD = 0.10
IOU_THRESHOLD = 0.45

MIN_PERSISTENCE_FRAMES = 5 
TRACKER_MIN_AVG_SCORE = 0.15
MIN_BOX_AREA_RATIO = 0.02     
MATCH_IOU = 0.4
MAX_TRACK_AGE = 6
VERIFIED_TTL = 6

MOTION_FRAC_THRESH = 0.05
INSTANT_VERIFY_SCORE = 0.40

# Configurações de envio ao servidor
API_URL = "http://localhost:8000/detections"  # URL da sua API FastAPI
SEND_INTERVAL = 2.0  # envia a cada 2 segundos (evita spam)
detection_queue = deque(maxlen=100)  # buffer de detecções
last_send_time = 0

def send_to_api(detections_list):
    """Envia lista de detecções para API FastAPI"""
    try:
        payload = {
            "timestamp": datetime.now().isoformat(),
            "detections": detections_list
        }
        response = requests.post(API_URL, json=payload, timeout=2)
        if response.status_code == 200:
            print(f"✅ Enviado {len(detections_list)} detecções para API")
        else:
            print(f"⚠️  API retornou status {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro ao enviar para API: {e}")

def iou_xyxy(a, b):
    xa1, ya1, xa2, ya2 = a
    xb1, yb1, xb2, yb2 = b
    xi1 = max(xa1, xb1); yi1 = max(ya1, yb1)
    xi2 = min(xa2, xb2); yi2 = min(ya2, yb2)
    if xi2 <= xi1 or yi2 <= yi1:
        return 0.0
    inter = (xi2 - xi1) * (yi2 - yi1)
    area_a = max(0, xa2 - xa1) * max(0, ya2 - ya1)
    area_b = max(0, xb2 - xb1) * max(0, yb2 - yb1)
    union = area_a + area_b - inter
    return inter / union if union > 0 else 0.0

class DetectionTracker:
    def __init__(self):
        self.tracks = []

    def update(self, candidates):
        for t in self.tracks:
            t['age'] += 1
            t['verified_ttl'] = max(0, t.get('verified_ttl', 0) - 1)

        for c in candidates:
            best = None; best_iou = 0.0
            for t in self.tracks:
                if t['cls'] != c['cls']:
                    continue
                i = iou_xyxy(t['box'], c['box'])
                if i > best_iou:
                    best_iou = i; best = t
            if best and best_iou >= MATCH_IOU:
                best['age'] = 0
                best['hits'] += 1
                best['score'] = (best['score'] * 0.6) + (c['score'] * 0.4)
                bb = best['box']; cb = c['box']
                best['box'] = [(bb[i] + cb[i]) / 2.0 for i in range(4)]
                if c.get('verified_now', False):
                    best['verified_ttl'] = VERIFIED_TTL
            else:
                self.tracks.append({
                    'cls': c['cls'],
                    'box': c['box'],
                    'score': c['score'],
                    'hits': 1,
                    'age': 0,
                    'verified_ttl': VERIFIED_TTL if c.get('verified_now', False) else 0
                })

        self.tracks = [t for t in self.tracks if t['age'] <= MAX_TRACK_AGE]

        confirmed = []
        for t in self.tracks:
            bx = t['box']
            box_area = max(0, bx[2] - bx[0]) * max(0, bx[3] - bx[1])
            if box_area < MIN_BOX_AREA_RATIO:
                continue
            cond_persistent = (t['hits'] >= MIN_PERSISTENCE_FRAMES)
            cond_score = (t['score'] >= TRACKER_MIN_AVG_SCORE)
            cond_verified = (t.get('verified_ttl', 0) > 0)
            if cond_persistent or cond_score or cond_verified:
                confirmed.append(t)
        return confirmed

def xywh2xyxy(x):
    y = np.copy(x)
    y[..., 0] = x[..., 0] - x[..., 2] / 2.0
    y[..., 1] = x[..., 1] - x[..., 3] / 2.0
    y[..., 2] = x[..., 0] + x[..., 2] / 2.0
    y[..., 3] = x[..., 1] + x[..., 3] / 2.0
    return y

def do_nms(boxes, scores, iou_threshold=IOU_THRESHOLD, max_output=50):
    if len(boxes) == 0:
        return np.array([], dtype=np.int32)
    boxes_tf = tf.convert_to_tensor(boxes, dtype=tf.float32)
    scores_tf = tf.convert_to_tensor(scores, dtype=tf.float32)
    idx = tf.image.non_max_suppression(boxes_tf, scores_tf, max_output, iou_threshold=iou_threshold)
    return idx.numpy()

def connect_stream(url, timeout=5):
    try:
        resp = requests.get(url, stream=True, timeout=(timeout, timeout))
        resp.raise_for_status()
        print("Conectado ao stream")
        return resp
    except Exception as e:
        print("Falha ao conectar:", e)
        return None

reconnect_delay = 2.0
max_silence = 5.0

results_dir = "resultados"
os.makedirs(results_dir, exist_ok=True)
capture_count = 0

tracker = DetectionTracker()
bg_sub = cv2.createBackgroundSubtractorMOG2(history=200, varThreshold=25, detectShadows=False)

while True:
    resp = connect_stream(URL)
    if resp is None:
        time.sleep(reconnect_delay)
        continue

    stream = resp.iter_content(chunk_size=1024)
    bytes_buffer = b''
    last_frame_time = time.time()

    try:
        for chunk in stream:
            if not chunk:
                if time.time() - last_frame_time > max_silence:
                    print("Sem dados por muito tempo, reconectando...")
                    raise requests.RequestException("timeout no stream")
                continue

            bytes_buffer += chunk
            if len(bytes_buffer) > 300000:
                bytes_buffer = bytes_buffer[-300000:]

            start = bytes_buffer.find(b'\xff\xd8')
            end   = bytes_buffer.find(b'\xff\xd9')
            if start == -1 or end == -1:
                if time.time() - last_frame_time > max_silence:
                    print("Frame incompleto por muito tempo, reconectando...")
                    raise requests.RequestException("frame incompleto")
                continue

            jpg = bytes_buffer[start:end+2]
            bytes_buffer = bytes_buffer[end+2:]

            if len(jpg) < 5000:
                continue
            if not (jpg.startswith(b'\xff\xd8') and jpg.endswith(b'\xff\xd9')):
                continue

            arr = np.frombuffer(jpg, dtype=np.uint8)
            if arr.size < 5000:
                continue

            frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if frame is None:
                continue

            last_frame_time = time.time()

            display = frame.copy()
            h_orig, w_orig = frame.shape[:2]

            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            resized = cv2.resize(frame_rgb, (IN_W, IN_H))
            input_data = np.expand_dims(resized, axis=0)

            if t_in['dtype'] == np.uint8:
                if in_scale != 0:
                    input_data = (input_data / in_scale + in_zero).astype(np.uint8)
                else:
                    input_data = input_data.astype(np.uint8)
            else:
                input_data = (np.float32(input_data) - 127.5) / 127.5

            try:
                tflite_interpreter.set_tensor(t_in['index'], input_data)
                tflite_interpreter.invoke()
                output = tflite_interpreter.get_tensor(t_out['index'])
            except Exception as e:
                cv2.putText(display, f"Infer err", (10,30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,0,255),2)
                print("Erro na inferência:", e)
                cv2.imshow("Stream Seguro", display)
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break
                continue

            if t_out['dtype'] == np.uint8:
                if out_scale != 0:
                    output = (output.astype(np.float32) - out_zero) * out_scale
                else:
                    output = output.astype(np.float32)
            else:
                output = output.astype(np.float32)

            if output.ndim == 2 and output.shape[1] > 1 and output.shape[0] == 1:
                probs = output[0]
                top_idx = int(np.argmax(probs))
                top_score = float(probs[top_idx])
                label_name = COCO_LABELS[top_idx] if top_idx < len(COCO_LABELS) else f"class{top_idx}"
                text = f"{label_name}: {top_score:.2f}"
                cv2.putText(display, text, (10,30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,0),2)
            else:
                preds = output[0] if output.ndim == 3 else output
                if preds.ndim == 2 and preds.shape[1] >= 6:
                    obj_conf = preds[:,4]
                    mask_obj = obj_conf > CONF_THRESHOLD
                    preds = preds[mask_obj]

                    if preds.shape[0] == 0:
                        cv2.putText(display, "Nenhuma detec > conf", (10,30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,255),2)
                    else:
                        class_probs = preds[:,5:]
                        class_ids = np.argmax(class_probs, axis=1)
                        class_scores = np.max(class_probs, axis=1)
                        scores = preds[:,4] * class_scores

                        keep = scores > CONF_THRESHOLD
                        preds = preds[keep]
                        scores = scores[keep]
                        class_ids = class_ids[keep]

                        if preds.shape[0] == 0:
                            pass
                        else:
                            boxes_xywh = preds[:,:4]
                            boxes_xyxy = xywh2xyxy(boxes_xywh)
                            boxes_nms = np.stack([boxes_xyxy[:,1], boxes_xyxy[:,0], boxes_xyxy[:,3], boxes_xyxy[:,2]], axis=1)
                            keep_idx = do_nms(boxes_nms, scores, IOU_THRESHOLD, max_output=50)

                            candidates = []
                            fg_mask = bg_sub.apply(frame)
                            for i in keep_idx:
                                x1n, y1n, x2n, y2n = boxes_xyxy[i]
                                cls = int(class_ids[i]); score = float(scores[i])
                                x1p = int(max(0, round(x1n * w_orig))); y1p = int(max(0, round(y1n * h_orig)))
                                x2p = int(min(w_orig-1, round(x2n * w_orig))); y2p = int(min(h_orig-1, round(y2n * h_orig)))
                                if x2p <= x1p or y2p <= y1p:
                                    continue
                                crop_mask = fg_mask[y1p:y2p, x1p:x2p]
                                motion_frac = float(np.count_nonzero(crop_mask)) / (max(1, crop_mask.size))
                                
                                verified_now = False
                                if score >= INSTANT_VERIFY_SCORE:
                                    verified_now = True
                                elif motion_frac >= MOTION_FRAC_THRESH and score >= CONF_THRESHOLD:
                                    verified_now = True

                                candidates.append({'cls': cls, 'box': [x1n, y1n, x2n, y2n], 'score': score, 'verified_now': verified_now})

                            confirmed = tracker.update(candidates)

                            for t in confirmed:
                                cls = int(t['cls']); score = float(t['score'])
                                box = t['box']
                                x1 = int(max(0, round(box[0] * w_orig))); y1 = int(max(0, round(box[1] * h_orig)))
                                x2 = int(min(w_orig-1, round(box[2] * w_orig))); y2 = int(min(h_orig-1, round(box[3] * h_orig)))
                                
                                box_area = max(0, (box[2]-box[0])) * max(0, (box[3]-box[1]))
                                if box_area < MIN_BOX_AREA_RATIO:
                                    continue
                                
                                label_name = COCO_LABELS[cls] if cls < len(COCO_LABELS) else f"cls{cls}"
                                label = f"{label_name} {score:.2f} H{t['hits']} A{t['age']}"
                                
                                color = (0, 255, 0) if t.get('verified_ttl', 0) > 0 else (255, 0, 0)
                                
                                cv2.rectangle(display, (x1,y1), (x2,y2), color, 2)
                                cv2.putText(display, label, (x1, max(15,y1-5)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                                
                                # ADICIONA À FILA DE ENVIO
                                detection_data = {
                                    "class": label_name,
                                    "confidence": round(score, 2),
                                    "hits": t['hits'],
                                    "age": t['age'],
                                    "bbox": [x1, y1, x2, y2],
                                    "verified": t.get('verified_ttl', 0) > 0
                                }
                                detection_queue.append(detection_data)

            # ENVIA PARA API SE PASSOU INTERVALO E TEM DETECÇÕES
            current_time = time.time()
            if current_time - last_send_time >= SEND_INTERVAL and len(detection_queue) > 0:
                send_to_api(list(detection_queue))
                detection_queue.clear()
                last_send_time = current_time

            cv2.imshow("Stream Seguro", display)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                resp.close()
                cv2.destroyAllWindows()
                raise SystemExit()

    except (requests.RequestException, requests.exceptions.ChunkedEncodingError) as e:
        print("Erro no stream, tentando reconectar:", e)
        try:
            resp.close()
        except:
            pass
        time.sleep(reconnect_delay)
        continue
    except KeyboardInterrupt:
        print("Interrompido pelo usuário")
        try:
            resp.close()
        except:
            pass
        break
    except SystemExit:
        break
    except Exception as e:
        print("Erro inesperado, reconectando:", e)
        try:
            resp.close()
        except:
            pass
        time.sleep(reconnect_delay)
        continue

cv2.destroyAllWindows()
