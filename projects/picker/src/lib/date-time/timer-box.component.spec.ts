import { ChangeDetectionStrategy, Component, provideZoneChangeDetection, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { DateTime } from 'luxon';
import { OwlLuxonDateTimeModule } from './adapter/luxon-date-time.module';
import { OwlDateTimeModule } from './date-time.module';
import { OwlTimerBoxComponent } from './timer-box.component';

describe('Поле ввода OwlTimerBoxComponent', () => {
    beforeEach(() => TestBed.configureTestingModule({
        imports: [OwlDateTimeModule],
        providers: [provideZonelessChangeDetection()]
    }));

    it('использует явно заданный ноль для отображения вместо значения модели', async () => {
        const fixture = TestBed.createComponent(OwlTimerBoxComponent);
        fixture.componentRef.setInput('value', 12);
        fixture.componentRef.setInput('boxValue', 0);
        await fixture.whenStable();
        expect(fixture.nativeElement.querySelector('input').value)
            .toBe('00');
    });

    it('обновляет представление после изменения значения нативным обработчиком wheel', async () => {
        const fixture = TestBed.createComponent(OwlTimerBoxComponent);
        fixture.componentRef.setInput('value', 1);
        await fixture.whenStable();
        fixture.componentInstance.valueChange.subscribe(value => fixture.componentInstance.value = value);
        const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
        input.dispatchEvent(new WheelEvent('wheel', { deltaY: -1, cancelable: true }));
        await fixture.whenStable();
        expect(input.value)
            .toBe('02');
    });

    it('однократно подтверждает потерю фокуса и отменяет отложенное событие input', async () => {
        const fixture = TestBed.createComponent(OwlTimerBoxComponent);
        fixture.componentRef.setInput('value', 1);
        fixture.componentRef.setInput('min', 0);
        fixture.componentRef.setInput('max', 59);
        await fixture.whenStable();
        const values: number[] = [];
        fixture.componentInstance.inputChange.subscribe(value => values.push(value));
        fixture.componentInstance.handleInputChange('12');
        fixture.componentInstance.focusOut('12');
        await new Promise(resolve => setTimeout(resolve, 800));
        expect(values)
            .toEqual([12]);
    });
});

@Component({
    standalone: true,
    imports: [FormsModule, OwlDateTimeModule, OwlLuxonDateTimeModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: '<owl-date-time-inline [ngModel]="value" (ngModelChange)="updateValue($event)" pickerType="timer"></owl-date-time-inline>'
})
class TimerInputHost {
    value: DateTime = DateTime.local(2026, 10, 11, 15, 30);
    readonly changes: number[] = [];

    updateValue(value: DateTime): void {
        this.value = value;
        this.changes.push(value.minute);
    }
}

for (const zoneless of [false, true]) {
    describe('Изменение времени в сфокусированном поле (' + (zoneless ? 'zoneless' : 'Zone.js') + ')', () => {
        beforeEach(() => TestBed.configureTestingModule({
            imports: [TimerInputHost],
            providers: [zoneless ? provideZonelessChangeDetection() : provideZoneChangeDetection()]
        }));

        const actions = [
            {
                title: 'по ArrowUp', expected: 31,
                dispatch: (input: HTMLInputElement) => input.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'ArrowUp', bubbles: true, cancelable: true
                }))
            },
            {
                title: 'по ArrowDown', expected: 29,
                dispatch: (input: HTMLInputElement) => input.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'ArrowDown', bubbles: true, cancelable: true
                }))
            },
            {
                title: 'колесом вверх', expected: 31,
                dispatch: (input: HTMLInputElement) => input.dispatchEvent(new WheelEvent('wheel', {
                    deltaY: -1, bubbles: true, cancelable: true
                }))
            },
            {
                title: 'колесом вниз', expected: 29,
                dispatch: (input: HTMLInputElement) => input.dispatchEvent(new WheelEvent('wheel', {
                    deltaY: 1, bubbles: true, cancelable: true
                }))
            }
        ];

        for (const action of actions) {
            it(
                'сохраняет новое время ' + action.title + ' после потери фокуса без повторного изменения модели',
                async () => {
                    const fixture = TestBed.createComponent(TimerInputHost);
                    if (!zoneless) {
                        fixture.autoDetectChanges();
                    }
                    await fixture.whenStable();
                    const element: HTMLElement = fixture.nativeElement;
                    const input = element.querySelectorAll<HTMLInputElement>('.owl-dt-timer-input')
                        .item(1);
                    input.focus();
                    await fixture.whenStable();
                    expect(document.activeElement)
                        .toBe(input);

                    action.dispatch(input);
                    await fixture.whenStable();
                    expect(input.value)
                        .toBe(String(action.expected));
                    expect(fixture.componentInstance.value.minute)
                        .toBe(action.expected);

                    input.blur();
                    await fixture.whenStable();
                    expect(input.value)
                        .toBe(String(action.expected));
                    expect(fixture.componentInstance.value.minute)
                        .toBe(action.expected);
                    expect(fixture.componentInstance.changes)
                        .toEqual([action.expected]);
                }
            );
        }

        it('не заменяет результат шага старым введённым текстом после debounce и потери фокуса', async () => {
            const fixture = TestBed.createComponent(TimerInputHost);
            if (!zoneless) {
                fixture.autoDetectChanges();
            }
            await fixture.whenStable();
            const element: HTMLElement = fixture.nativeElement;
            const input = element.querySelectorAll<HTMLInputElement>('.owl-dt-timer-input')
                .item(1);
            expect(input.value)
                .withContext('Исходная минута до фокуса')
                .toBe('30');
            expect(fixture.componentInstance.value.minute)
                .toBe(30);
            input.focus();
            input.value = '12';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
            await fixture.whenStable();
            expect(input.value)
                .toBe('31');
            expect(fixture.componentInstance.value.minute)
                .toBe(31);

            input.blur();
            await new Promise<void>(resolve => setTimeout(resolve, 800));
            await fixture.whenStable();
            expect(input.value)
                .toBe('31');
            expect(fixture.componentInstance.value.minute)
                .toBe(31);
            expect(fixture.componentInstance.changes)
                .toEqual([31]);
        });
    });
}
