/**
 * constants
 */

import { range } from './array.utils';

/** Поддерживает ли браузер Intl API */
export const SUPPORTS_INTL_API = typeof Intl !== 'undefined';

/** Названия месяцев по умолчанию при недоступном Intl API */
export const DEFAULT_MONTH_NAMES = {
    long: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ],
    short: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
    ],
    narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
};

/** Названия дней недели по умолчанию при недоступном Intl API */
export const DEFAULT_DAY_OF_WEEK_NAMES = {
    long: [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
    ],
    short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    narrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S']
};

/** Названия чисел месяца по умолчанию при недоступном Intl API */
export const DEFAULT_DATE_NAMES = range(31, i => String(i + 1));
