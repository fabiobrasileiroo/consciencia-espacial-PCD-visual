Feature: Configurações do app (persistência) com interações mock
  As a usuário
  I want salvar preferências locais e testar saídas
  So that as escolhas persistam mesmo sem servidor real

  Background:
    Given o app iniciou com storage limpo
    And o servidor mock está ativo

  Scenario: Salvar modo de saída como "alto-falante"
    Given o usuário abre Configurações
    When ele seleciona "Forçar alto-falante" e salva
    Then a preferência "forceSpeaker" = true está salva no storage local

  Scenario: Testar som pela saída configurada (mock)
    Given a preferência "forceSpeaker" = true
    When o usuário pressiona "Testar som"
    Then o app reproduz "Teste de som" pelo alto-falante
