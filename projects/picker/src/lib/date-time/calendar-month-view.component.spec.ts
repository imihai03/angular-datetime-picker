import { ChangeDetectionStrategy, Component, DebugElement, provideZoneChangeDetection } from '@angular/core';
/**
 * calendar-month-view.component.spec
 */
import { DateTime } from 'luxon';
import { registerLocaleData } from '@angular/common';
import localeDutch from '@angular/common/locales/nl';
import { DateTimeAdapter } from './adapter/date-time-adapter.class';
import { OwlMonthViewComponent } from './calendar-month-view.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OwlDateTimeIntl } from './date-time-picker-intl.service';
import { OwlLuxonDateTimeModule } from './adapter/luxon-date-time.module';
import { OwlDateTimeModule } from './date-time.module';
import { By } from '@angular/platform-browser';
import { createTestDateTime, dispatchKeyboardEvent } from '../../test-helpers';
import { DOWN_ARROW, END, ENTER, HOME, LEFT_ARROW, PAGE_DOWN, PAGE_UP, RIGHT_ARROW, UP_ARROW } from '@angular/cdk/keycodes';

const JAN = 0,
    FEB = 1,
    MAR = 2,
    APR = 3,
    MAY = 4,
    JUN = 5,
    JUL = 6,
    AUG = 7,
    SEP = 8,
    OCT = 9,
    NOV = 10,
    DEC = 11;

describe('Компонент OwlMonthViewComponent', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [OwlLuxonDateTimeModule, OwlDateTimeModule],
            declarations: [
                StandardMonthViewComponent,
                MonthViewWithDateFilterComponent
            ],
            providers: [provideZoneChangeDetection(), OwlDateTimeIntl]
        }).compileComponents();
    });

    describe('Стандартное представление месяца', () => {
        let fixture: ComponentFixture<StandardMonthViewComponent>;
        let testComponent: StandardMonthViewComponent;
        let monthViewDebugElement: DebugElement;
        let monthViewElement: HTMLElement;
        let monthViewInstance: OwlMonthViewComponent<DateTime>;

        beforeEach(() => {
            fixture = TestBed.createComponent(StandardMonthViewComponent);
            fixture.detectChanges();

            monthViewDebugElement = fixture.debugElement.query(
                By.directive(OwlMonthViewComponent)
            );
            monthViewElement = monthViewDebugElement.nativeElement;
            testComponent = fixture.componentInstance;
            monthViewInstance = monthViewDebugElement.componentInstance;
        });

        it('отображает 42 ячейки календарных дней', () => {
            const cellEls = monthViewElement.querySelectorAll(
                '.owl-dt-calendar-cell'
            );
            expect(cellEls.length).toBe(42);
        });

        it('отображает выбранную дату в текущем месяце', () => {
            const selectedEl = monthViewElement.querySelector(
                '.owl-dt-calendar-cell-selected'
            );
            expect(selectedEl.innerHTML.trim()).toBe('10');
        });

        it('не отображает выбранную дату из другого месяца', () => {
            testComponent.selected = createTestDateTime(2018, MAR, 10);
            fixture.detectChanges();
            const selectedEl = monthViewElement.querySelector(
                '.owl-dt-calendar-cell-selected'
            );
            expect(selectedEl).toBeNull();
        });

        it('отмечает активную дату', () => {
            const selectedElContent = monthViewElement.querySelector(
                '.owl-dt-calendar-cell-active .owl-dt-calendar-cell-content'
            );
            expect(selectedElContent.innerHTML.trim()).toBe('5');
        });

        it('по умолчанию начинает неделю с воскресенья', () => {
            expect(monthViewInstance.firstDayOfWeek).toBe(0);
            const weekdayCells = monthViewElement.querySelectorAll(
                '.owl-dt-weekday'
            );
            expect(weekdayCells[0].getAttribute('aria-label')).toBe('Sunday');
        });

        it('начинает неделю с понедельника при firstDayOfWeek равном 1', () => {
            monthViewInstance.firstDayOfWeek = 1;
            fixture.detectChanges();
            const weekdayCells = monthViewElement.querySelectorAll(
                '.owl-dt-weekday'
            );
            expect(weekdayCells[0].getAttribute('aria-label')).toBe('Monday');
        });

        it('начинает неделю с субботы при firstDayOfWeek равном 6', () => {
            monthViewInstance.firstDayOfWeek = 6;
            fixture.detectChanges();
            const weekdayCells = monthViewElement.querySelectorAll(
                '.owl-dt-weekday'
            );
            expect(weekdayCells[0].getAttribute('aria-label')).toBe('Saturday');
        });

        it('переходит к предыдущей дате по ArrowLeft', () => {
            const calendarBodyEl = monthViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', LEFT_ARROW);
            fixture.detectChanges();
            expect(testComponent.pickerDateTime).toEqual(createTestDateTime(2018, JAN, 4));

            monthViewInstance.pickerDateTime = createTestDateTime(2017, JAN, 1);
            fixture.detectChanges();

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', LEFT_ARROW);
            fixture.detectChanges();

            expect(testComponent.pickerDateTime).toEqual(createTestDateTime(2016, DEC, 31));
        });

        it('переходит к следующей дате по ArrowRight', () => {
            const calendarBodyEl = monthViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', RIGHT_ARROW);
            fixture.detectChanges();

            expect(testComponent.pickerDateTime).toEqual(createTestDateTime(2018, JAN, 6));

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', RIGHT_ARROW);
            fixture.detectChanges();

            expect(testComponent.pickerDateTime).toEqual(createTestDateTime(2018, JAN, 7));
        });

        it('переходит на строку выше по ArrowUp', () => {
            const calendarBodyEl = monthViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', UP_ARROW);
            fixture.detectChanges();

            expect(testComponent.pickerDateTime).toEqual(createTestDateTime(2017, DEC, 29));

            monthViewInstance.pickerDateTime = createTestDateTime(2017, JAN, 7);
            fixture.detectChanges();

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', UP_ARROW);
            fixture.detectChanges();

            expect(testComponent.pickerDateTime).toEqual(createTestDateTime(2016, DEC, 31));
        });

        it('переходит на строку ниже по ArrowDown', () => {
            const calendarBodyEl = monthViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', DOWN_ARROW);
            fixture.detectChanges();

            expect(testComponent.pickerDateTime).toEqual(createTestDateTime(2018, JAN, 12));

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', DOWN_ARROW);
            fixture.detectChanges();

            expect(testComponent.pickerDateTime).toEqual(createTestDateTime(2018, JAN, 19));
        });

        it('переходит к началу месяца по Home', () => {
            monthViewInstance.pickerDateTime = createTestDateTime(2018, JAN, 7);
            fixture.detectChanges();

            const calendarBodyEl = monthViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', HOME);
            fixture.detectChanges();

            expect(testComponent.pickerDateTime).toEqual(createTestDateTime(2018, JAN, 1));

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', HOME);
            fixture.detectChanges();

            expect(testComponent.pickerDateTime).toEqual(createTestDateTime(2018, JAN, 1));
        });

        it('переходит к концу месяца по End', () => {
            monthViewInstance.pickerDateTime = createTestDateTime(2018, JAN, 7);
            fixture.detectChanges();

            const calendarBodyEl = monthViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', END);
            fixture.detectChanges();

            expect(testComponent.pickerDateTime).toEqual(createTestDateTime(2018, JAN, 31));

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', END);
            fixture.detectChanges();

            expect(testComponent.pickerDateTime).toEqual(createTestDateTime(2018, JAN, 31));
        });

        it('переходит на месяц назад по PageUp', () => {
            const calendarBodyEl = monthViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', PAGE_UP);
            fixture.detectChanges();

            expect(testComponent.pickerDateTime).toEqual(createTestDateTime(2017, DEC, 5));

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', PAGE_UP);
            fixture.detectChanges();

            expect(testComponent.pickerDateTime).toEqual(createTestDateTime(2017, NOV, 5));
        });

        it('переходит на месяц вперёд по PageDown', () => {
            const calendarBodyEl = monthViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', PAGE_DOWN);
            fixture.detectChanges();

            expect(testComponent.pickerDateTime).toEqual(createTestDateTime(2018, FEB, 5));

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', PAGE_DOWN);
            fixture.detectChanges();

            expect(testComponent.pickerDateTime).toEqual(createTestDateTime(2018, MAR, 5));
        });

        it('выбирает активную дату по Enter', () => {
            const calendarBodyEl = monthViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', LEFT_ARROW);
            fixture.detectChanges();

            expect(testComponent.selected).toEqual(createTestDateTime(2018, JAN, 10));

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', ENTER);
            fixture.detectChanges();

            expect(testComponent.selected).toEqual(createTestDateTime(2018, JAN, 4));
        });
    });

    describe('Представление месяца с фильтром дат', () => {
        let fixture: ComponentFixture<MonthViewWithDateFilterComponent>;
        let monthViewNativeElement: Element;

        beforeEach(() => {
            fixture = TestBed.createComponent(MonthViewWithDateFilterComponent);
            fixture.detectChanges();

            const monthViewDebugElement = fixture.debugElement.query(
                By.directive(OwlMonthViewComponent)
            );
            monthViewNativeElement = monthViewDebugElement.nativeElement;
        });

        it('блокирует даты, исключённые фильтром', () => {
            const cellOne = monthViewNativeElement.querySelector(
                '[aria-label="01.01.2018"]'
            );
            const cellTwo = monthViewNativeElement.querySelector(
                '[aria-label="02.01.2018"]'
            );
            expect(cellOne.classList).toContain(
                'owl-dt-calendar-cell-disabled'
            );
            expect(cellTwo.classList).not.toContain(
                'owl-dt-calendar-cell-disabled'
            );
        });
    });


    describe('Стандартное представление месяца: локализация', () => {
        let fixture: ComponentFixture<StandardMonthViewComponent>;
        let adapter: DateTimeAdapter<unknown>;
        let monthViewDebugElement: DebugElement;
        let monthViewElement: HTMLElement;
        let monthViewInstance: OwlMonthViewComponent<DateTime>;

        beforeAll(() => {
            registerLocaleData(localeDutch);
        });

        beforeEach(() => {
            fixture = TestBed.createComponent(StandardMonthViewComponent);

            adapter = TestBed.inject(DateTimeAdapter);
            monthViewDebugElement = fixture.debugElement.query(
                By.directive(OwlMonthViewComponent)
            );
            monthViewElement = monthViewDebugElement.nativeElement;
            monthViewInstance = monthViewDebugElement.componentInstance;
        });

        it('определяет первый день недели по текущей локали', () => {
            adapter.setLocale('nl-NL');

            fixture.detectChanges();
            const weekdayCells = monthViewElement.querySelectorAll(
                '.owl-dt-weekday'
            );
            expect(weekdayCells[0].getAttribute('aria-label')).toBe('maandag');
        });

        it('начинает неделю с воскресенья при отсутствии данных локали', () => {
            adapter.setLocale('unknown');

            fixture.detectChanges();
            const weekdayCells = monthViewElement.querySelectorAll(
                '.owl-dt-weekday'
            );
            expect(monthViewInstance.firstDayOfWeek)
                .toBe(0);
            expect(weekdayCells[0].getAttribute('aria-label'))
                .toBe(adapter.getDayOfWeekNames('long')[0]);
        });

        it('обновляет первый день недели по умолчанию при смене локали', () => {
            adapter.setLocale('nl-NL');

            fixture.detectChanges();
            const weekdayCellsNl = monthViewElement.querySelectorAll(
                '.owl-dt-weekday'
            );
            expect(weekdayCellsNl[0].getAttribute('aria-label')).toBe('maandag');

            adapter.setLocale('en-US');

            fixture.detectChanges();
            const weekdayCellsUs = monthViewElement.querySelectorAll(
                '.owl-dt-weekday'
            );
            expect(weekdayCellsUs[0].getAttribute('aria-label')).toBe('Sunday');
        });
    });
});

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
        <owl-date-time-month-view
                [(selected)]="selected"
                [(pickerDateTime)]="pickerDateTime"></owl-date-time-month-view>
    `
})
class StandardMonthViewComponent {
    selected = createTestDateTime(2018, JAN, 10);
    pickerDateTime = createTestDateTime(2018, JAN, 5);
}

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
        <owl-date-time-month-view
                [(pickerDateTime)]="pickerDateTime"
                [dateFilter]="dateFilter"></owl-date-time-month-view>
    `
})
class MonthViewWithDateFilterComponent {
    pickerDateTime = createTestDateTime(2018, JAN, 1);
    dateFilter(date: DateTime) {
      // tslint:disable-next-line:triple-equals
        return date.day % 2 === 0;
    }
}
