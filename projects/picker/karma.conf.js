// Конфигурация Karma; документация доступна по ссылке ниже
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
        clearContext: false // Оставляет результаты Jasmine Spec Runner видимыми в браузере
    },
      coverageReporter: {
      dir: require('path').join(__dirname, '../../coverage'),
          reporters: [{ type: 'html' }, { type: 'lcovonly' }, { type: 'json' }]
    },
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--disable-web-security',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-extensions',
          '--remote-debugging-port=9222',
          '--headless'
        ]
      },
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--disable-web-security',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-extensions',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--remote-debugging-port=9222',
          '--headless'
        ]
      }
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
      // Выбирает браузер в зависимости от окружения
    browsers: process.env.CI ? ['ChromeHeadlessCI'] : ['Chrome'],
    singleRun: process.env.CI ? true : false,
    restartOnFileChange: false
  });
};
