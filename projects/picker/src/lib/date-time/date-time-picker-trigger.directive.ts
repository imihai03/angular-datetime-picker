/**
 * date-time-picker-trigger.directive
 */


import { AfterContentInit, ChangeDetectorRef, Directive, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { OwlDateTimeComponent } from './date-time-picker.component';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { EMPTY, merge, Subscription } from 'rxjs';

@Directive({
    selector: '[owlDateTimeTrigger]',
    standalone: false,
    host: {
        '(click)': 'handleClickOnHost($event)',
        '[class.owl-dt-trigger-disabled]': 'owlDTTriggerDisabledClass'
    }
})
export class OwlDateTimeTriggerDirective<T> implements OnInit, OnChanges, AfterContentInit, OnDestroy {

    @Input('owlDateTimeTrigger') dtPicker: OwlDateTimeComponent<T>;

    private _disabled: boolean;
    @Input()
    get disabled(): boolean {
        return this._disabled === undefined ? !!this.dtPicker?.disabled : !!this._disabled;
    }

    set disabled( value: boolean ) {
        this._disabled = coerceBooleanProperty(value);
    }

    get owlDTTriggerDisabledClass(): boolean {
        return this.disabled;
    }

    private stateChanges = Subscription.EMPTY;

    constructor( protected changeDetector: ChangeDetectorRef ) {
    }

    public ngOnInit(): void {
    }

    public ngOnChanges( changes: SimpleChanges ) {
        if (changes.dtPicker) {
            this.watchStateChanges();
        }
    }

    public ngAfterContentInit() {
        this.watchStateChanges();
    }

    public ngOnDestroy(): void {
        this.stateChanges.unsubscribe();
    }

    public handleClickOnHost( event: Event ): void {
        if (this.dtPicker && !this.disabled) {
            this.dtPicker.open();
            event.stopPropagation();
        }
    }

    private watchStateChanges(): void {
        this.stateChanges.unsubscribe();

        const inputDisabled = this.dtPicker && this.dtPicker.dtInput ?
            this.dtPicker.dtInput.disabledChange.asObservable() : EMPTY;

        const pickerDisabled = this.dtPicker ?
            this.dtPicker.disabledChange.asObservable() : EMPTY;

        this.stateChanges = merge(pickerDisabled, inputDisabled)
            .subscribe(() => {
                this.changeDetector.markForCheck();
            });
    }
}
