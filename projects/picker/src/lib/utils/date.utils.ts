/**
 * date.utils
 */

/**
 * Создаёт дату с указанными годом, месяцем, числом, часом, минутой и секундой без выхода
 * месяца и числа за допустимые границы
 */
export function createDate(
    year: number,
    month: number,
    date: number,
    hours: number = 0,
    minutes: number = 0,
    seconds: number = 0
): Date {
    if (month < 0 || month > 11) {
        throw Error(
            `Invalid month index "${month}". Month index has to be between 0 and 11.`
        );
    }

    if (date < 1) {
        throw Error(
            `Invalid date "${date}". Date has to be greater than 0.`
        );
    }

    if (hours < 0 || hours > 23) {
        throw Error(
            `Invalid hours "${hours}". Hours has to be between 0 and 23.`
        );
    }

    if (minutes < 0 || minutes > 59) {
        throw Error(
            `Invalid minutes "${minutes}". Minutes has to between 0 and 59.`
        );
    }

    if (seconds < 0 || seconds > 59) {
        throw Error(
            `Invalid seconds "${seconds}". Seconds has to be between 0 and 59.`
        );
    }

    const result = createDateWithOverflow(
        year,
        month,
        date,
        hours,
        minutes,
        seconds
    );

    // Проверяем, что число не превышает количество дней в месяце и не переносится в следующий месяц
    // Например, createDate(2017, 1, 31) пытается создать несуществующую дату 2017/02/31
    if (result.getMonth() !== month) {
        throw Error(
            `Invalid date "${date}" for month with index "${month}".`
        );
    }

    return result;
}

/**
 * Возвращает количество дней в месяце указанной даты
 */
export function getNumDaysInMonth(date: Date): number {
    const lastDateOfMonth = createDateWithOverflow(
        date.getFullYear(),
        date.getMonth() + 1,
        0
    );

    return lastDateOfMonth.getDate();
}

/**
 * Создаёт дату с допустимым переносом месяца и числа за их границы
 */
function createDateWithOverflow(
    year: number,
    month: number,
    date: number,
    hours: number = 0,
    minutes: number = 0,
    seconds: number = 0
): Date {
    // setFullYear не позволяет конструктору Date интерпретировать годы 0–99 как 1900–1999
    const result = new Date(0);
    result.setFullYear(year, month, date);
    result.setHours(hours, minutes, seconds, 0);
    return result;
}
