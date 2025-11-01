# ♿ Guia de Testes de Acessibilidade

## 🎯 Como Testar as Telas

### **Preparação**

#### iOS (VoiceOver)
1. Abrir **Ajustes** > **Acessibilidade**
2. Selecionar **VoiceOver**
3. Ativar VoiceOver
4. *(Atalho rápido: Triplo clique no botão lateral)*

#### Android (TalkBack)
1. Abrir **Configurações** > **Acessibilidade**
2. Selecionar **TalkBack**
3. Ativar TalkBack
4. *(Atalho rápido: Manter pressionados ambos botões de volume)*

---

## 📋 Checklist de Testes - HomeScreen

### ✅ **Teste 1: Anúncio Inicial**
- [ ] Ao abrir a tela, TTS anuncia: "Tela inicial. Dispositivo..."
- [ ] O anúncio contém status completo do dispositivo
- [ ] Bateria e tempo de uso são mencionados

### ✅ **Teste 2: Status do Dispositivo**
- [ ] Tocar no card de status ativa TTS
- [ ] TTS lê: nome, status, tempo, bateria
- [ ] Feedback háptico médio é sentido
- [ ] Screen reader identifica como "button"

### ✅ **Teste 3: Histórico**
- [ ] Cada item do histórico é focável
- [ ] TTS lê: "Temperatura: 32 graus Celsius"
- [ ] TTS lê: "Tempo de uso: 5 horas"
- [ ] TTS lê: "Notificações: 3 avisos"
- [ ] Feedback háptico leve em cada toque

### ✅ **Teste 4: Controle de Volume**
- [ ] Botão diminuir é acessível
- [ ] Botão aumentar é acessível
- [ ] Botão testar som é acessível
- [ ] TTS anuncia volume atual ao ajustar
- [ ] Exemplo: "Volume 80 por cento"
- [ ] Feedback háptico em cada ajuste

### ✅ **Teste 5: Botões de Ação**
- [ ] "Mudar modo" é focável e ativável
- [ ] TTS anuncia: "Mudando modo de operação"
- [ ] Feedback háptico de padrão é sentido
- [ ] "Conectar Bluetooth" é focável
- [ ] TTS anuncia: "Abrindo configurações de Bluetooth"
- [ ] Feedback háptico forte é sentido

### ✅ **Teste 6: Transcrição**
- [ ] Card de transcrição é focável
- [ ] TTS lê todo o texto da transcrição
- [ ] Feedback háptico leve ao tocar

### ✅ **Teste 7: Navegação**
- [ ] Tab "Home" está marcada como selecionada
- [ ] Screen reader identifica role "tab"
- [ ] Tocar em "Configurações" navega corretamente
- [ ] TTS anuncia: "Navegando para configurações"

---

## 📋 Checklist de Testes - ConfiguracoesScreen

### ✅ **Teste 8: Anúncio Inicial**
- [ ] Ao abrir, TTS anuncia: "Tela de Configurações..."
- [ ] Menciona dispositivos conectados disponíveis
- [ ] Menciona controle de volume

### ✅ **Teste 9: Lista de Dispositivos**
- [ ] Seção tem accessibilityLabel correto
- [ ] TTS lê: "2 de 3 dispositivos conectados"
- [ ] Cada dispositivo é focável individualmente

### ✅ **Teste 10: SmartGlasses**
- [ ] Tocar no item ativa TTS
- [ ] TTS lê: "LUMI SmartGlasses v1.0, conectado"
- [ ] Feedback háptico médio é sentido
- [ ] Status verde é anunciado como "conectado"

### ✅ **Teste 11: SmartBracelet**
- [ ] TTS lê: "LUMI SmartBracelet v1.0, desligado"
- [ ] Status cinza é anunciado como "desligado"
- [ ] Feedback háptico médio é sentido

### ✅ **Teste 12: Airpods**
- [ ] TTS lê: "Apple Airpods v1.0, conectado"
- [ ] Status é anunciado corretamente

### ✅ **Teste 13: Controle de Volume**
- [ ] Seção é identificada como "adjustable"
- [ ] accessibilityValue mostra volume atual
- [ ] Botão "Aumentar" funciona corretamente
- [ ] TTS confirma: "Volume aumentado para X por cento"
- [ ] Botão "Abaixar" funciona corretamente
- [ ] TTS confirma: "Volume diminuído para X por cento"
- [ ] Barra visual atualiza (feedback visual)

### ✅ **Teste 14: Menu de Suporte**
- [ ] "Ajuda e FAQ" é focável
- [ ] TTS anuncia corretamente
- [ ] Hint indica ação: "Toque duas vezes para abrir"
- [ ] "Sobre o Aplicativo" é focável
- [ ] TTS anuncia corretamente

### ✅ **Teste 15: Navegação**
- [ ] Tab "Configurações" está selecionada
- [ ] Tocar em "Home" navega de volta
- [ ] TTS anuncia: "Navegando para início"

---

## 🎤 Testes de TTS Específicos

### **Teste de Números**
- [ ] "75%" é lido como "75 por cento"
- [ ] "2h 30min" é lido claramente
- [ ] "100" é lido como "cem"

### **Teste de Status**
- [ ] "Conectado" vs "Desconectado" são claros
- [ ] Status é sempre mencionado com o dispositivo

### **Teste de Ações**
- [ ] Verbos de ação são claros
- [ ] "Aumentar volume" não é genérico
- [ ] Feedback confirma a ação realizada

---

## 📳 Testes de Haptics

### **Intensidades**
- [ ] Toques leves são sentidos em ajustes
- [ ] Toques médios são sentidos em botões
- [ ] Toques fortes são sentidos em ações importantes
- [ ] Padrões customizados são distintos

### **Contexto**
- [ ] Feedback é apropriado para cada ação
- [ ] Não é excessivo ou irritante
- [ ] Ajuda a entender o tipo de interação

---

## 🎨 Testes Visuais (Para Baixa Visão)

### **Contraste**
- [ ] Texto branco em fundo escuro é legível
- [ ] Contraste atende WCAG AAA (7:1)
- [ ] Verde de status é distinguível
- [ ] Cinza de desabilitado é claro

### **Tamanho**
- [ ] Textos principais são grandes (≥18pt)
- [ ] Botões são grandes (≥44x44pt)
- [ ] Espaçamento é generoso
- [ ] Ícones são grandes e claros

### **Redundância**
- [ ] Status tem cor + texto
- [ ] Botões tem ícone + texto
- [ ] Informação não depende só de cor

---

## 🔍 Testes de Navegação por Gestos

### **iOS (VoiceOver)**
- [ ] Deslizar direita: próximo elemento
- [ ] Deslizar esquerda: elemento anterior
- [ ] Toque duplo: ativar elemento
- [ ] Deslizar para cima/baixo: ajustar controles
- [ ] Três dedos: scroll

### **Android (TalkBack)**
- [ ] Deslizar direita: próximo elemento
- [ ] Deslizar esquerda: elemento anterior
- [ ] Toque duplo: ativar elemento
- [ ] Gestos em L: navegação especial

---

## ⚡ Testes de Performance

### **Responsividade de TTS**
- [ ] TTS inicia em <500ms
- [ ] Não há atrasos perceptíveis
- [ ] TTS pode ser interrompido
- [ ] Não há sobreposição de falas

### **Responsividade de Haptics**
- [ ] Haptics é instantâneo
- [ ] Não há atrasos perceptíveis
- [ ] Vibração é proporcional à ação

---

## 🐛 Testes de Edge Cases

### **Volume nos Limites**
- [ ] Volume em 100% não aumenta mais
- [ ] TTS não anuncia valores > 100
- [ ] Volume em 0% não diminui mais
- [ ] TTS não anuncia valores < 0

### **Múltiplos Toques Rápidos**
- [ ] TTS não se sobrepõe
- [ ] Última ação é anunciada
- [ ] Haptics não acumula

### **Mudança Rápida de Tela**
- [ ] TTS da tela anterior é interrompido
- [ ] Nova tela é anunciada corretamente
- [ ] Sem bugs de navegação

---

## 📊 Relatório de Testes

### **Template de Relatório**
```
Data: ___/___/___
Testador: __________
Dispositivo: __________
SO: iOS ___ / Android ___

HomeScreen:
□ Todos os testes passaram
□ Problemas encontrados: ___________

ConfiguracoesScreen:
□ Todos os testes passaram
□ Problemas encontrados: ___________

TTS:
□ Funcionou perfeitamente
□ Problemas: ___________

Haptics:
□ Funcionou perfeitamente
□ Problemas: ___________

Notas Adicionais:
_________________________________
_________________________________
```

---

## ✅ Critérios de Aprovação

### **Para considerar 100% acessível:**
- ✅ 100% dos elementos são focáveis com screen reader
- ✅ 100% dos elementos têm labels descritivos
- ✅ TTS funciona em todas as interações
- ✅ Haptics funciona em todas as interações
- ✅ Navegação por gestos funciona completamente
- ✅ Contraste atende WCAG AAA
- ✅ Tamanhos atendem requisitos de acessibilidade
- ✅ Sem bugs em edge cases
- ✅ Performance é aceitável (<500ms resposta)
- ✅ Funciona em iOS e Android

---

## 🎓 Recursos Adicionais

### **Ferramentas de Teste**
- **iOS**: Accessibility Inspector (Xcode)
- **Android**: Accessibility Scanner
- **Web**: axe DevTools

### **Documentação**
- [iOS Accessibility](https://developer.apple.com/accessibility/)
- [Android Accessibility](https://developer.android.com/guide/topics/ui/accessibility)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)

### **Comunidade**
- [A11y Project](https://www.a11yproject.com/)
- [WebAIM](https://webaim.org/)
- [Deque University](https://dequeuniversity.com/)

---

**Teste com usuários reais sempre que possível!**

Os melhores testes de acessibilidade vêm de pessoas que realmente usam tecnologias assistivas no dia a dia.
