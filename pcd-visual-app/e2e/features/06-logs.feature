Feature: Logs e envio de diagnóstico (mock)
  As a tester
  I want enviar logs ao servidor mock
  So that eu colete evidências de erros durante testes

  Background:
    Given o servidor mock tem endpoint POST "/logs" que retorna 200

  Scenario: Enviar log manualmente
    Given o usuário está em Configurações
    When ele pressiona "Enviar log"
    Then o app POST /logs com payload contendo último histórico e recebe status 200
    And o app mostra "Log enviado com sucesso"

  Scenario: Coletar log no crash e perguntar ao reiniciar
    Given o app simula um crash (mock)
    When o app reinicia
    Then o app exibe um modal "Enviar relatório de erro?"
    And se o usuário confirmar, o app POST /logs e mostra "Enviado"
