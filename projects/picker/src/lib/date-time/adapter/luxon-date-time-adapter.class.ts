/**
 * luxon-date-time-adapter.class
 */

import { Inject, Injectable, Optional } from '@angular/core';
import { DateTime, Info, Settings } from 'luxon';

import {
    DateTimeAdapter,
    OWL_DATE_TIME_LOCALE,
} from './date-time-adapter.class';

@Injectable()
export class LuxonDateTimeAdapter extends DateTimeAdapter<DateTime> {
    public firstMonthOfTheYear = 0;

    /**
     * 0 - Sunday
     * 1 - Monday
     * ...
     * 6 - Saturday
     */
    public firstDayOfTheWeek = 0;

    public constructor(
        @Optional()
        @Inject(OWL_DATE_TIME_LOCALE)
        private owlDateTimeLocale: string,
    ) {
        super();

        this.setLocale(owlDateTimeLocale || Settings.defaultLocale || 'ru');
    }

    public getYear(date: DateTime): number {
        return date.year;
    }

    /**
     * Picker expects month index:
     * 0 - January
     * 11 - December
     *
     * Luxon uses:
     * 1 - January
     * 12 - December
     */
    public getMonth(date: DateTime): number {
        return date.month - 1;
    }

    /**
     * Picker expects:
     * 0 - Sunday
     * 6 - Saturday
     *
     * Luxon weekday:
     * 1 - Monday
     * 7 - Sunday
     */
    public getDay(date: DateTime): number {
        return date.weekday % 7;
    }

    public getDate(date: DateTime): number {
        return date.day;
    }

    public getHours(date: DateTime): number {
        return date.hour;
    }

    public getMinutes(date: DateTime): number {
        return date.minute;
    }

    public getSeconds(date: DateTime): number {
        return date.second;
    }

    public getTime(date: DateTime): number {
        return date.toMillis();
    }

    public getNumDaysInMonth(date: DateTime): number {
        return date.daysInMonth ?? 0;
    }

    public differenceInCalendarDays(dateLeft: DateTime, dateRight: DateTime): number {
        if (this.isValid(dateLeft) && this.isValid(dateRight)) {
            return Math.round(
                dateLeft.startOf('day').diff(dateRight.startOf('day'), 'days').days,
            );
        }

        return null;
    }

    public getYearName(date: DateTime): string {
        return date.setLocale(this.locale).toFormat('yyyy');
    }

    public getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
        return Info.months(style, { locale: this.locale });
    }

    public getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
        const weekdays = Info.weekdays(style, { locale: this.locale });

        // Luxon returns Monday..Sunday.
        // Existing picker expects Sunday..Saturday.
        return [
            weekdays[6],
            ...weekdays.slice(0, 6),
        ];
    }

    public getDateNames(): string[] {
        return Array.from({ length: 31 }, (_, index) => `${index + 1}`);
    }

    public toIso8601(date: DateTime): string {
        return date.toISO() ?? '';
    }

    public isEqual(dateLeft: DateTime, dateRight: DateTime): boolean {
        if (this.isValid(dateLeft) && this.isValid(dateRight)) {
            return dateLeft.toMillis() === dateRight.toMillis();
        }

        return false;
    }

    public isSameDay(dateLeft: DateTime, dateRight: DateTime): boolean {
        if (this.isValid(dateLeft) && this.isValid(dateRight)) {
            return (
                dateLeft.year === dateRight.year &&
                dateLeft.month === dateRight.month &&
                dateLeft.day === dateRight.day
            );
        }

        return false;
    }

    public isValid(date: DateTime): boolean {
        return DateTime.isDateTime(date) && date.isValid;
    }

    public invalid(): DateTime {
        return DateTime.invalid('Invalid date');
    }

    public isDateInstance(obj: unknown): boolean {
        return DateTime.isDateTime(obj);
    }

    public addCalendarYears(date: DateTime, amount: number): DateTime {
        return date.plus({ years: Number(amount) });
    }

    public addCalendarMonths(date: DateTime, amount: number): DateTime {
        return date.plus({ months: Number(amount) });
    }

    public addCalendarDays(date: DateTime, amount: number): DateTime {
        return date.plus({ days: Number(amount) });
    }

    public setHours(date: DateTime, amount: number): DateTime {
        return date.set({ hour: amount });
    }

    public setMinutes(date: DateTime, amount: number): DateTime {
        return date.set({ minute: amount });
    }

    public setSeconds(date: DateTime, amount: number): DateTime {
        return date.set({ second: amount });
    }

    public createDate(
        year: number,
        month: number,
        date: number,
        hours = 0,
        minutes = 0,
        seconds = 0,
    ): DateTime {
        const result = DateTime.local(
            year,
            month + 1,
            date,
            hours,
            minutes,
            seconds,
            0,
        ).setLocale(this.locale);

        if (!result.isValid) {
            throw Error(
                `LuxonDateTimeAdapter: Invalid date "${date}" for month with index "${month}".`,
            );
        }

        return result;
    }

    public clone(date: DateTime): DateTime {
        return DateTime.fromMillis(date.toMillis(), {
            zone: date.zone,
            locale: date.locale,
        });
    }

    public now(): DateTime {
        return DateTime.local().setLocale(this.locale);
    }

    public format(date: DateTime, displayFormat: string): string {
        if (!this.isValid(date)) {
            throw Error('LuxonDateTimeAdapter: Cannot format invalid date.');
        }

        return date.setLocale(this.locale).toFormat(displayFormat);
    }

    public parse(value: unknown, parseFormat: string | string[]): DateTime | null {
        if (value == null || value === '') {
            return null;
        }

        if (DateTime.isDateTime(value)) {
            return value.isValid ? value.setLocale(this.locale) : this.invalid();
        }

        if (value instanceof Date) {
            const date = DateTime.fromJSDate(value).setLocale(this.locale);

            return date.isValid ? date : this.invalid();
        }

        if (typeof value === 'number') {
            const date = DateTime.fromMillis(value).setLocale(this.locale);

            return date.isValid ? date : this.invalid();
        }

        if (typeof value !== 'string') {
            return this.invalid();
        }

        const formats = Array.isArray(parseFormat) ? parseFormat : [parseFormat];

        for (const format of formats) {
            const parsed = DateTime.fromFormat(value, format, {
                locale: this.locale,
            });

            if (parsed.isValid) {
                return parsed;
            }
        }

        const iso = DateTime.fromISO(value, {
            locale: this.locale,
        });

        return iso.isValid ? iso : this.invalid();
    }

    public deserialize(value: unknown): DateTime | null {
        if (value == null || value === '') {
            return null;
        }

        if (DateTime.isDateTime(value)) {
            return value.isValid ? value.setLocale(this.locale) : this.invalid();
        }

        if (value instanceof Date) {
            const date = DateTime.fromJSDate(value).setLocale(this.locale);

            return date.isValid ? date : this.invalid();
        }

        if (typeof value === 'number') {
            const date = DateTime.fromMillis(value).setLocale(this.locale);

            return date.isValid ? date : this.invalid();
        }

        if (typeof value === 'string') {
            const date = DateTime.fromISO(value, {
                locale: this.locale,
            });

            return date.isValid ? date : this.invalid();
        }

        return this.invalid();
    }

    public override setLocale(locale: string): void {
        super.setLocale(locale || 'ru');
    }
}
