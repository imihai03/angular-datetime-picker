/**
 * calendar-multi-year-view.component
 */

import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Inject, Input, OnInit, Optional, Output, ViewChild } from '@angular/core';
import { DateTimeAdapter } from './adapter/date-time-adapter.class';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CalendarCell, OwlCalendarBodyComponent } from './calendar-body.component';
import { SelectMode } from './date-time.class';
import { DOWN_ARROW, END, ENTER, HOME, LEFT_ARROW, PAGE_DOWN, PAGE_UP, RIGHT_ARROW, UP_ARROW } from '@angular/cdk/keycodes';
import { OwlDateTimeIntl } from './date-time-picker-intl.service';
import { Options, OptionsTokens } from './options-provider';

@Component({
    selector: 'owl-date-time-multi-year-view',
    templateUrl: './calendar-multi-year-view.component.html',
    styleUrls: ['./calendar-multi-year-view.component.scss'],
    host: {
        '[class.owl-dt-calendar-view]': 'owlDTCalendarView',
        '[class.owl-dt-calendar-multi-year-view]': 'owlDTCalendarMultiYearView'
    },
    standalone: false,
    preserveWhitespaces: false,
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class OwlMultiYearViewComponent<T> implements OnInit, AfterContentInit {

    /**
     * Обработчик выбора нового месяца
     * */
    @Output() readonly change = new EventEmitter<T>();
    @Input()
    get selectMode(): SelectMode {
        return this._selectMode;
    }

    set selectMode( val: SelectMode ) {
        this._selectMode = val;
        if (this.initiated) {
            this.setSelectedYears();
            this.cdRef.markForCheck();
        }
    }
    /**
     * Передаёт выбранный год, не изменяя выбранную дату
     * */
    @Output() readonly yearSelected = new EventEmitter<T>();
    @Input()
    get selected(): T | null {
        return this._selected;
    }

    set selected( value: T | null ) {
        const oldSelected = this._selected;
        value = this.dateTimeAdapter.deserialize(value);
        this._selected = this.getValidDate(value);

        if (!this.dateTimeAdapter.isSameDay(oldSelected, this._selected)) {
            this.setSelectedYears();
        }
    }

    private _selecteds: T[] = [];
    @Input()
    get selecteds(): T[] {
        return this._selecteds;
    }
    /** Событие активации любой даты */
    @Output() readonly pickerDateTimeChange: EventEmitter<T> = new EventEmitter<T>();

    private _pickerDateTime: T | null;
    @Input()
    get pickerDateTime() {
        return this._pickerDateTime;
    }
    /** Событие выбора ячейки календаря клавишей Enter */
    @Output() readonly keyboardEnter: EventEmitter<any> = new EventEmitter<any>();
    /** Тело таблицы календаря */
    @ViewChild(OwlCalendarBodyComponent, { static: true }) calendarBodyElm: OwlCalendarBodyComponent;
    @Input()
    get dateFilter() {
        return this._dateFilter;
    }

    set dateFilter( filter: ( date: T ) => boolean ) {
        this._dateFilter = filter;
        if (this.initiated) {
            this.generateYearList();
        }
    }
    /**
     * Режим выбора даты
     * */
    private _selectMode: SelectMode = 'single';
    @Input()
    get minDate(): T | null {
        return this._minDate;
    }

    set minDate( value: T | null ) {
        value = this.dateTimeAdapter.deserialize(value);
        this._minDate = this.getValidDate(value);
        if (this.initiated) {
            this.generateYearList();
        }
    }
    /** Текущая выбранная дата */
    private _selected: T | null;
    @Input()
    get maxDate(): T | null {
        return this._maxDate;
    }

    set maxDate( value: T | null ) {
        value = this.dateTimeAdapter.deserialize(value);
        this._maxDate = this.getValidDate(value);
        if (this.initiated) {
            this.generateYearList();
        }
    }

    private _todayYear: number;
    get todayYear(): number {
        return this._todayYear;
    }

    private _years: CalendarCell[][];
    get years() {
        return this._years;
    }

    private _selectedYears: number[];
    get selectedYears(): number[] {
        return this._selectedYears;
    }

    private initiated = false;

    get isInSingleMode(): boolean {
        return this.selectMode === 'single';
    }

    get isInRangeMode(): boolean {
        return this.selectMode === 'range' || this.selectMode === 'rangeFrom'
            || this.selectMode === 'rangeTo';
    }
    /**
     * Функция, определяющая доступные для выбора даты
     * */
    private _dateFilter: ( date: T ) => boolean;

    get tableHeader(): string {
        if (this._years && this._years.length > 0) {
            return `${this._years[0][0].displayValue} - ${this._years[this.options.yearRows - 1][this.options.yearsPerRow - 1].displayValue}`;
        }
    }

    get prevButtonLabel(): string {
        return this.pickerIntl.prevMultiYearLabel;
    }

    get nextButtonLabel(): string {
        return this.pickerIntl.nextMultiYearLabel;
    }
    /** Минимальная доступная для выбора дата */
    private _minDate: T | null;
    /** Максимальная доступная для выбора дата */
    private _maxDate: T | null;

    constructor( private cdRef: ChangeDetectorRef,
                 private pickerIntl: OwlDateTimeIntl,
                 @Optional() private dateTimeAdapter: DateTimeAdapter<T>,
        @Inject(OptionsTokens.multiYear) public readonly options: Options['multiYear']
    ) {
        this.pickerIntl.changes.pipe(takeUntilDestroyed())
            .subscribe(() => this.cdRef.markForCheck());
        this.dateTimeAdapter.localeChanges.pipe(takeUntilDestroyed())
            .subscribe(() => {
                this.generateYearList();
                this.cdRef.markForCheck();
            });
    }

    set selecteds( values: T[] ) {
        this._selecteds = (values ?? []).map((v) => {
            v = this.dateTimeAdapter.deserialize(v);
            return this.getValidDate(v);
        });
        this.setSelectedYears();
    }

    set pickerDateTime( value: T ) {
        const oldDateTime = this._pickerDateTime;
        value = this.dateTimeAdapter.deserialize(value);
        this._pickerDateTime = this.getValidDate(value) ?? this.dateTimeAdapter.now();

        if (oldDateTime != null && this._pickerDateTime != null &&
            !this.isSameYearList(oldDateTime, this._pickerDateTime)) {
            this.generateYearList();
        }
    }

    get owlDTCalendarView(): boolean {
        return true;
    }

    get owlDTCalendarMultiYearView(): boolean {
        return true;
    }

    get activeCell(): number {
        if (this._pickerDateTime != null) {
            return this.dateTimeAdapter.getYear(this._pickerDateTime) - this.getYearListStart(this._pickerDateTime);
        }
    }

    public ngOnInit() {
    }

    public ngAfterContentInit(): void {
        this._todayYear = this.dateTimeAdapter.getYear(this.dateTimeAdapter.now());
        this.generateYearList();
        this.initiated = true;
    }

    /**
     * Обрабатывает выбор ячейки календаря
     */
    public selectCalendarCell( cell: CalendarCell ): void {
        if (cell.enabled) {
            this.selectYear(cell.value);
        }
    }

    private selectYear( year: number ): void {
        this.yearSelected.emit(this.dateTimeAdapter.createDate(year, this.dateTimeAdapter.firstMonthOfTheYear, 1));
        const firstDateOfMonth = this.dateTimeAdapter.createDate(
            year,
            this.dateTimeAdapter.getMonth(this.pickerDateTime),
            1
        );
        const daysInMonth = this.dateTimeAdapter.getNumDaysInMonth(firstDateOfMonth);
        const selected = this.dateTimeAdapter.createDate(
            year,
            this.dateTimeAdapter.getMonth(this.pickerDateTime),
            Math.min(daysInMonth, this.dateTimeAdapter.getDate(this.pickerDateTime)),
            this.dateTimeAdapter.getHours(this.pickerDateTime),
            this.dateTimeAdapter.getMinutes(this.pickerDateTime),
            this.dateTimeAdapter.getSeconds(this.pickerDateTime),
        );

        this.change.emit(selected);
    }

    /**
     * Создаёт список предыдущих лет
     * */
    public prevYearList( event: any ): void {
        this._pickerDateTime = this.dateTimeAdapter.addCalendarYears(this.pickerDateTime, -1 * this.options.yearsPerRow * this.options.yearRows);
        this.generateYearList();
        event.preventDefault();
    }

    /**
     * Создаёт список следующих лет
     * */
    public nextYearList( event: any ): void {
        this._pickerDateTime = this.dateTimeAdapter.addCalendarYears(this.pickerDateTime, this.options.yearsPerRow * this.options.yearRows);
        this.generateYearList();
        event.preventDefault();
    }

    public generateYearList(): void {
        if (this._pickerDateTime == null) {
            return;
        }

        this._years = [];

        const pickerDateTimeYear = this.dateTimeAdapter.getYear(this._pickerDateTime);
        const offset = pickerDateTimeYear - this.getYearListStart(this._pickerDateTime);

        for (let i = 0; i < this.options.yearRows; i++) {
            const row = [];

            for (let j = 0; j < this.options.yearsPerRow; j++) {
                const year = pickerDateTimeYear - offset + (j + i * this.options.yearsPerRow);
                const yearCell = this.createYearCell(year);
                row.push(yearCell);
            }

            this._years.push(row);
        }

        return;

    }

    /** Доступна ли кнопка перехода к предыдущему периоду */
    public previousEnabled(): boolean {
        return this.minDate == null || this.getYearListStart(this._pickerDateTime) >
            this.getYearListStart(this.minDate);
    }

    /** Доступна ли кнопка перехода к следующему периоду */
    public nextEnabled(): boolean {
        return this.maxDate == null || this.getYearListStart(this._pickerDateTime) <
            this.getYearListStart(this.maxDate);
    }

    public handleCalendarKeydown( event: KeyboardEvent ): void {
        let dateTime;
        switch (event.keyCode) {
            // На один год назад
            case LEFT_ARROW:
                dateTime = this.dateTimeAdapter.addCalendarYears(this._pickerDateTime, -1);
                this.pickerDateTimeChange.emit(dateTime);
                break;

            // На один год вперёд
            case RIGHT_ARROW:
                dateTime = this.dateTimeAdapter.addCalendarYears(this._pickerDateTime, 1);
                this.pickerDateTimeChange.emit(dateTime);
                break;

            // На три года назад
            case UP_ARROW:
                dateTime = this.dateTimeAdapter.addCalendarYears(this._pickerDateTime, -1 * this.options.yearsPerRow);
                this.pickerDateTimeChange.emit(dateTime);
                break;

            // На три года вперёд
            case DOWN_ARROW:
                dateTime = this.dateTimeAdapter.addCalendarYears(this._pickerDateTime, this.options.yearsPerRow);
                this.pickerDateTimeChange.emit(dateTime);
                break;

            // К первому году на текущей странице
            case HOME:
                dateTime = this.dateTimeAdapter.addCalendarYears(this._pickerDateTime,
                    -this.activeCell
                );
                this.pickerDateTimeChange.emit(dateTime);
                break;

            // К последнему году на текущей странице
            case END:
                dateTime = this.dateTimeAdapter.addCalendarYears(this._pickerDateTime,
                    (this.options.yearsPerRow * this.options.yearRows) - this.activeCell - 1
                );
                this.pickerDateTimeChange.emit(dateTime);
                break;

            // На одну страницу лет (или десять страниц) назад
            case PAGE_UP:
                dateTime = this.dateTimeAdapter.addCalendarYears(this.pickerDateTime, event.altKey ? -10 * (this.options.yearsPerRow * this.options.yearRows) : -1 * (this.options.yearsPerRow * this.options.yearRows));
                this.pickerDateTimeChange.emit(dateTime);
                break;

            // На одну страницу лет (или десять страниц) вперёд
            case PAGE_DOWN:
                dateTime = this.dateTimeAdapter.addCalendarYears(this.pickerDateTime, event.altKey ? 10 * (this.options.yearsPerRow * this.options.yearRows) : (this.options.yearsPerRow * this.options.yearRows));
                this.pickerDateTimeChange.emit(dateTime);
                break;

            case ENTER:
                if (this.isYearEnabled(this.dateTimeAdapter.getYear(this._pickerDateTime))) {
                    this.selectYear(this.dateTimeAdapter.getYear(this._pickerDateTime));
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
     * Создаёт CalendarCell для указанного года
     */
    private createYearCell( year: number ): CalendarCell {
        const startDateOfYear = this.dateTimeAdapter.createDate(year, this.dateTimeAdapter.firstMonthOfTheYear, 1);
        const ariaLabel = this.dateTimeAdapter.getYearName(startDateOfYear);
        const cellClass = 'owl-dt-year-' + year;
        return new CalendarCell(year, year.toString(), ariaLabel, this.isYearEnabled(year), false, cellClass);
    }

    private setSelectedYears(): void {

        this._selectedYears = [];

        if (this.isInSingleMode && this.selected != null) {
            this._selectedYears[0] = this.dateTimeAdapter.getYear(this.selected);
        }

        if (this.isInRangeMode && this.selecteds) {
            this._selectedYears = this.selecteds.map(( selected ) => {
                if (this.dateTimeAdapter.isValid(selected)) {
                    return this.dateTimeAdapter.getYear(selected);
                } else {
                    return null;
                }
            });
        }
    }

    /** Доступен ли указанный год для выбора */
    private isYearEnabled( year: number ) {
        // Отключаем выбор года, если он позже maxDate или раньше minDate
        if (year === undefined || year === null ||
            (this.maxDate != null && year > this.dateTimeAdapter.getYear(this.maxDate)) ||
            (this.minDate != null && year < this.dateTimeAdapter.getYear(this.minDate))) {
            return false;
        }

        // Разрешаем выбор, если проверки пройдены и фильтр не задан
        if (!this.dateFilter) {
            return true;
        }

        const firstOfYear = this.dateTimeAdapter.createDate(year, this.dateTimeAdapter.firstMonthOfTheYear, 1);

        // Считаем год доступным для выбора, если доступна хотя бы одна дата в нём
        for (let date = firstOfYear; this.dateTimeAdapter.getYear(date) === year;
             date = this.dateTimeAdapter.addCalendarDays(date, 1)) {
            if (this.dateFilter(date) &&
                (this.minDate == null || this.dateTimeAdapter.compare(date, this.minDate) >= 0) &&
                (this.maxDate == null || this.dateTimeAdapter.compare(date, this.maxDate) <= 0)) {
                return true;
            }
        }

        return false;
    }

    private isSameYearList( date1: T, date2: T ): boolean {
        return this.getYearListStart(date1) === this.getYearListStart(date2);
    }

    private getYearListStart(date: T): number {
        const yearsPerPage = this.options.yearsPerRow * this.options.yearRows;
        return Math.floor(this.dateTimeAdapter.getYear(date) / yearsPerPage) * yearsPerPage;
    }

    /**
     * Возвращает корректный объект даты
     */
    private getValidDate( obj: any ): T | null {
        return (this.dateTimeAdapter.isDateInstance(obj) && this.dateTimeAdapter.isValid(obj)) ? obj : null;
    }

    private focusActiveCell() {
        this.calendarBodyElm.focusActiveCell();
    }
}
