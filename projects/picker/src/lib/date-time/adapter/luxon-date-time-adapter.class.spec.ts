import { DateTime } from 'luxon';

import { LuxonDateTimeAdapter } from './luxon-date-time-adapter.class';

describe('Адаптер LuxonDateTimeAdapter', () => {
    let adapter: LuxonDateTimeAdapter;

    beforeEach(() => {
        adapter = new LuxonDateTimeAdapter('en-US');
    });

    it('сохраняет корректность Luxon DateTime при передаче через поле ввода', () => {
        const value = DateTime.local(2026, 7, 30, 12, 34);

        const result = adapter.deserialize(value);

        expect(DateTime.isDateTime(result)).toBeTrue();
        expect(result?.isValid).toBeTrue();
        expect(result?.toMillis()).toBe(value.toMillis());
    });

    it('преобразует нативный Date в Luxon DateTime', () => {
        const value = new Date(2026, 6, 30, 12, 34);

        const result = adapter.deserialize(value);

        expect(DateTime.isDateTime(result)).toBeTrue();
        expect(result?.isValid).toBeTrue();
        expect(result?.toMillis()).toBe(value.getTime());
    });

    it('разбирает значение с заданным форматом Luxon', () => {
        const result = adapter.parse('30.07.2026 12:34', 'dd.MM.yyyy HH:mm');

        expect(result?.isValid).toBeTrue();
        expect(result?.year).toBe(2026);
        expect(result?.month).toBe(7);
        expect(result?.day).toBe(30);
        expect(result?.hour).toBe(12);
        expect(result?.minute).toBe(34);
    });

    it('десериализует значение ISO', () => {
        const value = '2026-07-30T12:34:00+03:00';

        const result = adapter.deserialize(value);

        expect(result?.isValid).toBeTrue();
        expect(result?.toMillis()).toBe(DateTime.fromISO(value).toMillis());
    });
});
