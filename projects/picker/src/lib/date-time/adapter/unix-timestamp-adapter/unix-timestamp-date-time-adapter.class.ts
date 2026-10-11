/**
 * unix-timestamp-date-time-adapter.class
 */

import { Inject, Injectable, Optional } from '@angular/core';
import { DateTime, Info, Settings } from 'luxon';

import { DateTimeAdapter, OWL_DATE_TIME_LOCALE } from '../date-time-adapter.class';

@Injectable()
export class UnixTimestampDateTimeAdapter extends DateTimeAdapter<number> {
    public firstMonthOfTheYear = 0;

    /**
     * Компонент выбора даты ожидает:
     * 0 - воскресенье
     * 1 - понедельник
     * ...
     * 6 - суббота
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

    public getYear(date: number): number {
        return this.fromTimestamp(date).year;
    }

    /**
     * Компонент выбора даты ожидает:
     * 0 - январь
     * 11 - декабрь
     *
     * Luxon использует:
     * 1 - январь
     * 12 - декабрь
     */
    public getMonth(date: number): number {
        return this.fromTimestamp(date).month - 1;
    }

    /**
     * Компонент выбора даты ожидает:
     * 0 - воскресенье
     * 6 - суббота
     *
     * День недели в Luxon:
     * 1 - понедельник
     * 7 - воскресенье
     */
    public getDay(date: number): number {
        return this.fromTimestamp(date).weekday % 7;
    }

    public getDate(date: number): number {
        return this.fromTimestamp(date).day;
    }

    public getHours(date: number): number {
        return this.fromTimestamp(date).hour;
    }

    public getMinutes(date: number): number {
        return this.fromTimestamp(date).minute;
    }

    public getSeconds(date: number): number {
        return this.fromTimestamp(date).second;
    }

    public getTime(date: number): number {
        return date;
    }

    public getNumDaysInMonth(date: number): number {
        return this.fromTimestamp(date).daysInMonth ?? 0;
    }

    public differenceInCalendarDays(dateLeft: number, dateRight: number): number {
        if (!this.isValid(dateLeft) || !this.isValid(dateRight)) {
            return Number.NaN;
        }

        return Math.round(
            this.fromTimestamp(dateLeft)
                .startOf('day')
                .diff(this.fromTimestamp(dateRight).startOf('day'), 'days').days,
        );
    }

    public getYearName(date: number): string {
        return this.fromTimestamp(date).toFormat('yyyy');
    }

    public getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
        return Info.months(style, { locale: this.locale });
    }

    public getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
        const weekdays = Info.weekdays(style, { locale: this.locale });

        // Luxon возвращает дни недели от понедельника до воскресенья
        // Компонент выбора даты ожидает порядок от воскресенья до субботы
        return [
            weekdays[6],
            ...weekdays.slice(0, 6),
        ];
    }

    public getDateNames(): string[] {
        return Array.from({ length: 31 }, (_, index) => `${index + 1}`);
    }

    public toIso8601(date: number): string {
        return this.fromTimestamp(date).toISO() ?? '';
    }

    public isEqual(dateLeft: number, dateRight: number): boolean {
        if (!this.isValid(dateLeft) || !this.isValid(dateRight)) {
            return false;
        }

        return dateLeft === dateRight;
    }

    public isSameDay(dateLeft: number, dateRight: number): boolean {
        if (!this.isValid(dateLeft) || !this.isValid(dateRight)) {
            return false;
        }

        return this.fromTimestamp(dateLeft).hasSame(
            this.fromTimestamp(dateRight),
            'day',
        );
    }

    public isValid(date: number): boolean {
        return typeof date === 'number' && Number.isFinite(date) && this.fromTimestamp(date).isValid;
    }

    public invalid(): number {
        return NaN;
    }

    public isDateInstance(obj: unknown): boolean {
        return typeof obj === 'number';
    }

    public addCalendarYears(date: number, amount: number): number {
        return this.fromTimestamp(date)
            .plus({ years: Number(amount) })
            .toMillis();
    }

    public addCalendarMonths(date: number, amount: number): number {
        return this.fromTimestamp(date)
            .plus({ months: Number(amount) })
            .toMillis();
    }

    public addCalendarDays(date: number, amount: number): number {
        return this.fromTimestamp(date)
            .plus({ days: Number(amount) })
            .toMillis();
    }

    public setHours(date: number, amount: number): number {
        return this.fromTimestamp(date)
            .set({ hour: amount })
            .toMillis();
    }

    public setMinutes(date: number, amount: number): number {
        return this.fromTimestamp(date)
            .set({ minute: amount })
            .toMillis();
    }

    public setSeconds(date: number, amount: number): number {
        return this.fromTimestamp(date)
            .set({ second: amount })
            .toMillis();
    }

    public createDate(
        year: number,
        month: number,
        date: number,
        hours = 0,
        minutes = 0,
        seconds = 0,
    ): number {
        if (hours < 0 || hours > 23) {
            throw Error(`UnixTimestampDateTimeAdapter: Invalid hours "${hours}". Hours must be between 0 and 23.`);
        }

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
                `UnixTimestampDateTimeAdapter: Invalid date "${date}" for month with index "${month}".`,
            );
        }

        return result.toMillis();
    }

    public clone(date: number): number {
        return date;
    }

    public now(): number {
        return DateTime.local()
            .setLocale(this.locale)
            .toMillis();
    }

    /**
     * Форматирование с поддержкой двух видов формата:
     * - string => формат Luxon, например 'dd.MM.yyyy HH:mm'
     * - Intl.DateTimeFormatOptions => форматирование, совместимое с прежним адаптером
     */
    public format(
        date: number,
        displayFormat: string | Intl.DateTimeFormatOptions,
    ): string {
        if (!this.isValid(date)) {
            throw Error('UnixTimestampDateTimeAdapter: Cannot format invalid date.');
        }

        const dt = this.fromTimestamp(date);

        if (typeof displayFormat === 'string') {
            return dt.toFormat(displayFormat);
        }

        return this.stripDirectionalityCharacters(
            dt.toJSDate().toLocaleDateString(this.locale, displayFormat),
        );
    }

    public parse(value: unknown, parseFormat: string | string[] | null): number | null {
        if (value == null || value === '') {
            return null;
        }

        if (typeof value === 'number') {
            return this.isValid(value) ? value : this.invalid();
        }

        if (value instanceof Date) {
            const date = DateTime.fromJSDate(value).setLocale(this.locale);

            return date.isValid ? date.toMillis() : this.invalid();
        }

        if (DateTime.isDateTime(value)) {
            return value.isValid
                ? value.setLocale(this.locale).toMillis()
                : this.invalid();
        }

        if (typeof value !== 'string') {
            return this.invalid();
        }

        if (parseFormat) {
            const formats = Array.isArray(parseFormat) ? parseFormat : [parseFormat];

            for (const format of formats) {
                if (typeof format !== 'string') {
                    continue;
                }

                const parsed = DateTime.fromFormat(value, format, {
                    locale: this.locale,
                });

                if (parsed.isValid) {
                    return parsed.toMillis();
                }
            }
        }

        const iso = DateTime.fromISO(value, {
            locale: this.locale,
        });

        if (iso.isValid) {
            return iso.toMillis();
        }

        const jsDate = DateTime.fromJSDate(new Date(value)).setLocale(this.locale);

        return jsDate.isValid ? jsDate.toMillis() : this.invalid();
    }

    public override deserialize(value: unknown): number | null {
        if (value == null || value === '') {
            return null;
        }

        if (typeof value === 'number') {
            return this.isValid(value) ? value : this.invalid();
        }

        if (value instanceof Date) {
            const date = DateTime.fromJSDate(value).setLocale(this.locale);

            return date.isValid ? date.toMillis() : this.invalid();
        }

        if (DateTime.isDateTime(value)) {
            return value.isValid
                ? value.setLocale(this.locale).toMillis()
                : this.invalid();
        }

        if (typeof value === 'string') {
            const date = DateTime.fromISO(value, {
                locale: this.locale,
            });

            return date.isValid ? date.toMillis() : this.invalid();
        }

        return this.invalid();
    }

    public override setLocale(locale: string): void {
        super.setLocale(locale || 'ru');
    }

    private fromTimestamp(timestamp: number): DateTime {
        return DateTime.fromMillis(timestamp).setLocale(this.locale);
    }

    private stripDirectionalityCharacters(value: string): string {
        return value.replace(/[\u200e\u200f]/g, '');
    }
}
