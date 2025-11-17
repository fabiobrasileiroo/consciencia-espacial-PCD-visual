"""
Script de teste para verificar comunicação com backend
"""
import requests

server_url = "http://localhost:3000"

print("🧪 Testando endpoints do backend...\n")

# 1. Verificar modo atual
print("1️⃣ GET /api/operation-mode")
try:
    response = requests.get(f"{server_url}/api/operation-mode", timeout=2)
    print(f"   Status: {response.status_code}")
    print(f"   Resposta: {response.json()}\n")
except Exception as e:
    print(f"   ❌ Erro: {e}\n")

# 2. Alterar para MANUAL
print("2️⃣ POST /api/operation-mode (manual)")
try:
    response = requests.post(
        f"{server_url}/api/operation-mode",
        json={"mode": "manual", "triggeredBy": "test-script"},
        timeout=2
    )
    print(f"   Status: {response.status_code}")
    print(f"   Resposta: {response.json()}\n")
except Exception as e:
    print(f"   ❌ Erro: {e}\n")

# 3. Verificar modo novamente
print("3️⃣ GET /api/operation-mode (deve ser manual)")
try:
    response = requests.get(f"{server_url}/api/operation-mode", timeout=2)
    data = response.json()
    print(f"   Status: {response.status_code}")
    print(f"   Resposta: {data}")
    
    if 'state' in data and 'mode' in data['state']:
        print(f"   ✅ Modo atual: {data['state']['mode']}\n")
    else:
        print(f"   ⚠️  Estrutura inesperada\n")
except Exception as e:
    print(f"   ❌ Erro: {e}\n")

# 4. Solicitar captura manual
print("4️⃣ POST /api/esp32-cam/capture-now")
try:
    response = requests.post(f"{server_url}/api/esp32-cam/capture-now", timeout=2)
    print(f"   Status: {response.status_code}")
    print(f"   Resposta: {response.json()}\n")
except Exception as e:
    print(f"   ❌ Erro: {e}\n")

# 5. Verificar status de captura
print("5️⃣ GET /api/esp32-cam/capture-status")
try:
    response = requests.get(f"{server_url}/api/esp32-cam/capture-status", timeout=2)
    print(f"   Status: {response.status_code}")
    print(f"   Resposta: {response.json()}\n")
except Exception as e:
    print(f"   ❌ Erro: {e}\n")

# 6. Voltar para REALTIME
print("6️⃣ POST /api/operation-mode (realtime)")
try:
    response = requests.post(
        f"{server_url}/api/operation-mode",
        json={"mode": "realtime", "triggeredBy": "test-script"},
        timeout=2
    )
    print(f"   Status: {response.status_code}")
    print(f"   Resposta: {response.json()}\n")
except Exception as e:
    print(f"   ❌ Erro: {e}\n")

print("✅ Testes concluídos!")
