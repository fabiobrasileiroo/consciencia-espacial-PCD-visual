Feature: Conexão WebSocket e reconexão automática (com servidor mock)
  As a usuário
  I want o app reconectar automaticamente
  So that eu não perca eventos quando a rede oscilar

  Background:
    Given o servidor mock provê uma WebSocket em "ws://mock/ws"

  Scenario: Reconectar com backoff após queda (mock)
    Given o app está conectado ao mock WebSocket
    When o servidor mock simula desconexão
    Then o app tenta reconectar com backoff exponencial (1s, 2s, 4s)
    And quando o mock volta, o app se reconecta e recupera eventos pendentes

  Scenario: Deduplicação de mensagens ao reconectar (mock)
    Given o servidor mock envia evento texto_detectado { "id": "m5", "text": "OK" } enquanto o app está offline
    When o app reconecta
    Then o servidor mock reenvia o evento
    And o app processa o evento apenas uma vez
