import { DateTime } from 'luxon';

import { LuxonDateTimeAdapter } from './luxon-date-time-adapter.class';

describe('LuxonDateTimeAdapter', () => {
    let adapter: LuxonDateTimeAdapter;

    beforeEach(() => {
        adapter = new LuxonDateTimeAdapter('en-US');
    });

    it('keeps a Luxon DateTime valid when it crosses the input boundary', () => {
        const value = DateTime.local(2026, 7, 30, 12, 34);

        const result = adapter.deserialize(value);

        expect(DateTime.isDateTime(result)).toBeTrue();
        expect(result?.isValid).toBeTrue();
        expect(result?.toMillis()).toBe(value.toMillis());
    });

    it('normalizes a native Date to a Luxon DateTime', () => {
        const value = new Date(2026, 6, 30, 12, 34);

        const result = adapter.deserialize(value);

        expect(DateTime.isDateTime(result)).toBeTrue();
        expect(result?.isValid).toBeTrue();
        expect(result?.toMillis()).toBe(value.getTime());
    });

    it('parses a value with the configured Luxon format', () => {
        const result = adapter.parse('30.07.2026 12:34', 'dd.MM.yyyy HH:mm');

        expect(result?.isValid).toBeTrue();
        expect(result?.year).toBe(2026);
        expect(result?.month).toBe(7);
        expect(result?.day).toBe(30);
        expect(result?.hour).toBe(12);
        expect(result?.minute).toBe(34);
    });

    it('deserializes an ISO value', () => {
        const value = '2026-07-30T12:34:00+03:00';

        const result = adapter.deserialize(value);

        expect(result?.isValid).toBeTrue();
        expect(result?.toMillis()).toBe(DateTime.fromISO(value).toMillis());
    });
});
