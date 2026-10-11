/**
 * calendar-month-view.component
 */

import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Optional, Output, ViewChild } from '@angular/core';
import { CalendarCell, OwlCalendarBodyComponent } from './calendar-body.component';
import { DateTimeAdapter } from './adapter/date-time-adapter.class';
import { OWL_DATE_TIME_FORMATS, OwlDateTimeFormats } from './adapter/date-time-format.class';
import { Subscription } from 'rxjs';
import { SelectMode } from './date-time.class';
import { DOWN_ARROW, END, ENTER, HOME, LEFT_ARROW, PAGE_DOWN, PAGE_UP, RIGHT_ARROW, UP_ARROW } from '@angular/cdk/keycodes';
import { getLocaleFirstDayOfWeek } from '@angular/common';

const DAYS_PER_WEEK = 7;
const WEEKS_PER_VIEW = 6;

@Component({
    selector: 'owl-date-time-month-view',
    exportAs: 'owlYearView',
    templateUrl: './calendar-month-view.component.html',
    styleUrls: ['./calendar-month-view.component.scss'],
    standalone: false,
    host: {
        '[class.owl-dt-calendar-view]': 'owlDTCalendarView'
    },
    preserveWhitespaces: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OwlMonthViewComponent<T>
    implements OnInit, AfterContentInit, OnDestroy {
    /**
     * Нужно ли скрывать даты соседних месяцев в начале или конце текущего месяца
     * */
    @Input()
    hideOtherMonths = false;

    /**
     * Нужно ли показывать номера недель в календаре
     * */
    @Input()
    showCalendarWeeks = false;

    private isDefaultFirstDayOfWeek = true;
    /**
     * Число месяца, соответствующее сегодняшней дате
     * */
    public todayDate: number | null;

    @Input()
    get firstDayOfWeek(): number {
        return this._firstDayOfWeek;
    }

    set firstDayOfWeek(val: number) {
        if (val >= 0 && val <= 6 && val !== this._firstDayOfWeek) {
            this._firstDayOfWeek = val;
            this.isDefaultFirstDayOfWeek = false;

            if (this.initiated) {
                this.generateWeekDays();
                this.generateCalendar();
                this.cdRef.markForCheck();
            }
        }
    }
    /**
     * Номера дней недели
     * */
    public weekNumbers: number[];
    @Input()
    get selectMode(): SelectMode {
        return this._selectMode;
    }

    set selectMode(val: SelectMode) {
        this._selectMode = val;
        if (this.initiated) {
            this.generateCalendar();
            this.cdRef.markForCheck();
        }
    }
    /**
     * Массив значений selectedDates
     * Значение — номер дня в текущем месяце
     * */
    public selectedDates: number[] = [];
    @Input()
    get selected(): T | null {
        return this._selected;
    }

    set selected(value: T | null) {
        const oldSelected = this._selected;
        value = this.dateTimeAdapter.deserialize(value);
        this._selected = this.getValidDate(value);

        if (!this.dateTimeAdapter.isSameDay(oldSelected, this._selected)) {
            this.setSelectedDates();
        }
    }

    private _selecteds: T[] = [];
    @Input()
    get selecteds(): T[] {
        return this._selecteds;
    }
    // Индекс ячейки с первым днём месяца
    public firstRowOffset: number;

    private _pickerDateTime: T;
    @Input()
    get pickerDateTime() {
        return this._pickerDateTime;
    }
    /**
     * Обработчик выбора новой даты
     * */
    @Output()
    readonly selectedChange = new EventEmitter<T | null>();
    /**
     * Обработчик выбора любой даты
     * */
    @Output()
    readonly userSelection = new EventEmitter<void>();
    @Input()
    get dateFilter() {
        return this._dateFilter;
    }

    set dateFilter(filter: (date: T) => boolean) {
        this._dateFilter = filter;
        if (this.initiated) {
            this.generateCalendar();
            this.cdRef.markForCheck();
        }
    }
    /** Событие активации любой даты */
    @Output()
    readonly pickerDateTimeChange: EventEmitter<T> = new EventEmitter<T>();
    @Input()
    get minDate(): T | null {
        return this._minDate;
    }

    set minDate(value: T | null) {
        value = this.dateTimeAdapter.deserialize(value);
        this._minDate = this.getValidDate(value);
        if (this.initiated) {
            this.generateCalendar();
            this.cdRef.markForCheck();
        }
    }
    /** Тело таблицы календаря */
    @ViewChild(OwlCalendarBodyComponent, { static: true })
    calendarBodyElm: OwlCalendarBodyComponent;
    @Input()
    get maxDate(): T | null {
        return this._maxDate;
    }

    set maxDate(value: T | null) {
        value = this.dateTimeAdapter.deserialize(value);
        this._maxDate = this.getValidDate(value);

        if (this.initiated) {
            this.generateCalendar();
            this.cdRef.markForCheck();
        }
    }

    private _weekdays: Array<{ long: string; short: string; narrow: string }>;
    get weekdays() {
        return this._weekdays;
    }

    private _days: CalendarCell[][];
    get days() {
        return this._days;
    }
    /**
     * Задаёт первый день недели
     * Воскресенье: 0 — суббота: 6
     * */
    private _firstDayOfWeek: number;

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

    private firstDateOfMonth: T;

    private localeSub: Subscription = Subscription.EMPTY;

    private initiated = false;

    private dateNames: string[];
    /**
     * Режим выбора даты
     * */
    private _selectMode: SelectMode = 'single';
    /** Текущая выбранная дата */
    private _selected: T | null;
    /**
     * Функция, определяющая доступные для выбора даты
     * */
    private _dateFilter: (date: T) => boolean;
    /** Минимальная доступная для выбора дата */
    private _minDate: T | null;
    /** Максимальная доступная для выбора дата */
    private _maxDate: T | null;

    set selecteds(values: T[]) {
        this._selecteds = (values ?? []).map(v => {
            v = this.dateTimeAdapter.deserialize(v);
            return this.getValidDate(v);
        });
        this.setSelectedDates();
    }

    set pickerDateTime(value: T) {
        const oldDateTime = this._pickerDateTime;
        value = this.dateTimeAdapter.deserialize(value);
        this._pickerDateTime =
            this.getValidDate(value) ?? this.dateTimeAdapter.now();

        this.firstDateOfMonth = this.dateTimeAdapter.createDate(
            this.dateTimeAdapter.getYear(this._pickerDateTime),
            this.dateTimeAdapter.getMonth(this._pickerDateTime),
            1
        );

        if (
            !this.isSameMonth(oldDateTime, this._pickerDateTime) &&
            this.initiated
        ) {
            this.generateCalendar();
        }
    }

    get activeCell(): number {
        if (this.pickerDateTime != null) {
            return (
                this.dateTimeAdapter.getDate(this.pickerDateTime) +
                this.firstRowOffset -
                1
            );
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
    ) {}

    public ngOnInit() {
        this.updateFirstDayOfWeek(this.dateTimeAdapter.getLocale());
        this.generateWeekDays();

        this.localeSub = this.dateTimeAdapter.localeChanges.subscribe(
            locale => {
                this.updateFirstDayOfWeek(locale);
                this.generateWeekDays();
                this.generateCalendar();
                this.cdRef.markForCheck();
            }
        );
    }

    public ngAfterContentInit(): void {
        this.generateCalendar();
        this.initiated = true;
    }

    public ngOnDestroy(): void {
        this.localeSub.unsubscribe();
    }

    /**
     * Обрабатывает выбор ячейки календаря
     */
    public selectCalendarCell(cell: CalendarCell): void {
        // Условия, при которых дата не выбирается:
        // 1) Ячейка календаря недоступна для выбора
        // 2) Дата находится вне текущего месяца и включён hideOtherMonths
        if (!cell.enabled || (this.hideOtherMonths && cell.out)) {
            return;
        }

        this.selectDate(cell.value);
    }

    /**
     * Обрабатывает keydown в таблице календаря
     */
    public handleCalendarKeydown(event: KeyboardEvent): void {
        let dateTime;
        switch (event.keyCode) {
            // На один день назад
            case LEFT_ARROW:
                dateTime = this.dateTimeAdapter.addCalendarDays(
                    this.pickerDateTime,
                    -1
                );
                this.pickerDateTimeChange.emit(dateTime);
                break;

            // На один день вперёд
            case RIGHT_ARROW:
                dateTime = this.dateTimeAdapter.addCalendarDays(
                    this.pickerDateTime,
                    1
                );
                this.pickerDateTimeChange.emit(dateTime);
                break;

            // На одну неделю назад
            case UP_ARROW:
                dateTime = this.dateTimeAdapter.addCalendarDays(
                    this.pickerDateTime,
                    -7
                );
                this.pickerDateTimeChange.emit(dateTime);
                break;

            // На одну неделю вперёд
            case DOWN_ARROW:
                dateTime = this.dateTimeAdapter.addCalendarDays(
                    this.pickerDateTime,
                    7
                );
                this.pickerDateTimeChange.emit(dateTime);
                break;

            // К первому дню текущего месяца
            case HOME:
                dateTime = this.dateTimeAdapter.addCalendarDays(
                    this.pickerDateTime,
                    1 - this.dateTimeAdapter.getDate(this.pickerDateTime)
                );
                this.pickerDateTimeChange.emit(dateTime);
                break;

            // К последнему дню текущего месяца
            case END:
                dateTime = this.dateTimeAdapter.addCalendarDays(
                    this.pickerDateTime,
                    this.dateTimeAdapter.getNumDaysInMonth(this.pickerDateTime) -
                        this.dateTimeAdapter.getDate(this.pickerDateTime)
                );
                this.pickerDateTimeChange.emit(dateTime);
                break;

            // На один месяц (или год) назад
            case PAGE_UP:
                dateTime = event.altKey
                    ? this.dateTimeAdapter.addCalendarYears(
                          this.pickerDateTime,
                          -1
                      )
                    : this.dateTimeAdapter.addCalendarMonths(
                          this.pickerDateTime,
                          -1
                      );
                this.pickerDateTimeChange.emit(dateTime);
                break;

            // На один месяц (или год) вперёд
            case PAGE_DOWN:
                dateTime = event.altKey
                    ? this.dateTimeAdapter.addCalendarYears(
                          this.pickerDateTime,
                          1
                      )
                    : this.dateTimeAdapter.addCalendarMonths(
                          this.pickerDateTime,
                          1
                      );
                this.pickerDateTimeChange.emit(dateTime);
                break;

            // Выбирает активную дату
            case ENTER:
                if (this.isDateEnabled(this.dateTimeAdapter.addCalendarDays(
                    this.firstDateOfMonth,
                    this.dateTimeAdapter.getDate(this.pickerDateTime) - 1
                ))) {
                    this.selectDate(
                        this.dateTimeAdapter.getDate(this.pickerDateTime)
                    );
                }
                break;
            default:
                return;
        }

        this.focusActiveCell();
        event.preventDefault();
    }

    public getISOWeek(d: Date): number {
        const clonedDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        // Используем для воскресенья номер дня 7
        clonedDate.setUTCDate(clonedDate.getUTCDate() + 4 - (clonedDate.getUTCDay()||7));
        // Получаем первый день года
        const yearStart = new Date(Date.UTC(clonedDate.getUTCFullYear(),0,1));
        // Вычисляем число полных недель до ближайшего четверга
        const weekNo = Math.ceil(( ( (+clonedDate - +yearStart) / 86400000) + 1)/7);
        return weekNo;
    }

    /**
     * Проверяет, что даты не равны null и находятся в одном месяце
     */
    public isSameMonth(dateLeft: T, dateRight: T): boolean {
        return (
            dateLeft != null &&
            dateRight != null &&
            this.dateTimeAdapter.isValid(dateLeft) &&
            this.dateTimeAdapter.isValid(dateRight) &&
            this.dateTimeAdapter.getYear(dateLeft) ===
                this.dateTimeAdapter.getYear(dateRight) &&
            this.dateTimeAdapter.getMonth(dateLeft) ===
                this.dateTimeAdapter.getMonth(dateRight)
        );
    }

    /**
     * Обрабатывает выбор новой даты
     */
    private selectDate(date: number): void {
        const daysDiff = date - 1;
        const selected = this.dateTimeAdapter.addCalendarDays(
            this.firstDateOfMonth,
            daysDiff
        );

        this.selectedChange.emit(selected);
        this.userSelection.emit();
    }

    /**
     * Создаёт массив дней недели для календаря
     * */
    private generateWeekDays(): void {
        const longWeekdays = this.dateTimeAdapter.getDayOfWeekNames('long');
        const shortWeekdays = this.dateTimeAdapter.getDayOfWeekNames('short');
        const narrowWeekdays = this.dateTimeAdapter.getDayOfWeekNames('narrow');
        const firstDayOfWeek = this.firstDayOfWeek;

        const weekdays = longWeekdays.map((long, i) => {
            return { long, short: shortWeekdays[i], narrow: narrowWeekdays[i] };
        });

        this._weekdays = weekdays
            .slice(firstDayOfWeek-this.dateTimeAdapter.firstDayOfTheWeek)
            .concat(weekdays.slice(0, firstDayOfWeek-this.dateTimeAdapter.firstDayOfTheWeek));

        this.dateNames = this.dateTimeAdapter.getDateNames();

        return;
    }

    private updateFirstDayOfWeek(locale: string): void {
        if (this.isDefaultFirstDayOfWeek) {
            try {
                this._firstDayOfWeek = getLocaleFirstDayOfWeek(locale);
            } catch {
                this._firstDayOfWeek = 0;
            }
        }
    }

    /**
     * Создаёт массив дней календаря
     * */
    private generateCalendar(): void {
        if (this.pickerDateTime == null) {
            return;
        }

        this.todayDate = null;
        this.weekNumbers = [];

        const startWeekdayOfMonth = this.dateTimeAdapter.getDay(
            this.firstDateOfMonth
        );
        const firstDayOfWeek = this.firstDayOfWeek;

        let daysDiff =
                0 -
                ((startWeekdayOfMonth + (DAYS_PER_WEEK - firstDayOfWeek)) %
                    DAYS_PER_WEEK);

        this.firstRowOffset = Math.abs(daysDiff);

        this._days = [];

        for (let i = 0; i < WEEKS_PER_VIEW; i++) {
            const week = [];
            const weekStartDate = this.dateTimeAdapter.addCalendarDays(
                this.firstDateOfMonth,
                daysDiff
            );

            for (let j = 0; j < DAYS_PER_WEEK; j++) {
                const date = this.dateTimeAdapter.addCalendarDays(
                    this.firstDateOfMonth,
                    daysDiff
                );

                const dateCell = this.createDateCell(date, daysDiff);

                if (
                    this.dateTimeAdapter.isSameDay(
                        this.dateTimeAdapter.now(),
                        date
                    )
                ) {
                    this.todayDate = daysDiff + 1;
                }

                week.push(dateCell);
                daysDiff += 1;
            }

            this._days.push(week);

            if (this.showCalendarWeeks) {
                const weekNumber = this.getISOWeekFromDate(weekStartDate);
                this.weekNumbers.push(weekNumber);
            }
        }

        this.setSelectedDates();
    }

    /**
     * Создаёт CalendarCell для дней
     */
    private createDateCell(date: T, daysDiff: number): CalendarCell {
        // Количество дней в месяце
        const daysInMonth = this.dateTimeAdapter.getNumDaysInMonth(
            this.pickerDateTime
        );
        const dateNum = this.dateTimeAdapter.getDate(date);
        // const dateName = this.dateNames[dateNum - 1];
        const dateName = dateNum.toString();
        const ariaLabel = this.dateTimeAdapter.format(
            date,
            this.dateTimeFormats.dateA11yLabel
        );

        // Проверяем доступность даты для выбора
        const enabled = this.isDateEnabled(date);

        // Проверяем, находится ли дата вне текущего месяца
        const dayValue = daysDiff + 1;
        const out = dayValue < 1 || dayValue > daysInMonth;
        const cellClass = 'owl-dt-day-' + this.dateTimeAdapter.getDay(date);

        return new CalendarCell(
            dayValue,
            dateName,
            ariaLabel,
            enabled,
            out,
            cellClass
        );
    }

    /**
     * Проверяет допустимость даты
     */
    private isDateEnabled(date: T): boolean {
        return (
            date != null &&
            (!this.dateFilter || this.dateFilter(date)) &&
            (this.minDate == null ||
                this.dateTimeAdapter.compare(date, this.minDate) >= 0) &&
            (this.maxDate == null ||
                this.dateTimeAdapter.compare(date, this.maxDate) <= 0)
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

    private getISOWeekFromDate(date: T): number {
        const jsDate = new Date(Date.UTC(
            this.dateTimeAdapter.getYear(date),
            this.dateTimeAdapter.getMonth(date),
            this.dateTimeAdapter.getDate(date),
        ));

        jsDate.setUTCDate(
            jsDate.getUTCDate() + 4 - (jsDate.getUTCDay() || 7)
        );

        const yearStart = new Date(Date.UTC(jsDate.getUTCFullYear(), 0, 1));

        return Math.ceil((((+jsDate - +yearStart) / 86400000) + 1) / 7);
    }

    /**
     * Задаёт значение selectedDates
     * В режиме single содержит одно значение — выбранную дату
     * В режиме range содержит два значения: fromValue и toValue
     * */
    private setSelectedDates(): void {
        this.selectedDates = [];

        if (this.firstDateOfMonth == null) {
            return;
        }

        if (this.isInSingleMode && this.selected != null) {
            const dayDiff = this.dateTimeAdapter.differenceInCalendarDays(
                this.selected,
                this.firstDateOfMonth
            );
            this.selectedDates[0] = dayDiff + 1;
            return;
        }

        if (this.isInRangeMode && this.selecteds) {
            this.selectedDates = this.selecteds.map(selected => {
                if (this.dateTimeAdapter.isValid(selected)) {
                    const dayDiff = this.dateTimeAdapter.differenceInCalendarDays(
                        selected,
                        this.firstDateOfMonth
                    );
                    return dayDiff + 1;
                } else {
                    return null;
                }
            });
        }
    }

    private focusActiveCell() {
        this.calendarBodyElm.focusActiveCell();
    }
}
