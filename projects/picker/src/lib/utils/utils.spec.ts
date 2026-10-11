import { createDate, getNumDaysInMonth } from './date.utils';
import { extendObject } from './object.utils';

describe('Утилиты для дат и объектов', () => {
    it('создаёт високосные дни для годов меньше 100 без промежуточной даты 1900 года', () => {
        const value = createDate(0, 1, 29, 12, 34, 56);
        expect(value.getFullYear())
            .toBe(0);
        expect(value.getMonth())
            .toBe(1);
        expect(value.getDate())
            .toBe(29);
        expect(value.getHours())
            .toBe(12);
        expect(value.getMinutes())
            .toBe(34);
        expect(value.getSeconds())
            .toBe(56);
        expect(getNumDaysInMonth(value))
            .toBe(29);
    });

    it('отклоняет календарные даты с выходом за допустимые значения', () => {
        expect(() => createDate(1, 1, 29))
            .toThrow();
        expect(() => createDate(2026, 3, 31))
            .toThrow();
    });

    it('учитывает границу годов 99/100 при подсчёте дней декабря', () => {
        expect(getNumDaysInMonth(createDate(99, 11, 1)))
            .toBe(31);
        expect(createDate(99, 11, 31)
            .getFullYear())
            .toBe(99);
    });

    it('копирует собственные перечисляемые поля конфигурации без доверия к hasOwnProperty', () => {
        const source = { hasOwnProperty: 'custom value', value: 42 };
        expect(extendObject({}, source))
            .toEqual(source);
    });

    it('принимает источник с нулевым прототипом и игнорирует унаследованные поля', () => {
        const source: Record<string, number> = Object.create(null);
        source.value = 42;
        expect(extendObject({}, source))
            .toEqual({ value: 42 });
        const child: Record<string, number> = Object.create({ inherited: true });
        child.value = 7;
        expect(extendObject({}, child))
            .toEqual({ value: 7 });
    });
});
