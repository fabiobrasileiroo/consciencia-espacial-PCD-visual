# Comandos Úteis - PDC Visual E2E

## 📦 Instalação

```bash
# Instalar todas as dependências
npm install

# Ou com yarn
yarn install
```

## 🧪 Executar Testes

### E2E (Cucumber)

```bash
# Todos os testes E2E
npm run test:e2e

# Feature específica
npx cucumber-js e2e/features/01-tts.feature

# Com tags (quando adicionar @tags nas features)
npx cucumber-js --tags "@smoke"
npx cucumber-js --tags "@critical"
npx cucumber-js --tags "not @skip"

# Dry run (validar sintaxe sem executar)
npx cucumber-js --dry-run

# Ver steps não implementados
npx cucumber-js --dry-run --format snippets

# Formato específico
npx cucumber-js --format progress
npx cucumber-js --format json:reports/test.json
```

### Unitários (Jest)

```bash
# Todos os testes
npm test

# Watch mode (re-executa ao salvar)
npm run test:watch

# Com cobertura
npm run test:coverage

# Arquivo específico
npm test services.test.ts

# Atualizar snapshots
npm test -- -u
```

## 📊 Relatórios

```bash
# Abrir relatório HTML
open e2e/reports/cucumber-report.html

# Ver JSON
cat e2e/reports/cucumber-report.json | jq

# Ver cobertura
open coverage/lcov-report/index.html
```

## 🔍 Debug

```bash
# Cucumber com mais detalhes
npx cucumber-js --format progress-bar

# Jest com logs
npm test -- --verbose

# Jest com apenas um teste
npm test -- --testNamePattern="deve falar o texto"

# Node inspect
node --inspect-brk node_modules/.bin/cucumber-js e2e/features/01-tts.feature
```

## 🛠️ Desenvolvimento

```bash
# Validar estrutura (se você criou o script)
fish validate.fish

# Lint
npm run lint

# Fix lint
npm run lint -- --fix

# TypeScript check
npx tsc --noEmit

# Listar arquivos do projeto
tree -I 'node_modules|.git|coverage'
```

## 🚀 Expo/React Native

```bash
# Iniciar Expo
npm start

# Android
npm run android

# iOS
npm run ios

# Web
npm run web

# Limpar cache
npx expo start -c
```

## 📝 Git

```bash
# Status
git status

# Adicionar arquivos E2E
git add e2e/ services/ examples/ *.md *.js

# Commit
git commit -m "feat: adicionar estrutura E2E completa com 8 features"

# Ver diff
git diff

# Ver arquivos modificados
git diff --name-only
```

## 🔧 Utilitários

```bash
# Contar linhas de código
find . -name "*.ts" -not -path "./node_modules/*" | xargs wc -l

# Encontrar TODOs
grep -r "TODO" --include="*.ts" --include="*.tsx"

# Listar features
ls -la e2e/features/

# Listar step definitions
ls -la e2e/step-definitions/

# Ver dependências instaladas
npm list --depth=0

# Ver dependências desatualizadas
npm outdated

# Atualizar dependências
npm update
```

## 📦 Package.json

```bash
# Adicionar dependência
npm install <package>

# Adicionar dev dependency
npm install --save-dev <package>

# Remover dependência
npm uninstall <package>

# Ver scripts disponíveis
npm run
```

## 🐛 Troubleshooting

```bash
# Limpar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install

# Limpar cache do npm
npm cache clean --force

# Verificar portas em uso (Linux)
lsof -i :8080
lsof -i :3000

# Matar processo na porta (Linux)
kill -9 $(lsof -t -i:8080)

# Ver logs do Jest
npm test -- --no-coverage --verbose

# Ver logs do Cucumber
DEBUG=cucumber:* npx cucumber-js
```

## 📱 React Native

```bash
# Metro bundler
npx react-native start

# Reset cache
npx react-native start --reset-cache

# Ver logs Android
npx react-native log-android

# Ver logs iOS
npx react-native log-ios
```

## 🎯 Atalhos Úteis

```bash
# Criar alias no fish shell
alias te="npm run test:e2e"
alias tw="npm run test:watch"
alias s="npm start"

# Adicionar ao ~/.config/fish/config.fish para tornar permanente
```

## 📚 Referências Rápidas

### Cucumber

- Rodar feature: `npx cucumber-js path/to/feature`
- Dry run: `--dry-run`
- Tags: `--tags "@tag"`
- Format: `--format progress|json|html`

### Jest

- Rodar teste: `npm test [pattern]`
- Watch: `--watch`
- Coverage: `--coverage`
- Verbose: `--verbose`

### Expo

- Start: `npx expo start`
- Android: `npx expo start --android`
- iOS: `npx expo start --ios`
- Web: `npx expo start --web`

---

**Dica:** Adicione esses comandos ao seu README ou crie um script Makefile para facilitar!
