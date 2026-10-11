/**
 * date-time-picker-container.component
 */

import { AfterContentInit, AfterViewInit, AnimationCallbackEvent, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, OnInit, Optional, ViewChild } from '@angular/core';
import { OwlDateTimeIntl } from './date-time-picker-intl.service';
import { OwlCalendarComponent } from './calendar.component';
import { IDateTimePickerAnimationEvent } from './date-time-picker-animation-event';
import { OwlTimerComponent } from './timer.component';
import { DateTimeAdapter } from './adapter/date-time-adapter.class';
import { OwlDateTime, PickerType } from './date-time.class';
import { Observable, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW, SPACE, UP_ARROW } from '@angular/cdk/keycodes';

@Component({
    exportAs: 'owlDateTimeContainer',
    selector: 'owl-date-time-container',
    templateUrl: './date-time-picker-container.component.html',
    styleUrls: ['./date-time-picker-container.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    preserveWhitespaces: false,
    standalone: false,
    host: {
        '(animate.enter)': 'onAnimateEnter($event)',
        '(animate.leave)': 'onAnimateLeave($event)',
        '[class.owl-dt-container]': 'owlDTContainerClass',
        '[class.owl-dt-popup-container]': 'owlDTPopupContainerClass',
        '[class.owl-dt-dialog-container]': 'owlDTDialogContainerClass',
        '[class.owl-dt-inline-container]': 'owlDTInlineContainerClass',
        '[class.owl-dt-container-disabled]': 'owlDTContainerDisabledClass',
        '[attr.id]': 'owlDTContainerId',
    }
})
export class OwlDateTimeContainerComponent<T>
    implements OnInit, AfterContentInit, AfterViewInit
{
    @ViewChild(OwlCalendarComponent)
    calendar: OwlCalendarComponent<T>;
    @ViewChild(OwlTimerComponent)
    timer: OwlTimerComponent<T>;

    public picker: OwlDateTime<T>;
    public activeSelectedIndex = 0; // Индекс активной границы диапазона (0: 'from', 1: 'to')

    /** Событие изменения состояния анимации */
    public animationStateChanged = new EventEmitter<IDateTimePickerAnimationEvent>();

    // Сохраняем время начала и конца диапазона
    private retainStartTime: T;
    private retainEndTime: T;

    /**
     * Поток запросов на закрытие компонента выбора
     * */
    private hidePicker$ = new Subject<any>();

    get hidePickerStream(): Observable<any> {
        return this.hidePicker$.asObservable();
    }

    /**
     * Поток запросов на подтверждение выбранного значения
     * */
    private confirmSelected$ = new Subject<any>();

    get confirmSelectedStream(): Observable<any> {
        return this.confirmSelected$.asObservable();
    }

    private beforePickerOpened$ = new Subject<any>();

    get beforePickerOpenedStream(): Observable<any> {
        return this.beforePickerOpened$.asObservable();
    }

    private pickerOpened$ = new Subject<any>();

    get pickerOpenedStream(): Observable<any> {
        return this.pickerOpened$.asObservable();
    }

    /**
     * Текущее значение компонента выбора определяет отображаемый период и дату,
     * выделенную при навигации с клавиатуры
     */
    private _clampedPickerDateTime: T;

    get pickerDateTime() {
        return this._clampedPickerDateTime;
    }

    constructor(
        private cdRef: ChangeDetectorRef,
        private elmRef: ElementRef,
        private pickerIntl: OwlDateTimeIntl,
        @Optional() private dateTimeAdapter: DateTimeAdapter<T>,
    ) {
        this.pickerIntl.changes.pipe(takeUntilDestroyed())
            .subscribe(() => this.cdRef.markForCheck());
    }

    get pickerType(): PickerType {
        return this.picker.pickerType;
    }

    get cancelLabel(): string {
        return this.pickerIntl.cancelBtnLabel;
    }

    get setLabel(): string {
        return this.pickerIntl.setBtnLabel;
    }

    set pickerDateTime(value: T) {
        if (value != null) {
            this._clampedPickerDateTime = this.dateTimeAdapter.clampDate(
                value,
                this.picker.minDateTime,
                this.picker.maxDateTime,
            );
        }
        this.cdRef.markForCheck();
    }

    /**
     * Подпись начала диапазона ('from')
     * */
    get fromLabel(): string {
        return this.pickerIntl.rangeFromLabel;
    }

    /**
     * Подпись конца диапазона ('to')
     * */
    get toLabel(): string {
        return this.pickerIntl.rangeToLabel;
    }

    /**
     * Отформатированное значение начала диапазона ('from')
     * */
    get fromFormattedValue(): string {
        const value = this.picker.selecteds[0];
        return value != null
            ? this.dateTimeAdapter.format(value, this.picker.formatString)
            : '';
    }

    /**
     * Отформатированное значение конца диапазона ('to')
     * */
    get toFormattedValue(): string {
        const value = this.picker.selecteds[1];
        return value != null
            ? this.dateTimeAdapter.format(value, this.picker.formatString)
            : '';
    }

    get containerElm(): HTMLElement {
        return this.elmRef.nativeElement;
    }

    get owlDTContainerClass(): boolean {
        return true;
    }

    get owlDTPopupContainerClass(): boolean {
        return this.picker.pickerMode === 'popup';
    }

    get owlDTDialogContainerClass(): boolean {
        return this.picker.pickerMode === 'dialog';
    }

    get owlDTInlineContainerClass(): boolean {
        return this.picker.pickerMode === 'inline';
    }

    get owlDTContainerDisabledClass(): boolean {
        return this.picker.disabled;
    }

    get owlDTContainerId(): string {
        return this.picker.id;
    }

    get owlDTContainerAnimation(): any {
        return this.picker.pickerMode === 'inline' ? '' : 'enter';
    }

    /**
     * Условия отображения кнопок управления:
     * 1) Режим компонента — 'dialog'
     * 2) Тип компонента отличается от 'calendar', а режим — от 'inline'
     * */
    get showControlButtons(): boolean {
        return (
            this.picker.pickerMode === 'dialog' ||
            (this.picker.pickerType !== 'calendar' &&
                this.picker.pickerMode !== 'inline')
        );
    }

    public refreshView(): void {
        this.cdRef.markForCheck();
    }

    public ngOnInit() {
        if (this.picker.selectMode === 'range') {
            if (this.picker.selecteds[0] != null) {
                this.retainStartTime = this.dateTimeAdapter.clone(
                    this.picker.selecteds[0],
                );
            }
            if (this.picker.selecteds[1] != null) {
                this.retainEndTime = this.dateTimeAdapter.clone(
                    this.picker.selecteds[1],
                );
            }
        }
    }

    public ngAfterContentInit(): void {
        this.initPicker();
    }

    public ngAfterViewInit(): void {
        this.focusPicker();
    }

    public handleContainerAnimationStart(animationName: 'enter' | 'leave'): void {
        if (animationName === 'enter') {
            this.beforePickerOpened$.next(null);
        }
        this.animationStateChanged.emit({
            phaseName: 'start',
            toState: animationName
        });
    }

    public handleContainerAnimationDone(animationName: 'enter' | 'leave'): void {
        if (animationName === 'enter') {
            this.pickerOpened$.next(null);
        }
        this.animationStateChanged.emit({
            phaseName: 'done',
            toState: animationName
        });
    }

    public dateSelected(date: T): void {
        if (this.picker.disabled) {
            return;
        }
        let result;

        if (this.picker.isInSingleMode) {
            result = this.dateSelectedInSingleMode(date);
            if (result != null) {
                this.pickerDateTime = result;
                this.picker.select(result);
            } else {
                // Закрываем компонент выбора, если result равен null и pickerType равен 'calendar'
                if (this.pickerType === 'calendar') {
                    this.hidePicker$.next(null);
                }
            }
            return;
        }

        if (this.picker.isInRangeMode) {
            result = this.dateSelectedInRangeMode(date);
            if (result != null) {
                this.pickerDateTime = result[this.activeSelectedIndex];
                this.picker.select(result);
            }
        }
    }

    public timeSelected(time: T): void {
        if (this.picker.disabled) {
            return;
        }
        this.pickerDateTime = this.dateTimeAdapter.clone(time);

        if (!this.picker.dateTimeChecker(this.pickerDateTime)) {
            return;
        }

        if (this.picker.isInSingleMode) {
            this.picker.select(this.pickerDateTime);
            return;
        }

        if (this.picker.isInRangeMode) {
            const selecteds = [...this.picker.selecteds];

            // Проверяем, находится ли начало диапазона после конца или конец перед началом
            // В этом случае задаём обеим границам диапазона одинаковое значение
            if (
                (this.activeSelectedIndex === 0 &&
                    selecteds[1] != null &&
                    this.dateTimeAdapter.compare(
                        this.pickerDateTime,
                        selecteds[1],
                    ) === 1) ||
                (this.activeSelectedIndex === 1 &&
                    selecteds[0] != null &&
                    this.dateTimeAdapter.compare(
                        this.pickerDateTime,
                        selecteds[0],
                    ) === -1)
            ) {
                selecteds[0] = this.pickerDateTime;
                selecteds[1] = this.pickerDateTime;
            } else {
                selecteds[this.activeSelectedIndex] = this.pickerDateTime;
            }

            if (selecteds[0] != null) {
                this.retainStartTime = this.dateTimeAdapter.clone(selecteds[0]);
            }
            if (selecteds[1] != null) {
                this.retainEndTime = this.dateTimeAdapter.clone(selecteds[1]);
            }
            this.picker.select(selecteds);
        }
    }

    /**
     * Обрабатывает нажатие кнопки отмены
     */
    public onCancelClicked(event: any): void {
        this.hidePicker$.next(null);
        event.preventDefault();
        return;
    }

    /**
     * Обрабатывает нажатие кнопки подтверждения
     */
    public onSetClicked(event: any): void {
        if (this.picker.disabled) {
            event.preventDefault();
            return;
        }
        if (!this.picker.dateTimeChecker(this.pickerDateTime)) {
            this.hidePicker$.next(null);
            event.preventDefault();
            return;
        }

        this.confirmSelected$.next(event);
        event.preventDefault();
        return;
    }

    /**
     * Обрабатывает выбор границы диапазона в группе переключателей
     */
    public handleClickOnInfoGroup(event: any, index: number): void {
        this.setActiveSelectedIndex(index);
        event.preventDefault();
        event.stopPropagation();
    }

    /**
     * Обрабатывает выбор границы диапазона в группе переключателей
     */
    public handleKeydownOnInfoGroup(
        event: any,
        next: any,
        index: number,
    ): void {
        switch (event.keyCode) {
            case DOWN_ARROW:
            case RIGHT_ARROW:
            case UP_ARROW:
            case LEFT_ARROW:
                next.focus();
                this.setActiveSelectedIndex(index === 0 ? 1 : 0);
                event.preventDefault();
                event.stopPropagation();
                break;

            case SPACE:
                this.setActiveSelectedIndex(index);
                event.preventDefault();
                event.stopPropagation();
                break;

            default:
                return;
        }
    }

    protected onAnimateEnter(event: AnimationCallbackEvent): void {
        this.handleContainerAnimationStart('enter');
        const duration = this.parseCssVariableDuration(event.target, '--container-enter-animation-duration');
        if (duration === 0) {
            this.handleContainerAnimationDone('enter');
            event.animationComplete();
        } else {
            const animation = event.target.animate([
                { opacity: 0, transform: 'scaleY(0)' },
                { opacity: 1, transform: 'scaleY(1)' }
            ], {
                duration: duration ?? 400,
                easing: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
                fill: 'forwards'
            });
            const complete = () => {
                this.handleContainerAnimationDone('enter');
                event.animationComplete();
            };
            animation.finished.then(complete, complete);
        }
    }

    protected onAnimateLeave(event: AnimationCallbackEvent): void {
        this.handleContainerAnimationStart('leave');
        const duration = this.parseCssVariableDuration(event.target, '--container-leave-animation-duration');
        if (duration === 0) {
            this.handleContainerAnimationDone('leave');
            event.animationComplete();
        } else {
            const animation = event.target.animate([
                { opacity: 1 },
                { opacity: 0 }
            ], {
                duration: duration ?? 100,
                easing: 'linear',
                fill: 'forwards'
            });
            const complete = () => {
                this.handleContainerAnimationDone('leave');
                event.animationComplete();
            };
            animation.finished.then(complete, complete);
        }
    }

    /**
     * Задаёт значение activeSelectedIndex
     */
    private setActiveSelectedIndex(index: number): void {
        if (
            this.picker.selectMode === 'range' &&
            this.activeSelectedIndex !== index
        ) {
            this.activeSelectedIndex = index;

            const selected = this.picker.selecteds[this.activeSelectedIndex];
            if (this.picker.selecteds && selected != null) {
                this.pickerDateTime = this.dateTimeAdapter.clone(selected);
            }
        }
        return;
    }

    private initPicker(): void {
        this.pickerDateTime = this.picker.startAt ?? this.dateTimeAdapter.now();
        this.activeSelectedIndex = this.picker.selectMode === 'rangeTo' ? 1 : 0;
    }

    /**
     * Выбирает дату календаря в режиме single
     * Возвращает null, если дата не выбрана
     */
    private dateSelectedInSingleMode(date: T): T | null {
        if (this.dateTimeAdapter.isSameDay(date, this.picker.selected)) {
            return null;
        }

        return this.updateAndCheckCalendarDate(date);
    }

    /**
     * Выбирает даты в режиме диапазона
     */
    private dateSelectedInRangeMode(date: T): T[] | null {
        let from = this.picker.selecteds[0];
        let to = this.picker.selecteds[1];

        const result = this.updateAndCheckCalendarDate(date);

        if (result == null) {
            return null;
        }

        // Если указанный день совпадает с началом диапазона или находится после него,
        // задаём его как конец диапазона ('to')
        // Иначе задаём его как начало диапазона ('from'), а конец ('to') сбрасываем в null
        if (this.picker.selectMode === 'range') {
            if (
                this.picker.selecteds &&
                this.picker.selecteds.length &&
                to == null &&
                from != null &&
                this.dateTimeAdapter.differenceInCalendarDays(result, from) >= 0
            ) {
                if (this.picker.endAt != null && this.retainEndTime == null) {
                    to = this.dateTimeAdapter.createDate(
                        this.dateTimeAdapter.getYear(result),
                        this.dateTimeAdapter.getMonth(result),
                        this.dateTimeAdapter.getDate(result),
                        this.dateTimeAdapter.getHours(this.picker.endAt),
                        this.dateTimeAdapter.getMinutes(this.picker.endAt),
                        this.dateTimeAdapter.getSeconds(this.picker.endAt),
                    );
                } else if (this.retainEndTime != null) {
                    to = this.dateTimeAdapter.createDate(
                        this.dateTimeAdapter.getYear(result),
                        this.dateTimeAdapter.getMonth(result),
                        this.dateTimeAdapter.getDate(result),
                        this.dateTimeAdapter.getHours(this.retainEndTime),
                        this.dateTimeAdapter.getMinutes(this.retainEndTime),
                        this.dateTimeAdapter.getSeconds(this.retainEndTime),
                    );
                } else {
                    to = result;
                }
                this.activeSelectedIndex = 1;
            } else {
                if (this.picker.startAt != null && this.retainStartTime == null) {
                    from = this.dateTimeAdapter.createDate(
                        this.dateTimeAdapter.getYear(result),
                        this.dateTimeAdapter.getMonth(result),
                        this.dateTimeAdapter.getDate(result),
                        this.dateTimeAdapter.getHours(this.picker.startAt),
                        this.dateTimeAdapter.getMinutes(this.picker.startAt),
                        this.dateTimeAdapter.getSeconds(this.picker.startAt),
                    );
                } else if (this.retainStartTime != null) {
                    from = this.dateTimeAdapter.createDate(
                        this.dateTimeAdapter.getYear(result),
                        this.dateTimeAdapter.getMonth(result),
                        this.dateTimeAdapter.getDate(result),
                        this.dateTimeAdapter.getHours(this.retainStartTime),
                        this.dateTimeAdapter.getMinutes(this.retainStartTime),
                        this.dateTimeAdapter.getSeconds(this.retainStartTime),
                    );
                } else {
                    from = result;
                }
                to = null;
                this.activeSelectedIndex = 0;
            }
        } else if (this.picker.selectMode === 'rangeFrom') {
            from = result;

            // Если начало диапазона находится после конца, сбрасываем конец в null
            if (to != null && this.dateTimeAdapter.compare(from, to) > 0) {
                to = null;
            }
        } else if (this.picker.selectMode === 'rangeTo') {
            to = result;

            // Если начало диапазона находится после конца, сбрасываем начало в null
            if (from != null && this.dateTimeAdapter.compare(from, to) > 0) {
                from = null;
            }
        }

        // Сохранённое время может выходить за min/max, даже если день доступен для выбора
        const selected = this.dateTimeAdapter.clampDate(
            this.activeSelectedIndex === 0 ? from : to,
            this.picker.minDateTime,
            this.picker.maxDateTime
        );
        if (!this.picker.dateTimeChecker(selected)) {
            return null;
        }
        if (this.activeSelectedIndex === 0) {
            from = selected;
        } else {
            to = selected;
        }
        return [from, to];
    }

    /**
     * Обновляет время указанной даты календаря и проверяет её допустимость
     * Поскольку время даты календаря по умолчанию равно 00:00:00, в режиме 'both'
     * перед выбором даты необходимо обновить её время
     * Если дата допустима, возвращает обновлённое значение dateTime
     * Если дата недопустима, возвращает null
     */
    private updateAndCheckCalendarDate(date: T): T {
        let result;

        // В режиме 'both' обновляем время даты календаря
        if (this.picker.pickerType === 'both') {
            result = this.dateTimeAdapter.createDate(
                this.dateTimeAdapter.getYear(date),
                this.dateTimeAdapter.getMonth(date),
                this.dateTimeAdapter.getDate(date),
                this.dateTimeAdapter.getHours(this.pickerDateTime),
                this.dateTimeAdapter.getMinutes(this.pickerDateTime),
                this.dateTimeAdapter.getSeconds(this.pickerDateTime),
            );
            result = this.dateTimeAdapter.clampDate(
                result,
                this.picker.minDateTime,
                this.picker.maxDateTime,
            );
        } else {
            result = this.dateTimeAdapter.clone(date);
        }

        // Проверяем обновлённое значение dateTime
        return this.picker.dateTimeChecker(result) ? result : null;
    }

    /**
     * Переводит фокус на компонент выбора
     * */
    private focusPicker(): void {
        if (this.picker.pickerMode === 'inline') {
            return;
        }

        if (this.calendar) {
            this.calendar.focusActiveCell();
        } else if (this.timer) {
            this.timer.focus();
        }
    }

    private parseCssVariableDuration(el: Element, cssVariableName: string) {
        const durationStr = getComputedStyle(el).getPropertyValue(cssVariableName).trim();

        // Переводим в миллисекунды
        let duration: number | undefined = undefined;
        if (durationStr.endsWith('ms')) {
            duration = parseFloat(durationStr);
        } else if (durationStr.endsWith('s')) {
            duration = parseFloat(durationStr) * 1000;
        } else if (durationStr) {
            duration = parseFloat(durationStr);
            if (isNaN(duration)) {
                duration = undefined;
            }
        }
        return duration;
    }
}
