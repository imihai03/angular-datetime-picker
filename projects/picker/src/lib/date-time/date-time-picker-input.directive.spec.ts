import { Component, provideZonelessChangeDetection, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DateTime } from 'luxon';
import { Subject } from 'rxjs';
import { DateTimeAdapter } from './adapter/date-time-adapter.class';
import { OWL_DATE_TIME_FORMATS } from './adapter/date-time-format.class';
import { OWL_LUXON_DATE_TIME_FORMATS } from './adapter/luxon-date-time-format.class';
import { OwlLuxonDateTimeModule } from './adapter/luxon-date-time.module';
import { OwlDateTimeInputDirective } from './date-time-picker-input.directive';
import { OwlDateTimeModule } from './date-time.module';

@Component({
    standalone: true,
    imports: [OwlDateTimeModule, OwlLuxonDateTimeModule, ReactiveFormsModule],
    template: `<input [owlDateTime]="picker" [formControl]="control" selectMode="range"
                      [min]="min" [max]="max" [owlDateTimeFilter]="filter" [required]="required">
    <owl-date-time #picker pickerType="calendar"></owl-date-time>`
})
class RangeInputHost {
    readonly control = new FormControl<DateTime[]>([]);
    min: DateTime | null = null;
    max: DateTime | null = null;
    filter: ((date: DateTime) => boolean) | null = null;
    required: boolean | string = false;
    @ViewChild(OwlDateTimeInputDirective) input: OwlDateTimeInputDirective<DateTime>;
}

describe('Валидация диапазона в OwlDateTimeInputDirective', () => {
    const early = DateTime.local(2026, 10, 1);
    const middle = DateTime.local(2026, 10, 10);
    const late = DateTime.local(2026, 10, 20);

    beforeEach(() => TestBed.configureTestingModule({
        imports: [RangeInputHost],
        providers: [provideZonelessChangeDetection()]
    }));

    it('проверяет каждую заполненную границу по min и max, включая неполные диапазоны', () => {
        const fixture = TestBed.createComponent(RangeInputHost);
        const host = fixture.componentInstance;
        host.min = middle;
        host.max = middle;
        fixture.detectChanges();

        for (const value of [[early, null], [null, early], [early, middle]]) {
            host.control.setValue(value);
            expect(host.control.hasError('owlDateTimeMin'))
                .withContext(JSON.stringify(value))
                .toBeTrue();
        }
        for (const value of [[late, null], [null, late], [middle, late]]) {
            host.control.setValue(value);
            expect(host.control.hasError('owlDateTimeMax'))
                .withContext(JSON.stringify(value))
                .toBeTrue();
        }
        host.control.setValue([middle, null]);
        expect(host.control.valid)
            .toBeTrue();
    });

    it('применяет фильтр дат к обеим границам диапазона', () => {
        const fixture = TestBed.createComponent(RangeInputHost);
        const host = fixture.componentInstance;
        host.filter = date => date.day !== 1;
        fixture.detectChanges();
        for (const value of [[early, middle], [middle, early], [null, early]]) {
            host.control.setValue(value);
            expect(host.control.hasError('owlDateTimeFilter'))
                .toBeTrue();
        }
        host.control.setValue([middle, late]);
        expect(host.control.valid)
            .toBeTrue();
    });

    it('сохраняет ошибку разбора, если программно заданный диапазон содержит некорректную дату', () => {
        const fixture = TestBed.createComponent(RangeInputHost);
        fixture.detectChanges();
        const host = fixture.componentInstance;
        host.control.setValue([middle, DateTime.invalid('invalid date')]);
        expect(host.control.hasError('owlDateTimeParse'))
            .toBeTrue();
        host.control.setValue([middle, late]);
        expect(host.control.valid)
            .toBeTrue();
    });

    it('повторно проверяет введённый текст при невалидной незаполненной границе без изменения разобранных дат', () => {
        const fixture = TestBed.createComponent(RangeInputHost);
        fixture.detectChanges();
        const host = fixture.componentInstance;
        host.control.setValue([middle, null]);
        const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
        input.value = '10.10.2026 00:00 - invalid';
        input.dispatchEvent(new Event('input'));
        expect(host.control.hasError('owlDateTimeParse'))
            .toBeTrue();
        input.value = '10.10.2026 00:00 - ';
        input.dispatchEvent(new Event('input'));
        expect(host.control.valid)
            .toBeTrue();
    });

    it('считает диапазон необязательным при required="false"', () => {
        const fixture = TestBed.createComponent(RangeInputHost);
        fixture.componentInstance.required = 'false';
        fixture.detectChanges();
        expect(fixture.componentInstance.control.hasError('owlRequiredDateTimeRange'))
            .toBeFalse();
    });

    it('обновляет нативное состояние disabled после программного изменения контрола в режиме zoneless', async () => {
        const fixture = TestBed.createComponent(RangeInputHost);
        await fixture.whenStable();
        const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
        fixture.componentInstance.control.disable();
        await fixture.whenStable();
        expect(input.disabled)
            .toBeTrue();
        fixture.componentInstance.control.enable();
        await fixture.whenStable();
        expect(input.disabled)
            .toBeFalse();
    });
});

@Component({
    standalone: true,
    imports: [OwlDateTimeModule, ReactiveFormsModule],
    template: '<input [owlDateTime]="picker" [formControl]="control" [min]="0"><owl-date-time #picker></owl-date-time>'
})
class NumericInputHost {
    readonly control = new FormControl(0);
}

describe('Числовой адаптер OwlDateTimeInputDirective', () => {
    it('сохраняет ноль как корректное значение поля и границы min', async () => {
        const adapter = jasmine.createSpyObj<DateTimeAdapter<number>>(
            'NumericAdapter',
            ['deserialize', 'isDateInstance', 'isValid', 'isEqual', 'format', 'toIso8601', 'compare'],
            { localeChanges: new Subject<string>() }
        );
        adapter.deserialize.and.callFake(value => value);
        adapter.isDateInstance.and.callFake(value => typeof value === 'number');
        adapter.isValid.and.returnValue(true);
        adapter.isEqual.and.callFake((a, b) => a === b);
        adapter.format.and.callFake(value => String(value));
        adapter.toIso8601.and.callFake(value => String(value));
        adapter.compare.and.callFake((a, b) => a - b);
        TestBed.configureTestingModule({
            imports: [NumericInputHost], providers: [
                provideZonelessChangeDetection(),
                { provide: DateTimeAdapter, useValue: adapter },
                { provide: OWL_DATE_TIME_FORMATS, useValue: OWL_LUXON_DATE_TIME_FORMATS }
            ]
        });
        const fixture = TestBed.createComponent(NumericInputHost);
        await fixture.whenStable();
        const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
        expect(input.value)
            .toBe('0');
        expect(input.min)
            .toBe('0');
        fixture.componentInstance.control.setValue(-1);
        expect(fixture.componentInstance.control.hasError('owlDateTimeMin'))
            .toBeTrue();
        fixture.componentInstance.control.setValue(0);
        expect(fixture.componentInstance.control.valid)
            .toBeTrue();
    });
});
