/**
 * date-time-inline.component
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, forwardRef, Inject, Input, OnInit, Optional, Output, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { OwlDateTime, PickerMode, PickerType, SelectMode } from './date-time.class';
import { DateTimeAdapter } from './adapter/date-time-adapter.class';
import { OWL_DATE_TIME_FORMATS, OwlDateTimeFormats } from './adapter/date-time-format.class';
import { OwlDateTimeContainerComponent } from './date-time-picker-container.component';

export const OWL_DATETIME_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => OwlDateTimeInlineComponent),
    multi: true
};

@Component({
    selector: 'owl-date-time-inline',
    templateUrl: './date-time-inline.component.html',
    styleUrls: ['./date-time-inline.component.scss'],
    host: {
        '[class.owl-dt-inline]': 'owlDTInlineClass',
        '[attr.aria-disabled]': 'disabled || null'
    },
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush,
    preserveWhitespaces: false,
    providers: [OWL_DATETIME_VALUE_ACCESSOR]
})
export class OwlDateTimeInlineComponent<T> extends OwlDateTime<T>
    implements OnInit, ControlValueAccessor {
    @ViewChild(OwlDateTimeContainerComponent, { static: true })
    container: OwlDateTimeContainerComponent<T>;

    /**
     * Передаёт выбранный год в представлении нескольких лет
     * При этом выбранная дата не изменяется
     * */
    @Output()
    yearSelected = new EventEmitter<T>();
    @Input()
    get pickerType(): PickerType {
        return this._pickerType;
    }

    set pickerType(val: PickerType) {
        if (val !== this._pickerType) {
            this._pickerType = val;
        }
    }

    private _disabled = false;
    @Input()
    get disabled(): boolean {
        return !!this._disabled;
    }
    /**
     * Передаёт выбранный месяц в представлении года
     * При этом выбранная дата не изменяется
     * */
    @Output()
    monthSelected = new EventEmitter<T>();

    private _selectMode: SelectMode = 'single';
    @Input()
    get selectMode() {
        return this._selectMode;
    }

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
    }
    /**
     * Передаёт выбранную дату
     * */
    @Output()
    dateSelected = new EventEmitter<T>();
    /**
     * Задаёт тип компонента выбора даты и времени:
     *      'both' — календарь и выбор времени
     *      'calendar' — только календарь
     *      'timer' — только выбор времени
     */
    private _pickerType: PickerType = 'both';

    set startAt(date: T | null) {
        this._startAt = this.getValidDate(
            this.dateTimeAdapter.deserialize(date)
        );
    }
    /** Минимальная допустимая дата */
    private _min: T | null;
    /** Максимальная допустимая дата */
    private _max: T | null;

    set endAt(date: T | null) {
        this._endAt = this.getValidDate(
            this.dateTimeAdapter.deserialize(date)
        );
    }

    private _dateTimeFilter: (date: T | null) => boolean;
    @Input('owlDateTimeFilter')
    get dateTimeFilter() {
        return this._dateTimeFilter;
    }

    set dateTimeFilter(filter: (date: T | null) => boolean) {
        this._dateTimeFilter = filter;
    }

    set disabled(value: boolean) {
        this._disabled = coerceBooleanProperty(value);
        this.changeDetector.markForCheck();
        this.container?.refreshView();
    }

    /** Дата, на которой календарь открывается изначально */
    private _startAt: T | null;

    @Input('min')
    set minDateTime(value: T | null) {
        this._min = this.getValidDate(this.dateTimeAdapter.deserialize(value));
        this.changeDetector.markForCheck();
    }

    @Input()
    get startAt(): T | null {
        if (this._startAt != null) {
            return this._startAt;
        }

        if (this.selectMode === 'single') {
            return this.value ?? null;
        } else if (
            this.selectMode === 'range' ||
            this.selectMode === 'rangeFrom'
        ) {
            return this.values[0] ?? null;
        } else if (this.selectMode === 'rangeTo') {
            return this.values[1] ?? null;
        } else {
            return null;
        }
    }

    /** Дата открытия календаря в режиме диапазона */
    private _endAt: T | null;

    @Input('max')
    set maxDateTime(value: T | null) {
        this._max = this.getValidDate(this.dateTimeAdapter.deserialize(value));
        this.changeDetector.markForCheck();
    }

    private _value: T | null;
    @Input()
    get value() {
        return this._value;
    }

    set value(value: T | null) {
        value = this.dateTimeAdapter.deserialize(value);
        value = this.getValidDate(value);
        this._value = value;
        this.selected = value;
    }

    private _values: (T | null)[] = [];
    @Input()
    get values() {
        return this._values;
    }

    @Input()
    get endAt(): T | null {
        if (this._endAt != null) {
            return this._endAt;
        }

        if (this.selectMode === 'single') {
            return this.value ?? null;
        } else if (
            this.selectMode === 'range' ||
            this.selectMode === 'rangeFrom'
        ) {
            return this.values[1] ?? null;
        } else {
            return null;
        }
    }

    get minDateTime(): T | null {
        return this._min ?? null;
    }

    get maxDateTime(): T | null {
        return this._max ?? null;
    }

    set values(values: (T | null)[]) {
        if (values && values.length > 0) {
            values = values.map(v => {
                v = this.dateTimeAdapter.deserialize(v);
                v = this.getValidDate(v);
                return v != null ? this.dateTimeAdapter.clone(v) : null;
            });
            this._values = [...values];
            this.selecteds = [...values];
        } else {
            this._values = [];
            this.selecteds = [];
        }
    }

    private _selected: T | null;
    get selected() {
        return this._selected;
    }

    set selected(value: T | null) {
        this._selected = value;
        this.changeDetector.markForCheck();
    }

    private _selecteds: T[] = [];
    get selecteds() {
        return this._selecteds;
    }

    set selecteds(values: T[]) {
        this._selecteds = values;
        this.changeDetector.markForCheck();
    }

    get opened(): boolean {
        return true;
    }

    get pickerMode(): PickerMode {
        return 'inline';
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

    get owlDTInlineClass(): boolean {
        return true;
    }

    private onModelChange: Function = () => { };
    private onModelTouched: Function = () => { };

    constructor(
        protected changeDetector: ChangeDetectorRef,
        @Optional() protected dateTimeAdapter: DateTimeAdapter<T>,
        @Optional()
        @Inject(OWL_DATE_TIME_FORMATS)
        protected dateTimeFormats: OwlDateTimeFormats
    ) {
        super(dateTimeAdapter, dateTimeFormats);
    }

    public ngOnInit() {
        this.container.picker = this;
    }

    public writeValue(value: any): void {
        if (this.isInSingleMode) {
            this.value = value;
            this.container.pickerDateTime = value;
        } else {
            this.values = value;
            this.container.pickerDateTime = this._values[
                this.container.activeSelectedIndex
            ];
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

    public select(date: T[] | T): void {
        if (this.disabled) {
            return;
        }

        if (Array.isArray(date)) {
            this.values = [...date];
        } else {
            this.value = date;
        }
        this.onModelChange(date);
        this.onModelTouched();
    }

    /**
     * Передаёт выбранный год в представлении нескольких лет
     * */
    public selectYear(normalizedYear: T): void {
        this.yearSelected.emit(normalizedYear);
    }

    /**
     * Передаёт выбранный месяц в представлении года
     * */
    public selectMonth(normalizedMonth: T): void {
        this.monthSelected.emit(normalizedMonth);
    }

    /**
     * Передаёт выбранную дату
     * */
     public selectDate(normalizedDate: T): void {
        this.dateSelected.emit(normalizedDate);
    }
}
