Feature: Haptics - vibração local do celular (mock)
  As a usuário
  I want o app use a vibração do celular como fallback
  So that eu sinta alertas sem módulo externo

  Background:
    Given o servidor mock está ativo
    And o usuário escolheu modo de notificação "vibração local"

  Scenario: Vibrar fraco no celular a partir do mock
    Given o servidor mock envia evento alert_distance { "id":"d1","level":"weak" }
    When o app recebe alert_distance
    Then o app chama a API de vibração para um pulso curto (<=100ms)

  Scenario: Vibrar médio e forte
    Given o servidor mock envia alert_distance { "id":"d2","level":"medium" }
    When o app recebe o evento
    Then o app vibra por 300ms

    Given o servidor mock envia alert_distance { "id":"d3","level":"strong" }
    When o app recebe o evento
    Then o app vibra em padrão [200ms ON, 100ms OFF, 200ms ON]
