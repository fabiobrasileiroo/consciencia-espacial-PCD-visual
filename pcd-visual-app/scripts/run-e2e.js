#!/usr/bin/env node

/**
 * Script helper para executar testes E2E
 * 
 * Uso:
 *   npm run test:e2e
 *   npm run test:e2e -- --tags @smoke
 *   npm run test:e2e -- e2e/features/01-tts.feature
 */

const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);

const cucumberBin = path.join(__dirname, '..', 'node_modules', '.bin', 'cucumber-js');

const cucumberArgs = [
  '--require-module', 'ts-node/register',
  '--require', 'e2e/step-definitions/**/*.ts',
  '--require', 'e2e/support/**/*.ts',
  '--format', 'progress',
  '--format', 'json:e2e/reports/cucumber-report.json',
  '--format', 'html:e2e/reports/cucumber-report.html',
  '--publish-quiet',
  ...args
];

console.log('🥒 Executando testes E2E...\n');

const cucumber = spawn(cucumberBin, cucumberArgs, {
  stdio: 'inherit',
  shell: true
});

cucumber.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Testes E2E concluídos com sucesso!');
    console.log('\n📊 Relatórios gerados:');
    console.log('   - e2e/reports/cucumber-report.json');
    console.log('   - e2e/reports/cucumber-report.html');
  } else {
    console.log(`\n❌ Testes E2E falhou com código ${code}`);
  }
  process.exit(code);
});
