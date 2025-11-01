import { Controller, Get, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';
import { VisionService } from './vision/vision.service';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly visionService: VisionService) { }

  @Get()
  getRoot(@Res() res: Response) {
    const port = process.env.PORT || 3000;
    const localUrl = `http://localhost:${port}`;
    const networkUrl = `http://192.168.100.11:${port}`;
    const connectionStatus = this.visionService.getConnectionStatus();

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vision API - Sistema de Detecção</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #0f0f1e;
            color: #e1e1e6;
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            padding: 60px 20px 40px;
            background: #1a1a2e;
            border-radius: 16px;
            margin-bottom: 40px;
            // box-shadow: 0 8px 32px rgba(102, 126, 234, 0.2);
            border: 1px solid #2d2d44;
        }
        
        .header h1 {
            font-size: 2.8em;
            margin-bottom: 12px;
            font-weight: 700;
            letter-spacing: -1px;
        }
        
        .header p {
            font-size: 1.15em;
            opacity: 0.95;
            font-weight: 400;
        }
        
        .status-badge {
            display: inline-block;
            padding: 12px 24px;
            border-radius: 24px;
            font-weight: 600;
            margin: 30px 10px 20px;
            font-size: 0.95em;
        }
        
        .status-badge.online {
            background: rgba(72, 187, 120, 0.15);
            border: 1px solid rgba(72, 187, 120, 0.3);
            color: #68d391;
        }
        
        .status-badge.offline {
            background: rgba(245, 101, 101, 0.15);
            border: 1px solid rgba(245, 101, 101, 0.3);
            color: #fc8181;
        }
        
        .status-badge::before {
            content: "●";
            margin-right: 8px;
            animation: pulse 2s ease-in-out infinite;
        }
        
        .esp32-status {
            display: inline-block;
            background: rgba(102, 126, 234, 0.15);
            border: 1px solid rgba(102, 126, 234, 0.3);
            color: #a0aec0;
            padding: 8px 16px;
            border-radius: 16px;
            font-size: 0.85em;
            margin: 10px 5px;
        }
        
        .esp32-status.connected {
            background: rgba(72, 187, 120, 0.15);
            border: 1px solid rgba(72, 187, 120, 0.3);
            color: #68d391;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 24px;
            margin-bottom: 32px;
        }
        
        .card {
            background: #1a1a2e;
            border: 1px solid #2d2d44;
            border-radius: 12px;
            padding: 28px;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .card:hover {
            transform: translateY(-4px);
            border-color: #667eea;
            box-shadow: 0 12px 24px rgba(102, 126, 234, 0.15);
        }
        
        .card-icon {
            font-size: 2em;
            margin-bottom: 12px;
        }
        
        .card-title {
            font-size: 1.25em;
            font-weight: 600;
            margin-bottom: 8px;
            color: #e1e1e6;
        }
        
        .card-url {
            color: #667eea;
            text-decoration: none;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.85em;
            word-break: break-all;
            display: block;
            margin-bottom: 12px;
        }
        
        .card-desc {
            color: #a8a8b3;
            font-size: 0.9em;
            line-height: 1.5;
        }
        
        .section-title {
            font-size: 1.5em;
            font-weight: 700;
            margin: 48px 0 24px;
            color: #e1e1e6;
        }
        
        .test-panel {
            background: #1a1a2e;
            border: 1px solid #2d2d44;
            border-radius: 12px;
            padding: 32px;
            margin-top: 32px;
        }
        
        .test-panel h3 {
            font-size: 1.3em;
            margin-bottom: 24px;
            color: #e1e1e6;
        }
        
        .button-group {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 24px;
        }
        
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 14px 28px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.95em;
            font-weight: 600;
            transition: all 0.2s ease;
            font-family: inherit;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
        }
        
        .btn:active {
            transform: translateY(0);
        }
        
        .result-box {
            background: #0f0f1e;
            border: 1px solid #2d2d44;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.85em;
            max-height: 400px;
            overflow-y: auto;
            display: none;
            line-height: 1.6;
        }
        
        .result-box.show {
            display: block;
        }
        
        .result-box.success {
            border-color: rgba(72, 187, 120, 0.3);
        }
        
        .result-box.error {
            border-color: rgba(245, 101, 101, 0.3);
        }
        
        .footer {
            text-align: center;
            padding: 40px 20px;
            color: #a8a8b3;
            font-size: 0.9em;
        }
        
        .footer p {
            margin: 8px 0;
        }
        
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: #1a1a2e;
        }
        
        ::-webkit-scrollbar-thumb {
            background: #667eea;
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: #764ba2;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Vision API</h1>
            <p>Sistema de detecção de objetos para pessoas com deficiência visual</p>
            <div class="status-badge online">Servidor Online</div>
            <div id="esp32Status" class="esp32-status">
                ${connectionStatus.isConnected
        ? `✅ ESP32 Conectado (${connectionStatus.totalConnected} módulo${connectionStatus.totalConnected > 1 ? 's' : ''})`
        : '⚠️ Aguardando conexão ESP32'}
            </div>
            ${connectionStatus.isConnected && connectionStatus.connectedModules.length > 0
        ? `<div style="margin-top: 10px; font-size: 0.85em; opacity: 0.8;">
                   Módulos: ${connectionStatus.connectedModules.join(', ')}
                 </div>`
        : ''}
        </div>
        
        <div class="section-title">API Endpoints</div>
        <div class="grid">
            <div class="card" onclick="window.open('${localUrl}/api/docs', '_blank')">
                <div class="card-icon">📚</div>
                <div class="card-title">Documentação</div>
                <a href="${localUrl}/api/docs" class="card-url" onclick="event.stopPropagation()" target="_blank">/api/docs</a>
                <div class="card-desc">Swagger com todos os endpoints documentados</div>
            </div>
            
            <div class="card" onclick="window.open('${localUrl}/api/health', '_blank')">
                <div class="card-icon">💚</div>
                <div class="card-title">Health Check</div>
                <a href="${localUrl}/api/health" class="card-url" onclick="event.stopPropagation()" target="_blank">/api/health</a>
                <div class="card-desc">Status do servidor e métricas de sistema</div>
            </div>
            
            <div class="card" onclick="window.open('${localUrl}/api/vision/stream', '_blank')">
                <div class="card-icon">📡</div>
                <div class="card-title">Stream SSE</div>
                <a href="${localUrl}/api/vision/stream" class="card-url" onclick="event.stopPropagation()" target="_blank">/api/vision/stream</a>
                <div class="card-desc">Recebe detecções em tempo real via SSE</div>
            </div>
            
            <div class="card" onclick="window.open('${localUrl}/api/vision/history', '_blank')">
                <div class="card-icon">📜</div>
                <div class="card-title">Histórico</div>
                <a href="${localUrl}/api/vision/history" class="card-url" onclick="event.stopPropagation()" target="_blank">/api/vision/history</a>
                <div class="card-desc">Últimas detecções processadas</div>
            </div>
            
            <div class="card" onclick="window.open('${localUrl}/api/vision/statistics', '_blank')">
                <div class="card-icon">📊</div>
                <div class="card-title">Estatísticas</div>
                <a href="${localUrl}/api/vision/statistics" class="card-url" onclick="event.stopPropagation()" target="_blank">/api/vision/statistics</a>
                <div class="card-desc">Métricas gerais e analytics</div>
            </div>
        </div>
        
        <div class="test-panel">
            <h3>🧪 Testar Endpoints</h3>
            <div class="button-group">
                <button class="btn" onclick="testHealth()">Health Check</button>
                <button class="btn" onclick="testDetection()">Simular Detecção</button>
                <button class="btn" onclick="testStats()">Estatísticas</button>
                <button class="btn" onclick="testHistory()">Histórico</button>
            </div>
            <div id="result" class="result-box"></div>
        </div>
        
        <div class="footer">
            <p><strong>Vision API v1.0</strong></p>
            <p>Desenvolvido com NestJS</p>
        </div>
    </div>
    
    <script>
        const resultBox = document.getElementById('result');
        const esp32StatusEl = document.getElementById('esp32Status');
        
        function showResult(data, isError = false) {
            resultBox.className = 'result-box show ' + (isError ? 'error' : 'success');
            resultBox.textContent = JSON.stringify(data, null, 2);
        }
        
        // Atualiza status ESP32 a cada 5 segundos
        async function updateESP32Status() {
            try {
                const res = await fetch('${localUrl}/api/vision/connection-status');
                const { data } = await res.json();
                
                if (data.isConnected) {
                    esp32StatusEl.className = 'esp32-status connected';
                    esp32StatusEl.textContent = \`✅ ESP32 Conectado (\${data.totalConnected} módulo\${data.totalConnected > 1 ? 's' : ''})\`;
                } else {
                    esp32StatusEl.className = 'esp32-status';
                    esp32StatusEl.textContent = '⚠️ Aguardando conexão ESP32';
                }
            } catch (err) {
                console.error('Erro ao verificar status ESP32:', err);
            }
        }
        
        // Atualiza status a cada 5 segundos
        setInterval(updateESP32Status, 5000);
        
        async function testHealth() {
            try {
                const res = await fetch('${localUrl}/api/health');
                const data = await res.json();
                showResult(data);
            } catch (err) {
                showResult({ error: err.message }, true);
            }
        }
        
        async function testDetection() {
            const payload = {
                moduleId: 'test-module',
                objects: [
                    { name: 'pessoa', confidence: 95, description: 'Pessoa detectada à frente' },
                    { name: 'cadeira', confidence: 88, description: 'Cadeira ao lado' }
                ],
                metrics: { captureTime: 245, detectionTime: 1823, freeHeap: 89456, rssi: -67, fps: 0.45 }
            };
            
            try {
                const res = await fetch('${localUrl}/api/vision', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                showResult(data);
            } catch (err) {
                showResult({ error: err.message }, true);
            }
        }
        
        async function testStats() {
            try {
                const res = await fetch('${localUrl}/api/vision/statistics');
                const data = await res.json();
                showResult(data);
            } catch (err) {
                showResult({ error: err.message }, true);
            }
        }
        
        async function testHistory() {
            try {
                const res = await fetch('${localUrl}/api/vision/history?limit=10');
                const data = await res.json();
                showResult(data);
            } catch (err) {
                showResult({ error: err.message }, true);
            }
        }
    </script>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
}
