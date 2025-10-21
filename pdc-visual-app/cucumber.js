module.exports = {
  default: {
    require: ['e2e/step-definitions/**/*.ts', 'e2e/support/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: ['progress', 'json:e2e/reports/cucumber-report.json', 'html:e2e/reports/cucumber-report.html'],
    formatOptions: { snippetInterface: 'async-await' },
    publishQuiet: true,
  },
};
