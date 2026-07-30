import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DateTime } from 'luxon';
import { OwlDateTimeModule, OwlLuxonDateTimeModule } from '../../projects/picker/src/public_api';

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    OwlDateTimeModule,
    OwlLuxonDateTimeModule
  ]
})
export class AppComponent {
  protected readonly currentTab = signal<'date-range' | 'date-range-dialog' | 'date-time-inline'>('date-range');

  protected selectedDates: [DateTime, DateTime] = [
    DateTime.local().minus({ days: 1 }),
    DateTime.local().plus({ days: 1 })
  ];

  protected currentValue: DateTime = this.selectedDates[0];

  protected endValue: DateTime = this.selectedDates[1];

  protected selectedTrigger(date: DateTime): void {
    console.log(date);
  }
}
