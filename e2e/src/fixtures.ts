import { expect, test as base } from '@playwright/test';

export const initialRange = '10.10.2026 15:00 - 12.10.2026 15:00';

// Задаём начальную дату; часы продолжают идти для RxJS debounceTime и анимаций overlay
export const test = base.extend({
    page: async ({ page }, use) => {
        const pageErrors: string[] = [];
        const recordError = (error: Error): void => {
            pageErrors.push(error.stack ?? error.message);
        };

        page.on('pageerror', recordError);
        await page.clock.install({ time: new Date('2026-10-11T12:00:00Z') });
        await page.goto('/');
        await expect(page.locator('#daterange'))
            .toHaveValue(initialRange);
        expect(
            await page.evaluate(() => typeof Reflect.get(window, 'Zone')),
            'Демо должно запускать Angular без Zone.js'
        )
            .toBe('undefined');

        try {
            await use(page);
        } finally {
            page.off('pageerror', recordError);
            expect(pageErrors, 'Picker не должен вызывать необработанные ошибки браузера')
                .toEqual([]);
        }
    }
});

export { expect };
