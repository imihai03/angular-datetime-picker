/**
 * calendar-body.component.spec
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalendarCell, OwlCalendarBodyComponent } from './calendar-body.component';
import { ChangeDetectionStrategy, Component, provideZoneChangeDetection } from '@angular/core';
import { CommonModule } from '@angular/common';
import { By } from '@angular/platform-browser';

describe('Компонент OwlCalendarBodyComponent', () => {
    beforeEach((() => {
        TestBed.configureTestingModule({
            imports: [CommonModule],
            providers: [provideZoneChangeDetection()],
            declarations: [
                OwlCalendarBodyComponent,

                // Тестовые компоненты
                StandardCalendarBodyComponent,
            ],
        }).compileComponents();
    }));

    describe('Стандартный CalendarBodyComponent', () => {
        let fixture: ComponentFixture<StandardCalendarBodyComponent>;
        let testComponent: StandardCalendarBodyComponent;
        let calendarBodyNativeElement: Element;
        let rowEls: NodeListOf<Element>;
        let cellEls: NodeListOf<Element>;

        const refreshElementLists = () => {
            rowEls = calendarBodyNativeElement.querySelectorAll('tr');
            cellEls = calendarBodyNativeElement.querySelectorAll('.owl-dt-calendar-cell');
        };

        beforeEach(() => {
            fixture = TestBed.createComponent(StandardCalendarBodyComponent);
            fixture.detectChanges();

            const calendarBodyDebugElement = fixture.debugElement.query(By.directive(OwlCalendarBodyComponent));
            calendarBodyNativeElement = calendarBodyDebugElement.nativeElement;
            testComponent = fixture.componentInstance;

            refreshElementLists();
        });

        it('создаёт тело календаря', () => {
            expect(rowEls.length).toBe(2);
            expect(cellEls.length).toBe(14);
        });

        it('выделяет сегодняшний день', () => {
            const todayCell = calendarBodyNativeElement.querySelector('.owl-dt-calendar-cell-today');
            expect(todayCell).not.toBeNull();
            expect(todayCell.innerHTML.trim()).toBe('3');
        });

        it('выделяет выбранную дату', () => {
            const selectedCell = calendarBodyNativeElement.querySelector('.owl-dt-calendar-cell-selected');
            expect(selectedCell).not.toBeNull();
            expect(selectedCell.innerHTML.trim()).toBe('4');
        });

        it('выбирает ячейку при нажатии', () => {
            spyOn(testComponent, 'handleSelect');
            expect(testComponent.handleSelect).not.toHaveBeenCalled();
            const todayElement =
                calendarBodyNativeElement.querySelector('.owl-dt-calendar-cell-today') as HTMLElement;
            todayElement.click();
            fixture.detectChanges();

            expect(testComponent.handleSelect).toHaveBeenCalled();
        });

        it('отмечает активную дату', () => {
            expect((cellEls[10] as HTMLElement).innerText.trim()).toBe('11');
            expect(cellEls[10].classList).toContain('owl-dt-calendar-cell-active');
        });

        it('устанавливает aria-current для сегодняшнего дня', () => {
            const currentCells = calendarBodyNativeElement.querySelectorAll('.owl-dt-calendar-cell[aria-current]');
            expect(currentCells.length).toBe(1);
            const todayCell = calendarBodyNativeElement.querySelector('.owl-dt-calendar-cell-today');
            expect(currentCells[0].getAttribute('aria-current')).toBe('date');
            expect(currentCells[0].firstChild).toBe(todayCell);
        });

        it('устанавливает aria-selected для выбранных ячеек', () => {
            const calendarCells = calendarBodyNativeElement.querySelectorAll('.owl-dt-calendar-cell');
            const selectedCells = calendarBodyNativeElement.querySelectorAll('.owl-dt-calendar-cell[aria-selected=true]');
            const nonSelectedCells = calendarBodyNativeElement.querySelectorAll('.owl-dt-calendar-cell[aria-selected=false]');
            expect(nonSelectedCells.length).toBe(calendarCells.length - selectedCells.length);
            const selectedCell = calendarBodyNativeElement.querySelector('.owl-dt-calendar-cell-selected');
            expect(selectedCells[0].firstChild).toBe(selectedCell);
        });
    });
});

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
        <table owl-date-time-calendar-body
               [rows]="rows"
               [todayValue]="todayValue"
               [selectedValues]="selectedValues"
               [selectMode]="'single'"
               [activeCell]="activeCell"
               (select)="handleSelect()">
        </table>`,
})
class StandardCalendarBodyComponent {
    rows = [[1, 2, 3, 4, 5, 6, 7], [8, 9, 10, 11, 12, 13, 14]].map(r => r.map(createCell));
    todayValue = 3;
    selectedValues = [4];
    activeCell = 10;

    handleSelect() {
    }
}

function createCell( value: number ) {
    return new CalendarCell(value, `${value}`, `${value}-label`, true);
}
