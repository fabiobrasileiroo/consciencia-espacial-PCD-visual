Feature: Roteamento de áudio (fone Bluetooth ou alto-falante) com dados mock
  As a usuário com fone conectado
  I want ouvir o som no fone quando emparelhado
  So that o som não saia do alto-falante quando eu estiver com fone

  Background:
    Given o servidor mock está ativo
    And o app tem permissão de áudio

  Scenario: Som sai pelo fone emparelhado (mock)
    Given o SO reporta que o dispositivo "FoneXY" está emparelhado e conectado
    When o servidor mock envia texto_detectado { "id": "m3", "text": "Alerta" }
    Then o app reproduz "Alerta" e o sistema roteia para "FoneXY"

  Scenario: Fallback para alto-falante quando desconecta (mock)
    Given o SO reporta dispositivo "FoneXY" desconectado
    When o servidor mock envia texto_detectado { "id": "m4", "text": "Atenção" }
    Then o app reproduz "Atenção" pelo alto-falante do celular
