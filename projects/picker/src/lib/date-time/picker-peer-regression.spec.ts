import { Component, provideZonelessChangeDetection, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { OwlDateTimeModule } from './date-time.module';
import { OwlDateTimeComponent } from './date-time-picker.component';
import { OwlDateTimeInputDirective } from './date-time-picker-input.directive';
import { OwlDateTimeContainerComponent } from './date-time-picker-container.component';
import { OwlUnixTimestampDateTimeModule } from './adapter/unix-timestamp-adapter/unix-timestamp-date-time.module';
import { DateTimeAdapter } from './adapter/date-time-adapter.class';

@Component({
    standalone: true,
    imports: [OwlDateTimeModule, OwlUnixTimestampDateTimeModule],
    template: '<input [owlDateTime]="picker"><owl-date-time #picker pickerMode="dialog"></owl-date-time>'
})
class PeerPickerHost {
    @ViewChild(OwlDateTimeComponent) picker: OwlDateTimeComponent<number>;
    @ViewChild(OwlDateTimeInputDirective) input: OwlDateTimeInputDirective<number>;
}

describe('Регрессионные проверки независимого ревью пикера', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [PeerPickerHost],
            providers: [provideZonelessChangeDetection()],
            animationsEnabled: true
        });
        const overlay = TestBed.inject(OverlayContainer)
            .getContainerElement();
        overlay.style.setProperty('--container-enter-animation-duration', '0ms');
        overlay.style.setProperty('--container-leave-animation-duration', '50ms');
    });

    it('сохраняет фокус в новом диалоге после завершения закрытия предыдущего', async () => {
        const fixture = TestBed.createComponent(PeerPickerHost);
        fixture.detectChanges();
        const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
        const picker = fixture.componentInstance.picker;
        input.focus();
        picker.open();
        await fixture.whenStable();
        picker.close();
        picker.open();
        await fixture.whenStable();
        await new Promise<void>(resolve => setTimeout(resolve, 150));
        const dialogs = TestBed.inject(OverlayContainer)
            .getContainerElement()
            .querySelectorAll('owl-dialog-container');
        expect(dialogs.length)
            .toBe(1);
        expect(dialogs[0].contains(document.activeElement))
            .toBeTrue();
    });

    it('обновляет отображаемый выбор при изменении поля в открытом пикере', async () => {
        const fixture = TestBed.createComponent(PeerPickerHost);
        fixture.detectChanges();
        const adapter = TestBed.inject(DateTimeAdapter<number>);
        const host = fixture.componentInstance;
        host.input.value = adapter.createDate(2026, 0, 1);
        host.picker.open();
        await fixture.whenStable();
        host.input.value = adapter.createDate(2026, 0, 2);
        await fixture.whenStable();
        const selected = TestBed.inject(OverlayContainer)
            .getContainerElement()
            .querySelector('.owl-dt-calendar-cell-selected');
        expect(selected?.textContent?.trim())
            .toBe('2');
    });

    it('ограничивает сохранённое время конца диапазона после выбора максимального календарного дня', () => {
        const fixture = TestBed.createComponent(PeerPickerHost);
        fixture.detectChanges();
        const picker = fixture.componentInstance.picker;
        const input = fixture.componentInstance.input;
        const adapter = TestBed.inject(DateTimeAdapter<number>);
        const max = adapter.createDate(2026, 9, 12, 10, 0, 0);
        input.selectMode = 'range';
        input.values = [adapter.createDate(2026, 9, 10, 8, 0, 0), adapter.createDate(2026, 9, 11, 20, 0, 0)];
        input.max = max;
        const containerFixture = TestBed.createComponent(OwlDateTimeContainerComponent<number>);
        try {
            const container = containerFixture.componentInstance;
            container.picker = picker;
            containerFixture.detectChanges();
            container.dateSelected(adapter.createDate(2026, 9, 11));
            container.dateSelected(adapter.createDate(2026, 9, 12));
            expect(picker.selecteds[1])
                .toBe(max);
            expect(picker.dateTimeChecker(picker.selecteds[1]))
                .toBeTrue();
        } finally {
            containerFixture.destroy();
            // Host binding заменяет root ID, поэтому стандартная очистка TestBed не находит этот элемент
            const containerElement: HTMLElement = containerFixture.nativeElement;
            containerElement.remove();
        }
    });
});
