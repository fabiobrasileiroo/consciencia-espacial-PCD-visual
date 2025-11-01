Feature: Histórico de textos recebidos na UI (persistência com mock)
  As a usuário
  I want ver o histórico de textos que o app falou
  So that eu possa revisar o que foi dito

  Background:
    Given o storage local está vazio
    And o servidor mock está ativo

  Scenario: Mostrar texto recebido no histórico
    Given o servidor mock envia texto_detectado { "id":"h1", "text":"Pessoa detectada" }
    When o app recebe o evento
    Then o item aparece no histórico com texto "Pessoa detectada" e timestamp

  Scenario: Histórico persiste após reinício
    Given o histórico contém 2 itens
    When o usuário fecha e reabre o app
    Then o histórico ainda mostra os 2 itens
