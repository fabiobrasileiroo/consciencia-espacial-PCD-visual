const WebSocket = require('ws');

function registerAppClient(state, ws) {
  state.appClients.add(ws);
}

function unregisterAppClient(state, ws) {
  state.appClients.delete(ws);
}

function registerSSEClient(state, res) {
  state.sseClients.add(res);
}

function unregisterSSEClient(state, res) {
  state.sseClients.delete(res);
}

function broadcastToAppClients(state, payload) {
  const message = JSON.stringify(payload);
  let sentCount = 0;

  state.appClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sentCount++;
    }
  });

  if (sentCount > 0) {
    console.log(`📤 Broadcast enviado para ${sentCount} app(s)`);
  }
}

function sendSSEUpdate(client, eventType, data) {
  try {
    client.write(`event: ${eventType}\n`);
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (err) {
    console.error('❌ Erro ao enviar SSE:', err);
  }
}

function broadcastToSSEClients(state, eventType, data) {
  state.sseClients.forEach((client) => sendSSEUpdate(client, eventType, data));
}

module.exports = {
  registerAppClient,
  unregisterAppClient,
  registerSSEClient,
  unregisterSSEClient,
  broadcastToAppClients,
  broadcastToSSEClients,
  sendSSEUpdate
};
