import { ChangeDetectionStrategy, Component, DebugElement, provideZoneChangeDetection } from '@angular/core';
/**
 * calendar-multi-year-view.component.spec
 */
import { DateTime } from 'luxon';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OwlDateTimeIntl } from './date-time-picker-intl.service';
import { OwlLuxonDateTimeModule } from './adapter/luxon-date-time.module';
import { OwlDateTimeModule } from './date-time.module';
import { By } from '@angular/platform-browser';
import { OwlMultiYearViewComponent } from './calendar-multi-year-view.component';
import { createTestDateTime, dispatchKeyboardEvent, dispatchMouseEvent } from '../../test-helpers';
import { DOWN_ARROW, END, HOME, LEFT_ARROW, PAGE_DOWN, PAGE_UP, RIGHT_ARROW, UP_ARROW } from '@angular/cdk/keycodes';
import { Options, OptionsTokens } from './options-provider';

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

const YEAR_ROWS = 7;
const YEARS_PER_ROW = 3;

describe('Компонент OwlMultiYearViewComponent', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [OwlLuxonDateTimeModule, OwlDateTimeModule],
            declarations: [
                StandardMultiYearViewComponent,
                MultiYearViewWithDateFilterComponent
            ],
            providers: [
                provideZoneChangeDetection(), OwlDateTimeIntl, {
                provide: OptionsTokens.multiYear,
                useFactory: () =>
                    ({
                        yearRows: YEAR_ROWS,
                        yearsPerRow: YEARS_PER_ROW,
                    } as Options['multiYear']),
            },]
        }).compileComponents();
    });

    describe('Стандартное представление нескольких лет', () => {
        let fixture: ComponentFixture<StandardMultiYearViewComponent>;
        let testComponent: StandardMultiYearViewComponent;
        let multiYearViewDebugElement: DebugElement;
        let multiYearViewElement: HTMLElement;
        let multiYearViewInstance: OwlMultiYearViewComponent<DateTime>;

        beforeEach(() => {
            fixture = TestBed.createComponent(StandardMultiYearViewComponent);
            fixture.detectChanges();

            multiYearViewDebugElement = fixture.debugElement.query(
                By.directive(OwlMultiYearViewComponent)
            );
            multiYearViewElement = multiYearViewDebugElement.nativeElement;
            testComponent = fixture.componentInstance;
            multiYearViewInstance = multiYearViewDebugElement.componentInstance;
        });

        it('отображает правильное количество лет', () => {
            const cellEls = multiYearViewElement.querySelectorAll(
                '.owl-dt-calendar-cell'
            );
            expect(cellEls.length).toBe(YEARS_PER_ROW * YEAR_ROWS);
        });

        it('отображает выбранный год в текущем диапазоне', () => {
            const selectedElContent = multiYearViewElement.querySelector(
                '.owl-dt-calendar-cell-selected.owl-dt-calendar-cell-content'
            );
            expect(selectedElContent.innerHTML.trim()).toBe('2020');
        });

        it('не отображает выбранный год из другого диапазона', () => {
            testComponent.selected = createTestDateTime(2040, JAN, 10);
            fixture.detectChanges();

            const selectedElContent = multiYearViewElement.querySelector(
                '.owl-calendar-body-selected.owl-dt-calendar-cell-content'
            );
            expect(selectedElContent).toBeNull();
        });

        it('отправляет событие изменения при нажатии на ячейку', () => {
            const cellDecember = multiYearViewElement.querySelector(
                '[aria-label="2030"]'
            );
            dispatchMouseEvent(cellDecember, 'click');
            fixture.detectChanges();

            const selectedElContent = multiYearViewElement.querySelector(
                '.owl-dt-calendar-cell-active .owl-dt-calendar-cell-content'
            );
            expect(selectedElContent.innerHTML.trim()).toBe('2030');
        });

        it('отмечает активную дату', () => {
            const cell2017 = multiYearViewElement.querySelector(
                '[aria-label="2018"]'
            );
            expect((cell2017 as HTMLElement).innerText.trim()).toBe('2018');
            expect(cell2017.classList).toContain('owl-dt-calendar-cell-active');
        });

        it('переходит к предыдущему году по ArrowLeft', () => {
            const calendarBodyEl = multiYearViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', LEFT_ARROW);
            fixture.detectChanges();

            expect(multiYearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2017, JAN, 5)
            );

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', LEFT_ARROW);
            fixture.detectChanges();

            expect(multiYearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2016, JAN, 5)
            );
        });

        it('переходит к следующему году по ArrowRight', () => {
            const calendarBodyEl = multiYearViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', RIGHT_ARROW);
            fixture.detectChanges();

            expect(multiYearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2019, JAN, 5)
            );

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', RIGHT_ARROW);
            fixture.detectChanges();

            expect(multiYearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2020, JAN, 5)
            );
        });

        it('переходит на строку выше по ArrowUp', () => {
            const calendarBodyEl = multiYearViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', UP_ARROW);
            fixture.detectChanges();

            expect(multiYearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2018 - YEARS_PER_ROW, JAN, 5)
            );

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', UP_ARROW);
            fixture.detectChanges();

            expect(multiYearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2018 - YEARS_PER_ROW * 2, JAN, 5)
            );
        });

        it('переходит на строку ниже по ArrowDown', () => {
            const calendarBodyEl = multiYearViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', DOWN_ARROW);
            fixture.detectChanges();

            expect(multiYearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2018 + YEARS_PER_ROW, JAN, 5)
            );

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', DOWN_ARROW);
            fixture.detectChanges();

            expect(multiYearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2018 + YEARS_PER_ROW * 2, JAN, 5)
            );
        });

        it('переходит к первому году текущего диапазона по Home', () => {
            const calendarBodyEl = multiYearViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', HOME);
            fixture.detectChanges();

            expect(multiYearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2016, JAN, 5)
            );

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', HOME);
            fixture.detectChanges();

            expect(multiYearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2016, JAN, 5)
            );
        });

        it('переходит к последнему году текущего диапазона по End', () => {
            const calendarBodyEl = multiYearViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', END);
            fixture.detectChanges();

            expect(multiYearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2036, JAN, 5)
            );

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', END);
            fixture.detectChanges();

            expect(multiYearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2036, JAN, 5)
            );
        });

        it('переходит к тому же индексу в предыдущем диапазоне лет по PageUp', () => {
            const calendarBodyEl = multiYearViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', PAGE_UP);
            fixture.detectChanges();

            expect(multiYearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2018 - YEARS_PER_ROW * YEAR_ROWS, JAN, 5)
            );

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', PAGE_UP);
            fixture.detectChanges();

            expect(multiYearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2018 - YEARS_PER_ROW * YEAR_ROWS * 2, JAN, 5)
            );
        });

        it('переходит к тому же индексу в следующем диапазоне лет по PageDown', () => {
            const calendarBodyEl = multiYearViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', PAGE_DOWN);
            fixture.detectChanges();

            expect(multiYearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2018 + YEARS_PER_ROW * YEAR_ROWS, JAN, 5)
            );

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', PAGE_DOWN);
            fixture.detectChanges();

            expect(multiYearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2018 + YEARS_PER_ROW * YEAR_ROWS * 2, JAN, 5)
            );
        });
    });

    describe('Представление нескольких лет с фильтром дат', () => {
        let fixture: ComponentFixture<MultiYearViewWithDateFilterComponent>;
        let multiYearViewElement: Element;

        beforeEach(() => {
            fixture = TestBed.createComponent(
                MultiYearViewWithDateFilterComponent
            );
            fixture.detectChanges();

            const multiYearViewDebugElement = fixture.debugElement.query(
                By.directive(OwlMultiYearViewComponent)
            );
            multiYearViewElement = multiYearViewDebugElement.nativeElement;
        });

        it('блокирует годы, исключённые фильтром', () => {
            const cell2018 = multiYearViewElement.querySelector(
                '[aria-label="2018"]'
            );
            const cell2019 = multiYearViewElement.querySelector(
                '[aria-label="2019"]'
            );
            expect(cell2019.classList).not.toContain(
                'owl-dt-calendar-cell-disabled'
            );
            expect(cell2018.classList).toContain(
                'owl-dt-calendar-cell-disabled'
            );
        });
    });
});

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
        <owl-date-time-multi-year-view
                [selected]="selected"
                [(pickerDateTime)]="pickerDateTime"
                (change)="handleChange($event)"></owl-date-time-multi-year-view>
    `
})
class StandardMultiYearViewComponent {
    selected = createTestDateTime(2020, JAN, 10);
    pickerDateTime = createTestDateTime(2018, JAN, 5);

    handleChange(date: DateTime): void {
        this.pickerDateTime = createTestDateTime(date);
    }
}

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
        <owl-date-time-multi-year-view
                [(pickerDateTime)]="pickerDateTime"
                [dateFilter]="dateFilter"></owl-date-time-multi-year-view>
    `
})
class MultiYearViewWithDateFilterComponent {
    pickerDateTime = createTestDateTime(2018, JAN, 1);
    dateFilter(date: DateTime) {
        return date.year !== 2018;
    }
}
