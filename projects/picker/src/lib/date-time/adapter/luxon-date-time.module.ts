/**
 * luxon-date-time.module
 */

import { NgModule } from '@angular/core';

import { DateTimeAdapter } from './date-time-adapter.class';
import { OWL_DATE_TIME_FORMATS } from './date-time-format.class';
import { LuxonDateTimeAdapter } from './luxon-date-time-adapter.class';
import { OWL_LUXON_DATE_TIME_FORMATS } from './luxon-date-time-format.class';

@NgModule({
    providers: [
        {
            provide: DateTimeAdapter,
            useClass: LuxonDateTimeAdapter,
        },
    ],
})
export class LuxonDateTimeModule {}

@NgModule({
    imports: [LuxonDateTimeModule],
    providers: [
        {
            provide: OWL_DATE_TIME_FORMATS,
            useValue: OWL_LUXON_DATE_TIME_FORMATS,
        },
    ],
})
export class OwlLuxonDateTimeModule {}
