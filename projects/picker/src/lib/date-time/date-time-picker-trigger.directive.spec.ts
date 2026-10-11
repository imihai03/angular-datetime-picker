import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { OwlLuxonDateTimeModule } from './adapter/luxon-date-time.module';
import { OwlDateTimeComponent } from './date-time-picker.component';
import { OwlDateTimeTriggerDirective } from './date-time-picker-trigger.directive';
import { OwlDateTimeModule } from './date-time.module';

@Component({
    standalone: true,
    imports: [OwlDateTimeModule, OwlLuxonDateTimeModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<input [owlDateTime]="first" [disabled]="inputDisabled()">
    <owl-date-time #first></owl-date-time>
    <input [owlDateTime]="second">
    <owl-date-time #second></owl-date-time>
    <span [owlDateTimeTrigger]="useSecond() ? second : first">Open</span>`
})
class TriggerHost {
    readonly useSecond = signal(false);
    readonly inputDisabled = signal(false);
}

describe('Директива OwlDateTimeTriggerDirective', () => {
    beforeEach(() => TestBed.configureTestingModule({
        imports: [TriggerHost], providers: [provideZonelessChangeDetection()]
    }));

    it('отражает привязку disabled нативного поля в пикере и триггере', async () => {
        const fixture = TestBed.createComponent(TriggerHost);
        await fixture.whenStable();
        fixture.componentInstance.inputDisabled.set(true);
        await fixture.whenStable();
        const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
        expect(input.disabled)
            .toBeTrue();
        expect(fixture.nativeElement.querySelector('span')
            .classList
            .contains('owl-dt-trigger-disabled'))
            .toBeTrue();
        fixture.componentInstance.inputDisabled.set(false);
        await fixture.whenStable();
        expect(input.disabled)
            .toBeFalse();
        expect(fixture.nativeElement.querySelector('span')
            .classList
            .contains('owl-dt-trigger-disabled'))
            .toBeFalse();
    });

    it('обновляет класс disabled при асинхронном изменении блокировки поля или пикера', async () => {
        const fixture = TestBed.createComponent(TriggerHost);
        await fixture.whenStable();
        const picker = fixture.debugElement.query(By.directive(OwlDateTimeComponent)).componentInstance;
        const trigger: HTMLElement = fixture.nativeElement.querySelector('span');
        picker.dtInput.disabled = true;
        await fixture.whenStable();
        expect(trigger.classList.contains('owl-dt-trigger-disabled'))
            .toBeTrue();
        picker.disabled = false;
        await fixture.whenStable();
        expect(trigger.classList.contains('owl-dt-trigger-disabled'))
            .toBeFalse();
    });

    it('следит за новым пикером после замены и отписывается от прежнего', async () => {
        const fixture = TestBed.createComponent(TriggerHost);
        await fixture.whenStable();
        const pickers = fixture.debugElement.queryAll(By.directive(OwlDateTimeComponent));
        fixture.componentInstance.useSecond.set(true);
        await fixture.whenStable();
        pickers[1].componentInstance.disabled = true;
        await fixture.whenStable();
        expect(fixture.nativeElement.querySelector('span')
            .classList
            .contains('owl-dt-trigger-disabled'))
            .toBeTrue();
        pickers[0].componentInstance.disabled = false;
        await fixture.whenStable();
        expect(fixture.nativeElement.querySelector('span')
            .classList
            .contains('owl-dt-trigger-disabled'))
            .toBeTrue();
    });

    it('не открывает пикер при заблокированном триггере', async () => {
        const fixture = TestBed.createComponent(TriggerHost);
        await fixture.whenStable();
        const trigger = fixture.debugElement.query(By.directive(OwlDateTimeTriggerDirective));
        const directive = trigger.injector.get(OwlDateTimeTriggerDirective);
        const open = spyOn(directive.dtPicker, 'open');
        directive.disabled = true;
        trigger.nativeElement.click();
        expect(open)
            .not
            .toHaveBeenCalled();
        directive.disabled = false;
        trigger.nativeElement.click();
        expect(open)
            .toHaveBeenCalledTimes(1);
    });
});
