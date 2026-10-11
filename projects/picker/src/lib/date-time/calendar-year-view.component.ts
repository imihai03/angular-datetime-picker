/**
 * calendar-year-view.component
 */

import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Optional, Output, ViewChild } from '@angular/core';
import { CalendarCell, OwlCalendarBodyComponent } from './calendar-body.component';
import { DateTimeAdapter } from './adapter/date-time-adapter.class';
import { OWL_DATE_TIME_FORMATS, OwlDateTimeFormats } from './adapter/date-time-format.class';
import { Subscription } from 'rxjs';
import { SelectMode } from './date-time.class';
import { DOWN_ARROW, END, ENTER, HOME, LEFT_ARROW, PAGE_DOWN, PAGE_UP, RIGHT_ARROW, UP_ARROW } from '@angular/cdk/keycodes';

const MONTHS_PER_YEAR = 12;
const MONTHS_PER_ROW = 3;

@Component({
    selector: 'owl-date-time-year-view',
    exportAs: 'owlMonthView',
    templateUrl: './calendar-year-view.component.html',
    styleUrls: ['./calendar-year-view.component.scss'],
    host: {
        '[class.owl-dt-calendar-view]': 'owlDTCalendarView'
    },
    standalone: false,
    preserveWhitespaces: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OwlYearViewComponent<T>
    implements OnInit, AfterContentInit, OnDestroy {
    /**
     * Массив номеров месяцев из selectedDates
     * Значение — номер месяца в текущем году
     * */
    public selectedMonths: number[] = [];
    @Input()
    get selectMode(): SelectMode {
        return this._selectMode;
    }

    set selectMode(val: SelectMode) {
        this._selectMode = val;
        if (this.initiated) {
            this.generateMonthList();
            this.cdRef.markForCheck();
        }
    }
    /**
     * Обработчик выбора нового месяца
     * */
    @Output()
    readonly change = new EventEmitter<T>();
    @Input()
    get selected(): T | null {
        return this._selected;
    }

    set selected(value: T | null) {
        value = this.dateTimeAdapter.deserialize(value);
        this._selected = this.getValidDate(value);
        this.setSelectedMonths();
    }

    private _selecteds: T[] = [];
    @Input()
    get selecteds(): T[] {
        return this._selecteds;
    }
    /**
     * Передаёт выбранный год, не изменяя выбранную дату
     * */
    @Output()
    readonly monthSelected = new EventEmitter<T>();

    private _pickerDateTime: T | null;
    @Input()
    get pickerDateTime() {
        return this._pickerDateTime;
    }
    /** Событие активации любой даты */
    @Output()
    readonly pickerDateTimeChange: EventEmitter<T> = new EventEmitter<T>();
    /** Событие выбора ячейки календаря клавишей Enter */
    @Output()
    readonly keyboardEnter: EventEmitter<any> = new EventEmitter<any>();
    @Input()
    get dateFilter() {
        return this._dateFilter;
    }

    set dateFilter(filter: (date: T) => boolean) {
        this._dateFilter = filter;
        if (this.initiated) {
            this.generateMonthList();
        }
    }
    /** Тело таблицы календаря */
    @ViewChild(OwlCalendarBodyComponent, { static: true })
    calendarBodyElm: OwlCalendarBodyComponent;
    @Input()
    get minDate(): T | null {
        return this._minDate;
    }

    set minDate(value: T | null) {
        value = this.dateTimeAdapter.deserialize(value);
        this._minDate = this.getValidDate(value);
        if (this.initiated) {
            this.generateMonthList();
        }
    }
    /**
     * Режим выбора даты
     * */
    private _selectMode: SelectMode = 'single';
    @Input()
    get maxDate(): T | null {
        return this._maxDate;
    }

    set maxDate(value: T | null) {
        value = this.dateTimeAdapter.deserialize(value);
        this._maxDate = this.getValidDate(value);
        if (this.initiated) {
            this.generateMonthList();
        }
    }
    /** Текущая выбранная дата */
    private _selected: T | null;

    private _months: CalendarCell[][];
    get months() {
        return this._months;
    }
    /**
     * Функция, определяющая доступные для выбора даты
     * */
    private _dateFilter: (date: T) => boolean;

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

    private localeSub: Subscription = Subscription.EMPTY;

    private initiated = false;

    public todayMonth: number | null;
    /** Минимальная доступная для выбора дата */
    private _minDate: T | null;
    /** Максимальная доступная для выбора дата */
    private _maxDate: T | null;
    private monthNames: string[];

    set selecteds(values: T[]) {
        this._selecteds = [];
        for (let i = 0; i < (values?.length ?? 0); i++) {
            const value = this.dateTimeAdapter.deserialize(values[i]);
            this._selecteds.push(this.getValidDate(value));
        }

        this.setSelectedMonths();
    }

    set pickerDateTime(value: T) {
        const oldDateTime = this._pickerDateTime;
        value = this.dateTimeAdapter.deserialize(value);
        this._pickerDateTime =
            this.getValidDate(value) ?? this.dateTimeAdapter.now();

        if (
            !this.hasSameYear(oldDateTime, this._pickerDateTime) &&
            this.initiated
        ) {
            this.generateMonthList();
        }
    }

    get activeCell(): number {
        if (this._pickerDateTime != null) {
            return this.dateTimeAdapter.getMonth(this._pickerDateTime);
        }
    }

    get owlDTCalendarView(): boolean {
        return true;
    }

    constructor(
        private cdRef: ChangeDetectorRef,
        @Optional() private dateTimeAdapter: DateTimeAdapter<T>,
        @Optional()
        @Inject(OWL_DATE_TIME_FORMATS)
        private dateTimeFormats: OwlDateTimeFormats
    ) {
        this.monthNames = this.dateTimeAdapter.getMonthNames('short');
    }

    public ngOnInit() {
        this.localeSub = this.dateTimeAdapter.localeChanges.subscribe(() => {
            this.monthNames = this.dateTimeAdapter.getMonthNames('short');
            this.generateMonthList();
            this.cdRef.markForCheck();
        });
    }

    public ngAfterContentInit(): void {
        this.generateMonthList();
        this.initiated = true;
    }

    public ngOnDestroy(): void {
        this.localeSub.unsubscribe();
    }

    /**
     * Обрабатывает выбор ячейки календаря
     */
    public selectCalendarCell(cell: CalendarCell): void {
        if (cell.enabled) {
            this.selectMonth(cell.value);
        }
    }

    /**
     * Обрабатывает keydown в таблице календаря
     */
    public handleCalendarKeydown(event: KeyboardEvent): void {
        let dateTime;
        switch (event.keyCode) {
            // На один месяц назад
            case LEFT_ARROW:
                dateTime = this.dateTimeAdapter.addCalendarMonths(
                    this.pickerDateTime,
                    -1
                );
                this.pickerDateTimeChange.emit(dateTime);
                break;

            // На один месяц вперёд
            case RIGHT_ARROW:
                dateTime = this.dateTimeAdapter.addCalendarMonths(
                    this.pickerDateTime,
                    1
                );
                this.pickerDateTimeChange.emit(dateTime);
                break;

            // На три месяца назад
            case UP_ARROW:
                dateTime = this.dateTimeAdapter.addCalendarMonths(
                    this.pickerDateTime,
                    -3
                );
                this.pickerDateTimeChange.emit(dateTime);
                break;

            // На три месяца вперёд
            case DOWN_ARROW:
                dateTime = this.dateTimeAdapter.addCalendarMonths(
                    this.pickerDateTime,
                    3
                );
                this.pickerDateTimeChange.emit(dateTime);
                break;

            // К первому месяцу текущего года
            case HOME:
                dateTime = this.dateTimeAdapter.addCalendarMonths(
                    this.pickerDateTime,
                    -this.dateTimeAdapter.getMonth(this.pickerDateTime)
                );
                this.pickerDateTimeChange.emit(dateTime);
                break;

            // К последнему месяцу текущего года
            case END:
                dateTime = this.dateTimeAdapter.addCalendarMonths(
                    this.pickerDateTime,
                    11 - this.dateTimeAdapter.getMonth(this.pickerDateTime)
                );
                this.pickerDateTimeChange.emit(dateTime);
                break;

            // На один год (или десять лет) назад
            case PAGE_UP:
                dateTime = this.dateTimeAdapter.addCalendarYears(
                    this.pickerDateTime,
                    event.altKey ? -10 : -1
                );
                this.pickerDateTimeChange.emit(dateTime);
                break;

            // На один год (или десять лет) вперёд
            case PAGE_DOWN:
                dateTime = this.dateTimeAdapter.addCalendarYears(
                    this.pickerDateTime,
                    event.altKey ? 10 : 1
                );
                this.pickerDateTimeChange.emit(dateTime);
                break;

            // Выбирает текущий месяц
            case ENTER:
                if (this.isMonthEnabled(this.dateTimeAdapter.getMonth(this.pickerDateTime))) {
                    this.selectMonth(this.dateTimeAdapter.getMonth(this.pickerDateTime));
                    this.keyboardEnter.emit();
                }
                break;
            default:
                return;
        }

        this.focusActiveCell();
        event.preventDefault();
    }

    /**
     * Обрабатывает выбор нового месяца
     */
    private selectMonth(month: number): void {
        const firstDateOfMonth = this.dateTimeAdapter.createDate(
            this.dateTimeAdapter.getYear(this.pickerDateTime),
            month,
            1
        );

        this.monthSelected.emit(firstDateOfMonth);

        const daysInMonth = this.dateTimeAdapter.getNumDaysInMonth(
            firstDateOfMonth
        );
        const result = this.dateTimeAdapter.createDate(
            this.dateTimeAdapter.getYear(this.pickerDateTime),
            month,
            Math.min(
                daysInMonth,
                this.dateTimeAdapter.getDate(this.pickerDateTime)
            ),
            this.dateTimeAdapter.getHours(this.pickerDateTime),
            this.dateTimeAdapter.getMinutes(this.pickerDateTime),
            this.dateTimeAdapter.getSeconds(this.pickerDateTime)
        );

        this.change.emit(result);
    }

    /**
     * Создаёт список месяцев календаря
     * */
    private generateMonthList(): void {
        if (this.pickerDateTime == null) {
            return;
        }

        this.setSelectedMonths();
        this.todayMonth = this.getMonthInCurrentYear(
            this.dateTimeAdapter.now()
        );

        this._months = [];
        for (let i = 0; i < MONTHS_PER_YEAR / MONTHS_PER_ROW; i++) {
            const row = [];

            for (let j = 0; j < MONTHS_PER_ROW; j++) {
                const month = j + i * MONTHS_PER_ROW + this.dateTimeAdapter.firstMonthOfTheYear;
                const monthCell = this.createMonthCell(month);
                row.push(monthCell);
            }

            this._months.push(row);
        }

        return;
    }

    /**
     * Создаёт CalendarCell для указанного месяца
     */
    private createMonthCell(month: number): CalendarCell {
        const startDateOfMonth = this.dateTimeAdapter.createDate(
            this.dateTimeAdapter.getYear(this.pickerDateTime),
            month,
            1
        );
        const ariaLabel = this.dateTimeAdapter.format(
            startDateOfMonth,
            this.dateTimeFormats.monthYearA11yLabel
        );
        const cellClass = 'owl-dt-month-' + month;
        return new CalendarCell(
            month,
            this.monthNames[month-this.dateTimeAdapter.firstMonthOfTheYear],
            ariaLabel,
            this.isMonthEnabled(month),
            false,
            cellClass
        );
    }

    /**
     * Проверяет доступность указанного месяца для выбора
     */
    private isMonthEnabled(month: number): boolean {
        const firstDateOfMonth = this.dateTimeAdapter.createDate(
            this.dateTimeAdapter.getYear(this.pickerDateTime),
            month,
            1
        );

        // Если в месяце доступна для выбора хотя бы одна дата,
        // считаем месяц доступным для выбора
        for (
            let date = firstDateOfMonth;
            this.dateTimeAdapter.getMonth(date) === month;
            date = this.dateTimeAdapter.addCalendarDays(date, 1)
        ) {
            if (
                date != null &&
                (!this.dateFilter || this.dateFilter(date)) &&
                (this.minDate == null ||
                    this.dateTimeAdapter.compare(date, this.minDate) >= 0) &&
                (this.maxDate == null ||
                    this.dateTimeAdapter.compare(date, this.maxDate) <= 0)
            ) {
                return true;
            }
        }

        return false;
    }

    /**
     * Возвращает месяц указанной даты в текущем году
     * Возвращает null, если указанная дата находится в другом году
     */
    private getMonthInCurrentYear(date: T | null): number {
        if (this.getValidDate(date) != null && this.getValidDate(this._pickerDateTime) != null) {
            const result = this.dateTimeAdapter.compareYear(
                date,
                this._pickerDateTime
            );

            // < 0: выбранная дата находится в предыдущем году, поэтому возвращаем -1
            // > 0: выбранная дата находится в следующем году, поэтому возвращаем 12
            // 0: оба значения находятся в одном году, поэтому возвращаем номер месяца
            if (result < 0) {
                return -1;
            } else if (result > 0) {
                return 12;
            } else {
                return this.dateTimeAdapter.getMonth(date);
            }
        } else {
            return null;
        }
    }

    /**
     * Задаёт значение selectedMonths
     * В режиме single содержит одно значение — месяц выбранной даты
     * В режиме range содержит два значения: месяц fromValue и месяц toValue
     * */
    private setSelectedMonths(): void {
        this.selectedMonths = [];
        if (this.isInSingleMode && this.selected != null) {
            this.selectedMonths[0] = this.getMonthInCurrentYear(this.selected);
        }

        if (this.isInRangeMode && this.selecteds) {
            this.selectedMonths[0] = this.getMonthInCurrentYear(
                this.selecteds[0]
            );
            this.selectedMonths[1] = this.getMonthInCurrentYear(
                this.selecteds[1]
            );
        }
    }

    /**
     * Проверяет, находятся ли указанные даты в одном году
     */
    private hasSameYear(dateLeft: T, dateRight: T) {
        return !!(
            dateLeft != null &&
            dateRight != null &&
            this.dateTimeAdapter.getYear(dateLeft) ===
                this.dateTimeAdapter.getYear(dateRight)
        );
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

    private focusActiveCell() {
        this.calendarBodyElm.focusActiveCell();
    }
}
