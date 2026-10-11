import { DateTime, Settings } from 'luxon';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ENTER } from '@angular/cdk/keycodes';
import { OwlDateTimeModule } from './date-time.module';
import { OwlLuxonDateTimeModule } from './adapter/luxon-date-time.module';
import { OwlUnixTimestampDateTimeModule } from './adapter/unix-timestamp-adapter/unix-timestamp-date-time.module';
import { DateTimeAdapter } from './adapter/date-time-adapter.class';
import { OwlMonthViewComponent } from './calendar-month-view.component';
import { OwlYearViewComponent } from './calendar-year-view.component';
import { OwlMultiYearViewComponent } from './calendar-multi-year-view.component';
import { OptionsTokens } from './options-provider';
import { OwlDateTimeIntl } from './date-time-picker-intl.service';
import { dispatchKeyboardEvent } from '../../test-helpers';

function pressEnter(element: HTMLElement): void {
    dispatchKeyboardEvent(element.querySelector('tbody'), 'keydown', ENTER);
}

describe('Границы выбора в представлениях календаря', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [OwlDateTimeModule, OwlLuxonDateTimeModule],
            providers: [provideZonelessChangeDetection()]
        });
    });

    for (const bound of ['minDate', 'maxDate']) {
        it('не выбирает заблокированный день по Enter за границей ' + bound, () => {
            const fixture = TestBed.createComponent(OwlMonthViewComponent<DateTime>);
            fixture.componentRef.setInput('pickerDateTime', DateTime.local(2026, 1, 10));
            fixture.componentRef.setInput(bound, DateTime.local(2026, 1, bound === 'minDate' ? 11 : 9));
            fixture.detectChanges();
            const selected = jasmine.createSpy('selected');
            fixture.componentInstance.selectedChange.subscribe(selected);
            pressEnter(fixture.nativeElement);
            expect(selected)
                .not
                .toHaveBeenCalled();
        });

        it('не выбирает заблокированный месяц по Enter за границей ' + bound, () => {
            const fixture = TestBed.createComponent(OwlYearViewComponent<DateTime>);
            fixture.componentRef.setInput('pickerDateTime', DateTime.local(2026, 6, 10));
            fixture.componentRef.setInput(bound, DateTime.local(2026, bound === 'minDate' ? 7 : 5, 1));
            fixture.detectChanges();
            const changed = jasmine.createSpy('changed');
            const enter = jasmine.createSpy('enter');
            fixture.componentInstance.change.subscribe(changed);
            fixture.componentInstance.keyboardEnter.subscribe(enter);
            pressEnter(fixture.nativeElement);
            expect(changed)
                .not
                .toHaveBeenCalled();
            expect(enter)
                .not
                .toHaveBeenCalled();
        });

        it('не выбирает заблокированный год по Enter за границей ' + bound, () => {
            const fixture = TestBed.createComponent(OwlMultiYearViewComponent<DateTime>);
            fixture.componentRef.setInput('pickerDateTime', DateTime.local(2026, 6, 10));
            fixture.componentRef.setInput(bound, DateTime.local(bound === 'minDate' ? 2027 : 2025, 1, 1));
            fixture.detectChanges();
            const changed = jasmine.createSpy('changed');
            const enter = jasmine.createSpy('enter');
            fixture.componentInstance.change.subscribe(changed);
            fixture.componentInstance.keyboardEnter.subscribe(enter);
            pressEnter(fixture.nativeElement);
            expect(changed)
                .not
                .toHaveBeenCalled();
            expect(enter)
                .not
                .toHaveBeenCalled();
        });
    }

    it('не выбирает исключённый фильтром месяц по Enter или при нажатии на заблокированную ячейку', () => {
        const fixture = TestBed.createComponent(OwlYearViewComponent<DateTime>);
        fixture.componentRef.setInput('pickerDateTime', DateTime.local(2026, 1, 10));
        fixture.componentRef.setInput('dateFilter', (date: DateTime) => date.month !== 1);
        fixture.detectChanges();
        const changed = jasmine.createSpy('changed');
        fixture.componentInstance.change.subscribe(changed);
        pressEnter(fixture.nativeElement);
        fixture.componentInstance.selectCalendarCell(fixture.componentInstance.months[0][0]);
        expect(changed)
            .not
            .toHaveBeenCalled();
    });

    it('разрешает выбор года только при наличии допустимой даты в границах min/max', () => {
        const fixture = TestBed.createComponent(OwlMultiYearViewComponent<DateTime>);
        fixture.componentRef.setInput('pickerDateTime', DateTime.local(2026, 7, 1));
        fixture.componentRef.setInput('minDate', DateTime.local(2026, 6, 1));
        fixture.componentRef.setInput('dateFilter', (date: DateTime) => date.month === 1 && date.day === 1);
        fixture.detectChanges();
        const cell = fixture.componentInstance.years.flat()
            .find(value => value.value === 2026);
        expect(cell?.enabled)
            .toBeFalse();
        const changed = jasmine.createSpy('changed');
        fixture.componentInstance.change.subscribe(changed);
        pressEnter(fixture.nativeElement);
        fixture.componentInstance.selectCalendarCell(cell);
        expect(changed)
            .not
            .toHaveBeenCalled();
    });

    it('выбирает разрешённые дни, месяцы и годы по Enter', () => {
        const day = TestBed.createComponent(OwlMonthViewComponent<DateTime>);
        const month = TestBed.createComponent(OwlYearViewComponent<DateTime>);
        const year = TestBed.createComponent(OwlMultiYearViewComponent<DateTime>);
        const date = DateTime.local(2026, 1, 10);
        day.componentRef.setInput('pickerDateTime', date);
        month.componentRef.setInput('pickerDateTime', date);
        year.componentRef.setInput('pickerDateTime', date);
        day.detectChanges();
        month.detectChanges();
        year.detectChanges();
        const daySelected = jasmine.createSpy('day');
        const monthSelected = jasmine.createSpy('month');
        const yearSelected = jasmine.createSpy('year');
        day.componentInstance.selectedChange.subscribe(daySelected);
        month.componentInstance.change.subscribe(monthSelected);
        year.componentInstance.change.subscribe(yearSelected);
        pressEnter(day.nativeElement);
        pressEnter(month.nativeElement);
        pressEnter(year.nativeElement);
        expect(daySelected)
            .toHaveBeenCalledTimes(1);
        expect(monthSelected)
            .toHaveBeenCalledTimes(1);
        expect(yearSelected)
            .toHaveBeenCalledTimes(1);
    });

    it('обновляет отображаемые названия месяцев после смены локали', async () => {
        const fixture = TestBed.createComponent(OwlYearViewComponent<DateTime>);
        fixture.componentRef.setInput('pickerDateTime', DateTime.local(2026, 1, 10));
        fixture.detectChanges();
        const adapter = TestBed.inject(DateTimeAdapter<DateTime>);
        adapter.setLocale('fr');
        await fixture.whenStable();
        const firstCell: HTMLElement = fixture.nativeElement.querySelector('.owl-dt-calendar-cell-content');
        expect(firstCell.textContent?.trim())
            .toBe(adapter.getMonthNames('short')[0]);
    });

    it('обновляет подписи кнопок представления нескольких лет после изменения Intl', async () => {
        const fixture = TestBed.createComponent(OwlMultiYearViewComponent<DateTime>);
        fixture.componentRef.setInput('pickerDateTime', DateTime.local(2026, 1, 1));
        fixture.detectChanges();
        const intl = TestBed.inject(OwlDateTimeIntl);
        intl.prevMultiYearLabel = 'Updated previous years';
        intl.nextMultiYearLabel = 'Updated next years';
        intl.changes.next();
        await fixture.whenStable();
        const buttons = fixture.nativeElement.querySelectorAll('button');
        expect(buttons[0].getAttribute('aria-label'))
            .toBe('Updated previous years');
        expect(buttons[1].getAttribute('aria-label'))
            .toBe('Updated next years');
    });

    it('обновляет полученные от адаптера aria-подписи нескольких лет после смены локали', async () => {
        const adapter = TestBed.inject(DateTimeAdapter<DateTime>);
        spyOn(adapter, 'getYearName')
            .and
            .callFake(date => adapter.getLocale() + ':' + date.year);
        const fixture = TestBed.createComponent(OwlMultiYearViewComponent<DateTime>);
        fixture.componentRef.setInput('pickerDateTime', DateTime.local(2026, 1, 1));
        fixture.detectChanges();
        adapter.setLocale('ar');
        await fixture.whenStable();
        const firstYear = fixture.componentInstance.years[0][0].value;
        expect(fixture.nativeElement.querySelector('td')
            .getAttribute('aria-label'))
            .toBe(
                adapter.getYearName(adapter.createDate(firstYear, 0, 1))
            );
    });

    it('использует заданное число столбцов в сетке лет и при определении активной ячейки', () => {
        TestBed.overrideProvider(OptionsTokens.multiYear, { useValue: { yearsPerRow: 4, yearRows: 3 } });
        const fixture = TestBed.createComponent(OwlMultiYearViewComponent<DateTime>);
        fixture.componentRef.setInput('pickerDateTime', DateTime.local(2021, 1, 1));
        fixture.detectChanges();
        expect(fixture.componentInstance.calendarBodyElm.numCols)
            .toBe(4);
        const active: HTMLElement = fixture.nativeElement.querySelector('.owl-dt-calendar-cell-active');
        expect(active.textContent?.trim())
            .toBe('2021');
        expect(fixture.nativeElement.querySelector('th')
            .getAttribute('colspan'))
            .toBe('4');
    });

    it('сохраняет блокировку навигации по годам, если новая граница исключает текущую страницу', () => {
        const fixture = TestBed.createComponent(OwlMultiYearViewComponent<DateTime>);
        fixture.componentRef.setInput('pickerDateTime', DateTime.local(2026, 1, 1));
        fixture.componentRef.setInput('minDate', DateTime.local(2100, 1, 1));
        fixture.detectChanges();
        expect(fixture.componentInstance.previousEnabled())
            .toBeFalse();
        fixture.componentRef.setInput('minDate', null);
        fixture.componentRef.setInput('maxDate', DateTime.local(1900, 1, 1));
        fixture.detectChanges();
        expect(fixture.componentInstance.nextEnabled())
            .toBeFalse();
    });

    it('согласует страницы годов до нашей эры с индексом активной ячейки', () => {
        const fixture = TestBed.createComponent(OwlMultiYearViewComponent<DateTime>);
        fixture.componentRef.setInput('pickerDateTime', DateTime.local(-1, 1, 1));
        fixture.detectChanges();
        const view = fixture.componentInstance;
        expect(view.activeCell)
            .toBe(20);
        expect(view.years.flat()[view.activeCell].value)
            .toBe(-1);
        expect(view.years[0][0].value)
            .toBe(-21);
    });
});

describe('Представления календаря с началом эпохи Unix и пустыми диапазонами', () => {
    let originalZone: typeof Settings.defaultZone;

    beforeEach(() => {
        originalZone = Settings.defaultZone;
        Settings.defaultZone = 'UTC';
        TestBed.configureTestingModule({
            imports: [OwlDateTimeModule, OwlUnixTimestampDateTimeModule],
            providers: [provideZonelessChangeDetection()]
        });
    });

    afterEach(() => {
        Settings.defaultZone = originalZone;
    });

    it('отображает и выбирает метку 0 в представлении месяца с учётом границ эпохи Unix', () => {
        const fixture = TestBed.createComponent(OwlMonthViewComponent<number>);
        fixture.componentRef.setInput('pickerDateTime', 0);
        fixture.componentRef.setInput('selected', 0);
        fixture.componentRef.setInput('minDate', 0);
        fixture.componentRef.setInput('maxDate', 0);
        fixture.componentRef.setInput('selecteds', null);
        fixture.detectChanges();
        const view = fixture.componentInstance;
        expect(view.pickerDateTime)
            .toBe(0);
        expect(view.selectedDates)
            .toEqual([1]);
        expect(view.days.flat()
            .filter(cell => cell.enabled)
            .map(cell => cell.value))
            .toEqual([1]);
        expect(view.isSameMonth(0, 0))
            .toBeTrue();
    });

    it('отображает и выбирает метку 0 в представлении года', () => {
        const fixture = TestBed.createComponent(OwlYearViewComponent<number>);
        fixture.componentRef.setInput('pickerDateTime', 0);
        fixture.componentRef.setInput('selected', 0);
        fixture.componentRef.setInput('maxDate', 0);
        fixture.componentRef.setInput('selecteds', null);
        fixture.detectChanges();
        const view = fixture.componentInstance;
        expect(view.pickerDateTime)
            .toBe(0);
        expect(view.activeCell)
            .toBe(0);
        expect(view.selectedMonths)
            .toEqual([0]);
        expect(view.months.flat()
            .filter(cell => cell.enabled)
            .map(cell => cell.value))
            .toEqual([0]);
    });

    it('отображает и выбирает метку 0 в представлении нескольких лет', () => {
        const fixture = TestBed.createComponent(OwlMultiYearViewComponent<number>);
        fixture.componentRef.setInput('pickerDateTime', 0);
        fixture.componentRef.setInput('selected', 0);
        fixture.componentRef.setInput('minDate', 0);
        fixture.componentRef.setInput('maxDate', 0);
        fixture.componentRef.setInput('selecteds', null);
        fixture.detectChanges();
        const view = fixture.componentInstance;
        expect(view.pickerDateTime)
            .toBe(0);
        expect(view.selectedYears)
            .toEqual([1970]);
        expect(view.years.flat()
            .filter(cell => cell.enabled)
            .map(cell => cell.value))
            .toEqual([1970]);
        expect(view.previousEnabled())
            .toBeFalse();
        expect(view.nextEnabled())
            .toBeFalse();
    });
});
