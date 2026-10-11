/**
 * timer.component
 */

import { afterNextRender, AfterRenderRef, ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, EventEmitter, inject, Injector, Input, NgZone, OnDestroy, OnInit, Optional, Output } from '@angular/core';
import { OwlDateTimeIntl } from './date-time-picker-intl.service';
import { DateTimeAdapter } from './adapter/date-time-adapter.class';
import { Subscription } from 'rxjs';

@Component({
    exportAs: 'owlDateTimeTimer',
    selector: 'owl-date-time-timer',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.scss'],
    preserveWhitespaces: false,
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class.owl-dt-timer]': 'owlDTTimerClass',
        '[attr.tabindex]': 'owlDTTimeTabIndex'
    }
})
export class OwlTimerComponent<T> implements OnInit, OnDestroy {
    /**
     * Нужно ли показывать поле секунд
     */
    @Input()
    showSecondsTimer: boolean;
    /**
     * Используется ли 12-часовой формат времени
     */
    @Input()
    hour12Timer: boolean;
    /**
     * Количество часов за один шаг
     */
    @Input()
    stepHour = 1;
    /**
     * Количество минут за один шаг
     */
    @Input()
    stepMinute = 1;
    /**
     * Количество секунд за один шаг
     */
    @Input()
    stepSecond = 1;
    @Input()
    get pickerDateTime() {
        return this._pickerDateTime;
    }
    private readonly injector = inject(Injector);
    private readonly destroyRef = inject(DestroyRef);
    @Input()
    get minDateTime(): T | null {
        return this._minDateTime;
    }

    set minDateTime(value: T | null) {
        value = this.dateTimeAdapter.deserialize(value);
        this._minDateTime = this.getValidDate(value);
    }
    private focusRef: AfterRenderRef | undefined;
    @Input()
    get maxDateTime(): T | null {
        return this._maxDateTime;
    }

    set maxDateTime(value: T | null) {
        value = this.dateTimeAdapter.deserialize(value);
        this._maxDateTime = this.getValidDate(value);
    }
    private intlChangesSub = Subscription.EMPTY;
    /** Дата и время, отображаемые в компоненте выбора */
    private _pickerDateTime: T;
    /** Минимальные доступные для выбора дата и время */
    private _minDateTime: T | null;
    /** Максимальные доступные для выбора дата и время */
    private _maxDateTime: T | null;
    private isPM = false; // Относится ли текущее время к PM в 12-часовом формате

    constructor(
        private ngZone: NgZone,
        private elmRef: ElementRef<HTMLElement>,
        private pickerIntl: OwlDateTimeIntl,
        private cdRef: ChangeDetectorRef,
        @Optional() private dateTimeAdapter: DateTimeAdapter<T>
    ) {
        this.intlChangesSub = this.pickerIntl.changes.subscribe(() => this.cdRef.markForCheck());
    }

    get hourValue(): number {
        return this.dateTimeAdapter.getHours(this.pickerDateTime);
    }

    set pickerDateTime(value: T) {
        value = this.dateTimeAdapter.deserialize(value);
        this._pickerDateTime =
            this.getValidDate(value) ?? this.dateTimeAdapter.now();
    }

    get minuteValue(): number {
        return this.dateTimeAdapter.getMinutes(this.pickerDateTime);
    }

    get secondValue(): number {
        return this.dateTimeAdapter.getSeconds(this.pickerDateTime);
    }

    get upHourButtonLabel(): string {
        return this.pickerIntl.upHourLabel;
    }

    get downHourButtonLabel(): string {
        return this.pickerIntl.downHourLabel;
    }

    get upMinuteButtonLabel(): string {
        return this.pickerIntl.upMinuteLabel;
    }

    get downMinuteButtonLabel(): string {
        return this.pickerIntl.downMinuteLabel;
    }

    get upSecondButtonLabel(): string {
        return this.pickerIntl.upSecondLabel;
    }

    get downSecondButtonLabel(): string {
        return this.pickerIntl.downSecondLabel;
    }

    get hour12ButtonLabel(): string {
        return this.isPM
            ? this.pickerIntl.hour12PMLabel
            : this.pickerIntl.hour12AMLabel;
    }

    @Output()
    selectedChange = new EventEmitter<T>();

    get owlDTTimerClass(): boolean {
        return true;
    }

    get owlDTTimeTabIndex(): number {
        return -1;
    }

    /**
     * Значение, отображаемое в hourBox
     * Оно требуется, поскольку значение в hourBox отличается
     * от hourValue в режиме hour12Timer
     * */
    get hourBoxValue(): number {
        let hours = this.hourValue;

        if (!this.hour12Timer) {
            return hours;
        } else {
            if (hours === 0) {
                hours = 12;
                this.isPM = false;
            } else if (hours > 0 && hours < 12) {
                this.isPM = false;
            } else if (hours === 12) {
                this.isPM = true;
            } else if (hours > 12 && hours < 24) {
                hours = hours - 12;
                this.isPM = true;
            }

            return hours;
        }
    }

    public ngOnInit() {}

    public ngOnDestroy(): void {
        this.intlChangesSub.unsubscribe();
    }

    /**
     * Переводит фокус на элемент компонента
     * */
    public focus() {
        if (this.destroyRef.destroyed) {
            return;
        }

        this.focusRef?.destroy();
        this.focusRef = afterNextRender({
            write: () => {
                this.focusRef = undefined;
                this.elmRef.nativeElement.focus();
            }
        }, { injector: this.injector });
    }

    /**
     * Задаёт час при вводе текста в поле времени
     * Нужно для обработки часа в 12-часовом формате времени
     * */
    public setHourValueViaInput(hours: number): void {
        if (this.hour12Timer && this.isPM && hours >= 1 && hours <= 11) {
            hours = hours + 12;
        } else if (this.hour12Timer && !this.isPM && hours === 12) {
            hours = 0;
        }

        this.setHourValue(hours);
    }

    public setHourValue(hours: number): void {
        const m = this.dateTimeAdapter.setHours(this.pickerDateTime, hours);
        this.selectedChange.emit(m);
        this.cdRef.markForCheck();
    }

    public setMinuteValue(minutes: number): void {
        const m = this.dateTimeAdapter.setMinutes(this.pickerDateTime, minutes);
        this.selectedChange.emit(m);
        this.cdRef.markForCheck();
    }

    public setSecondValue(seconds: number): void {
        const m = this.dateTimeAdapter.setSeconds(this.pickerDateTime, seconds);
        this.selectedChange.emit(m);
        this.cdRef.markForCheck();
    }

    public setMeridiem(event: any): void {
        this.isPM = !this.isPM;

        let hours = this.hourValue;
        if (this.isPM) {
            hours = hours + 12;
        } else {
            hours = hours - 12;
        }

        if (hours >= 0 && hours <= 23) {
            this.setHourValue(hours);
        }

        this.cdRef.markForCheck();
        event.preventDefault();
    }

    /**
     * Проверяет доступность кнопки увеличения часов
     */
    public upHourEnabled(): boolean {
        return (
            this.maxDateTime == null ||
            this.compareHours(this.stepHour, this.maxDateTime) < 1
        );
    }

    /**
     * Проверяет доступность кнопки уменьшения часов
     */
    public downHourEnabled(): boolean {
        return (
            this.minDateTime == null ||
            this.compareHours(-this.stepHour, this.minDateTime) > -1
        );
    }

    /**
     * Проверяет доступность кнопки увеличения минут
     */
    public upMinuteEnabled(): boolean {
        return (
            this.maxDateTime == null ||
            this.compareMinutes(this.stepMinute, this.maxDateTime) < 1
        );
    }

    /**
     * Проверяет доступность кнопки уменьшения минут
     */
    public downMinuteEnabled(): boolean {
        return (
            this.minDateTime == null ||
            this.compareMinutes(-this.stepMinute, this.minDateTime) > -1
        );
    }

    /**
     * Проверяет доступность кнопки увеличения секунд
     */
    public upSecondEnabled(): boolean {
        return (
            this.maxDateTime == null ||
            this.compareSeconds(this.stepSecond, this.maxDateTime) < 1
        );
    }

    /**
     * Проверяет доступность кнопки уменьшения секунд
     */
    public downSecondEnabled(): boolean {
        return (
            this.minDateTime == null ||
            this.compareSeconds(-this.stepSecond, this.minDateTime) > -1
        );
    }

    /**
     * Изменяет отображаемый час и сравнивает результат с указанной датой
     * 1 — позже comparedDate
     * -1 — раньше comparedDate
     * 0 — совпадает с comparedDate
     * */
    private compareHours(amount: number, comparedDate: T): number {
        const hours = this.dateTimeAdapter.getHours(this.pickerDateTime) + amount;
        const result = this.dateTimeAdapter.setHours(this.pickerDateTime, hours);
        return this.dateTimeAdapter.compare(result, comparedDate);
    }

    /**
     * Изменяет отображаемую минуту и сравнивает результат с указанной датой
     * 1 — позже comparedDate
     * -1 — раньше comparedDate
     * 0 — совпадает с comparedDate
     * */
    private compareMinutes(amount: number, comparedDate: T): number {
        const minutes =
            this.dateTimeAdapter.getMinutes(this.pickerDateTime) + amount;
        const result = this.dateTimeAdapter.setMinutes(
            this.pickerDateTime,
            minutes
        );
        return this.dateTimeAdapter.compare(result, comparedDate);
    }

    /**
     * Изменяет отображаемую секунду и сравнивает результат с указанной датой
     * 1 — позже comparedDate
     * -1 — раньше comparedDate
     * 0 — совпадает с comparedDate
     * */
    private compareSeconds(amount: number, comparedDate: T): number {
        const seconds =
            this.dateTimeAdapter.getSeconds(this.pickerDateTime) + amount;
        const result = this.dateTimeAdapter.setSeconds(
            this.pickerDateTime,
            seconds
        );
        return this.dateTimeAdapter.compare(result, comparedDate);
    }

    /**
     * Возвращает корректный объект даты
     */
    private getValidDate(obj: any): T | null {
        return this.dateTimeAdapter.isDateInstance(obj) &&
            this.dateTimeAdapter.isValid(obj)
            ? obj
            : null;
    }
}
