import { expect, initialRange, test } from './fixtures';

test.describe('inline в zoneless Angular', () => {
    test.beforeEach(async ({ page }) => {
        const tab = page.getByRole('button', { name: 'DateTime Range (Inline)', exact: true });
        await tab.focus();
        await tab.press('Enter');
    });

    test('отображается на месте без перемещения фокуса и элементов управления overlay', async ({ page }) => {
        const picker = page.locator('owl-date-time-inline');
        await expect(picker)
            .toBeVisible();
        await expect(page.getByRole('button', { name: 'DateTime Range (Inline)', exact: true }))
            .toBeFocused();
        await expect(picker.getByRole('cell', { name: '10.10.2026', exact: true }))
            .toHaveAttribute('aria-selected', 'true');
        await expect(picker.getByRole('cell', { name: '12.10.2026', exact: true }))
            .toHaveAttribute('aria-selected', 'true');
        await expect(picker.getByRole('button', { name: 'Set', exact: true }))
            .toHaveCount(0);
        await expect(picker.getByRole('button', { name: 'Cancel', exact: true }))
            .toHaveCount(0);
        await expect(page.locator('.cdk-overlay-pane'))
            .toHaveCount(0);
    });

    test('сразу передаёт выбранный диапазон через ngModel', async ({ page }) => {
        const picker = page.locator('owl-date-time-inline');
        await picker.getByRole('cell', { name: '13.10.2026', exact: true })
            .click();
        await expect(picker.getByRole('radio', { name: 'From: 13.10.2026 15:00', exact: true }))
            .toBeVisible();
        await picker.getByRole('cell', { name: '15.10.2026', exact: true })
            .click();
        await expect(picker.getByRole('radio', { name: 'To: 15.10.2026 15:00', exact: true }))
            .toBeVisible();

        await page.getByRole('button', { name: 'Date Range', exact: true })
            .click();
        await expect(page.locator('#daterange'))
            .toHaveValue('13.10.2026 15:00 - 15.10.2026 15:00');
    });

    test('отображает изменения таймера после debounce и сохраняет обе границы диапазона', async ({ page }) => {
        const picker = page.locator('owl-date-time-inline');
        const from = picker.getByRole('radio', { name: /^From:/ });
        const to = picker.getByRole('radio', { name: /^To:/ });
        const minute = picker.getByRole('textbox', { name: 'Minute', exact: true });
        await minute.fill('37');
        await expect(from)
            .toHaveAccessibleName('From: 10.10.2026 15:37');
        await expect(minute)
            .toBeFocused();

        await from.focus();
        await from.press('ArrowRight');
        await expect(to)
            .toBeFocused();
        await expect(to)
            .toHaveAttribute('aria-checked', 'true');
        await expect(minute)
            .toHaveValue('00');
        await minute.press('ArrowUp');
        await expect(minute)
            .toHaveValue('01');
        await expect(to)
            .toHaveAccessibleName('To: 12.10.2026 15:01');
        await expect(from)
            .toHaveAccessibleName('From: 10.10.2026 15:37');

        await page.getByRole('button', { name: 'Date Range', exact: true })
            .click();
        await expect(page.locator('#daterange'))
            .toHaveValue('10.10.2026 15:37 - 12.10.2026 15:01');
    });

    test('переключает отображаемый месяц без изменения выбранного диапазона', async ({ page }) => {
        const picker = page.locator('owl-date-time-inline');
        await picker.getByRole('button', { name: 'Next month', exact: true })
            .click();
        await expect(picker.getByRole('cell', { name: '10.11.2026', exact: true }))
            .toBeVisible();
        await picker.getByRole('button', { name: 'Previous month', exact: true })
            .click();
        await expect(picker.getByRole('cell', { name: '10.10.2026', exact: true }))
            .toBeVisible();
        await expect(picker.getByRole('radio', { name: 'From: 10.10.2026 15:00', exact: true }))
            .toBeVisible();
        await expect(picker.getByRole('radio', { name: 'To: 12.10.2026 15:00', exact: true }))
            .toBeVisible();

        await page.getByRole('button', { name: 'Date Range', exact: true })
            .click();
        await expect(page.locator('#daterange'))
            .toHaveValue(initialRange);
    });
});
