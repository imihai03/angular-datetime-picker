import { Component, provideZonelessChangeDetection, signal, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { OverlayContainer } from '@angular/cdk/overlay';
import { DateTime } from 'luxon';
import { OwlDateTimeModule } from './date-time.module';
import { OwlDateTimeComponent } from './date-time-picker.component';
import { OwlLuxonDateTimeModule } from './adapter/luxon-date-time.module';

@Component({
    standalone: true,
    imports: [OwlDateTimeModule, OwlLuxonDateTimeModule, ReactiveFormsModule],
    template: `<input [owlDateTime]="picker" [formControl]="control"
                      [min]="min()" [max]="max()" [owlDateTimeFilter]="filter()">
    <owl-date-time #picker pickerType="calendar"></owl-date-time>`
})
class OpenInputHost {
    readonly control = new FormControl(DateTime.local(2026, 10, 10));
    readonly min = signal<DateTime | null>(null);
    readonly max = signal<DateTime | null>(null);
    readonly filter = signal<((date: DateTime) => boolean) | null>(null);
    @ViewChild(OwlDateTimeComponent) picker: OwlDateTimeComponent<DateTime>;
}

describe('Состояние открытого оверлея OwlDateTimeInputDirective', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [OpenInputHost], providers: [provideZonelessChangeDetection()], animationsEnabled: true
        });
        const overlay = TestBed.inject(OverlayContainer)
            .getContainerElement();
        overlay.style.setProperty('--container-enter-animation-duration', '0ms');
        overlay.style.setProperty('--container-leave-animation-duration', '0ms');
    });

    async function openPicker() {
        const fixture = TestBed.createComponent(OpenInputHost);
        await fixture.whenStable();
        fixture.componentInstance.picker.open();
        await fixture.whenStable();
        return fixture;
    }

    function cell(day: number): HTMLElement {
        const date = DateTime.local(2026, 10, day)
            .toFormat('dd.MM.yyyy');
        const element = TestBed.inject(OverlayContainer)
            .getContainerElement()
            .querySelector<HTMLElement>(`.owl-dt-calendar-cell[aria-label="${date}"]`);
        expect(element)
            .withContext(`Calendar date ${date}`)
            .not
            .toBeNull();
        return element;
    }

    it('обновляет доступные даты при изменении min/max в открытом всплывающем пикере', async () => {
        const fixture = await openPicker();
        const host = fixture.componentInstance;
        expect(cell(5)
            .classList
            .contains('owl-dt-calendar-cell-disabled'))
            .toBeFalse();
        host.min.set(DateTime.local(2026, 10, 10));
        await fixture.whenStable();
        expect(cell(5)
            .classList
            .contains('owl-dt-calendar-cell-disabled'))
            .toBeTrue();
        expect(cell(15)
            .classList
            .contains('owl-dt-calendar-cell-disabled'))
            .toBeFalse();
        host.max.set(DateTime.local(2026, 10, 18));
        await fixture.whenStable();
        expect(cell(20)
            .classList
            .contains('owl-dt-calendar-cell-disabled'))
            .toBeTrue();
        expect(cell(15)
            .classList
            .contains('owl-dt-calendar-cell-disabled'))
            .toBeFalse();
        host.min.set(null);
        host.max.set(null);
        await fixture.whenStable();
        expect(cell(5)
            .classList
            .contains('owl-dt-calendar-cell-disabled'))
            .toBeFalse();
        expect(cell(20)
            .classList
            .contains('owl-dt-calendar-cell-disabled'))
            .toBeFalse();
    });

    it('сразу применяет заменённый фильтр дат в открытом календаре', async () => {
        const fixture = await openPicker();
        expect(cell(15)
            .classList
            .contains('owl-dt-calendar-cell-disabled'))
            .toBeFalse();
        fixture.componentInstance.filter.set(date => date.day !== 15);
        await fixture.whenStable();
        expect(cell(15)
            .classList
            .contains('owl-dt-calendar-cell-disabled'))
            .toBeTrue();
        fixture.componentInstance.filter.set(null);
        await fixture.whenStable();
        expect(cell(15)
            .classList
            .contains('owl-dt-calendar-cell-disabled'))
            .toBeFalse();
    });

    it('обновляет оформление disabled и игнорирует выбор при отключении контрола с открытым пикером', async () => {
        const fixture = await openPicker();
        const host = fixture.componentInstance;
        const overlay = TestBed.inject(OverlayContainer)
            .getContainerElement();
        const container = overlay.querySelector('owl-date-time-container');
        const value = host.control.value;
        host.control.disable();
        await fixture.whenStable();
        expect(container.classList.contains('owl-dt-container-disabled'))
            .toBeTrue();
        cell(15)
            .click();
        await fixture.whenStable();
        expect(host.control.value)
            .toBe(value);
        expect(host.picker.opened)
            .toBeTrue();
        host.control.enable();
        await fixture.whenStable();
        expect(container.classList.contains('owl-dt-container-disabled'))
            .toBeFalse();
    });
});
