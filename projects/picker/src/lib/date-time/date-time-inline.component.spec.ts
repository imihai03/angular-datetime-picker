import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DateTime } from 'luxon';
import { OwlDateTimeModule } from './date-time.module';
import { OwlLuxonDateTimeModule } from './adapter/luxon-date-time.module';

@Component({
    standalone: true,
    imports: [OwlDateTimeModule, OwlLuxonDateTimeModule, ReactiveFormsModule],
    template: '<owl-date-time-inline [formControl]="control" pickerType="calendar"></owl-date-time-inline>'
})
class InlineHost {
    readonly control = new FormControl(DateTime.local(2026, 10, 10));
}

describe('CVA компонента OwlDateTimeInlineComponent в режиме zoneless', () => {
    it('обновляет доступность заблокированного состояния после программного отключения и включения', async () => {
        TestBed.configureTestingModule({ imports: [InlineHost], providers: [provideZonelessChangeDetection()] });
        const fixture = TestBed.createComponent(InlineHost);
        await fixture.whenStable();
        const inline: HTMLElement = fixture.nativeElement.querySelector('owl-date-time-inline');
        fixture.componentInstance.control.disable();
        await fixture.whenStable();
        expect(inline.getAttribute('aria-disabled'))
            .toBe('true');
        expect(inline.querySelector('owl-date-time-container')
            .classList
            .contains('owl-dt-container-disabled'))
            .toBeTrue();
        const value = fixture.componentInstance.control.value;
        fixture.nativeElement.querySelector('.owl-dt-calendar-cell')
            .click();
        expect(fixture.componentInstance.control.value)
            .toBe(value);
        fixture.componentInstance.control.enable();
        await fixture.whenStable();
        expect(inline.hasAttribute('aria-disabled'))
            .toBeFalse();
        expect(inline.querySelector('owl-date-time-container')
            .classList
            .contains('owl-dt-container-disabled'))
            .toBeFalse();
    });
});
