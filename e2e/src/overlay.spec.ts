import { expect, initialRange, test } from './fixtures';

for (const mode of ['popup', 'dialog'] as const) {
    test.describe(mode + ' в zoneless Angular', () => {
        test.beforeEach(async ({ page }) => {
            if (mode === 'dialog') {
                await page.getByRole('button', { name: 'Date Range (Dialog)', exact: true })
                    .click();
            }
        });

        test(
            'фокусирует календарь и подтверждает выбранный клавиатурой диапазон только после Set',
            async ({ page }) => {
                const input = page.locator('#daterange');
                const picker = page.locator(
                    mode === 'dialog' ? 'owl-dialog-container owl-date-time-container'
                        : '.owl-dt-popup owl-date-time-container'
                );
                await input.click();

                const firstDay = picker.getByRole('cell', { name: '10.10.2026', exact: true });
                await expect(firstDay)
                    .toBeFocused();
                await firstDay.press('ArrowRight');
                const fromDay = picker.getByRole('cell', { name: '11.10.2026', exact: true });
                await expect(fromDay)
                    .toBeFocused();
                await fromDay.press('Enter');
                await fromDay.press('ArrowRight');
                const toDay = picker.getByRole('cell', { name: '12.10.2026', exact: true });
                await expect(toDay)
                    .toBeFocused();
                await toDay.press('Enter');

                await expect(picker.getByRole('radio', { name: 'From: 11.10.2026 15:00', exact: true }))
                    .toBeVisible();
                await expect(picker.getByRole('radio', { name: 'To: 12.10.2026 15:00', exact: true }))
                    .toBeVisible();
                await expect(input)
                    .toHaveValue(initialRange);

                await picker.getByRole('button', { name: 'Set', exact: true })
                    .click();
                await expect(picker)
                    .toHaveCount(0);
                await expect(input)
                    .toBeFocused();
                await expect(input)
                    .toHaveValue('11.10.2026 15:00 - 12.10.2026 15:00');

                // Создаём другой CVA, чтобы проверить передачу подтверждённого диапазона в родительский ngModel
                await page.getByRole('button', { name: 'DateTime Range (Inline)', exact: true })
                    .click();
                await expect(page.getByRole('radio', { name: 'From: 11.10.2026 15:00', exact: true }))
                    .toBeVisible();
                await expect(page.getByRole('radio', { name: 'To: 12.10.2026 15:00', exact: true }))
                    .toBeVisible();
            }
        );

        test(
            'отображает изменение времени после debounce и отменяет его при Cancel и повторном открытии',
            async ({ page }) => {
                const input = page.locator('#daterange');
                const picker = page.locator(
                    mode === 'dialog' ? 'owl-dialog-container owl-date-time-container'
                        : '.owl-dt-popup owl-date-time-container'
                );
                await input.click();
                const minute = picker.getByRole('textbox', { name: 'Minute', exact: true });
                await minute.fill('37');

                // Значение должно обновиться после асинхронного debounce без blur и дополнительных событий
                await expect(picker.getByRole('radio', { name: 'From: 10.10.2026 15:37', exact: true }))
                    .toBeVisible();
                await expect(minute)
                    .toBeFocused();
                await expect(input)
                    .toHaveValue(initialRange);
                await picker.getByRole('button', { name: 'Cancel', exact: true })
                    .click();

                await expect(picker)
                    .toHaveCount(0);
                await expect(input)
                    .toBeFocused();
                await expect(input)
                    .toHaveValue(initialRange);
                await input.click();
                await expect(picker)
                    .toHaveCount(1);
                await expect(picker.getByRole('radio', { name: 'From: 10.10.2026 15:00', exact: true }))
                    .toBeVisible();
                await expect(picker.getByRole('textbox', { name: 'Minute', exact: true }))
                    .toHaveValue('00');
            }
        );

        test('отменяет неподтверждённые изменения через Escape и backdrop и закрывает overlay', async ({ page }) => {
            const input = page.locator('#daterange');
            const picker = page.locator(
                mode === 'dialog' ? 'owl-dialog-container owl-date-time-container'
                    : '.owl-dt-popup owl-date-time-container'
            );

            for (const dismissal of ['Escape', 'backdrop'] as const) {
                await input.click();
                await expect(picker)
                    .toHaveCount(1);
                await expect(page.locator('.cdk-overlay-pane'))
                    .toHaveCount(1);
                await picker.getByRole('button', { name: 'Add a minute', exact: true })
                    .click();
                await expect(picker.getByRole('radio', { name: 'From: 10.10.2026 15:01', exact: true }))
                    .toBeVisible();

                if (dismissal === 'Escape') {
                    await page.keyboard.press('Escape');
                } else {
                    await page.locator('.cdk-overlay-backdrop')
                        .click({ position: { x: 5, y: 5 } });
                }

                await expect(picker)
                    .toHaveCount(0);
                await expect(page.locator('.cdk-overlay-backdrop'))
                    .toHaveCount(0);
                await expect(page.locator('.cdk-overlay-pane:visible'))
                    .toHaveCount(0);
                await expect(input)
                    .toBeFocused();
                await expect(input)
                    .toHaveValue(initialRange);
            }
        });

        test(
            'перемещается по трём колонкам лет и восстанавливает фокус при переключении представлений',
            async ({ page }) => {
                const input = page.locator('#daterange');
                const picker = page.locator(
                    mode === 'dialog' ? 'owl-dialog-container owl-date-time-container'
                        : '.owl-dt-popup owl-date-time-container'
                );
                await input.click();
                await picker.getByRole('button', { name: 'Choose month and year', exact: true })
                    .click();
                const year = picker.getByRole('cell', { name: '2026', exact: true });
                await expect(year)
                    .toBeFocused();
                await year.press('ArrowDown');
                const nextRow = picker.getByRole('cell', { name: '2029', exact: true });
                await expect(nextRow)
                    .toBeFocused();
                await nextRow.press('Enter');

                const month = picker.getByRole('cell', { name: 'October 2029', exact: true });
                await expect(month)
                    .toBeFocused();
                await month.press('Enter');
                await expect(picker.getByRole('cell', { name: '10.10.2029', exact: true }))
                    .toBeFocused();
                await expect(input)
                    .toHaveValue(initialRange);
                await picker.getByRole('button', { name: 'Cancel', exact: true })
                    .click();
                await expect(input)
                    .toBeFocused();
                await expect(input)
                    .toHaveValue(initialRange);
            }
        );

        test('переключает границу диапазона клавиатурой и подтверждает только её время', async ({ page }) => {
            const input = page.locator('#daterange');
            const picker = page.locator(
                mode === 'dialog' ? 'owl-dialog-container owl-date-time-container'
                    : '.owl-dt-popup owl-date-time-container'
            );
            await input.click();
            const from = picker.getByRole('radio', { name: /^From:/ });
            const to = picker.getByRole('radio', { name: /^To:/ });
            await from.focus();
            await from.press('ArrowRight');
            await expect(to)
                .toBeFocused();
            await expect(to)
                .toHaveAttribute('aria-checked', 'true');
            await expect(from)
                .toHaveAttribute('aria-checked', 'false');
            const minute = picker.getByRole('textbox', { name: 'Minute', exact: true });
            await minute.press('ArrowUp');
            await expect(minute)
                .toHaveValue('01');
            await expect(to)
                .toHaveAccessibleName('To: 12.10.2026 15:01');
            await expect(from)
                .toHaveAccessibleName('From: 10.10.2026 15:00');

            await picker.getByRole('button', { name: 'Set', exact: true })
                .click();
            await expect(input)
                .toHaveValue('10.10.2026 15:00 - 12.10.2026 15:01');
            await expect(input)
                .toBeFocused();
        });

        test('удерживает клавиатурный фокус внутри открытого picker', async ({ page }) => {
            await page.locator('#daterange')
                .click();
            const picker = page.locator(
                mode === 'dialog' ? 'owl-dialog-container owl-date-time-container'
                    : '.owl-dt-popup owl-date-time-container'
            );
            const first = picker.getByRole('button', { name: 'Previous month', exact: true });
            const last = picker.getByRole('button', { name: 'Set', exact: true });
            await last.focus();
            await last.press('Tab');
            await expect(first)
                .toBeFocused();
            await first.press('Shift+Tab');
            await expect(last)
                .toBeFocused();
        });
    });
}
