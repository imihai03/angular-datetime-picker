/**
 * date-time-picker-input.directive
 */

import { AfterContentInit, ChangeDetectorRef, Directive, ElementRef, EventEmitter, forwardRef, Inject, Input, OnDestroy, OnInit, Optional, Output, Renderer2 } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator, ValidatorFn, Validators } from '@angular/forms';
import { DOWN_ARROW } from '@angular/cdk/keycodes';
import { OwlDateTimeComponent } from './date-time-picker.component';
import { DateTimeAdapter } from './adapter/date-time-adapter.class';
import { OWL_DATE_TIME_FORMATS, OwlDateTimeFormats } from './adapter/date-time-format.class';
import { Subscription } from 'rxjs';
import { SelectMode } from './date-time.class';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

export const OWL_DATETIME_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => OwlDateTimeInputDirective),
    multi: true
};

export const OWL_DATETIME_VALIDATORS: any = {
    provide: NG_VALIDATORS,
    useExisting: forwardRef(() => OwlDateTimeInputDirective),
    multi: true
};

@Directive({
    selector: 'input[owlDateTime]',
    exportAs: 'owlDateTimeInput',
    standalone: false,
    host: {
        '(keydown)': 'handleKeydownOnHost($event)',
        '(blur)': 'handleBlurOnHost($event)',
        '(input)': 'handleInputOnHost($event)',
        '(change)': 'handleChangeOnHost($event)',
        '[attr.aria-haspopup]': 'owlDateTimeInputAriaHaspopup',
        '[attr.aria-owns]': 'owlDateTimeInputAriaOwns',
        '[attr.min]': 'minIso8601',
        '[attr.max]': 'maxIso8601',
        '[disabled]': 'owlDateTimeInputDisabled'
    },
    providers: [
        OWL_DATETIME_VALUE_ACCESSOR,
        OWL_DATETIME_VALIDATORS,
    ],
})
export class OwlDateTimeInputDirective<T>
    implements
        OnInit,
        AfterContentInit,
        OnDestroy,
        ControlValueAccessor,
        Validator {
    static ngAcceptInputType_disabled: boolean|'';

    /**
     * Символ, разделяющий начало ('from') и конец ('to') диапазона в поле ввода
     */
    @Input()
    rangeSeparator = '-';
    @Input()
    get required() {
        return this._required;
    }
    /**
     * Обработчик события `change` этого `<input>`
     * */
    @Output()
    dateTimeChange = new EventEmitter<any>();
    /**
     * Обработчик события `input` этого `<input>`
     * */
    @Output()
    dateTimeInput = new EventEmitter<any>();
    /** Компонент выбора даты и времени, связанный с этим полем */
    public dtPicker: OwlDateTimeComponent<T>;

    private _dateTimeFilter: (date: T | null) => boolean;
    get dateTimeFilter() {
        return this._dateTimeFilter;
    }
    /** Событие изменения значения пользователем или программно */
    public valueChange = new EventEmitter<T[] | T | null>();
    /** Событие изменения состояния disabled */
    public disabledChange = new EventEmitter<boolean>();
     /**
      * Признак обязательного значения для диапазона [null, null]
     * */
    private _required: boolean;
    /** Минимальная допустимая дата */
    private _min: T | null;
    @Input()
    get min(): T | null {
        return this._min;
    }
    /** Максимальная допустимая дата */
    private _max: T | null;
    /**
     * Режим выбора даты
     */
    private _selectMode: SelectMode = 'single';
    @Input()
    get max(): T | null {
        return this._max;
    }

    constructor(
        private elmRef: ElementRef,
        private renderer: Renderer2,
        @Optional()
        private dateTimeAdapter: DateTimeAdapter<T>,
        @Optional() @Inject(OWL_DATE_TIME_FORMATS)
        private dateTimeFormats: OwlDateTimeFormats,
        private changeDetector: ChangeDetectorRef
    ) {
        if (!this.dateTimeAdapter) {
            throw Error(
                `OwlDateTimePicker: No provider found for DateTimeAdapter. You must import ` +
                    `OwlLuxonDateTimeModule at your application root or provide a custom implementation.`
            );
        }

        if (!this.dateTimeFormats) {
            throw Error(
                `OwlDateTimePicker: No provider found for OWL_DATE_TIME_FORMATS. You must import ` +
                    `OwlLuxonDateTimeModule at your application root or provide custom formats.`
            );
        }

        this.localeSub = this.dateTimeAdapter.localeChanges.subscribe(() => {
            this.value = this.value;
        });
    }

    set required(value: any) {
        this._required = coerceBooleanProperty(value);
        this.validatorOnChange();
    }
    @Input()
    get selectMode() {
        return this._selectMode;
    }

    /**
     * Компонент выбора даты и времени, связанный с этим полем
     * */
    @Input()
    set owlDateTime(value: OwlDateTimeComponent<T>) {
        this.registerDateTimePicker(value);
    }

    /**
     * Функция фильтрации даты и времени
     */
    @Input()
    set owlDateTimeFilter(filter: (date: T | null) => boolean) {
        this._dateTimeFilter = filter;
        this.validatorOnChange();
        this.dtPicker?.refreshView();
    }

    private _value: T | null;
    @Input()
    get value() {
        return this._value;
    }

    /** Отключено ли поле ввода даты и времени */
    private _disabled: boolean;

    private _values: T[] = [];
    @Input()
    get values() {
        return this._values;
    }

    @Input()
    get disabled() {
        return !!this._disabled;
    }

    set disabled(value: boolean) {
        const newValue = coerceBooleanProperty(value);
        const element = this.elmRef.nativeElement;

        if (this._disabled !== newValue) {
            this._disabled = newValue;
            this.disabledChange.emit(newValue);
            this.changeDetector.markForCheck();
            this.dtPicker?.refreshView();
        }

        // Проверяем наличие метода `blur`, поскольку при SSR он отсутствует
        if (newValue && element.blur) {
            // Обычно нативное поле ввода автоматически теряет фокус при отключении, что
            // запускает дополнительный цикл change detection и может вызвать ошибку
            // changed after checked, если поле ввода до этого находилось в фокусе
            element.blur();
        }
    }

    set min(value: T | null) {
        this._min = this.getValidDate(this.dateTimeAdapter.deserialize(value));
        this.validatorOnChange();
        this.dtPicker?.refreshView();
    }

    get elementRef(): ElementRef {
        return this.elmRef;
    }

    get isInSingleMode(): boolean {
        return this._selectMode === 'single';
    }

    get isInRangeMode(): boolean {
        return (
            this._selectMode === 'range' ||
            this._selectMode === 'rangeFrom' ||
            this._selectMode === 'rangeTo'
        );
    }

    set max(value: T | null) {
        this._max = this.getValidDate(this.dateTimeAdapter.deserialize(value));
        this.validatorOnChange();
        this.dtPicker?.refreshView();
    }

    private dtPickerSub: Subscription = Subscription.EMPTY;
    private localeSub: Subscription = Subscription.EMPTY;

    private lastValueValid = true;

    private onModelChange: Function = () => {};
    private onModelTouched: Function = () => {};
    private validatorOnChange: Function = () => {};

    set selectMode(mode: SelectMode) {
        if (
            mode !== 'single' &&
            mode !== 'range' &&
            mode !== 'rangeFrom' &&
            mode !== 'rangeTo'
        ) {
            throw Error('OwlDateTime Error: invalid selectMode value!');
        }

        this._selectMode = mode;
        this.validatorOnChange();
        this.dtPicker?.refreshView();
    }

    set value(value: T | null) {
        value = this.dateTimeAdapter.deserialize(value);
        this.lastValueValid = value == null || this.dateTimeAdapter.isValid(value);
        value = this.getValidDate(value);
        const oldDate = this._value;
        this._value = value;

        // Задаём свойство 'value' поля ввода
        this.formatNativeInputValue();

        // Проверяем, изменилось ли значение поля ввода
        if (!this.dateTimeAdapter.isEqual(oldDate, value)) {
            this.valueChange.emit(value);
        }
    }

    set values(values: T[]) {
        if (values && values.length > 0) {
            const deserialized = values.map(v => this.dateTimeAdapter.deserialize(v));
            this.lastValueValid = deserialized.every(v => v == null || this.dateTimeAdapter.isValid(v));
            this._values = deserialized.map(v => this.getValidDate(v));
        } else {
            this._values = [];
            this.lastValueValid = true;
        }

        // Задаём свойство 'value' поля ввода
        this.formatNativeInputValue();

        this.valueChange.emit(this._values);
    }

    get owlDateTimeInputAriaOwns(): string {
        return (this.dtPicker?.opened && this.dtPicker.id) || null;
    }

    get minIso8601(): string {
        return this.min != null ? this.dateTimeAdapter.toIso8601(this.min) : null;
    }

    get maxIso8601(): string {
        return this.max != null ? this.dateTimeAdapter.toIso8601(this.max) : null;
    }

    /**
     * Открывает компонент выбора по сочетанию Alt + ArrowDown
     * */
    public handleKeydownOnHost(event: KeyboardEvent ): void {
        if (event.altKey && event.keyCode === DOWN_ARROW) {
            this.dtPicker.open();
            event.preventDefault();
        }
    }

    /**
     * Задаёт свойство 'value' нативного поля ввода
     */
    public formatNativeInputValue(): void {
        if (this.isInSingleMode) {
            this.renderer.setProperty(
                this.elmRef.nativeElement,
                'value',
                this._value != null
                    ? this.dateTimeAdapter.format(
                          this._value,
                          this.dtPicker.formatString
                      )
                    : ''
            );
        } else if (this.isInRangeMode) {
            if (this._values && this.values.length > 0) {
                const from = this._values[0];
                const to = this._values[1];

                const fromFormatted = from != null
                    ? this.dateTimeAdapter.format(
                          from,
                          this.dtPicker.formatString
                      )
                    : '';
                const toFormatted = to != null
                    ? this.dateTimeAdapter.format(
                          to,
                          this.dtPicker.formatString
                      )
                    : '';

                if (!fromFormatted && !toFormatted) {
                    this.renderer.setProperty(
                        this.elmRef.nativeElement,
                        'value',
                        null
                    );
                } else {
                    if (this._selectMode === 'range') {
                        this.renderer.setProperty(
                            this.elmRef.nativeElement,
                            'value',
                            fromFormatted +
                                ' ' +
                                this.rangeSeparator +
                                ' ' +
                                toFormatted
                        );
                    } else if (this._selectMode === 'rangeFrom') {
                        this.renderer.setProperty(
                            this.elmRef.nativeElement,
                            'value',
                            fromFormatted
                        );
                    } else if (this._selectMode === 'rangeTo') {
                        this.renderer.setProperty(
                            this.elmRef.nativeElement,
                            'value',
                            toFormatted
                        );
                    }
                }
            } else {
                this.renderer.setProperty(
                    this.elmRef.nativeElement,
                    'value',
                    ''
                );
            }
        }

        return;
    }

    /** Валидатор корректности разбора введённого значения */
    private parseValidator: ValidatorFn = (): ValidationErrors | null => {
        return this.lastValueValid
            ? null
            : { owlDateTimeParse: { text: this.elmRef.nativeElement.value } };
    }

    get owlDateTimeInputAriaHaspopup(): boolean {
        return true;
    }

    /** Валидатор минимальной даты */
    private minValidator: ValidatorFn = (
        control: AbstractControl
    ): ValidationErrors | null => {
        if (this.isInSingleMode) {
            const controlValue = this.getValidDate(
                this.dateTimeAdapter.deserialize(control.value)
            );
            return this.min == null ||
            controlValue == null ||
                this.dateTimeAdapter.compare(this.min, controlValue) <= 0
                ? null
                : { owlDateTimeMin: { min: this.min, actual: controlValue } };
        } else if (this.isInRangeMode && control.value) {
            const controlValueFrom = this.getValidDate(
                this.dateTimeAdapter.deserialize(control.value[0])
            );
            const controlValueTo = this.getValidDate(
                this.dateTimeAdapter.deserialize(control.value[1])
            );
            return this.min == null ||
            [controlValueFrom, controlValueTo].every(value =>
                value == null || this.dateTimeAdapter.compare(this.min, value) <= 0
            )
                ? null
                : {
                      owlDateTimeMin: {
                          min: this.min,
                          actual: [controlValueFrom, controlValueTo]
                      }
                  };
        }
    }

    /** Валидатор максимальной даты */
    private maxValidator: ValidatorFn = (
        control: AbstractControl
    ): ValidationErrors | null => {
        if (this.isInSingleMode) {
            const controlValue = this.getValidDate(
                this.dateTimeAdapter.deserialize(control.value)
            );
            return this.max == null ||
            controlValue == null ||
                this.dateTimeAdapter.compare(this.max, controlValue) >= 0
                ? null
                : { owlDateTimeMax: { max: this.max, actual: controlValue } };
        } else if (this.isInRangeMode && control.value) {
            const controlValueFrom = this.getValidDate(
                this.dateTimeAdapter.deserialize(control.value[0])
            );
            const controlValueTo = this.getValidDate(
                this.dateTimeAdapter.deserialize(control.value[1])
            );
            return this.max == null ||
            [controlValueFrom, controlValueTo].every(value =>
                value == null || this.dateTimeAdapter.compare(this.max, value) >= 0
            )
                ? null
                : {
                      owlDateTimeMax: {
                          max: this.max,
                          actual: [controlValueFrom, controlValueTo]
                      }
                  };
        }
    }

    /** Валидатор соответствия фильтру дат */
    private filterValidator: ValidatorFn = (
        control: AbstractControl
    ): ValidationErrors | null => {
        const values = this.isInRangeMode && Array.isArray(control.value)
            ? control.value
            : [control.value];
        return !this._dateTimeFilter || values.every(value => {
            const date = this.getValidDate(this.dateTimeAdapter.deserialize(value));
            return date == null || this._dateTimeFilter(date);
        }) ? null : { owlDateTimeFilter: true };
    }

    get owlDateTimeInputDisabled(): boolean {
        return this.disabled;
    }

    /**
     * Валидатор диапазона дат
     * Проверяет, что начало диапазона находится не позже конца ('to')
     * */
    private rangeValidator: ValidatorFn = (
        control: AbstractControl
    ): ValidationErrors | null => {
        if (this.isInSingleMode || !control.value) {
            return null;
        }

        const controlValueFrom = this.getValidDate(
            this.dateTimeAdapter.deserialize(control.value[0])
        );
        const controlValueTo = this.getValidDate(
            this.dateTimeAdapter.deserialize(control.value[1])
        );

        return controlValueFrom == null ||
        controlValueTo == null ||
            this.dateTimeAdapter.compare(controlValueFrom, controlValueTo) <= 0
            ? null
            : { owlDateTimeRange: true };
    }

    public ngOnInit(): void {
        if (!this.dtPicker) {
            throw Error(
                `OwlDateTimePicker: the picker input doesn't have any associated owl-date-time component`
            );
        }
    }

    public ngAfterContentInit(): void {
        this.dtPickerSub = this.dtPicker.confirmSelectedChange.subscribe(
            (selecteds: T[] | T) => {
                if (Array.isArray(selecteds)) {
                    this.values = selecteds;
                } else {
                    this.value = selecteds;
                }

                this.onModelChange(selecteds);
                this.onModelTouched();
                this.dateTimeChange.emit({
                    source: this,
                    value: selecteds,
                    input: this.elmRef.nativeElement
                });
                this.dateTimeInput.emit({
                    source: this,
                    value: selecteds,
                    input: this.elmRef.nativeElement
                });
            }
        );
    }

    public ngOnDestroy(): void {
        this.dtPickerSub.unsubscribe();
        this.localeSub.unsubscribe();
        this.valueChange.complete();
        this.disabledChange.complete();
    }

    public writeValue(value: any): void {
        if (this.isInSingleMode) {
            this.value = value;
        } else {
            this.values = value;
        }
    }

    public registerOnChange(fn: any): void {
        this.onModelChange = fn;
    }

    public registerOnTouched(fn: any): void {
        this.onModelTouched = fn;
    }

    public setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    public validate(c: AbstractControl): { [key: string]: any } {
        return this.validator ? this.validator(c) : null;
    }

    public registerOnValidatorChange(fn: () => void): void {
        this.validatorOnChange = fn;
    }

    /**
     * Валидатор обязательного диапазона дат
     * Проверяет наличие обеих границ диапазона
     * */
    private requiredRangeValidator: ValidatorFn = (
        control: AbstractControl
    ): ValidationErrors | null => {
        if (this.isInSingleMode || !control.value || !this.required) {
            return null;
        }

        const controlValueFrom = this.getValidDate(
            this.dateTimeAdapter.deserialize(control.value[0])
        );
        const controlValueTo = this.getValidDate(
            this.dateTimeAdapter.deserialize(control.value[1])
        );

        return controlValueFrom == null ||
        controlValueTo == null
            ? { owlRequiredDateTimeRange: [controlValueFrom, controlValueTo] }
            : null;
    }

    public handleBlurOnHost(event: Event ): void {
        this.onModelTouched();
    }

    public handleInputOnHost(event: any ): void {
        const value = event.target.value;
        if (this._selectMode === 'single') {
            this.changeInputInSingleMode(value);
        } else if (this._selectMode === 'range') {
            this.changeInputInRangeMode(value);
        } else {
            this.changeInputInRangeFromToMode(value);
        }
    }

    public handleChangeOnHost(event: any ): void {

        let v;
        if (this.isInSingleMode) {
            v = this.value;
        } else if (this.isInRangeMode) {
            v = this.values;
        }

        this.dateTimeChange.emit({
            source: this,
            value: v,
            input: this.elmRef.nativeElement
        });
    }

    /** Объединённый валидатор этого поля ввода */
    private validator: ValidatorFn | null = Validators.compose([
        this.parseValidator,
        this.minValidator,
        this.maxValidator,
        this.filterValidator,
        this.rangeValidator,
        this.requiredRangeValidator
    ]);

    /**
     * Регистрирует связь между полем ввода и компонентом выбора
     */
    private registerDateTimePicker(picker: OwlDateTimeComponent<T>) {
        if (picker) {
            this.dtPicker = picker;
            this.dtPicker.registerInput(this);
        }
    }

    /**
     * Преобразует указанный объект в корректный объект даты
     */
    private getValidDate(obj: any): T | null {
        return this.dateTimeAdapter.isDateInstance(obj) &&
            this.dateTimeAdapter.isValid(obj)
            ? obj
            : null;
    }

    /**
     * Преобразует строку времени в строку даты и времени
     * При pickerType равном 'timer' поле ввода содержит строку времени
     * Метод parse адаптера dateTimeAdapter не может разобрать строку времени как объект даты
     * Поэтому эта функция преобразует строку времени в строку даты и времени
     */
    private convertTimeStringToDateTimeString(
        timeString: string,
        dateTime: T
    ): string | null {
        if (timeString) {
            const v = dateTime ?? this.dateTimeAdapter.now();
            const dateString = this.dateTimeAdapter.format(
                v,
                this.dateTimeFormats.datePickerInput
            );
            return dateString + ' ' + timeString;
        } else {
            return null;
        }
    }

    /**
     * Обрабатывает изменение поля ввода в режиме single
     */
    private changeInputInSingleMode(inputValue: string): void {
        let value = inputValue;
        if (this.dtPicker.pickerType === 'timer') {
            value = this.convertTimeStringToDateTimeString(value, this.value);
        }

        let result = this.dateTimeAdapter.parse(
            value,
            this.dateTimeFormats.parseInput
        );
        this.lastValueValid = result == null || this.dateTimeAdapter.isValid(result);
        result = this.getValidDate(result);

        // Если newValue совпадает с oldValue, не отправляем событие valueChange
        // result равный null означает, что событие ввода произошло, но значение недопустимо
        if (!this.isSameValue(result, this._value) || result === null) {
            this._value = result;
            this.valueChange.emit(result);
            this.onModelChange(result);
            this.dateTimeInput.emit({
                source: this,
                value: result,
                input: this.elmRef.nativeElement
            });
        }
    }

    /**
     * Обрабатывает изменение поля ввода в режиме rangeFrom или rangeTo
     */
    private changeInputInRangeFromToMode(inputValue: string): void {
        const originalValue =
            this._selectMode === 'rangeFrom'
                ? this._values[0]
                : this._values[1];

        if (this.dtPicker.pickerType === 'timer') {
            inputValue = this.convertTimeStringToDateTimeString(
                inputValue,
                originalValue
            );
        }

        let result = this.dateTimeAdapter.parse(
            inputValue,
            this.dateTimeFormats.parseInput
        );
        this.lastValueValid = result == null || this.dateTimeAdapter.isValid(result);
        result = this.getValidDate(result);

        // Если newValue совпадает с oldValue, не отправляем событие valueChange
        if (
            (this._selectMode === 'rangeFrom' &&
                this.isSameValue(result, this._values[0]) &&
                result) ||
            (this._selectMode === 'rangeTo' &&
                this.isSameValue(result, this._values[1]) &&
                result)
        ) {
            return;
        }

        this._values =
            this._selectMode === 'rangeFrom'
                ? [result, this._values[1]]
                : [this._values[0], result];
        this.valueChange.emit(this._values);
        this.onModelChange(this._values);
        this.dateTimeInput.emit({
            source: this,
            value: this._values,
            input: this.elmRef.nativeElement
        });
    }

    /**
     * Обрабатывает изменение поля ввода в режиме range
     */
    private changeInputInRangeMode(inputValue: string): void {
        const wasValid = this.lastValueValid;
        const selecteds = inputValue.split(this.rangeSeparator)
            .map(value => value.trim());
        let fromString = selecteds[0];
        let toString = selecteds[1];

        if (this.dtPicker.pickerType === 'timer') {
            fromString = this.convertTimeStringToDateTimeString(
                fromString,
                this.values[0]
            );
            toString = this.convertTimeStringToDateTimeString(
                toString,
                this.values[1]
            );
        }

        let from = this.dateTimeAdapter.parse(
            fromString,
            this.dateTimeFormats.parseInput
        );
        let to = this.dateTimeAdapter.parse(
            toString,
            this.dateTimeFormats.parseInput
        );
        this.lastValueValid =
            (from == null || this.dateTimeAdapter.isValid(from)) &&
            (to == null || this.dateTimeAdapter.isValid(to));
        from = this.getValidDate(from);
        to = this.getValidDate(to);

        // Если newValue совпадает с oldValue, не отправляем событие valueChange
        if (
            !this.isSameValue(from, this._values[0]) ||
            !this.isSameValue(to, this._values[1]) ||
            wasValid !== this.lastValueValid ||
            (from === null && to === null)
        ) {
            this._values = [from, to];
            this.valueChange.emit(this._values);
            this.onModelChange(this._values);
            this.dateTimeInput.emit({
                source: this,
                value: this._values,
                input: this.elmRef.nativeElement
            });
        }
    }

    /**
     * Проверяет равенство двух значений
     */
    private isSameValue(first: T | null, second: T | null): boolean {
        if (first != null && second != null) {
            return this.dateTimeAdapter.compare(first, second) === 0;
        }

        return first === second;
    }
}
