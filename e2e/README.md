# E2E на Playwright

Тесты запускают локальное демо в zoneless Angular и проверяют отсутствие `window.Zone`.
Покрыты popup, dialog и inline: выбор диапазона, подтверждение и отмена, таймер,
передача значений через ngModel, клавиатурная навигация и управление фокусом.

## Установка и запуск

Используйте Node.js, совместимый с установленной версией Angular CLI. После установки зависимостей:

```sh
npm ci
npx playwright install chromium firefox webkit
npm run e2e:typecheck
npm run e2e
```

В Linux для установки системных зависимостей браузеров используйте
`npx playwright install --with-deps chromium firefox webkit`.

Playwright сам запускает и останавливает dev server на `http://127.0.0.1:4208`.
Порт должен быть свободен: подключение к уже работающему серверу отключено.
Часы браузера стартуют с известной даты и продолжают идти; часовой пояс задан явно.
Это сохраняет работу RxJS debounce и делает тесты независимыми от даты компьютера.

## Отладка

```sh
npm run e2e -- --project=chromium
npm run e2e:ui
npx playwright show-report
```

HTML-отчёт сохраняется в `playwright-report/`, снимки экрана и trace при ошибках —
в `test-results/`. Эти каталоги исключены из Git. CI запускает все три браузера,
публикует HTML-отчёт как артефакт и считает нестабильный тест ошибкой даже после успешного повтора.

## Остальные проверки

```sh
npm run test:ci
npm run test:demo
npm run lint
npm run package_windows
npx ng build date-time-picker-app --configuration production
```

На Linux для сборки npm-пакета используйте `npm run package_linux`.
Unit-тесты библиотеки и демо используют Karma/Jasmine и установленный Chrome;
их запускают последовательно, поскольку оба target используют порт 9876.
