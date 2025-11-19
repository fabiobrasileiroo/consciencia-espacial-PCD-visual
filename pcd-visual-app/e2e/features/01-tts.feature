Feature: Receber texto do servidor mock e reproduzir por voz
  As a usuário do app
  I want ouvir o texto processado pela câmera (dados mock)
  So that eu receba feedback auditivo automaticamente

  Background:
    Given o servidor mock está ativo e responde em "/ws" com eventos WebSocket
    And o app está iniciado com TTS habilitado

  Scenario: Receber texto mock e falar automaticamente
    Given o servidor mock envia via WebSocket o evento texto_detectado { "id": "m1", "text": "Objeto detectado à frente" }
    When o app recebe o evento texto_detectado
    Then o app reproduz por TTS o texto "Objeto detectado à frente"
    And o app armazena no histórico a entrada { "id": "m1", "text": "Objeto detectado à frente" }

  Scenario: Evitar repetição do mesmo texto mock
    Given o servidor mock já enviou texto_detectado { "id": "m2", "text": "Porta aberta" }
    And o app já falou o texto com id "m2"
    When o servidor mock reenviar texto_detectado { "id": "m2", "text": "Porta aberta" }
    Then o app não reproduce o TTS novamente
