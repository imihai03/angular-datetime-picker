/**
 * date-time-adapter.class
 */
import { Observable, Subject } from 'rxjs';
import { inject, InjectionToken, LOCALE_ID } from '@angular/core';

/** InjectionToken для переопределения локали компонента выбора даты и времени */
export const OWL_DATE_TIME_LOCALE = new InjectionToken<string>(
    'OWL_DATE_TIME_LOCALE',
    {
        providedIn: 'root',
        factory: OWL_DATE_TIME_LOCALE_FACTORY
    }
);

/** @docs-private */
export function OWL_DATE_TIME_LOCALE_FACTORY(): string {
    return inject(LOCALE_ID);
}

/** Провайдер токена OWL_DATE_TIME_LOCALE */
export const OWL_DATE_TIME_LOCALE_PROVIDER = {
    provide: OWL_DATE_TIME_LOCALE,
    useExisting: LOCALE_ID
};

export abstract class DateTimeAdapter<T> {
    /** Локаль для всех дат */
    protected locale: any;

    /** Поток уведомлений об изменении локали */
    protected _localeChanges = new Subject<string>();
    get localeChanges(): Observable<string> {
        return this._localeChanges;
    }

	public firstMonthOfTheYear: number = 0;
	public firstDayOfTheWeek: number = 0;

    /** Количество миллисекунд в сутках */
    protected readonly millisecondsInDay = 86400000;

    /** Количество миллисекунд в минуте */
    protected readonly millisecondsInMinute = 60000;

    /**
     * Возвращает год указанной даты
     */
    abstract getYear(date: T): number;

    /**
     * Возвращает индекс месяца указанной даты
     * 0 -- январь
     * 11 -- декабрь
     * */
    abstract getMonth(date: T): number;

    /**
     * Возвращает день недели указанной даты
     * 0 -- воскресенье
     * 6 -- суббота
     * */
    abstract getDay(date: T): number;

    /**
     * Возвращает число месяца указанной даты
     */
    abstract getDate(date: T): number;

    /**
     * Возвращает часы указанной даты
     */
    abstract getHours(date: T): number;

    /**
     * Возвращает минуты указанной даты
     */
    abstract getMinutes(date: T): number;

    /**
     * Возвращает секунды указанной даты
     */
    abstract getSeconds(date: T): number;

    /**
     * Возвращает временную метку указанной даты в миллисекундах
     */
    abstract getTime(date: T): number;

    /**
     * Возвращает количество дней в месяце указанной даты
     */
    abstract getNumDaysInMonth(date: T): number;

    /**
     * Возвращает разницу между указанными датами в календарных днях
     * Если dateLeft раньше dateRight, возвращает отрицательное значение
     * Если dateLeft позже dateRight, возвращает положительное значение
     */
    abstract differenceInCalendarDays(dateLeft: T, dateRight: T): number;

    /**
     * Возвращает строковое представление года указанной даты
     */
    abstract getYearName(date: T): string;

    /**
     * Возвращает список названий месяцев
     */
    abstract getMonthNames(style: 'long' | 'short' | 'narrow'): string[];

    /**
     * Возвращает список названий дней недели
     */
    abstract getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[];

    /**
     * Возвращает список строковых представлений чисел месяца
     */
    abstract getDateNames(): string[];

    /**
     * Возвращает дату в виде строки по стандарту ISO
     */
    abstract toIso8601(date: T): string;

    /**
     * Проверяет равенство указанных дат
     */
    abstract isEqual(dateLeft: T, dateRight: T): boolean;

    /**
     * Проверяет, относятся ли указанные даты к одному дню
     */
    abstract isSameDay(dateLeft: T, dateRight: T): boolean;

    /**
     * Проверяет корректность указанной даты
     */
    abstract isValid(date: T): boolean;

    /**
     * Возвращает экземпляр некорректной даты
     */
    abstract invalid(): T;

    /**
     * Проверяет, считает ли этот DateTimeAdapter указанный объект экземпляром даты
     */
    abstract isDateInstance(obj: any): boolean;

    /**
     * Добавляет указанное количество лет к дате
     */
    abstract addCalendarYears(date: T, amount: number): T;

    /**
     * Добавляет указанное количество месяцев к дате
     */
    abstract addCalendarMonths(date: T, amount: number): T;

    /**
     * Добавляет указанное количество дней к дате
     */
    abstract addCalendarDays(date: T, amount: number): T;

    /**
     * Устанавливает часы указанной даты
     */
    abstract setHours(date: T, amount: number): T;

    /**
     * Устанавливает минуты указанной даты
     */
    abstract setMinutes(date: T, amount: number): T;

    /**
     * Устанавливает секунды указанной даты
     */
    abstract setSeconds(date: T, amount: number): T;

    /**
     * Создаёт дату с указанными годом, месяцем, числом, часами, минутами и секундами
     * Месяц и число должны находиться в допустимых пределах
     */
    abstract createDate(year: number, month: number, date: number): T;
    abstract createDate(
        year: number,
        month: number,
        date: number,
        hours: number,
        minutes: number,
        seconds: number
    ): T;

    /**
     * Создаёт копию указанной даты
     */
    abstract clone(date: T): T;

    /**
     * Возвращает текущие дату и время
     * */
    abstract now(): T;

    /**
     * Форматирует дату в строку по указанному формату
     */
    abstract format(date: T, displayFormat: any): string;

    /**
     * Преобразует введённое пользователем значение в объект даты
     */
    abstract parse(value: any, parseFormat: any): T | null;

    /**
     * Сравнивает две указанные даты
     * 1, если первая дата позже второй;
     * -1, если первая дата раньше второй;
     * 0, если даты равны
     * */
    compare(first: T, second: T): number {
        if (!this.isValid(first) || !this.isValid(second)) {
            throw Error('JSNativeDate: Cannot compare invalid dates.');
        }

        const dateFirst = this.clone(first);
        const dateSecond = this.clone(second);

        const diff = this.getTime(dateFirst) - this.getTime(dateSecond);

        if (diff < 0) {
            return -1;
        } else if (diff > 0) {
            return 1;
        } else {
            // Возвращает 0 при diff === 0 и NaN при diff === NaN
            return diff;
        }
    }

    /**
     * Сравнивает годы двух указанных дат
     * 1, если год первой даты больше года второй;
     * -1, если год первой даты меньше года второй;
     * 0, если обе даты относятся к одному году
     * */
    compareYear(first: T, second: T): number {
        if (!this.isValid(first) || !this.isValid(second)) {
            throw Error('JSNativeDate: Cannot compare invalid dates.');
        }

        const yearLeft = this.getYear(first);
        const yearRight = this.getYear(second);

        const diff = yearLeft - yearRight;

        if (diff < 0) {
            return -1;
        } else if (diff > 0) {
            return 1;
        } else {
            return 0;
        }
    }

    /**
     * Пытается десериализовать значение в корректный объект даты
     * В отличие от разбора
     * пользовательского ввода, deserialize принимает только однозначные форматы, не зависящие
     * от локали, например ISO 8601
     * По умолчанию метод ничего не преобразует, а проверяет,
     * что значение уже является корректным объектом даты или null
     * Компонент выбора даты
     * использует этот метод для входных значений, представляющих даты
     * Переопределение
     * метода позволяет передавать в такие свойства значения прямо с сервера,
     * если реализовать десериализацию формата, используемого сервером
     */
    deserialize(value: any): T | null {
        if (
            value == null ||
            (this.isDateInstance(value) && this.isValid(value))
        ) {
            return value;
        }
        return this.invalid();
    }

    /**
     * Устанавливает локаль для всех дат
     */
    setLocale(locale: string) {
        this.locale = locale;
        this._localeChanges.next(locale);
    }

     /**
      * Возвращает локаль для всех дат
     * */
    getLocale() {
        return this.locale;
    }

    /**
     * Ограничивает дату минимальным и максимальным значениями
     */
    clampDate(date: T, min?: T | null, max?: T | null): T {
        if (min != null && this.compare(date, min) < 0) {
            return min;
        }
        if (max != null && this.compare(date, max) > 0) {
            return max;
        }
        return date;
    }
}
