import { ChangeDetectionStrategy, Component, DebugElement, provideZoneChangeDetection } from '@angular/core';
/**
 * calendar-year-view.component.spec
 */
import { DateTime } from 'luxon';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OwlDateTimeIntl } from './date-time-picker-intl.service';
import { OwlLuxonDateTimeModule } from './adapter/luxon-date-time.module';
import { OwlDateTimeModule } from './date-time.module';
import { OwlYearViewComponent } from './calendar-year-view.component';
import { By } from '@angular/platform-browser';
import { createTestDateTime, dispatchKeyboardEvent, dispatchMouseEvent } from '../../test-helpers';
import { DOWN_ARROW, END, HOME, LEFT_ARROW, PAGE_DOWN, PAGE_UP, RIGHT_ARROW, UP_ARROW } from '@angular/cdk/keycodes';

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

describe('Компонент OwlYearViewComponent', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [OwlLuxonDateTimeModule, OwlDateTimeModule],
            declarations: [
                StandardYearViewComponent,
                YearViewWithDateFilterComponent
            ],
            providers: [provideZoneChangeDetection(), OwlDateTimeIntl]
        }).compileComponents();
    });

    describe('Стандартное представление года', () => {
        let fixture: ComponentFixture<StandardYearViewComponent>;
        let testComponent: StandardYearViewComponent;
        let yearViewDebugElement: DebugElement;
        let yearViewElement: HTMLElement;
        let yearViewInstance: OwlYearViewComponent<DateTime>;

        beforeEach(() => {
            fixture = TestBed.createComponent(StandardYearViewComponent);
            fixture.detectChanges();

            yearViewDebugElement = fixture.debugElement.query(
                By.directive(OwlYearViewComponent)
            );
            yearViewElement = yearViewDebugElement.nativeElement;
            testComponent = fixture.componentInstance;
            yearViewInstance = yearViewDebugElement.componentInstance;
        });

        it('отображает 12 месяцев', () => {
            const cellEls = yearViewElement.querySelectorAll(
                '.owl-dt-calendar-cell'
            );
            expect(cellEls.length).toBe(12);
        });

        it('отображает выбранный месяц в текущем году', () => {
            const selectedElContent = yearViewElement.querySelector(
                '.owl-dt-calendar-cell-selected.owl-dt-calendar-cell-content'
            );
            expect(selectedElContent.innerHTML.trim()).toBe('Jan');
        });

        it('не отображает выбранный месяц из другого года', () => {
            testComponent.selected = createTestDateTime(2017, JAN, 10);
            fixture.detectChanges();

            const selectedElContent = yearViewElement.querySelector(
                '.owl-calendar-body-selected.owl-dt-calendar-cell-content'
            );
            expect(selectedElContent).toBeNull();
        });

        it('отправляет событие изменения при нажатии на ячейку', () => {
            const cellDecember = yearViewElement.querySelector(
                '[aria-label="December 2018"]'
            );
            dispatchMouseEvent(cellDecember, 'click');
            fixture.detectChanges();

            const selectedElContent = yearViewElement.querySelector(
                '.owl-dt-calendar-cell-active .owl-dt-calendar-cell-content'
            );
            expect(selectedElContent.innerHTML.trim()).toBe('Dec');
        });

        it('отмечает активную дату', () => {
            const cellDecember = yearViewElement.querySelector(
                '[aria-label="January 2018"]'
            );
            expect((cellDecember as HTMLElement).innerText.trim()).toBe('Jan');
            expect(cellDecember.classList).toContain(
                'owl-dt-calendar-cell-active'
            );
        });

        it('разрешает выбор месяца с меньшим числом дней, чем день текущей активной даты', () => {
            testComponent.pickerDateTime = createTestDateTime(2017, JUL, 31);
            fixture.detectChanges();

            const cellJune = yearViewElement.querySelector(
                '[aria-label="June 2017"]'
            );
            dispatchMouseEvent(cellJune, 'click');
            fixture.detectChanges();

            expect(testComponent.pickerDateTime).toEqual(createTestDateTime(2017, JUN, 30));
        });

        it('переходит к предыдущему месяцу по ArrowLeft', () => {
            const calendarBodyEl = yearViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', LEFT_ARROW);
            fixture.detectChanges();

            expect(yearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2017, DEC, 5)
            );

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', LEFT_ARROW);
            fixture.detectChanges();

            expect(yearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2017, NOV, 5)
            );
        });

        it('переходит к следующему месяцу по ArrowRight', () => {
            const calendarBodyEl = yearViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', RIGHT_ARROW);
            fixture.detectChanges();

            expect(yearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2018, FEB, 5)
            );

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', RIGHT_ARROW);
            fixture.detectChanges();

            expect(yearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2018, MAR, 5)
            );
        });

        it('переходит на строку выше по ArrowUp', () => {
            const calendarBodyEl = yearViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', UP_ARROW);
            fixture.detectChanges();

            expect(yearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2017, OCT, 5)
            );

            yearViewInstance.pickerDateTime = createTestDateTime(2018, JUL, 1);
            fixture.detectChanges();

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', UP_ARROW);
            fixture.detectChanges();

            expect(yearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2018, APR, 1)
            );

            yearViewInstance.pickerDateTime = createTestDateTime(2018, DEC, 10);
            fixture.detectChanges();

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', UP_ARROW);
            fixture.detectChanges();

            expect(yearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2018, SEP, 10)
            );
        });

        it('переходит на строку ниже по ArrowDown', () => {
            const calendarBodyEl = yearViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', DOWN_ARROW);
            fixture.detectChanges();

            expect(yearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2018, APR, 5)
            );

            yearViewInstance.pickerDateTime = createTestDateTime(2018, JUN, 1);
            fixture.detectChanges();

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', DOWN_ARROW);
            fixture.detectChanges();

            expect(yearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2018, SEP, 1)
            );

            yearViewInstance.pickerDateTime = createTestDateTime(2018, SEP, 30);
            fixture.detectChanges();

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', DOWN_ARROW);
            fixture.detectChanges();

            expect(yearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2018, DEC, 30)
            );
        });

        it('переходит к первому месяцу года по Home', () => {
            yearViewInstance.pickerDateTime = createTestDateTime(2018, SEP, 30);
            fixture.detectChanges();

            const calendarBodyEl = yearViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', HOME);
            fixture.detectChanges();

            expect(yearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2018, JAN, 30)
            );

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', HOME);
            fixture.detectChanges();

            expect(yearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2018, JAN, 30)
            );
        });

        it('переходит к последнему месяцу года по End', () => {
            yearViewInstance.pickerDateTime = createTestDateTime(2018, OCT, 31);
            fixture.detectChanges();

            const calendarBodyEl = yearViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', END);
            fixture.detectChanges();

            expect(yearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2018, DEC, 31)
            );

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', END);
            fixture.detectChanges();

            expect(yearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2018, DEC, 31)
            );
        });

        it('переходит на год назад по PageUp', () => {
            yearViewInstance.pickerDateTime = createTestDateTime(2016, FEB, 29);
            fixture.detectChanges();

            const calendarBodyEl = yearViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', PAGE_UP);
            fixture.detectChanges();

            expect(yearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2015, FEB, 28)
            );

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', PAGE_UP);
            fixture.detectChanges();

            expect(yearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2014, FEB, 28)
            );
        });

        it('переходит на год вперёд по PageDown', () => {
            yearViewInstance.pickerDateTime = createTestDateTime(2016, FEB, 29);
            fixture.detectChanges();

            const calendarBodyEl = yearViewElement.querySelector(
                '.owl-dt-calendar-body'
            );
            dispatchKeyboardEvent(calendarBodyEl, 'keydown', PAGE_DOWN);
            fixture.detectChanges();

            expect(yearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2017, FEB, 28)
            );

            dispatchKeyboardEvent(calendarBodyEl, 'keydown', PAGE_DOWN);
            fixture.detectChanges();

            expect(yearViewInstance.pickerDateTime).toEqual(
                createTestDateTime(2018, FEB, 28)
            );
        });
    });

    describe('Представление года с фильтром дат', () => {
        let fixture: ComponentFixture<YearViewWithDateFilterComponent>;
        let yearViewNativeElement: Element;

        beforeEach(() => {
            fixture = TestBed.createComponent(YearViewWithDateFilterComponent);
            fixture.detectChanges();

            const yearViewDebugElement = fixture.debugElement.query(
                By.directive(OwlYearViewComponent)
            );
            yearViewNativeElement = yearViewDebugElement.nativeElement;
        });

        it('блокирует месяцы, исключённые фильтром', () => {
            const cellJan = yearViewNativeElement.querySelector(
                '[aria-label="January 2018"]'
            );
            const cellFeb = yearViewNativeElement.querySelector(
                '[aria-label="February 2018"]'
            );
            expect(cellJan.classList).not.toContain(
                'owl-dt-calendar-cell-disabled'
            );
            expect(cellFeb.classList).toContain(
                'owl-dt-calendar-cell-disabled'
            );
        });
    });
});

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
        <owl-date-time-year-view
                [selected]="selected"
                [(pickerDateTime)]="pickerDateTime"
                (change)="handleChange($event)"></owl-date-time-year-view>
    `
})
class StandardYearViewComponent {
    selected = createTestDateTime(2018, JAN, 10);
    pickerDateTime = createTestDateTime(2018, JAN, 5);

    handleChange(date: DateTime): void {
        this.pickerDateTime = createTestDateTime(date);
    }
}

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
        <owl-date-time-year-view
                [(pickerDateTime)]="pickerDateTime"
                [dateFilter]="dateFilter"></owl-date-time-year-view>
    `
})
class YearViewWithDateFilterComponent {
    pickerDateTime = createTestDateTime(2018, JAN, 1);
    dateFilter(date: DateTime) {
        return date.month - 1 !== FEB;
    }
}
