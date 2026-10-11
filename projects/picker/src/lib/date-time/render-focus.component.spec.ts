import { provideZoneChangeDetection, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DateTime } from 'luxon';
import { RIGHT_ARROW } from '@angular/cdk/keycodes';
import { dispatchKeyboardEvent } from '../../test-helpers';
import { DateTimeAdapter } from './adapter/date-time-adapter.class';
import { OwlUnixTimestampDateTimeModule } from './adapter/unix-timestamp-adapter/unix-timestamp-date-time.module';
import { OwlLuxonDateTimeModule } from './adapter/luxon-date-time.module';
import { CalendarCell, OwlCalendarBodyComponent } from './calendar-body.component';
import { OwlCalendarComponent } from './calendar.component';
import { DateView } from './date-time.class';
import { OwlDateTimeIntl } from './date-time-picker-intl.service';
import { OwlDateTimeModule } from './date-time.module';
import { OwlTimerComponent } from './timer.component';

for (const zoneless of [false, true]) {
    describe(`Отрисовка календаря и таймера (${zoneless ? 'zoneless' : 'Zone.js'})`, () => {
        beforeEach(() => {
            TestBed.configureTestingModule({
                imports: [OwlDateTimeModule, OwlLuxonDateTimeModule],
                providers: [zoneless ? provideZonelessChangeDetection() : provideZoneChangeDetection()]
            });
        });

        async function createBody() {
            const fixture = TestBed.createComponent(OwlCalendarBodyComponent);
            fixture.componentRef.setInput('rows', [
                [
                    new CalendarCell(1, '1', 'First day', true),
                    new CalendarCell(2, '2', 'Second day', true)
                ]
            ]);
            fixture.componentRef.setInput('selectMode', 'single');
            fixture.componentRef.setInput('selectedValues', []);
            fixture.autoDetectChanges();
            await fixture.whenStable();
            return fixture;
        }

        async function createCalendar() {
            const fixture = TestBed.createComponent(OwlCalendarComponent<DateTime>);
            fixture.componentRef.setInput('pickerDateTime', DateTime.local(2026, 10, 11));
            fixture.componentRef.setInput('selectMode', 'single');
            fixture.autoDetectChanges();
            await fixture.whenStable();
            return fixture;
        }

        async function createTimer() {
            const fixture = TestBed.createComponent(OwlTimerComponent<DateTime>);
            fixture.componentRef.setInput('pickerDateTime', DateTime.local(2026, 10, 11, 13, 30));
            fixture.componentRef.setInput('hour12Timer', true);
            fixture.autoDetectChanges();
            await fixture.whenStable();
            return fixture;
        }

        it('фокусирует ячейку, отрисованную после изменения активного индекса', async () => {
            const fixture = await createBody();
            fixture.componentRef.setInput('activeCell', 1);
            fixture.componentInstance.focusActiveCell();
            await fixture.whenStable();

            const cell = fixture.nativeElement.querySelector('[aria-label="Second day"]');
            expect(document.activeElement)
                .toBe(cell);
        });

        it('объединяет запросы фокуса тела календаря и отменяет ожидающий запрос при уничтожении', async () => {
            const fixture = await createBody();
            const cell = fixture.nativeElement.querySelector('.owl-dt-calendar-cell-active');
            const focus = spyOn(cell, 'focus');
            fixture.componentInstance.focusActiveCell();
            fixture.componentInstance.focusActiveCell();
            await fixture.whenStable();
            expect(focus)
                .toHaveBeenCalledTimes(1);

            fixture.componentInstance.focusActiveCell();
            fixture.destroy();
            expect(() => fixture.componentInstance.focusActiveCell())
                .not
                .toThrow();
            await fixture.whenStable();
            expect(focus)
                .toHaveBeenCalledTimes(1);
        });

        it('не вызывает ошибку, если в теле календаря нет активной ячейки для фокуса', async () => {
            const fixture = await createBody();
            fixture.componentRef.setInput('rows', []);
            fixture.componentInstance.focusActiveCell();
            await fixture.whenStable();
            expect(fixture.nativeElement.querySelector('.owl-dt-calendar-cell-active'))
                .toBeNull();
        });

        it('обрабатывает пустой диапазон и выделяет выбранную границу неполного диапазона', async () => {
            const fixture = await createBody();
            fixture.componentRef.setInput('selectMode', 'range');
            fixture.componentRef.setInput('selectedValues', null);
            await fixture.whenStable();
            expect(fixture.nativeElement.querySelector('.owl-dt-calendar-cell-in-range'))
                .toBeNull();

            fixture.componentRef.setInput('selectedValues', [2]);
            await fixture.whenStable();
            const inRange = fixture.nativeElement.querySelectorAll('.owl-dt-calendar-cell-in-range');
            expect(inRange.length)
                .toBe(1);
            expect(inRange[0].getAttribute('aria-label'))
                .toBe('Second day');
        });

        it('не отправляет событие выбора заблокированной ячейки календаря', async () => {
            const fixture = await createBody();
            fixture.componentRef.setInput('rows', [[new CalendarCell(1, '1', 'Disabled day', false)]]);
            await fixture.whenStable();
            const select = spyOn(fixture.componentInstance.select, 'emit');
            fixture.nativeElement.querySelector('.owl-dt-calendar-cell')
                .click();
            expect(select)
                .not
                .toHaveBeenCalled();
        });

        it('фокусирует новое представление после нажатия кнопки периода', async () => {
            const fixture = await createCalendar();
            const oldCell = fixture.nativeElement.querySelector('.owl-dt-calendar-cell-active');
            fixture.nativeElement.querySelector('.owl-dt-control-period-button')
                .click();
            await fixture.whenStable();

            const newCell = fixture.nativeElement.querySelector('.owl-dt-calendar-cell-active');
            expect(fixture.componentInstance.currentView)
                .toBe(DateView.MULTI_YEARS);
            expect(newCell)
                .not
                .toBe(oldCell);
            expect(document.activeElement)
                .toBe(newCell);
        });

        it('очищает публичный диапазон календаря при selecteds равном null', async () => {
            const fixture = await createCalendar();
            fixture.componentRef.setInput('selectMode', 'range');
            fixture.componentRef.setInput('selecteds', [DateTime.local(2026, 10, 11), DateTime.local(2026, 10, 12)]);
            await fixture.whenStable();
            expect(fixture.nativeElement.querySelectorAll('.owl-dt-calendar-cell-selected').length)
                .toBe(2);

            fixture.componentRef.setInput('selecteds', null);
            await fixture.whenStable();
            expect(fixture.componentInstance.selecteds)
                .toEqual([]);
            expect(fixture.nativeElement.querySelector('.owl-dt-calendar-cell-selected'))
                .toBeNull();
        });

        it('переносит клавиатурный фокус на следующую дату без ручного запуска change detection', async () => {
            const fixture = await createCalendar();
            const body = fixture.nativeElement.querySelector('.owl-dt-calendar-body');
            dispatchKeyboardEvent(body, 'keydown', RIGHT_ARROW);
            await fixture.whenStable();

            const activeCell = fixture.nativeElement.querySelector('.owl-dt-calendar-cell-active');
            expect(fixture.componentInstance.pickerDateTime.day)
                .toBe(12);
            expect(activeCell.textContent.trim())
                .toBe('12');
            expect(document.activeElement)
                .toBe(activeCell);
        });

        it('отменяет фокус календаря при уничтожении представления до отрисовки', async () => {
            const fixture = await createCalendar();
            const cell = fixture.nativeElement.querySelector('.owl-dt-calendar-cell-active');
            const focus = spyOn(cell, 'focus');
            fixture.componentInstance.focusActiveCell();
            fixture.destroy();
            expect(() => fixture.componentInstance.focusActiveCell())
                .not
                .toThrow();
            await fixture.whenStable();
            expect(focus)
                .not
                .toHaveBeenCalled();
        });

        it('фокусирует таймер без ожидания NgZone.onStable', async () => {
            const fixture = await createTimer();
            fixture.componentInstance.focus();
            await fixture.whenStable();
            expect(document.activeElement)
                .toBe(fixture.nativeElement);
        });

        it('отменяет фокус таймера при уничтожении представления до отрисовки', async () => {
            const fixture = await createTimer();
            const focus = spyOn(fixture.nativeElement, 'focus');
            fixture.componentInstance.focus();
            fixture.destroy();
            expect(() => fixture.componentInstance.focus())
                .not
                .toThrow();
            await fixture.whenStable();
            expect(focus)
                .not
                .toHaveBeenCalled();
        });

        it('обновляет подписи таймера при изменении сервиса intl', async () => {
            const fixture = await createTimer();
            const intl = TestBed.inject(OwlDateTimeIntl);
            intl.upHourLabel = 'Increase hours';
            intl.hour12PMLabel = 'Afternoon';
            intl.changes.next();
            await fixture.whenStable();

            expect(fixture.nativeElement.querySelector('button')
                .getAttribute('aria-label'))
                .toBe('Increase hours');
            expect(fixture.nativeElement.querySelector('.owl-dt-timer-hour12-box').textContent)
                .toContain('Afternoon');
        });
    });
}


describe('Календарь и таймер со значениями эпохи Unix', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [OwlDateTimeModule, OwlUnixTimestampDateTimeModule],
            providers: [provideZonelessChangeDetection()]
        });
    });

    it('сохраняет нулевую метку Unix как активную дату и учитывает её календарные границы', async () => {
        const fixture = TestBed.createComponent(OwlCalendarComponent<number>);
        const adapter = TestBed.inject<DateTimeAdapter<number>>(DateTimeAdapter);
        const epochDay = adapter.createDate(adapter.getYear(0), adapter.getMonth(0), adapter.getDate(0));
        fixture.componentRef.setInput('pickerDateTime', 0);
        fixture.componentRef.setInput('minDate', 0);
        fixture.componentRef.setInput('maxDate', 0);
        fixture.componentRef.setInput('selectMode', 'single');
        fixture.autoDetectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.pickerDateTime)
            .toBe(0);
        expect(fixture.componentInstance.minDate)
            .toBe(epochDay);
        expect(fixture.componentInstance.maxDate)
            .toBe(epochDay);
        const arrows = fixture.nativeElement.querySelectorAll('.owl-dt-control-arrow-button');
        expect(arrows[0].disabled)
            .toBeTrue();
        expect(arrows[1].disabled)
            .toBeTrue();

        fixture.componentRef.setInput('minDate', null);
        fixture.componentRef.setInput('maxDate', null);
        await fixture.whenStable();
        expect(fixture.componentInstance.dateFilterForViews(0))
            .toBeTrue();
    });

    it('сохраняет нулевую метку Unix как активное время и запрещает шаги за её границы', async () => {
        const fixture = TestBed.createComponent(OwlTimerComponent<number>);
        fixture.componentRef.setInput('pickerDateTime', 0);
        fixture.componentRef.setInput('minDateTime', 0);
        fixture.componentRef.setInput('maxDateTime', 0);
        fixture.componentRef.setInput('showSecondsTimer', true);
        fixture.autoDetectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.pickerDateTime)
            .toBe(0);
        const arrows = fixture.nativeElement.querySelectorAll('.owl-dt-control-arrow-button');
        expect(arrows.length)
            .toBe(6);
        for (const arrow of arrows) {
            expect(arrow.disabled)
                .toBeTrue();
        }
    });
});
