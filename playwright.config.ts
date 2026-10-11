import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4208';
const isCI = Boolean(process.env.CI);

export default defineConfig({
    testDir: './e2e/src',
    testMatch: '**/*.spec.ts',
    fullyParallel: true,
    forbidOnly: true,
    retries: isCI ? 1 : 0,
    failOnFlakyTests: isCI,
    workers: isCI ? 1 : 2,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL,
        locale: 'en-US',
        timezoneId: 'Europe/Moscow',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure'
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } }
    ],
    webServer: {
        command: 'npm run start -- date-time-picker-app --host 127.0.0.1 --port 4208 --no-open --no-hmr --no-live-reload',
        url: baseURL,
        // Каждый прогон запускает сервер этого репозитория; занятый порт считается ошибкой
        reuseExistingServer: false,
        timeout: 120_000
    }
});
