import { Component, NgZone, provideZoneChangeDetection, provideZonelessChangeDetection, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { OverlayContainer } from '@angular/cdk/overlay';
import { OwlDateTimeModule } from './date-time.module';
import { OwlDateTimeComponent } from './date-time-picker.component';
import { OwlDateTimeInputDirective } from './date-time-picker-input.directive';
import { OwlDateTimeIntl } from './date-time-picker-intl.service';
import { OwlUnixTimestampDateTimeModule } from './adapter/unix-timestamp-adapter/unix-timestamp-date-time.module';
import { SelectMode } from './date-time.class';

@Component({
    standalone: true,
    imports: [OwlDateTimeModule, OwlUnixTimestampDateTimeModule],
    template: `
        <input [owlDateTime]="picker" [value]="value" [selectMode]="selectMode" [min]="min" [max]="max">
        <owl-date-time #picker [pickerType]="pickerType" [startAt]="startAt" [endAt]="endAt"></owl-date-time>
        <span class="open-state">{{ picker.opened }}</span>
    `
})
class PickerHost {
    @ViewChild(OwlDateTimeComponent) picker: OwlDateTimeComponent<number>;
    @ViewChild(OwlDateTimeInputDirective) input: OwlDateTimeInputDirective<number>;
    value = 0;
    min: number | null = null;
    max: number | null = null;
    startAt: number | null = null;
    endAt: number | null = null;
    selectMode: SelectMode = 'single';
    pickerType: 'both' | 'calendar' = 'both';
}

for (const zoneless of [false, true]) {
    describe(`Жизненный цикл оверлея пикера (${zoneless ? 'zoneless' : 'Zone.js'})`, () => {
        beforeEach(() => {
            TestBed.configureTestingModule({
                imports: [PickerHost],
                providers: [zoneless ? provideZonelessChangeDetection() : provideZoneChangeDetection()],
                animationsEnabled: true
            });
            const overlay = TestBed.inject(OverlayContainer)
                .getContainerElement();
            overlay.style.setProperty('--container-enter-animation-duration', '0ms');
            overlay.style.setProperty('--container-leave-animation-duration', '0ms');
        });

        async function createPicker() {
            const fixture = TestBed.createComponent(PickerHost);
            fixture.autoDetectChanges();
            await fixture.whenStable();
            return fixture;
        }

        it('позиционирует всплывающий пикер после отрисовки без NgZone.onStable', async () => {
            const fixture = await createPicker();
            const create = spyOn(fixture.componentInstance.picker.overlay, 'create')
                .and
                .callThrough();
            const { overlay, update } = TestBed.inject(NgZone)
                .run(() => {
                    fixture.componentInstance.picker.open();
                    const overlay = create.calls.mostRecent().returnValue;
                    return { overlay,
                        update: spyOn(overlay, 'updatePosition')
                            .and
                            .callThrough()
                    };
                });
            await fixture.whenStable();
            expect(update)
                .toHaveBeenCalled();
            expect(overlay.overlayElement.querySelector('owl-date-time-calendar'))
                .not
                .toBeNull();
            expect(fixture.nativeElement.querySelector('.open-state').textContent)
                .toBe('true');
        });

        it('закрывается до первой отрисовки и отменяет ожидающее позиционирование', async () => {
            const fixture = await createPicker();
            const create = spyOn(fixture.componentInstance.picker.overlay, 'create')
                .and
                .callThrough();
            const closed = spyOn(fixture.componentInstance.picker.afterPickerClosed, 'emit');
            const { overlay, update } = TestBed.inject(NgZone)
                .run(() => {
                    fixture.componentInstance.picker.open();
                    const overlay = create.calls.mostRecent().returnValue;
                    const update = spyOn(overlay, 'updatePosition');
                    fixture.componentInstance.picker.close();
                    fixture.componentInstance.picker.close();
                    return { overlay, update };
                });
            await fixture.whenStable();
            expect(overlay.hasAttached())
                .toBeFalse();
            expect(update)
                .not
                .toHaveBeenCalled();
            expect(closed)
                .toHaveBeenCalledOnceWith(0);
            expect(fixture.nativeElement.querySelector('.open-state').textContent)
                .toBe('false');
        });

        it('не открывается повторно через обработчик фокуса при закрытии', async () => {
            const fixture = await createPicker();
            const picker = fixture.componentInstance.picker;
            const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
            input.focus();
            TestBed.inject(NgZone)
                .run(() => picker.open());
            await fixture.whenStable();
            const focusListener = () => picker.open();
            input.addEventListener('focus', focusListener);
            picker.close();
            await fixture.whenStable();
            input.removeEventListener('focus', focusListener);
            expect(picker.opened)
                .toBeFalse();
            expect(document.activeElement)
                .toBe(input);
            expect(TestBed.inject(OverlayContainer)
                .getContainerElement()
                .querySelector('owl-date-time-container'))
                .toBeNull();
        });

        it('сразу открывается повторно и отправляет каждое событие закрытия один раз', async () => {
            const fixture = await createPicker();
            const picker = fixture.componentInstance.picker;
            const closed = spyOn(picker.afterPickerClosed, 'emit');
            TestBed.inject(NgZone)
                .run(() => {
                    picker.open();
                    picker.close();
                    picker.open();
                });
            await fixture.whenStable();
            expect(picker.opened)
                .toBeTrue();
            expect(closed)
                .toHaveBeenCalledTimes(1);
            expect(TestBed.inject(OverlayContainer)
                .getContainerElement()
                .querySelectorAll('owl-date-time-container').length)
                .toBe(1);
        });

        it('уничтожает открывающийся пикер без последующей отправки события открытия', async () => {
            const fixture = await createPicker();
            const opened = spyOn(fixture.componentInstance.picker.afterPickerOpen, 'emit');
            TestBed.inject(NgZone)
                .run(() => {
                    fixture.componentInstance.picker.open();
                    fixture.destroy();
                });
            await fixture.whenStable();
            expect(opened)
                .not
                .toHaveBeenCalled();
            expect(TestBed.inject(OverlayContainer)
                .getContainerElement()
                .querySelector('owl-date-time-container'))
                .toBeNull();
        });

        it('сохраняет нулевую метку Unix как подтверждённое значение', async () => {
            const fixture = await createPicker();
            const picker = fixture.componentInstance.picker;
            const confirmed = spyOn(picker.confirmSelectedChange, 'emit');
            expect(picker.startAt)
                .toBe(0);
            TestBed.inject(NgZone)
                .run(() => picker.open());
            await fixture.whenStable();
            expect(picker.dateTimeChecker(0))
                .toBeTrue();
            picker.confirmSelect();
            expect(confirmed)
                .toHaveBeenCalledOnceWith(0);
        });

        it('применяет нулевую метку Unix как границу min/max', async () => {
            const fixture = await createPicker();
            const host = fixture.componentInstance;
            host.input.min = 0;
            host.input.max = 0;
            expect(host.picker.dateTimeChecker(0))
                .toBeTrue();
            expect(host.picker.dateTimeChecker(-1))
                .toBeFalse();
            expect(host.picker.dateTimeChecker(1))
                .toBeFalse();
            expect(host.picker.dateTimeChecker(NaN))
                .toBeFalse();
        });

        it('обновляет подписи контейнера после изменения Intl', async () => {
            const fixture = await createPicker();
            TestBed.inject(NgZone)
                .run(() => fixture.componentInstance.picker.open());
            await fixture.whenStable();
            const intl = fixture.debugElement.query(By.directive(OwlDateTimeComponent))
                .injector
                .get(OwlDateTimeIntl);
            TestBed.inject(NgZone)
                .run(() => {
                    intl.setBtnLabel = 'Confirm updated';
                    intl.changes.next();
                });
            await fixture.whenStable();
            expect(TestBed.inject(OverlayContainer)
                .getContainerElement().textContent)
                .toContain('Confirm updated');
        });
    });
}
