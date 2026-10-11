/**
 * calendar-body.component
 */

import { afterNextRender, AfterRenderRef, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, EventEmitter, inject, Injector, Input, NgZone, OnInit, Output } from '@angular/core';
import { SelectMode } from './date-time.class';

export class CalendarCell {
    constructor(
        public value: number,
        public displayValue: string,
        public ariaLabel: string,
        public enabled: boolean,
        public out: boolean = false,
        public cellClass: string = ''
    ) {}
}

@Component({
    selector: '[owl-date-time-calendar-body]',
    exportAs: 'owlDateTimeCalendarBody',
    templateUrl: './calendar-body.component.html',
    styleUrls: ['./calendar-body.component.scss'],
    host: {
        '[class.owl-dt-calendar-body]': 'owlDTCalendarBodyClass'
    },
    preserveWhitespaces: false,
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OwlCalendarBodyComponent implements OnInit {
    /**
     * Номер активной ячейки в таблице
     */
    @Input()
    activeCell = 0;
    /**
     * Ячейки, отображаемые в таблице
     * */
    @Input()
    rows: CalendarCell[][];
    /**
     * Количество столбцов в таблице
     * */
    @Input()
    numCols = 7;
    /**
     * Соотношение ширины и высоты ячеек таблицы
     */
    @Input()
    cellRatio = 1;
    /**
     * Значение в таблице, соответствующее сегодняшней дате
     * */
    @Input()
    todayValue: number;
    /**
     * Выбранное значение в таблице
     * */
    @Input()
    selectedValues: number[] = [];
    /**
     * Текущий режим выбора даты
     */
    @Input()
    selectMode: SelectMode;
    /**
     * Событие выбора ячейки календаря
     * */
    @Output()
    public readonly select = new EventEmitter<CalendarCell>();
    private readonly injector = inject(Injector);
    private readonly destroyRef = inject(DestroyRef);
    private focusRef: AfterRenderRef | undefined;

    get owlDTCalendarBodyClass(): boolean {
        return true;
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

    constructor(private elmRef: ElementRef<HTMLElement>, private ngZone: NgZone) {
    }

    public ngOnInit() {}

    public selectCell(cell: CalendarCell): void {
        if (cell.enabled) {
            this.select.emit(cell);
        }
    }

    public isActiveCell(rowIndex: number, colIndex: number): boolean {
        const cellNumber = rowIndex * this.numCols + colIndex;
        return cellNumber === this.activeCell;
    }

    /**
     * Проверяет, выбрана ли ячейка
     */
    public isSelected(value: number): boolean {
        if (!this.selectedValues || this.selectedValues.length === 0) {
            return false;
        }

        if (this.isInSingleMode) {
            return value === this.selectedValues[0];
        }

        if (this.isInRangeMode) {
            const fromValue = this.selectedValues?.[0];
            const toValue = this.selectedValues?.[1];

            return value === fromValue || value === toValue;
        }
    }

    /**
     * Проверяет, входит ли ячейка в диапазон
     * */
    public isInRange(value: number): boolean {
        if (this.isInRangeMode) {
            const fromValue = this.selectedValues?.[0];
            const toValue = this.selectedValues?.[1];

            if (fromValue != null && toValue != null) {
                return value >= fromValue && value <= toValue;
            } else {
                return value === fromValue || value === toValue;
            }
        }
    }

    /**
     * Проверяет, соответствует ли ячейка началу диапазона
     * */
    public isRangeFrom(value: number): boolean {
        if (this.isInRangeMode) {
            const fromValue = this.selectedValues?.[0];
            return fromValue != null && value === fromValue;
        }
    }

    /**
     * Проверяет, соответствует ли ячейка концу диапазона
     * */
    public isRangeTo(value: number): boolean {
        if (this.isInRangeMode) {
            const toValue = this.selectedValues?.[1];
            return toValue != null && value === toValue;
        }
    }

    /**
     * Переводит фокус на активную ячейку
     * */
    public focusActiveCell(): void {
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
}
