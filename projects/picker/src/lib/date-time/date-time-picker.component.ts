/**
 * date-time-picker.component
 */

import { afterNextRender, AfterRenderRef, ChangeDetectionStrategy, ChangeDetectorRef, Component, ComponentRef, EventEmitter, Inject, inject, InjectionToken, Injector, Input, NgZone, OnDestroy, OnInit, Optional, Output, untracked, ViewContainerRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ComponentPortal } from '@angular/cdk/portal';
import { BlockScrollStrategy, Overlay, OverlayConfig, OverlayRef, PositionStrategy, ScrollStrategy } from '@angular/cdk/overlay';
import { ESCAPE, UP_ARROW } from '@angular/cdk/keycodes';
import { coerceArray, coerceBooleanProperty } from '@angular/cdk/coercion';
import { merge, Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { OwlDialogRef } from '../dialog/dialog-ref.class';
import { OwlDialogService } from '../dialog/dialog.service';
import { DateTimeAdapter } from './adapter/date-time-adapter.class';
import { OWL_DATE_TIME_FORMATS, OwlDateTimeFormats } from './adapter/date-time-format.class';
import { OwlDateTimeContainerComponent } from './date-time-picker-container.component';
import { OwlDateTimeInputDirective } from './date-time-picker-input.directive';
import { OwlDateTime, PickerMode, PickerType, SelectMode } from './date-time.class';

/** Токен DI, определяющий обработку прокрутки при открытом компоненте выбора даты и времени */
export const OWL_DTPICKER_SCROLL_STRATEGY = new InjectionToken<
    () => ScrollStrategy
>('owl-dtpicker-scroll-strategy');

/** @docs-private */
export function OWL_DTPICKER_SCROLL_STRATEGY_PROVIDER_FACTORY(
    overlay: Overlay
): () => BlockScrollStrategy {
    const fn = () => overlay.scrollStrategies.block();
    return fn;
}

/** @docs-private */
export const OWL_DTPICKER_SCROLL_STRATEGY_PROVIDER = {
    provide: OWL_DTPICKER_SCROLL_STRATEGY,
    deps: [Overlay],
    useFactory: OWL_DTPICKER_SCROLL_STRATEGY_PROVIDER_FACTORY
};

@Component({
    selector: 'owl-date-time',
    exportAs: 'owlDateTime',
    templateUrl: './date-time-picker.component.html',
    styleUrls: ['./date-time-picker.component.scss'],
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush,
    preserveWhitespaces: false
})
export class OwlDateTimeComponent<T> extends OwlDateTime<T>
    implements OnInit, OnDestroy {
    /** Пользовательский класс фона компонента выбора */
    @Input()
    public backdropClass: string | string[] = [];

    /** Пользовательский класс overlay-панели компонента выбора */
    @Input()
    public panelClass: string | string[] = [];
    /**
     * Открывается ли компонент выбора в диалоговом окне
     */
    _pickerMode: PickerMode = 'popup';
    /**
     * Стратегия прокрутки при открытом компоненте выбора
     * Подробнее: https://material.angular.io/cdk/overlay/overview#scroll-strategies
     * */
    @Input()
    public scrollStrategy: ScrollStrategy;

    set startAt(date: T | null) {
        this._startAt = this.getValidDate(
            this.dateTimeAdapter.deserialize(date)
        );
    }
    /**
     * Обработчик закрытия компонента выбора
     * */
    @Output()
    afterPickerClosed = new EventEmitter<any>();
    /**
     * Обработчик перед открытием компонента выбора
     * */
    @Output()
    beforePickerOpen = new EventEmitter<any>();

    set endAt(date: T | null) {
        this._endAt = this.getValidDate(
            this.dateTimeAdapter.deserialize(date)
        );
    }
    /**
     * Обработчик открытия компонента выбора
     * */
    @Output()
    afterPickerOpen = new EventEmitter<any>();
    @Input()
    get pickerType(): PickerType {
        return this._pickerType;
    }

    set pickerType(val: PickerType) {
        if (val !== this._pickerType) {
            this._pickerType = val;
            if (this._dtInput) {
                this._dtInput.formatNativeInputValue();
            }
        }
    }
    /**
     * Передаёт выбранный год в представлении нескольких лет
     * При этом выбранная дата не изменяется
     * */
    @Output()
    yearSelected = new EventEmitter<T>();
    @Input()
    get pickerMode() {
        return this._pickerMode;
    }

    set pickerMode(mode: PickerMode) {
        if (mode === 'popup') {
            this._pickerMode = mode;
        } else {
            this._pickerMode = 'dialog';
        }
    }
    /**
     * Передаёт выбранный месяц в представлении года
     * При этом выбранная дата не изменяется
     * */
    @Output()
    monthSelected = new EventEmitter<T>();
    @Input()
    get disabled(): boolean {
        return this._disabled === undefined && this._dtInput
            ? this._dtInput.disabled
            : !!this._disabled;
    }
    /**
     * Передаёт выбранную дату
     * */
    @Output()
    dateSelected = new EventEmitter<T>();
    /**
     * Событие подтверждения выбранного значения
     * */
    public confirmSelectedChange = new EventEmitter<T[] | T>();
    /**
     * Событие отключения компонента выбора даты и времени
     * */
    public disabledChange = new EventEmitter<boolean>();
    /**
     * Задаёт тип компонента выбора даты и времени:
     *      'both' — календарь и выбор времени
     *      'calendar' — только календарь
     *      'timer' — только выбор времени
     */
    private _pickerType: PickerType = 'both';
    /** Отключён ли компонент выбора даты и времени */
    private _disabled: boolean;
    /** Открыт ли календарь */
    private _opened = false;
    @Input()
    get opened(): boolean {
        return this._opened;
    }

    set opened(val: boolean) {
        val ? this.open() : this.close();
    }
    private closing = false;
    private destroyed = false;
    private positionRenderRef: AfterRenderRef | undefined;
    private readonly injector = inject(Injector);
    private dialogClosedStreamSub = Subscription.EMPTY;
    /** Элемент, находившийся в фокусе до открытия компонента выбора даты и времени */
    private focusedElementBeforeOpen: HTMLElement | null = null;

    /** Дата, на которой календарь открывается изначально */
    private _startAt: T | null;

    @Input()
    get startAt(): T | null {
        // Если startAt задан явно, открываем календарь на этой дате
        // Иначе используем текущее выбранное значение
        if (this._startAt != null) {
            return this._startAt;
        }

        if (this._dtInput) {
            if (this._dtInput.selectMode === 'single') {
                return this._dtInput.value ?? null;
            } else if (
                this._dtInput.selectMode === 'range' ||
                this._dtInput.selectMode === 'rangeFrom'
            ) {
                return this._dtInput.values[0] ?? null;
            } else if (this._dtInput.selectMode === 'rangeTo') {
                return this._dtInput.values[1] ?? null;
            }
        } else {
            return null;
        }
    }

    /** Конечная дата календаря в режиме диапазона */
    private _endAt: T | null;

    private pickerContainerPortal: ComponentPortal<
        OwlDateTimeContainerComponent<T>
    >;
    private pickerContainer: OwlDateTimeContainerComponent<T>;
    private popupRef: OverlayRef;
    private dialogRef: OwlDialogRef<OwlDateTimeContainerComponent<T>>;

    @Input()
    get endAt(): T | null {
        if (this._endAt != null) {
            return this._endAt;
        }

        if (this._dtInput) {
            if (this._dtInput.selectMode === 'single') {
                return this._dtInput.value ?? null;
            } else if (
                this._dtInput.selectMode === 'range' ||
                this._dtInput.selectMode === 'rangeFrom'
            ) {
                return this._dtInput.values[1] ?? null;
            }
        } else {
            return null;
        }
    }
    private dtInputSub = Subscription.EMPTY;
    private hidePickerStreamSub = Subscription.EMPTY;
    private confirmSelectedStreamSub = Subscription.EMPTY;
    private pickerOpenedStreamSub = Subscription.EMPTY;
    private pickerBeforeOpenedStreamSub = Subscription.EMPTY;

    set disabled(value: boolean) {
        value = coerceBooleanProperty(value);
        if (value !== this._disabled) {
            this._disabled = value;
            this.disabledChange.next(value);
            this.refreshView();
        }
    }

    private _dtInput: OwlDateTimeInputDirective<T>;
    get dtInput() {
        return this._dtInput;
    }

    private _selected: T | null;
    get selected() {
        return this._selected;
    }

    set selected(value: T | null) {
        this._selected = value;
        this.refreshView();
    }

    private _selecteds: T[] = [];
    get selecteds() {
        return this._selecteds;
    }

    set selecteds(values: T[]) {
        this._selecteds = values;
        this.refreshView();
    }

    /** Минимальная доступная для выбора дата */
    get minDateTime(): T | null {
        return this._dtInput && this._dtInput.min;
    }

    /** Максимальная доступная для выбора дата */
    get maxDateTime(): T | null {
        return this._dtInput && this._dtInput.max;
    }

    get dateTimeFilter(): (date: T | null) => boolean {
        return this._dtInput && this._dtInput.dateTimeFilter;
    }

    get selectMode(): SelectMode {
        return this._dtInput.selectMode;
    }

    get isInSingleMode(): boolean {
        return this._dtInput.isInSingleMode;
    }

    get isInRangeMode(): boolean {
        return this._dtInput.isInRangeMode;
    }

    private readonly defaultScrollStrategy: () => ScrollStrategy;

    constructor(
        public overlay: Overlay,
        private viewContainerRef: ViewContainerRef,
        private dialogService: OwlDialogService,
        private ngZone: NgZone,
        protected changeDetector: ChangeDetectorRef,
        @Optional() protected dateTimeAdapter: DateTimeAdapter<T>,
        @Inject(OWL_DTPICKER_SCROLL_STRATEGY) defaultScrollStrategy: any,
        @Optional()
        @Inject(OWL_DATE_TIME_FORMATS)
        protected dateTimeFormats: OwlDateTimeFormats,
        @Optional()
        @Inject(DOCUMENT)
        private document: any
    ) {
        super(dateTimeAdapter, dateTimeFormats);
        this.defaultScrollStrategy = defaultScrollStrategy;
    }

    public refreshView(): void {
        this.changeDetector.markForCheck();
        this.pickerContainer?.refreshView();
    }

    public ngOnInit() {}

    public ngOnDestroy(): void {
        this.destroyed = true;
        this.close();
        this.dtInputSub.unsubscribe();
        this.disabledChange.complete();

        if (this.popupRef) {
            this.popupRef.dispose();
        }
    }

    public registerInput(input: OwlDateTimeInputDirective<T>): void {
        if (this._dtInput) {
            throw Error(
                'A Owl DateTimePicker can only be associated with a single input.'
            );
        }

        this._dtInput = input;
        this.dtInputSub = this._dtInput.valueChange.subscribe(
            (value: T[] | T | null) => {
                if (Array.isArray(value)) {
                    this.selecteds = value;
                } else {
                    this.selected = value;
                }
            }
        );
    }

    public open(): void {
        if (this._opened || this.closing || this.destroyed || this.disabled) {
            return;
        }

        if (!this._dtInput) {
            throw Error(
                'Attempted to open an DateTimePicker with no associated input.'
            );
        }

        if (this.document) {
            this.focusedElementBeforeOpen = this.document.activeElement;
        }

        // Сбрасываем выбранное значение компонента
        if (this.isInSingleMode) {
            this.selected = this._dtInput.value;
        } else if (this.isInRangeMode) {
            this.selecteds = this._dtInput.values;
        }

        // При открытии компонента выбора приводим текущее выбранное время
        // к времени из _startAt
        if (this.selected != null && this.pickerType !== 'calendar' && this._startAt != null) {
            this.selected = this.dateTimeAdapter.createDate(
                this.dateTimeAdapter.getYear(this.selected),
                this.dateTimeAdapter.getMonth(this.selected),
                this.dateTimeAdapter.getDate(this.selected),
                this.dateTimeAdapter.getHours(this._startAt),
                this.dateTimeAdapter.getMinutes(this._startAt),
                this.dateTimeAdapter.getSeconds(this._startAt)
            );
        }

        this._opened = true;
        this.changeDetector.markForCheck();
        this.pickerMode === 'dialog' ? this.openAsDialog() : this.openAsPopup();

        this.pickerContainer.picker = this;

        // Подписываемся на hidePickerStream контейнера компонента выбора
        this.hidePickerStreamSub = this.pickerContainer.hidePickerStream.subscribe(
            () => {
                this.close();
            }
        );

        // Подписываемся на confirmSelectedStream контейнера компонента выбора
        this.confirmSelectedStreamSub = this.pickerContainer.confirmSelectedStream.subscribe(
            (event: any) => {
                this.confirmSelect(event);
            }
        );
    }

    /**
     * Выбирает указанную дату
     */
    public select(date: T[] | T): void {
        if (Array.isArray(date)) {
            this.selecteds = [...date];
        } else {
            this.selected = date;
        }

        /**
         * Условия автоматического подтверждения выбранной даты или диапазона:
         * 1) Режим компонента отличается от 'dialog'
         * 2) Тип компонента — 'calendar', а selectMode — 'single'
         * 3) Тип компонента — 'calendar', selectMode — 'range',
         *    а в selecteds заданы начало (selecteds[0]) и конец (selecteds[1]) диапазона
         * 4) selectMode — 'rangeFrom', а selecteds[0] содержит значение
         * 5) selectMode — 'rangeTo', а selecteds[1] содержит значение
         * */
        if (
            this.pickerMode !== 'dialog' &&
            this.pickerType === 'calendar' &&
            ((this.selectMode === 'single' && this.selected != null) ||
                (this.selectMode === 'rangeFrom' && this.selecteds[0] != null) ||
                (this.selectMode === 'rangeTo' && this.selecteds[1] != null) ||
                (this.selectMode === 'range' &&
                    this.selecteds[0] != null &&
                    this.selecteds[1] != null))
        ) {
            this.confirmSelect();
        }
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

    /**
     * Закрывает компонент выбора
     */
    public close(): void {
        if (!this._opened || this.closing) {
            return;
        }

        this.closing = true;
        this._opened = false;
        this.positionRenderRef?.destroy();
        this.positionRenderRef = undefined;
        this.hidePickerStreamSub?.unsubscribe();
        this.confirmSelectedStreamSub?.unsubscribe();
        this.pickerBeforeOpenedStreamSub?.unsubscribe();
        this.pickerOpenedStreamSub?.unsubscribe();
        this.dialogClosedStreamSub.unsubscribe();

        const dialogRef = this.dialogRef;
        this.dialogRef = null;
        dialogRef?.close();

        if (this.popupRef?.hasAttached()) {
            this.popupRef.detach();
        }
        if (this.pickerContainerPortal?.isAttached) {
            this.pickerContainerPortal.detach();
        }

        this.pickerContainer = null;

        // Игнорируем обработчики фокуса, пытающиеся повторно открыть компонент при восстановлении фокуса
        this.focusedElementBeforeOpen?.focus();
        this.focusedElementBeforeOpen = null;
        this.changeDetector.markForCheck();
        this.closing = false;
        this.afterPickerClosed.emit(this.isInSingleMode ? this.selected : this.selecteds);
    }

    /**
     * Подтверждает выбранное значение
     */
    public confirmSelect(event?: any): void {
        if (this.isInSingleMode) {
            const selected =
                      this.selected ?? this.startAt ?? this.dateTimeAdapter.now();
            this.confirmSelectedChange.emit(selected);
        } else if (this.isInRangeMode) {
            this.confirmSelectedChange.emit(this.selecteds);
        }

        this.close();
        return;
    }

    /**
     * Открывает компонент выбора в диалоговом окне
     */
    private openAsDialog(): void {
        this.dialogRef = this.dialogService.open(
            OwlDateTimeContainerComponent,
            {
                autoFocus: false,
                backdropClass: [
                    'cdk-overlay-dark-backdrop',
                    ...coerceArray(this.backdropClass)
                ],
                paneClass: ['owl-dt-dialog', ...coerceArray(this.panelClass)],
                viewContainerRef: this.viewContainerRef,
                scrollStrategy:
                    this.scrollStrategy || this.defaultScrollStrategy()
            }
        );
        this.pickerContainer = untracked(this.dialogRef.componentInstance);

        this.pickerBeforeOpenedStreamSub = this.dialogRef.beforeOpen()
            .subscribe(() => {
            this.beforePickerOpen.emit(null);
        });
        this.pickerOpenedStreamSub = this.dialogRef.afterOpen()
            .subscribe(() => {
            this.afterPickerOpen.emit(null);
        });
        this.dialogClosedStreamSub = this.dialogRef.afterClosed()
            .subscribe(() => this.close());
    }

    /**
     * Открывает компонент выбора во всплывающем окне
     */
    private openAsPopup(): void {
        if (!this.pickerContainerPortal) {
            this.pickerContainerPortal = new ComponentPortal<
                OwlDateTimeContainerComponent<T>
            >(OwlDateTimeContainerComponent, this.viewContainerRef);
        }

        if (!this.popupRef) {
            this.createPopup();
        }

        if (!this.popupRef.hasAttached()) {
            const componentRef: ComponentRef<
                OwlDateTimeContainerComponent<T>
            > = this.popupRef.attach(this.pickerContainerPortal);
            this.pickerContainer = componentRef.instance;

            // Обновляем положение после отрисовки календаря
            this.positionRenderRef?.destroy();
            this.positionRenderRef = afterNextRender({
                mixedReadWrite: () => {
                    this.positionRenderRef = undefined;
                    if (this.popupRef.hasAttached()) {
                        this.popupRef.updatePosition();
                    }
                }
            }, { injector: this.injector });

            this.pickerBeforeOpenedStreamSub = this.pickerContainer.beforePickerOpenedStream
                .pipe(take(1))
                .subscribe(() => {
                    this.beforePickerOpen.emit(null);
                });

            // Отправляем событие открытия
            this.pickerOpenedStreamSub = this.pickerContainer.pickerOpenedStream
                .pipe(take(1))
                .subscribe(() => {
                    this.afterPickerOpen.emit(null);
                });
        }
    }

    private createPopup(): void {
        const overlayConfig = new OverlayConfig({
            positionStrategy: this.createPopupPositionStrategy(),
            hasBackdrop: true,
            backdropClass: [
                'cdk-overlay-transparent-backdrop',
                ...coerceArray(this.backdropClass)
            ],
            scrollStrategy: this.scrollStrategy || this.defaultScrollStrategy(),
            panelClass: ['owl-dt-popup', ...coerceArray(this.panelClass)]
        });

        this.popupRef = this.overlay.create(overlayConfig);

        merge(
            this.popupRef.backdropClick(),
            this.popupRef.detachments(),
            this.popupRef
                .keydownEvents()
                .pipe(
                    filter(
                        event =>
                            event.keyCode === ESCAPE ||
                            (this._dtInput &&
                                event.altKey &&
                                event.keyCode === UP_ARROW)
                    )
                )
        ).subscribe(() => this.close());
    }

    /**
     * Создаёт PositionStrategy всплывающего окна
     * */
    private createPopupPositionStrategy(): PositionStrategy {
        return this.overlay
            .position()
            .flexibleConnectedTo(this._dtInput.elementRef)
            .withTransformOriginOn('.owl-dt-container')
            .withFlexibleDimensions(false)
            .withPush(false)
            .withPositions([
                {
                    originX: 'start',
                    originY: 'bottom',
                    overlayX: 'start',
                    overlayY: 'top'
                },
                {
                    originX: 'start',
                    originY: 'top',
                    overlayX: 'start',
                    overlayY: 'bottom'
                },
                {
                    originX: 'end',
                    originY: 'bottom',
                    overlayX: 'end',
                    overlayY: 'top'
                },
                {
                    originX: 'end',
                    originY: 'top',
                    overlayX: 'end',
                    overlayY: 'bottom'
                },
                {
                    originX: 'start',
                    originY: 'top',
                    overlayX: 'start',
                    overlayY: 'top',
                    offsetY: -176
                },
                {
                    originX: 'start',
                    originY: 'top',
                    overlayX: 'start',
                    overlayY: 'top',
                    offsetY: -352
                }
            ]);
    }
}
