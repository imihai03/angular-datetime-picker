/**
 * timer-box.component
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { coerceNumberProperty } from '@angular/cdk/coercion';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
    exportAs: 'owlDateTimeTimerBox',
    selector: 'owl-date-time-timer-box',
    templateUrl: './timer-box.component.html',
    styleUrls: ['./timer-box.component.scss'],
    standalone: false,
    preserveWhitespaces: false,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class.owl-dt-timer-box]': 'owlDTTimerBoxClass'
    }
})

export class OwlTimerBoxComponent implements OnInit, OnDestroy {

    @Input() showDivider = false;

    @Input() upBtnAriaLabel: string;

    @Input() upBtnDisabled: boolean;

    @Input() downBtnAriaLabel: string;

    @Input() downBtnDisabled: boolean;

    /**
     * Значение, отображаемое в поле
     * Если равно null, в поле отображается [value]
     * */
    @Input() boxValue: number;

    @Input() value: number;

    @Input() min: number;

    @Input() max: number;

    @Input() step = 1;

    @Input() inputLabel: string;

    @Output() valueChange = new EventEmitter<number>();

    @Output() inputChange = new EventEmitter<number>();

    private inputStream = new Subject<string>();

    private inputStreamSub = Subscription.EMPTY;

    private isEditing = false;

    constructor(private changeDetector: ChangeDetectorRef) {
    }

    get owlDTTimerBoxClass(): boolean {
        return true;
    }

    @ViewChild('valueInput', { static: true })
    private valueInput: ElementRef<HTMLInputElement>;
    private onValueInputMouseWheelBind = this.onValueInputMouseWheel.bind(this);

    get displayValue(): string {
        if (this.isEditing) {
            // Не переформатируем значение, пока пользователь его редактирует
            return this.valueInput.nativeElement.value;
        }

        const value = this.boxValue ?? this.value;

        if (value == null || isNaN(value)) {
            return '';
        }

        return value < 10 ? '0' + value.toString() : value.toString();
    }

    public ngOnInit() {
        this.inputStreamSub = this.inputStream.pipe(debounceTime(750)).subscribe(( val: string ) => {
            if (val) {
                const inputValue = coerceNumberProperty(val, 0);
                this.updateValueViaInput(inputValue);
            }
        });
        this.bindValueInputMouseWheel();
    }

    public ngOnDestroy(): void {
        this.unbindValueInputMouseWheel();
        this.inputStreamSub.unsubscribe();
    }

    public upBtnClicked(): void {
        this.updateValue(this.value + this.step);
    }

    public downBtnClicked(): void {
        this.updateValue(this.value - this.step);
    }

    public handleInputChange(val: string ): void {
        this.isEditing = true;
        this.inputStream.next(val);
    }

    public focusIn(): void {
        this.isEditing = true;
    }

    public focusOut(value: string): void {
        const wasEditing = this.isEditing;
        this.isEditing = false;
        // Отменяем ожидающий debounce: blur сразу фиксирует текущий текст
        this.inputStream.next('');
        if (wasEditing && value) {
            const inputValue = coerceNumberProperty(value, 0);
            this.updateValueViaInput(inputValue);
        }
    }

    private updateValue( value: number ): void {
        // Шаг заменяет введённый текст; отложенный input и blur не должны откатывать значение
        this.isEditing = false;
        this.inputStream.next('');
        this.valueChange.emit(value);
    }

    private updateValueViaInput( value: number ): void {
        if (value > this.max || value < this.min) {
            return;
        }
        this.inputChange.emit(value);
    }

    private onValueInputMouseWheel( event: any ): void {
        event = event || window.event;
        const delta = event.deltaY != null ? -event.deltaY : event.wheelDelta || -event.detail;

        if (delta > 0) {
          if (!this.upBtnDisabled) {
            this.upBtnClicked();
          }
        } else if (delta < 0) {
          if (!this.downBtnDisabled) {
            this.downBtnClicked();
          }
        }

        this.changeDetector.markForCheck();
        event.preventDefault ? event.preventDefault() : (event.returnValue = false);
    }

    private bindValueInputMouseWheel(): void {
        this.valueInput.nativeElement.addEventListener(
            'onwheel' in this.valueInput.nativeElement.ownerDocument ? 'wheel' : 'mousewheel',
            this.onValueInputMouseWheelBind);
    }

    private unbindValueInputMouseWheel(): void {
        this.valueInput.nativeElement.removeEventListener(
            'onwheel' in this.valueInput.nativeElement.ownerDocument ? 'wheel' : 'mousewheel',
            this.onValueInputMouseWheelBind);
    }
}
