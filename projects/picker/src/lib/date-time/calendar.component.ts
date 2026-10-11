/**
 * calendar.component
 */

import { AfterContentInit, afterNextRender, AfterRenderRef, AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, EventEmitter, inject, Inject, Injector, Input, NgZone, OnDestroy, OnInit, Optional, Output } from '@angular/core';
import { OwlDateTimeIntl } from './date-time-picker-intl.service';
import { DateTimeAdapter } from './adapter/date-time-adapter.class';
import { OWL_DATE_TIME_FORMATS, OwlDateTimeFormats } from './adapter/date-time-format.class';
import { DateView, DateViewType, SelectMode } from './date-time.class';
import { Subscription } from 'rxjs';

@Component({
    selector: 'owl-date-time-calendar',
    exportAs: 'owlDateTimeCalendar',
    templateUrl: './calendar.component.html',
    styleUrls: ['./calendar.component.scss'],
    standalone: false,
    host: {
        '[class.owl-dt-calendar]': 'owlDTCalendarClass'
    },
    preserveWhitespaces: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OwlCalendarComponent<T>
    implements OnInit, AfterContentInit, AfterViewChecked, OnDestroy {

    /**
     * Фильтр дат для представлений месяца и года
     * */
    @Input()
    dateFilter: (date: T) => boolean;
    /**
     * Задаёт первый день недели
     */
    @Input()
    firstDayOfWeek: number;
    /**
     * Начальное представление календаря
     */
    @Input()
    startView: DateViewType = DateView.MONTH;

    DateView = DateView;

    @Input()
    get minDate(): T | null {
        return this._minDate;
    }
    /**
     * Нужно ли показывать только представления года и нескольких лет
     */
    @Input()
    yearOnly = false;

    @Input()
    get maxDate(): T | null {
        return this._maxDate;
    }
    /**
     * Нужно ли показывать номера недель в календаре
     * */
    @Input()
    showCalendarWeeks = false;

    @Input()
    get pickerDateTime() {
        return this._pickerDateTime;
    }
    /**
     * Нужно ли показывать только представление нескольких лет
     */
    @Input()
    multiyearOnly = false;

    @Input()
    get selected(): T | null {
        return this._selected;
    }

    set selected(value: T | null) {
        value = this.dateTimeAdapter.deserialize(value);
        this._selected = this.getValidDate(value);
    }

    @Input()
    get selecteds(): T[] {
        return this._selecteds;
    }
    /**
     * Нужно ли скрывать даты соседних месяцев в начале или конце текущего месяца
     * */
    @Input()
    hideOtherMonths: boolean;

    get periodButtonText(): string {
        return this.isMonthView
            ? this.dateTimeAdapter.format(
                this.pickerDateTime,
                this.dateTimeFormats.monthYearLabel
            )
            : this.dateTimeAdapter.getYearName(this.pickerDateTime);
    }

    get periodButtonLabel(): string {
        return this.isMonthView
            ? this.pickerIntl.switchToMultiYearViewLabel
            : this.pickerIntl.switchToMonthViewLabel;
    }

    get prevButtonLabel(): string {
        if (this._currentView === DateView.MONTH) {
            return this.pickerIntl.prevMonthLabel;
        } else if (this._currentView === DateView.YEAR) {
            return this.pickerIntl.prevYearLabel;
        } else {
            return null;
        }
    }

    get nextButtonLabel(): string {
        if (this._currentView === DateView.MONTH) {
            return this.pickerIntl.nextMonthLabel;
        } else if (this._currentView === DateView.YEAR) {
            return this.pickerIntl.nextYearLabel;
        } else {
            return null;
        }
    }

    get currentView(): DateViewType {
        return this._currentView;
    }

    set currentView(view: DateViewType) {
        this._currentView = view;
        this.moveFocusOnNextTick = true;
    }

    get isInSingleMode(): boolean {
        return this.selectMode === 'single';
    }

    get isInRangeMode(): boolean {
        return (
            this.selectMode === 'range' ||
            this.selectMode === 'rangeFrom' ||
            this.selectMode === 'rangeTo'
        );
    }

    get showControlArrows(): boolean {
        return this._currentView !== DateView.MULTI_YEARS;
    }

    get isMonthView() {
        return this._currentView === DateView.MONTH;
    }
    /** Событие изменения отображаемых даты и времени */
    @Output()
    pickerDateTimeChange = new EventEmitter<T>();
    /** Событие изменения выбранной даты */
    @Output()
    readonly dateClicked = new EventEmitter<T>();
    /** Событие изменения текущей выбранной даты */
    @Output()
    readonly selectedChange = new EventEmitter<T>();
    /** Событие выбора любой даты */
    @Output()
    readonly userSelection = new EventEmitter<void>();
    /**
     * Передаёт выбранный год, не изменяя выбранную дату
     * */
    @Output()
    readonly yearSelected = new EventEmitter<T>();
    /**
     * Передаёт выбранный месяц, не изменяя выбранную дату
     * */
    @Output()
    readonly monthSelected = new EventEmitter<T>();
    private readonly injector = inject(Injector);

    @Input()
    selectMode: SelectMode;
    private readonly destroyRef = inject(DestroyRef);

    private _selecteds: T[] = [];
    private focusRef: AfterRenderRef | undefined;
    /** Минимальная доступная для выбора дата */
    private _minDate: T | null;
    /** Максимальная доступная для выбора дата */
    private _maxDate: T | null;
    /** Дата и время, отображаемые в компоненте выбора */
    private _pickerDateTime: T;
    /** Текущие выбранные дата и время */
    private _selected: T | null;
    /**
     * Откладывает перевод фокуса на активную ячейку до следующего обновления представления
     * Перевод фокуса откладывается, чтобы дождаться, пока Angular
     * обновит дочерние элементы представления
     */
    private moveFocusOnNextTick = false;

    constructor(
        private elmRef: ElementRef<HTMLElement>,
        private pickerIntl: OwlDateTimeIntl,
        private ngZone: NgZone,
        private cdRef: ChangeDetectorRef,
        @Optional() private dateTimeAdapter: DateTimeAdapter<T>,
        @Optional()
        @Inject(OWL_DATE_TIME_FORMATS)
        private dateTimeFormats: OwlDateTimeFormats
    ) {
        this.intlChangesSub = this.pickerIntl.changes.subscribe(() => {
            this.cdRef.markForCheck();
        });
    }

    set minDate(value: T | null) {
        value = this.dateTimeAdapter.deserialize(value);
        value = this.getValidDate(value);

        this._minDate = value != null
            ? this.dateTimeAdapter.createDate(
                this.dateTimeAdapter.getYear(value),
                this.dateTimeAdapter.getMonth(value),
                this.dateTimeAdapter.getDate(value)
            )
            : null;
    }

    set maxDate(value: T | null) {
        value = this.dateTimeAdapter.deserialize(value);
        value = this.getValidDate(value);

        this._maxDate = value != null
            ? this.dateTimeAdapter.createDate(
                this.dateTimeAdapter.getYear(value),
                this.dateTimeAdapter.getMonth(value),
                this.dateTimeAdapter.getDate(value)
            )
            : null;
    }

    set pickerDateTime(value: T) {
        value = this.dateTimeAdapter.deserialize(value);
        this._pickerDateTime =
            this.getValidDate(value) ?? this.dateTimeAdapter.now();
    }

    set selecteds(values: T[]) {
        this._selecteds = (values ?? []).map(v => {
            v = this.dateTimeAdapter.deserialize(v);
            return this.getValidDate(v);
        });
    }

    private _currentView: DateViewType;

    private intlChangesSub = Subscription.EMPTY;

    /**
     * Добавляет класс 'owl-dt-calendar' к элементу компонента
     * */
    get owlDTCalendarClass(): boolean {
        return true;
    }

    /**
     * Фильтр дат для представлений месяца и года
     */
    public dateFilterForViews = (date: T) => {
        return (
            date != null &&
            (!this.dateFilter || this.dateFilter(date)) &&
            (this.minDate == null ||
                this.dateTimeAdapter.compare(date, this.minDate) >= 0) &&
            (this.maxDate == null ||
                this.dateTimeAdapter.compare(date, this.maxDate) <= 0)
        );
    };

    public ngOnInit() {
    }

    public ngAfterContentInit(): void {
        this._currentView = this.startView;
    }

    public ngAfterViewChecked() {
        if (this.moveFocusOnNextTick) {
            this.moveFocusOnNextTick = false;
            this.focusActiveCell();
        }
    }

    public ngOnDestroy(): void {
        this.intlChangesSub.unsubscribe();
    }

    /**
     * Переключает представления месяца и года
     */
    public toggleViews(): void {
        let nextView = null;
        if (this._currentView === DateView.MONTH) {
            nextView = DateView.MULTI_YEARS;
        } else {
            if (this.multiyearOnly) {
                nextView = DateView.MULTI_YEARS;
            } else if (this.yearOnly) {
                nextView = this._currentView === DateView.YEAR ? DateView.MULTI_YEARS : DateView.YEAR;
            } else {
                nextView = DateView.MONTH;
            }
        }
        this.currentView = nextView;
    }

    /**
     * Обрабатывает нажатие кнопки перехода к предыдущему периоду
     * */
    public previousClicked(): void {
        this.pickerDateTime = this.isMonthView
            ? this.dateTimeAdapter.addCalendarMonths(this.pickerDateTime, -1)
            : this.dateTimeAdapter.addCalendarYears(this.pickerDateTime, -1);

        this.pickerDateTimeChange.emit(this.pickerDateTime);
    }

    /**
     * Обрабатывает нажатие кнопки перехода к следующему периоду
     * */
    public nextClicked(): void {
        this.pickerDateTime = this.isMonthView
            ? this.dateTimeAdapter.addCalendarMonths(this.pickerDateTime, 1)
            : this.dateTimeAdapter.addCalendarYears(this.pickerDateTime, 1);

        this.pickerDateTimeChange.emit(this.pickerDateTime);
    }

    public dateSelected(date: T): void {
        if (!this.dateFilterForViews(date)) {
            return;
        }

        this.dateClicked.emit(date);
        this.selectedChange.emit(date);

        /*if ((this.isInSingleMode && !this.dateTimeAdapter.isSameDay(date, this.selected)) ||
            this.isInRangeMode) {
            this.selectedChange.emit(date);
        }*/
    }

    /**
     * Меняет отображаемую дату и переключается на указанное представление
     */
    public goToDateInView(
        date: T,
        view: DateViewType
    ): void {
        this.handlePickerDateTimeChange(date);
        if ((!this.yearOnly && !this.multiyearOnly) ||
            (this.multiyearOnly && (view !== DateView.MONTH && view !== DateView.YEAR)) ||
            (this.yearOnly && view !== DateView.MONTH)) {
            this.currentView = view;
        } else {
            this.dateSelected(date);
        }
        return;
    }

    /**
     * Меняет отображаемую дату
     */
    public handlePickerDateTimeChange(date: T): void {
        this.pickerDateTime = this.dateTimeAdapter.clampDate(
            date,
            this.minDate,
            this.maxDate
        );
        this.pickerDateTimeChange.emit(this.pickerDateTime);
        return;
    }

    public userSelected(): void {
        this.userSelection.emit();
    }

    /**
     * Доступна ли кнопка перехода к предыдущему периоду
     */
    public prevButtonEnabled(): boolean {
        return (
            this.minDate == null || !this.isSameView(this.pickerDateTime, this.minDate)
        );
    }

    /**
     * Доступна ли кнопка перехода к следующему периоду
     */
    public nextButtonEnabled(): boolean {
        return (
            this.maxDate == null || !this.isSameView(this.pickerDateTime, this.maxDate)
        );
    }

    /**
     * Переводит фокус на элемент компонента
     * */
    public focusActiveCell() {
        if (this.destroyRef.destroyed) {
            return;
        }

        this.focusRef?.destroy();
        this.focusRef = afterNextRender({
            write: () => {
                this.focusRef = undefined;
                this.elmRef.nativeElement.querySelector<HTMLElement>('.owl-dt-calendar-cell-active')
                    ?.focus();
            }
        }, { injector: this.injector });
    }

    public selectYearInMultiYearView(normalizedYear: T): void {
        this.yearSelected.emit(normalizedYear);
    }

    public selectMonthInYearView(normalizedMonth: T): void {
        this.monthSelected.emit(normalizedMonth);
    }

    /**
     * Соответствуют ли две даты одному представлению в текущем режиме (месяц или год)
     */
    private isSameView(date1: T, date2: T): boolean {
        if (this._currentView === DateView.MONTH) {
            return !!(
                date1 != null &&
                date2 != null &&
                this.dateTimeAdapter.getYear(date1) ===
                this.dateTimeAdapter.getYear(date2) &&
                this.dateTimeAdapter.getMonth(date1) ===
                this.dateTimeAdapter.getMonth(date2)
            );
        } else if (this._currentView === DateView.YEAR) {
            return !!(
                date1 != null &&
                date2 != null &&
                this.dateTimeAdapter.getYear(date1) ===
                this.dateTimeAdapter.getYear(date2)
            );
        } else {
            return false;
        }
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
