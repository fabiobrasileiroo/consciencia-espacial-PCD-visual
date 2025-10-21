Feature: Exibir status do dispositivo móvel (bateria, rede, bluetooth) usando mocks
  As a usuário
  I want ver o estado do celular
  So that eu saiba quando o app pode funcionar corretamente

  Background:
    Given o servidor mock está ativo

  Scenario: Mostrar bateria crítica (mock)
    Given o sistema mock informa batteryLevel = 10
    When o usuário abre a tela Status
    Then o app exibe "Bateria crítica (10%)" e sugestão "Ativar economia"

  Scenario: Mostrar fone conectado (mock)
    Given o sistema mock informa bluetoothConnected = true e deviceName = "FoneXY"
    When o usuário abre Status
    Then o app exibe "Fone conectado: FoneXY"
