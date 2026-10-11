/**
 * timer.component.spec
 */

import { DateTime } from 'luxon';
import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { OwlDateTimeIntl } from './date-time-picker-intl.service';
import { ChangeDetectionStrategy, Component, DebugElement, provideZoneChangeDetection } from '@angular/core';
import { OwlLuxonDateTimeModule } from './adapter/luxon-date-time.module';
import { OwlDateTimeModule } from './date-time.module';
import { By } from '@angular/platform-browser';
import { OwlTimerComponent } from './timer.component';
import { createTestDateTime, dispatchFakeEvent } from '../../test-helpers';

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

describe('Компонент OwlTimerComponent', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [OwlLuxonDateTimeModule, OwlDateTimeModule],
            declarations: [StandardTimerComponent],
            providers: [
                OwlDateTimeIntl,
                provideZoneChangeDetection()
            ]
        }).compileComponents();
    });

    describe('Стандартный таймер', () => {
        let fixture: ComponentFixture<StandardTimerComponent>;
        let testComponent: StandardTimerComponent;
        let timerDebugElement: DebugElement;
        let timerElement: HTMLElement;
        let timerInstance: OwlTimerComponent<DateTime>;

        beforeEach(() => {
            fixture = TestBed.createComponent(StandardTimerComponent);
            fixture.detectChanges();

            timerDebugElement = fixture.debugElement.query(
                By.directive(OwlTimerComponent)
            );
            timerElement = timerDebugElement.nativeElement;
            testComponent = fixture.componentInstance;
            timerInstance = timerDebugElement.componentInstance;
        });

        it('отображает два поля времени при showSecondsTimer равном false', () => {
            const timerBoxes = timerElement.querySelectorAll(
                'owl-date-time-timer-box'
            );
            expect(timerInstance.showSecondsTimer).toBeFalsy();
            expect(timerBoxes.length).toBe(2);
        });

        it('отображает три поля времени при showSecondsTimer равном true', () => {
            testComponent.showSecondsTimer = true;
            fixture.detectChanges();

            const timerBoxes = timerElement.querySelectorAll(
                'owl-date-time-timer-box'
            );
            expect(timerInstance.showSecondsTimer).toBeTruthy();
            expect(timerBoxes.length).toBe(3);
        });

        it('скрывает переключатель hour12 при hour12Timer равном false', () => {
            const toggleBtn = timerElement.querySelector(
                'button.owl-dt-timer-hour12-box'
            );
            expect(timerInstance.hour12Timer).toBeFalsy();
            expect(toggleBtn).toBeFalsy();
        });

        it('отображает переключатель hour12 при hour12Timer равном true', () => {
            testComponent.hour12Timer = true;
            fixture.detectChanges();

            const toggleBtn = timerElement.querySelector(
                'button.owl-dt-timer-hour12-box'
            );
            expect(timerInstance.hour12Timer).toBeTruthy();
            expect(toggleBtn).toBeTruthy();
        });

        it('отправляет событие при нажатии кнопки со стрелкой таймера', fakeAsync(() => {
            spyOn(testComponent, 'handleSelectedChange');
            expect(testComponent.handleSelectedChange).not.toHaveBeenCalled();

            testComponent.showSecondsTimer = true;
            fixture.detectChanges();

            const arrowBtns = timerElement.querySelectorAll<HTMLButtonElement>(
                'button.owl-dt-control-arrow-button'
            );
            expect(arrowBtns.length).toBe(6);

            for (let i = 0; i < arrowBtns.length; i++) {
                arrowBtns[i].click();
                fixture.detectChanges();
                flush();
            }

            expect(testComponent.handleSelectedChange).toHaveBeenCalledTimes(6);
        }));

        it('отправляет событие при нажатии переключателя hour12', fakeAsync(() => {
            spyOn(testComponent, 'handleSelectedChange');
            expect(testComponent.handleSelectedChange).not.toHaveBeenCalled();

            testComponent.hour12Timer = true;
            fixture.detectChanges();

            const toggleBtn = timerElement.querySelector<HTMLButtonElement>(
                'button.owl-dt-timer-hour12-box'
            );

            toggleBtn.click();
            fixture.detectChanges();
            flush();

            expect(testComponent.handleSelectedChange).toHaveBeenCalledTimes(1);
        }));

        it('прибавляет или вычитает stepHour часов при нажатии стрелки часов', fakeAsync(() => {
            expect(timerInstance.stepHour).toBe(1);

            const arrowBtns = timerElement.querySelectorAll<HTMLButtonElement>(
                'button.owl-dt-control-arrow-button'
            );
            expect(arrowBtns.length).toBe(4);

            arrowBtns[0].click();
            fixture.detectChanges();
            flush();
            expect(testComponent.pickerDateTime).toEqual(
                createTestDateTime(2018, JAN, 31, 13, 30, 30)
            );

            arrowBtns[1].click();
            fixture.detectChanges();
            flush();
            expect(testComponent.pickerDateTime).toEqual(
                createTestDateTime(2018, JAN, 31, 12, 30, 30)
            );

            testComponent.stepHour = 2;
            fixture.detectChanges();
            expect(timerInstance.stepHour).toBe(2);

            arrowBtns[0].click();
            fixture.detectChanges();
            flush();
            expect(testComponent.pickerDateTime).toEqual(
                createTestDateTime(2018, JAN, 31, 14, 30, 30)
            );

            arrowBtns[1].click();
            fixture.detectChanges();
            flush();
            expect(testComponent.pickerDateTime).toEqual(
                createTestDateTime(2018, JAN, 31, 12, 30, 30)
            );
        }));

        it('прибавляет или вычитает stepMinute минут при нажатии стрелки минут', fakeAsync(() => {
            expect(timerInstance.stepMinute).toBe(1);

            const arrowBtns = timerElement.querySelectorAll<HTMLButtonElement>(
                'button.owl-dt-control-arrow-button'
            );
            expect(arrowBtns.length).toBe(4);

            arrowBtns[2].click();
            fixture.detectChanges();
            flush();
            expect(testComponent.pickerDateTime).toEqual(
                createTestDateTime(2018, JAN, 31, 12, 31, 30)
            );

            arrowBtns[3].click();
            fixture.detectChanges();
            flush();
            expect(testComponent.pickerDateTime).toEqual(
                createTestDateTime(2018, JAN, 31, 12, 30, 30)
            );

            testComponent.stepMinute = 2;
            fixture.detectChanges();
            expect(timerInstance.stepMinute).toBe(2);

            arrowBtns[2].click();
            fixture.detectChanges();
            flush();
            expect(testComponent.pickerDateTime).toEqual(
                createTestDateTime(2018, JAN, 31, 12, 32, 30)
            );

            arrowBtns[3].click();
            fixture.detectChanges();
            flush();
            expect(testComponent.pickerDateTime).toEqual(
                createTestDateTime(2018, JAN, 31, 12, 30, 30)
            );
        }));

        it('прибавляет или вычитает stepSecond секунд при нажатии стрелки секунд', fakeAsync(() => {
            expect(timerInstance.stepSecond).toBe(1);

            testComponent.showSecondsTimer = true;
            fixture.detectChanges();
            const arrowBtns = timerElement.querySelectorAll<HTMLButtonElement>(
                'button.owl-dt-control-arrow-button'
            );
            expect(arrowBtns.length).toBe(6);

            arrowBtns[4].click();
            fixture.detectChanges();
            flush();
            expect(testComponent.pickerDateTime).toEqual(
                createTestDateTime(2018, JAN, 31, 12, 30, 31)
            );

            arrowBtns[5].click();
            fixture.detectChanges();
            flush();
            expect(testComponent.pickerDateTime).toEqual(
                createTestDateTime(2018, JAN, 31, 12, 30, 30)
            );

            testComponent.stepSecond = 2;
            fixture.detectChanges();
            expect(timerInstance.stepSecond).toBe(2);

            arrowBtns[4].click();
            fixture.detectChanges();
            flush();
            expect(testComponent.pickerDateTime).toEqual(
                createTestDateTime(2018, JAN, 31, 12, 30, 32)
            );

            arrowBtns[5].click();
            fixture.detectChanges();
            flush();
            expect(testComponent.pickerDateTime).toEqual(
                createTestDateTime(2018, JAN, 31, 12, 30, 30)
            );
        }));

        it('переключает PM и AM при нажатии переключателя hour12', fakeAsync(() => {
            testComponent.hour12Timer = true;
            fixture.detectChanges();

            const toggleBtn = timerElement.querySelector<HTMLButtonElement>(
                'button.owl-dt-timer-hour12-box'
            );
            expect(toggleBtn.innerHTML).toContain('PM');

            toggleBtn.click();
            fixture.detectChanges();
            flush();

            expect(toggleBtn.innerHTML).toContain('AM');
            expect(testComponent.pickerDateTime).toEqual(
                createTestDateTime(2018, JAN, 31, 0, 30, 30)
            );
        }));

        it('блокирует все стрелки вниз при pickerDateTime равном minDateTime', () => {
            testComponent.showSecondsTimer = true;
            fixture.detectChanges();
            const arrowBtns = timerElement.querySelectorAll<HTMLButtonElement>(
                'button.owl-dt-control-arrow-button'
            );
            expect(arrowBtns.length).toBe(6);

            testComponent.pickerDateTime = createTestDateTime(testComponent.minDateTime);
            fixture.detectChanges();

            // Кнопки со стрелками вверх
            expect(arrowBtns[0].hasAttribute('disabled')).toBe(false);
            expect(arrowBtns[2].hasAttribute('disabled')).toBe(false);
            expect(arrowBtns[4].hasAttribute('disabled')).toBe(false);

            // Кнопки со стрелками вниз
            expect(arrowBtns[1].hasAttribute('disabled')).toBe(true);
            expect(arrowBtns[3].hasAttribute('disabled')).toBe(true);
            expect(arrowBtns[5].hasAttribute('disabled')).toBe(true);
        });

        it('блокирует все стрелки вверх при pickerDateTime равном maxDateTime', () => {
            testComponent.showSecondsTimer = true;
            fixture.detectChanges();
            const arrowBtns = timerElement.querySelectorAll<HTMLButtonElement>(
                'button.owl-dt-control-arrow-button'
            );
            expect(arrowBtns.length).toBe(6);

            testComponent.pickerDateTime = createTestDateTime(testComponent.maxDateTime);
            fixture.detectChanges();

            // Кнопки со стрелками вверх
            expect(arrowBtns[0].hasAttribute('disabled')).toBe(true);
            expect(arrowBtns[2].hasAttribute('disabled')).toBe(true);
            expect(arrowBtns[4].hasAttribute('disabled')).toBe(true);

            // Кнопки со стрелками вниз
            expect(arrowBtns[1].hasAttribute('disabled')).toBe(false);
            expect(arrowBtns[3].hasAttribute('disabled')).toBe(false);
            expect(arrowBtns[5].hasAttribute('disabled')).toBe(false);
        });

        it('не переформатирует текст, пока поле находится в фокусе', fakeAsync(() => {
            const timeCells = timerElement.querySelectorAll<HTMLInputElement>('.owl-dt-timer-input');

            dispatchFakeEvent(timeCells[0], 'focusin');
            timeCells[0].value = '5';
            dispatchFakeEvent(timeCells[0], 'input');
            setTimeout(() => { }, 1000);

            timeCells[1].value = '8';
            dispatchFakeEvent(timeCells[1], 'input');
            setTimeout(() => { }, 1000);

            fixture.detectChanges();

            expect(timeCells[0].value).toEqual('5');
            expect(timeCells[1].value).toEqual('8');


            flush();
        }));
    });
});

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
        <owl-date-time-timer
                [hour12Timer]="hour12Timer"
                [showSecondsTimer]="showSecondsTimer"
                [pickerDateTime]="pickerDateTime"
                [stepHour]="stepHour"
                [stepMinute]="stepMinute"
                [stepSecond]="stepSecond"
                [minDateTime]="minDateTime"
                [maxDateTime]="maxDateTime"
                (selectedChange)="handleSelectedChange($event)"></owl-date-time-timer>
    `
})
class StandardTimerComponent {
    stepHour = 1;
    stepMinute = 1;
    stepSecond = 1;
    hour12Timer = false;
    showSecondsTimer = false;
    pickerDateTime = createTestDateTime(2018, JAN, 31, 12, 30, 30);
    minDateTime = createTestDateTime(2018, JAN, 29, 12, 30, 30);
    maxDateTime = createTestDateTime(2018, FEB, 1, 12, 30, 30);

    handleSelectedChange(val: DateTime) {
        this.pickerDateTime = val;
    }
}
