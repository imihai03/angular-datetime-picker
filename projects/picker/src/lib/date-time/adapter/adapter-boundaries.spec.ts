import { DateTime, Settings } from 'luxon';
import { LuxonDateTimeAdapter } from './luxon-date-time-adapter.class';
import { UnixTimestampDateTimeAdapter } from './unix-timestamp-adapter/unix-timestamp-date-time-adapter.class';

describe('Граничные значения адаптеров DateTime', () => {
    const luxon = new LuxonDateTimeAdapter('en-US');
    const unix = new UnixTimestampDateTimeAdapter('en-US');

    it('принимает начало эпохи Unix и ограничивает значение границами min/max', () => {
        expect(unix.isValid(0))
            .toBeTrue();
        expect(unix.deserialize(0))
            .toBe(0);
        expect(unix.parse(0, null))
            .toBe(0);
        expect(unix.clampDate(-1, 0, null))
            .toBe(0);
        expect(unix.clampDate(1, null, 0))
            .toBe(0);
    });

    for (const invalid of [NaN, Infinity, -Infinity, 8640000000000001, -8640000000000001]) {
        it('отклоняет непредставимую временную метку Unix: ' + invalid, () => {
            expect(unix.isValid(invalid))
                .toBeFalse();
            expect(unix.deserialize(invalid))
                .toBeNaN();
            expect(unix.parse(invalid, null))
                .toBeNaN();
            expect(() => unix.compare(invalid, 0))
                .toThrow();
            expect(() => unix.format(invalid, 'yyyy'))
                .toThrow();
        });
    }

    it('разбирает значения ISO без заданного формата ввода Luxon', () => {
        expect(luxon.parse('2026-10-11', null)
            ?.toISODate())
            .toBe('2026-10-11');
        expect(luxon.parse('not a date', null)?.isValid)
            .toBeFalse();
    });

    it('возвращает NaN при вычислении календарной разницы с некорректной датой Luxon', () => {
        expect(luxon.differenceInCalendarDays(luxon.invalid(), DateTime.utc(2026, 1, 1)))
            .toBeNaN();
    });

    it('сравнивает календарные даты независимо от смещения относительно UTC', () => {
        const east = DateTime.fromISO('2026-01-02T00:00:00+14:00', { setZone: true });
        const west = DateTime.fromISO('2026-01-02T00:00:00-12:00', { setZone: true });
        expect(luxon.isSameDay(east, west))
            .toBeTrue();
        expect(luxon.differenceInCalendarDays(east, west))
            .toBe(0);
        expect(luxon.differenceInCalendarDays(east.plus({ days: 1 }), west))
            .toBe(1);
        expect(luxon.differenceInCalendarDays(west, east.plus({ days: 1 })))
            .toBe(-1);
    });

    it('считает календарные дни при переходе на летнее и зимнее время', () => {
        const spring = DateTime.fromISO('2026-03-08T12:00:00', { zone: 'America/New_York' });
        const autumn = DateTime.fromISO('2026-11-01T12:00:00', { zone: 'America/New_York' });
        expect(luxon.differenceInCalendarDays(spring, spring.minus({ days: 1 })))
            .toBe(1);
        expect(luxon.differenceInCalendarDays(autumn, autumn.minus({ days: 1 })))
            .toBe(1);
        expect(luxon.addCalendarDays(spring.minus({ days: 1 }), 1).hour)
            .toBe(12);
    });

    it('отклоняет 24:00 без неявного изменения заданного дня', () => {
        expect(() => luxon.createDate(2026, 0, 1, 24, 0, 0))
            .toThrow();
        expect(() => unix.createDate(2026, 0, 1, 24, 0, 0))
            .toThrow();
    });

    it('сохраняет календарное время при переходе DST для временных меток Unix', () => {
        const originalZone = Settings.defaultZone;
        Settings.defaultZone = 'America/New_York';
        try {
            const date = unix.createDate(2026, 2, 7, 12, 0, 0);
            const next = unix.addCalendarDays(date, 1);
            expect(unix.getHours(next))
                .toBe(12);
            expect(unix.differenceInCalendarDays(next, date))
                .toBe(1);
            expect(next - date)
                .toBe(23 * 60 * 60 * 1000);
        } finally {
            Settings.defaultZone = originalZone;
        }
    });
});
