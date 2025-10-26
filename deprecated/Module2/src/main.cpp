#include <Arduino.h>
#include "esp_camera.h"
#include <WiFi.h>
#include "esp_http_server.h"
#include "esp_timer.h"
#include "img_converters.h"

// ===== CONFIGURAÇÕES WIFI =====
const char* ssid = "FJ";          // Coloque o nome da sua rede WiFi
const char* password = "#f39A@jl32*1";     // Coloque a senha da sua rede WiFi

// ===== CONFIGURAÇÃO DOS PINOS DA CÂMERA =====
// Configuração alternativa para ESP32-S3 com câmera OV2640
// Tente esta configuração se a anterior não funcionou
#define PWDN_GPIO_NUM     -1
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM     15
#define SIOD_GPIO_NUM     4
#define SIOC_GPIO_NUM     5

#define Y9_GPIO_NUM       16
#define Y8_GPIO_NUM       17
#define Y7_GPIO_NUM       18
#define Y6_GPIO_NUM       12
#define Y5_GPIO_NUM       10
#define Y4_GPIO_NUM       8
#define Y3_GPIO_NUM       9
#define Y2_GPIO_NUM       11
#define VSYNC_GPIO_NUM    6
#define HREF_GPIO_NUM     7
#define PCLK_GPIO_NUM     13

// ===== VARIÁVEIS GLOBAIS =====
httpd_handle_t camera_httpd = NULL;
httpd_handle_t stream_httpd = NULL;

// ===== PÁGINA HTML =====
static const char PROGMEM INDEX_HTML[] = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ESP32-S3 Camera Server</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      text-align: center;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
    }
    #stream {
      width: 100%;
      max-width: 800px;
      border-radius: 10px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.2);
      margin: 20px auto;
      display: block;
    }
    .controls {
      margin: 30px 0;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 15px;
    }
    button, select {
      padding: 12px 24px;
      font-size: 16px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      background: #667eea;
      color: white;
      font-weight: bold;
    }
    button:hover, select:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
    button:active {
      transform: translateY(0);
    }
    .info {
      background: #f0f0f0;
      padding: 15px;
      border-radius: 10px;
      margin: 20px 0;
    }
    .slider-container {
      margin: 15px;
      text-align: left;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    }
    input[type="range"] {
      width: 100%;
    }
    label {
      font-weight: bold;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📸 ESP32-S3 Camera Server</h1>
    <p class="subtitle">Streaming de Vídeo ao Vivo</p>
    
    <img id="stream" src="">
    
    <div class="info">
      <p><strong>URL do Stream:</strong> <span id="streamUrl"></span></p>
      <p><strong>Status:</strong> <span id="status">Conectando...</span></p>
    </div>
    
    <div class="controls">
      <button onclick="capturePhoto()">📷 Capturar Foto</button>
      <button onclick="toggleStream()">▶️ Iniciar/Parar Stream</button>
      <select id="resolution" onchange="changeResolution()">
        <option value="13">UXGA (1600x1200)</option>
        <option value="12">SXGA (1280x1024)</option>
        <option value="11">HD (1280x720)</option>
        <option value="10" selected>XGA (1024x768)</option>
        <option value="9">SVGA (800x600)</option>
        <option value="8">VGA (640x480)</option>
        <option value="7">HVGA (480x320)</option>
        <option value="6">CIF (400x296)</option>
        <option value="5">QVGA (320x240)</option>
      </select>
    </div>

    <div class="slider-container">
      <label for="quality">Qualidade JPEG: <span id="qualityValue">10</span></label>
      <input type="range" id="quality" min="10" max="63" value="10" oninput="updateQuality(this.value)">
    </div>

    <div class="slider-container">
      <label for="brightness">Brilho: <span id="brightnessValue">0</span></label>
      <input type="range" id="brightness" min="-2" max="2" value="0" oninput="updateBrightness(this.value)">
    </div>
  </div>

  <script>
    const streamUrl = window.location.protocol + '//' + window.location.hostname + ':81/stream';
    document.getElementById('streamUrl').textContent = streamUrl;
    document.getElementById('stream').src = streamUrl;
    
    let streamRunning = true;

    function toggleStream() {
      if (streamRunning) {
        document.getElementById('stream').src = '';
        document.getElementById('status').textContent = 'Stream Parado';
        streamRunning = false;
      } else {
        document.getElementById('stream').src = streamUrl;
        document.getElementById('status').textContent = 'Streaming...';
        streamRunning = true;
      }
    }

    function capturePhoto() {
      window.open(window.location.protocol + '//' + window.location.hostname + '/capture', '_blank');
    }

    function changeResolution() {
      const res = document.getElementById('resolution').value;
      fetch('/control?var=framesize&val=' + res)
        .then(response => response.text())
        .then(data => console.log('Resolução alterada:', data));
    }

    function updateQuality(value) {
      document.getElementById('qualityValue').textContent = value;
      fetch('/control?var=quality&val=' + value)
        .then(response => response.text())
        .then(data => console.log('Qualidade alterada:', data));
    }

    function updateBrightness(value) {
      document.getElementById('brightnessValue').textContent = value;
      fetch('/control?var=brightness&val=' + value)
        .then(response => response.text())
        .then(data => console.log('Brilho alterado:', data));
    }

    document.getElementById('stream').onload = function() {
      document.getElementById('status').textContent = 'Streaming...';
    };

    document.getElementById('stream').onerror = function() {
      document.getElementById('status').textContent = 'Erro no Stream';
    };
  </script>
</body>
</html>
)rawliteral";


// ===== HANDLERS HTTP =====
static esp_err_t index_handler(httpd_req_t *req) {
  httpd_resp_set_type(req, "text/html");
  return httpd_resp_send(req, (const char *)INDEX_HTML, strlen(INDEX_HTML));
}

static esp_err_t capture_handler(httpd_req_t *req) {
  camera_fb_t * fb = NULL;
  esp_err_t res = ESP_OK;
  
  fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Falha ao capturar imagem");
    httpd_resp_send_500(req);
    return ESP_FAIL;
  }

  httpd_resp_set_type(req, "image/jpeg");
  httpd_resp_set_hdr(req, "Content-Disposition", "inline; filename=capture.jpg");
  
  res = httpd_resp_send(req, (const char *)fb->buf, fb->len);
  esp_camera_fb_return(fb);
  return res;
}

static esp_err_t stream_handler(httpd_req_t *req) {
  camera_fb_t * fb = NULL;
  esp_err_t res = ESP_OK;
  size_t _jpg_buf_len = 0;
  uint8_t * _jpg_buf = NULL;
  char * part_buf[64];

  static const char* _STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=frame";
  static const char* _STREAM_BOUNDARY = "\r\n--frame\r\n";
  static const char* _STREAM_PART = "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

  res = httpd_resp_set_type(req, _STREAM_CONTENT_TYPE);
  if(res != ESP_OK){
    return res;
  }

  while(true){
    fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("Falha ao capturar frame");
      res = ESP_FAIL;
    } else {
      if(fb->format != PIXFORMAT_JPEG){
        bool jpeg_converted = frame2jpg(fb, 80, &_jpg_buf, &_jpg_buf_len);
        esp_camera_fb_return(fb);
        fb = NULL;
        if(!jpeg_converted){
          Serial.println("Conversão JPEG falhou");
          res = ESP_FAIL;
        }
      } else {
        _jpg_buf_len = fb->len;
        _jpg_buf = fb->buf;
      }
    }
    if(res == ESP_OK){
      size_t hlen = snprintf((char *)part_buf, 64, _STREAM_PART, _jpg_buf_len);
      res = httpd_resp_send_chunk(req, (const char *)part_buf, hlen);
    }
    if(res == ESP_OK){
      res = httpd_resp_send_chunk(req, (const char *)_jpg_buf, _jpg_buf_len);
    }
    if(res == ESP_OK){
      res = httpd_resp_send_chunk(req, _STREAM_BOUNDARY, strlen(_STREAM_BOUNDARY));
    }
    if(fb){
      esp_camera_fb_return(fb);
      fb = NULL;
      _jpg_buf = NULL;
    } else if(_jpg_buf){
      free(_jpg_buf);
      _jpg_buf = NULL;
    }
    if(res != ESP_OK){
      break;
    }
  }
  return res;
}

static esp_err_t control_handler(httpd_req_t *req) {
  char*  buf;
  size_t buf_len;
  char variable[32] = {0,};
  char value[32] = {0,};

  buf_len = httpd_req_get_url_query_len(req) + 1;
  if (buf_len > 1) {
    buf = (char*)malloc(buf_len);
    if(!buf){
      httpd_resp_send_500(req);
      return ESP_FAIL;
    }
    if (httpd_req_get_url_query_str(req, buf, buf_len) == ESP_OK) {
      if (httpd_query_key_value(buf, "var", variable, sizeof(variable)) == ESP_OK &&
          httpd_query_key_value(buf, "val", value, sizeof(value)) == ESP_OK) {
      } else {
        free(buf);
        httpd_resp_send_404(req);
        return ESP_FAIL;
      }
    } else {
      free(buf);
      httpd_resp_send_404(req);
      return ESP_FAIL;
    }
    free(buf);
  } else {
    httpd_resp_send_404(req);
    return ESP_FAIL;
  }

  int val = atoi(value);
  sensor_t * s = esp_camera_sensor_get();
  int res = 0;

  if(!strcmp(variable, "framesize")) {
    if(s->pixformat == PIXFORMAT_JPEG) res = s->set_framesize(s, (framesize_t)val);
  }
  else if(!strcmp(variable, "quality")) res = s->set_quality(s, val);
  else if(!strcmp(variable, "contrast")) res = s->set_contrast(s, val);
  else if(!strcmp(variable, "brightness")) res = s->set_brightness(s, val);
  else if(!strcmp(variable, "saturation")) res = s->set_saturation(s, val);
  else {
    res = -1;
  }

  if(res){
    return httpd_resp_send_500(req);
  }

  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  return httpd_resp_send(req, NULL, 0);
}

void startCameraServer() {
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.server_port = 80;

  httpd_uri_t index_uri = {
    .uri       = "/",
    .method    = HTTP_GET,
    .handler   = index_handler,
    .user_ctx  = NULL
  };

  httpd_uri_t capture_uri = {
    .uri       = "/capture",
    .method    = HTTP_GET,
    .handler   = capture_handler,
    .user_ctx  = NULL
  };

  httpd_uri_t control_uri = {
    .uri       = "/control",
    .method    = HTTP_GET,
    .handler   = control_handler,
    .user_ctx  = NULL
  };

  Serial.printf("Iniciando servidor web na porta %d\n", config.server_port);
  if (httpd_start(&camera_httpd, &config) == ESP_OK) {
    httpd_register_uri_handler(camera_httpd, &index_uri);
    httpd_register_uri_handler(camera_httpd, &capture_uri);
    httpd_register_uri_handler(camera_httpd, &control_uri);
  }

  config.server_port = 81;
  config.ctrl_port = 32769;
  
  httpd_uri_t stream_uri = {
    .uri       = "/stream",
    .method    = HTTP_GET,
    .handler   = stream_handler,
    .user_ctx  = NULL
  };

  Serial.printf("Iniciando servidor de stream na porta %d\n", config.server_port);
  if (httpd_start(&stream_httpd, &config) == ESP_OK) {
    httpd_register_uri_handler(stream_httpd, &stream_uri);
  }
}

void setup() {
  Serial.begin(9600);
  Serial.setDebugOutput(true);
  Serial.println("\n=================================");
  Serial.println("ESP32-S3 Camera Web Server");
  Serial.println("=================================\n");

  // Configuração da câmera
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  // Configurações otimizadas com PSRAM embutida do ESP32-S3
  // XCLK reduzido ajuda a estabilizar cores no OV2640
  config.xclk_freq_hz = 16500000; // 16.5 MHz (antes: 20 MHz)
  config.pixel_format = PIXFORMAT_JPEG; // JPEG nativo - mais eficiente
  config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
  config.jpeg_quality = 12;
  config.fb_count = 1;

  // CRÍTICO: ESP32-S3 **tem** PSRAM embutida de 8MB!
  if(psramFound()){
    Serial.println("✓ PSRAM encontrada!");
    config.fb_location = CAMERA_FB_IN_PSRAM;
    config.frame_size = FRAMESIZE_SVGA; // 800x600 com PSRAM
    config.jpeg_quality = 10;
    config.fb_count = 2;
    config.grab_mode = CAMERA_GRAB_LATEST;
  } else {
    Serial.println("⚠ PSRAM não encontrada - usando DRAM");
    config.fb_location = CAMERA_FB_IN_DRAM;
    config.frame_size = FRAMESIZE_QVGA; // 320x240 fallback
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  // Inicializar a câmera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("✗ Erro ao inicializar câmera: 0x%x\n", err);
    Serial.println("\nPossíveis causas:");
    Serial.println("1. Verifique as conexões dos pinos");
    Serial.println("2. Confirme se o módulo de câmera está conectado corretamente");
    Serial.println("3. Ajuste os pinos no código conforme sua placa");
    return;
  }

  Serial.println("✓ Câmera inicializada com sucesso!");

  // Configurações do sensor para corrigir cores
  sensor_t * s = esp_camera_sensor_get();
  if (s != NULL) {
    Serial.printf("Sensor PID detectado: 0x%02X\n", s->id.PID);
    // Resetar para configurações padrão primeiro
    s->set_brightness(s, 0);     // -2 a 2 (neutro primeiro)
    s->set_contrast(s, 0);       // -2 a 2
    s->set_saturation(s, -1);    // Reduzir saturação levemente para diminuir o rosa
    s->set_special_effect(s, 0); // 0 = sem efeito
    
    // Ajustes de balanço de branco
    s->set_whitebal(s, 1);       // Habilitar balanço de branco automático
    s->set_awb_gain(s, 1);       // Habilitar ganho AWB
    s->set_wb_mode(s, 0);        // 0=Auto (testa depois: 1=Sunny, 2=Cloudy, 3=Office, 4=Home)
    
    // Ajustes de exposição
    s->set_exposure_ctrl(s, 1);  // Habilitar controle de exposição
    s->set_aec2(s, 1);           // Habilitar AEC DSP
  s->set_ae_level(s, 1);       // Aumentar nível de exposição
    s->set_aec_value(s, 400);    // Valor de exposição (0-1200)
    
    // Ajustes de ganho
    s->set_gain_ctrl(s, 1);      // Habilitar controle de ganho
    s->set_agc_gain(s, 5);       // Ganho AGC (0-30)
    s->set_gainceiling(s, (gainceiling_t)2);  // Limite de ganho
    
    // Correções de pixels
    s->set_bpc(s, 1);            // Habilitar correção de pixel preto
    s->set_wpc(s, 1);            // Habilitar correção de pixel branco
    s->set_raw_gma(s, 1);        // Habilitar correção gamma
    s->set_lenc(s, 1);           // Habilitar correção de lente
    
    // Orientação
    s->set_hmirror(s, 0);        // Espelhamento horizontal
    s->set_vflip(s, 0);          // Inversão vertical
    s->set_dcw(s, 1);            // Habilitar downsize
    s->set_colorbar(s, 0);       // Desabilitar barra de teste
    
    Serial.println("✓ Configurações do sensor ajustadas para melhorar cores");
  }

  // Conectar ao WiFi
  Serial.println("\n---------------------------------");
  Serial.print("Conectando ao WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  WiFi.setSleep(false);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi conectado!");
    Serial.print("📡 IP da Câmera: ");
    Serial.println(WiFi.localIP());
    Serial.println("---------------------------------");
    
    // Iniciar servidor web
    startCameraServer();
    
    Serial.println("\n╔════════════════════════════════════╗");
    Serial.println("║  🌐 SERVIDOR WEB ATIVO!           ║");
    Serial.println("╚════════════════════════════════════╝");
    Serial.print("\n📱 Abra no navegador: http://");
    Serial.println(WiFi.localIP());
    Serial.println("\n📸 Stream de vídeo: http://" + WiFi.localIP().toString() + ":81/stream");
    Serial.println("📷 Captura de foto: http://" + WiFi.localIP().toString() + "/capture");
    Serial.println("\n=================================\n");
  } else {
    Serial.println("\n✗ Falha ao conectar ao WiFi");
    Serial.println("Verifique suas credenciais!");
  }
}

void loop() {
  delay(10000);
  Serial.println("📊 Sistema rodando... IP: " + WiFi.localIP().toString());
}