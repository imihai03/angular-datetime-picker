/**
 * calendar.component.spec
 */

import { DateTime } from 'luxon';
import { ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { ChangeDetectionStrategy, Component, provideZoneChangeDetection } from '@angular/core';
import { createTestDateTime, dispatchFakeEvent, dispatchKeyboardEvent, dispatchMouseEvent } from '../../test-helpers';
import { OwlLuxonDateTimeModule } from './adapter/luxon-date-time.module';
import { OwlDateTimeModule } from './date-time.module';
import { OwlCalendarComponent } from './calendar.component';
import { OwlDateTimeIntl } from './date-time-picker-intl.service';
import { By } from '@angular/platform-browser';
import { ENTER, RIGHT_ARROW } from '@angular/cdk/keycodes';
import { OwlMonthViewComponent } from './calendar-month-view.component';
import { OwlYearViewComponent } from './calendar-year-view.component';
import { OwlMultiYearViewComponent } from './calendar-multi-year-view.component';
import { DateView } from './date-time.class';

export const JAN = 0,
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

describe('Компонент OwlCalendarComponent', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [OwlLuxonDateTimeModule, OwlDateTimeModule],
            declarations: [
                StandardCalendarComponent,
                CalendarWithCalendarWeeks,
                CalendarWithMinMaxComponent,
                CalendarWithDateFilterComponent
            ],
            providers: [
                OwlDateTimeIntl,
                provideZoneChangeDetection()
            ]
        }).compileComponents();
    });

    describe('Стандартный календарь', () => {
        let fixture: ComponentFixture<StandardCalendarComponent>;
        let testComponent: StandardCalendarComponent;
        let calendarElement: HTMLElement;
        let periodButton: HTMLElement;
        let calendarInstance: OwlCalendarComponent<DateTime>;

        beforeEach(() => {
            fixture = TestBed.createComponent(StandardCalendarComponent);
            fixture.detectChanges();

            const calendarDebugElement = fixture.debugElement.query(
                By.directive(OwlCalendarComponent)
            );
            calendarElement = calendarDebugElement.nativeElement;

            periodButton = calendarElement.querySelector(
                '.owl-dt-control-period-button'
            ) as HTMLElement;
            calendarInstance = calendarDebugElement.componentInstance;
            testComponent = fixture.componentInstance;
        });

        it('открывает представление месяца с заданным активным месяцем', () => {
            expect(calendarInstance.currentView).toBe(DateView.MONTH);
            expect(calendarInstance.pickerDateTime).toEqual(
                createTestDateTime(2018, JAN, 31)
            );
        });

        it('выбирает дату в представлении месяца', () => {
            const monthCell = calendarElement.querySelector(
                '[aria-label="31.01.2018"]'
            );
            (monthCell as HTMLElement).click();

            fixture.detectChanges();
            expect(calendarInstance.currentView).toBe(DateView.MONTH);
            expect(testComponent.selected).toEqual(createTestDateTime(2018, JAN, 31));
        });

        it('отправляет выбранный месяц при нажатии на ячейку в представлении года', () => {
            periodButton.click();
            fixture.detectChanges();

            expect(calendarInstance.currentView).toBe(DateView.MULTI_YEARS);
            expect(calendarInstance.pickerDateTime).toEqual(
                createTestDateTime(2018, JAN, 31)
            );

            (calendarElement.querySelector(
                '.owl-dt-calendar-cell-active'
            ) as HTMLElement).click();

            fixture.detectChanges();

            expect(calendarInstance.currentView).toBe(DateView.YEAR);

            (calendarElement.querySelector(
                '.owl-dt-calendar-cell-active'
            ) as HTMLElement).click();

            const normalizedMonth: DateTime =
                fixture.componentInstance.selectedMonth;
            expect(normalizedMonth.month - 1).toEqual(0);
        });

        it('отправляет выбранный год при нажатии на ячейку в представлении нескольких лет', () => {
            periodButton.click();
            fixture.detectChanges();

            expect(calendarInstance.currentView).toBe(DateView.MULTI_YEARS);
            expect(calendarInstance.pickerDateTime).toEqual(
                createTestDateTime(2018, JAN, 31)
            );
            (calendarElement.querySelector(
                '.owl-dt-calendar-cell-active'
            ) as HTMLElement).click();

            fixture.detectChanges();

            const normalizedYear: DateTime = fixture.componentInstance.selectedYear;
            expect(normalizedYear.year).toEqual(2018);
        });

        it(
            'обновляет представление при изменении локализованных подписей',
            inject([OwlDateTimeIntl], (intl: OwlDateTimeIntl) => {
                const button = fixture.debugElement.nativeElement.querySelector(
                    '.owl-dt-control-period-button'
                );

                intl.switchToMultiYearViewLabel = 'Go to multi-year view?';
                intl.changes.next();
                fixture.detectChanges();

                expect(button.getAttribute('aria-label')).toBe(
                    'Go to multi-year view?'
                );
            })
        );

        it('устанавливает type="button" для всех кнопок', () => {
            const invalidButtons = calendarElement.querySelectorAll(
                'button:not([type="button"])'
            );
            expect(invalidButtons.length).toBe(0);
        });

        describe('Доступность', () => {
            describe('Тело календаря', () => {
                let calendarMainEl: HTMLElement;

                beforeEach(() => {
                    calendarMainEl = calendarElement.querySelector(
                        '.owl-dt-calendar-main'
                    ) as HTMLElement;
                    expect(calendarMainEl).not.toBeNull();

                    dispatchFakeEvent(calendarMainEl, 'focus');
                    fixture.detectChanges();
                });

                it('устанавливает pickerDateTime при инициализации', () => {
                    expect(calendarInstance.pickerDateTime).toEqual(
                        createTestDateTime(2018, JAN, 31)
                    );
                });

                it('позволяет сфокусировать основную область календаря', () => {
                    expect(calendarMainEl.getAttribute('tabindex')).toBe('-1');
                });

                it('не переносит фокус на активную ячейку при инициализации', () => {
                    const activeCell = calendarMainEl.querySelector(
                        '.owl-dt-calendar-cell-active'
                    ) as HTMLElement;

                    spyOn(activeCell, 'focus').and.callThrough();
                    fixture.detectChanges();

                    expect(activeCell.focus).not.toHaveBeenCalled();
                });

                it('переносит фокус на новую активную ячейку после смены представления', async () => {
                    const oldCell = calendarMainEl.querySelector('.owl-dt-calendar-cell-active');
                    periodButton.click();
                    fixture.detectChanges();
                    await fixture.whenStable();

                    const activeCell = calendarMainEl.querySelector('.owl-dt-calendar-cell-active');
                    expect(activeCell)
                        .not
                        .toBe(oldCell);
                    expect(document.activeElement)
                        .toBe(activeCell);
                });

                describe('Представление года', () => {
                    beforeEach(() => {
                        dispatchMouseEvent(periodButton, 'click');
                        fixture.detectChanges();

                        expect(calendarInstance.currentView).toBe(
                            DateView.MULTI_YEARS
                        );

                        (calendarMainEl.querySelector(
                            '.owl-dt-calendar-cell-active'
                        ) as HTMLElement).click();
                        fixture.detectChanges();

                        expect(calendarInstance.currentView).toBe(DateView.YEAR);
                    });

                    it('возвращается к представлению месяца по Enter', () => {
                        const tableBodyEl = calendarMainEl.querySelector(
                            '.owl-dt-calendar-body'
                        ) as HTMLElement;

                        dispatchKeyboardEvent(
                            tableBodyEl,
                            'keydown',
                            RIGHT_ARROW
                        );
                        fixture.detectChanges();

                        dispatchKeyboardEvent(tableBodyEl, 'keydown', ENTER);
                        fixture.detectChanges();

                        expect(calendarInstance.currentView).toBe(DateView.MONTH);
                        expect(calendarInstance.pickerDateTime).toEqual(
                            createTestDateTime(2018, FEB, 28)
                        );
                        expect(testComponent.selected).toBeUndefined();
                    });
                });

                describe('Представление нескольких лет', () => {
                    beforeEach(() => {
                        dispatchMouseEvent(periodButton, 'click');
                        fixture.detectChanges();

                        expect(calendarInstance.currentView).toBe(
                            DateView.MULTI_YEARS
                        );
                    });

                    it('возвращается к представлению года по Enter', () => {
                        const tableBodyEl = calendarMainEl.querySelector(
                            '.owl-dt-calendar-body'
                        ) as HTMLElement;

                        dispatchKeyboardEvent(
                            tableBodyEl,
                            'keydown',
                            RIGHT_ARROW
                        );
                        fixture.detectChanges();

                        dispatchKeyboardEvent(tableBodyEl, 'keydown', ENTER);
                        fixture.detectChanges();

                        expect(calendarInstance.currentView).toBe(DateView.YEAR);
                        expect(calendarInstance.pickerDateTime).toEqual(
                            createTestDateTime(2019, JAN, 31)
                        );
                        expect(testComponent.selected).toBeUndefined();
                    });
                });
            });
        });
    });

    describe('Календарь с номерами недель', () => {
        let fixture: ComponentFixture<CalendarWithCalendarWeeks>;
        let testComponent: CalendarWithCalendarWeeks;
        let calendarElement: HTMLElement;
        let calendarInstance: OwlCalendarComponent<DateTime>;

        beforeEach(() => {
            fixture = TestBed.createComponent(CalendarWithCalendarWeeks);

            const calendarDebugElement = fixture.debugElement.query(
                By.directive(OwlCalendarComponent)
            );
            calendarElement = calendarDebugElement.nativeElement;

            calendarInstance = calendarDebugElement.componentInstance;
            testComponent = fixture.componentInstance;

            fixture.detectChanges();
        });

        it('отображает номера недель при showCalendarWeeks равном true', () => {
            // Проверяем исходное значение false
            expect(calendarInstance.showCalendarWeeks).toBe(false);
            testComponent.showCalendarWeeks = true;
            fixture.detectChanges(); // Запускаем change detection для применения нового значения
            // Проверяем, что calendarInstance отражает изменение
            expect(calendarInstance.showCalendarWeeks).toBe(true);
        });

        it('добавляет классы номеров недель только при showCalendarWeeks равном true', () => {
            // Проверяем исходное значение false
            expect(calendarInstance.showCalendarWeeks).toBe(false);

            // Проверяем отсутствие классов в исходном состоянии
            let weekNumberElement = fixture.debugElement.nativeElement.querySelector('.week-number');
            let owlCalendarWeeksElement = fixture.debugElement.nativeElement.querySelector('.owl-calendar-weeks');
            expect(weekNumberElement).toBeNull();
            expect(owlCalendarWeeksElement).toBeNull();

            // Устанавливаем showCalendarWeeks в true
            testComponent.showCalendarWeeks = true;
            fixture.detectChanges(); // Запускаем change detection для применения нового значения

            // Проверяем, что calendarInstance отражает изменение
            expect(calendarInstance.showCalendarWeeks).toBe(true);

            // Проверяем наличие классов после изменения
            weekNumberElement = fixture.debugElement.nativeElement.querySelector('.week-number');
            owlCalendarWeeksElement = fixture.debugElement.nativeElement.querySelector('.owl-calendar-weeks');
            expect(weekNumberElement).toBeTruthy();
            expect(owlCalendarWeeksElement).toBeTruthy();
        });
    });


    describe('Календарь с границами min и max', () => {
        let fixture: ComponentFixture<CalendarWithMinMaxComponent>;
        let testComponent: CalendarWithMinMaxComponent;
        let calendarElement: HTMLElement;
        let calendarInstance: OwlCalendarComponent<DateTime>;

        beforeEach(() => {
            fixture = TestBed.createComponent(CalendarWithMinMaxComponent);
            fixture.detectChanges();

            const calendarDebugElement = fixture.debugElement.query(
                By.directive(OwlCalendarComponent)
            );
            calendarElement = calendarDebugElement.nativeElement;

            calendarInstance = calendarDebugElement.componentInstance;
            testComponent = fixture.componentInstance;
        });

        it('обновляет представление месяца при изменении minDate', () => {
            const monthViewDebugElm = fixture.debugElement.query(
                By.directive(OwlMonthViewComponent)
            );
            const monthViewComp = monthViewDebugElm.componentInstance;
            expect(monthViewComp).toBeTruthy();

            spyOn(monthViewComp, 'generateCalendar').and.callThrough();
            testComponent.minDate = createTestDateTime(2017, NOV, 1);
            fixture.detectChanges();

            expect(monthViewComp.generateCalendar).toHaveBeenCalled();
        });

        it('обновляет представление месяца при изменении maxDate', () => {
            const monthViewDebugElm = fixture.debugElement.query(
                By.directive(OwlMonthViewComponent)
            );
            const monthViewComp = monthViewDebugElm.componentInstance;
            expect(monthViewComp).toBeTruthy();

            spyOn(monthViewComp, 'generateCalendar').and.callThrough();
            testComponent.maxDate = createTestDateTime(2017, NOV, 1);
            fixture.detectChanges();

            expect(monthViewComp.generateCalendar).toHaveBeenCalled();
        });

        it('обновляет представление года при изменении minDate', () => {
            fixture.detectChanges();
            const periodButton = calendarElement.querySelector(
                '.owl-dt-control-period-button'
            ) as HTMLElement;
            periodButton.click();
            fixture.detectChanges();

            (calendarElement.querySelector(
                '.owl-dt-calendar-cell-active'
            ) as HTMLElement).click();
            fixture.detectChanges();

            const yearViewDebugElm = fixture.debugElement.query(
                By.directive(OwlYearViewComponent)
            );
            const yearViewComp = yearViewDebugElm.componentInstance;
            expect(yearViewComp).toBeTruthy();

            spyOn(yearViewComp, 'generateMonthList').and.callThrough();
            testComponent.minDate = createTestDateTime(2017, NOV, 1);
            fixture.detectChanges();

            expect(yearViewComp.generateMonthList).toHaveBeenCalled();
        });

        it('обновляет представление года при изменении maxDate', () => {
            fixture.detectChanges();
            const periodButton = calendarElement.querySelector(
                '.owl-dt-control-period-button'
            ) as HTMLElement;
            periodButton.click();
            fixture.detectChanges();

            (calendarElement.querySelector(
                '.owl-dt-calendar-cell-active'
            ) as HTMLElement).click();
            fixture.detectChanges();

            const yearViewDebugElm = fixture.debugElement.query(
                By.directive(OwlYearViewComponent)
            );
            const yearViewComp = yearViewDebugElm.componentInstance;
            expect(yearViewComp).toBeTruthy();

            spyOn(yearViewComp, 'generateMonthList').and.callThrough();
            testComponent.maxDate = createTestDateTime(2017, NOV, 1);
            fixture.detectChanges();

            expect(yearViewComp.generateMonthList).toHaveBeenCalled();
        });

        it('обновляет представление нескольких лет при изменении minDate', () => {
            fixture.detectChanges();
            const periodButton = calendarElement.querySelector(
                '.owl-dt-control-period-button'
            ) as HTMLElement;
            periodButton.click();
            fixture.detectChanges();

            const multiYearsViewDebugElm = fixture.debugElement.query(
                By.directive(OwlMultiYearViewComponent)
            );
            const multiYearsViewComp = multiYearsViewDebugElm.componentInstance;
            expect(multiYearsViewComp).toBeTruthy();

            spyOn(multiYearsViewComp, 'generateYearList').and.callThrough();
            testComponent.minDate = createTestDateTime(2017, NOV, 1);
            fixture.detectChanges();

            expect(multiYearsViewComp.generateYearList).toHaveBeenCalled();
        });

        it('обновляет представление нескольких лет при изменении maxDate', () => {
            fixture.detectChanges();
            const periodButton = calendarElement.querySelector(
                '.owl-dt-control-period-button'
            ) as HTMLElement;
            periodButton.click();
            fixture.detectChanges();

            const multiYearsViewDebugElm = fixture.debugElement.query(
                By.directive(OwlMultiYearViewComponent)
            );
            const multiYearsViewComp = multiYearsViewDebugElm.componentInstance;
            expect(multiYearsViewComp).toBeTruthy();

            spyOn(multiYearsViewComp, 'generateYearList').and.callThrough();
            testComponent.maxDate = createTestDateTime(2017, NOV, 1);
            fixture.detectChanges();

            expect(multiYearsViewComp.generateYearList).toHaveBeenCalled();
        });
    });

    describe('Календарь с фильтром дат', () => {
        let fixture: ComponentFixture<CalendarWithDateFilterComponent>;
        let testComponent: CalendarWithDateFilterComponent;
        let calendarElement: HTMLElement;
        let calendarInstance: OwlCalendarComponent<DateTime>;

        beforeEach(() => {
            fixture = TestBed.createComponent(CalendarWithDateFilterComponent);
            fixture.detectChanges();

            const calendarDebugElement = fixture.debugElement.query(
                By.directive(OwlCalendarComponent)
            );
            calendarElement = calendarDebugElement.nativeElement;
            calendarInstance = calendarDebugElement.componentInstance;
            testComponent = fixture.componentInstance;
        });

        it('блокирует исключённые фильтром даты и запрещает их выбор', () => {
            const monthCell = calendarElement.querySelector(
                '[aria-label="03.01.2018"]'
            );
            expect(testComponent.selected).toBeFalsy();

            (monthCell as HTMLElement).click();
            fixture.detectChanges();

            expect(testComponent.selected)
                .toBeFalsy();
        });
    });
});

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
        <owl-date-time-calendar
                [(selected)]="selected"
                [selectMode]="selectMode"
                [pickerDateTime]="pickerDateTime"
                (monthSelected)="selectedMonth=$event"
                (yearSelected)="selectedYear=$event"></owl-date-time-calendar>
    `
})
class StandardCalendarComponent {
    selectMode = 'single';
    selected: DateTime;
    selectedYear: DateTime;
    selectedMonth: DateTime;
    pickerDateTime = createTestDateTime(2018, JAN, 31);
}

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
        <owl-date-time-calendar [selectMode]="selectMode"
                                [pickerDateTime]="pickerDateTime"
                                [minDate]="minDate"
                                [maxDate]="maxDate"></owl-date-time-calendar>
    `
})
class CalendarWithMinMaxComponent {
    selectMode = 'single';
    startAt: DateTime;
    minDate = createTestDateTime(2016, JAN, 1);
    maxDate = createTestDateTime(2019, JAN, 1);
    pickerDateTime = createTestDateTime(2018, JAN, 31);
}

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
        <owl-date-time-calendar [selectMode]="selectMode"
                                [pickerDateTime]="pickerDateTime"
                                [showCalendarWeeks]="showCalendarWeeks"></owl-date-time-calendar>
    `
})
class CalendarWithCalendarWeeks {
    selectMode = 'single';
    startAt: DateTime;
    showCalendarWeeks = false;
    pickerDateTime = createTestDateTime(2018, JAN, 31);
}

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
        <owl-date-time-calendar [(selected)]="selected"
                                [selectMode]="selectMode"
                                [pickerDateTime]="pickerDateTime"
                                [dateFilter]="dateFilter"></owl-date-time-calendar>
    `
})
class CalendarWithDateFilterComponent {
    selectMode = 'single';
    selected: DateTime;
    pickerDateTime = createTestDateTime(2018, JAN, 31);

    dateFilter(date: DateTime) {
        return !(date.day % 2) && date.month - 1 !== NOV;
    }
}
