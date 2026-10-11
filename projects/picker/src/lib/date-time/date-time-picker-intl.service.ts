/**
 * date-time-picker-intl.service
 */

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({providedIn: 'root'})
export class OwlDateTimeIntl {

    /**
     * Поток событий изменения подписей для уведомления
     * компонентов об изменении подписей после инициализации
     */
    readonly changes: Subject<void> = new Subject<void>();

    /** Подпись кнопки увеличения секунд для программ чтения с экрана  */
    upSecondLabel = 'Add a second';

    /** Подпись кнопки уменьшения секунд для программ чтения с экрана  */
    downSecondLabel = 'Minus a second';

    /** Подпись кнопки увеличения минут для программ чтения с экрана  */
    upMinuteLabel = 'Add a minute';

    /** Подпись кнопки уменьшения минут для программ чтения с экрана  */
    downMinuteLabel = 'Minus a minute';

    /** Подпись кнопки увеличения часов для программ чтения с экрана  */
    upHourLabel = 'Add a hour';

    /** Подпись кнопки уменьшения часов для программ чтения с экрана  */
    downHourLabel = 'Minus a hour';

    /** Подпись кнопки предыдущего месяца для программ чтения с экрана */
    prevMonthLabel = 'Previous month';

    /** Подпись кнопки следующего месяца для программ чтения с экрана */
    nextMonthLabel = 'Next month';

    /** Подпись кнопки предыдущего года для программ чтения с экрана */
    prevYearLabel = 'Previous year';

    /** Подпись кнопки следующего года для программ чтения с экрана */
    nextYearLabel = 'Next year';

    /** Подпись кнопки предыдущей группы лет для программ чтения с экрана */
    prevMultiYearLabel = 'Previous 21 years';

    /** Подпись кнопки следующей группы лет для программ чтения с экрана */
    nextMultiYearLabel = 'Next 21 years';

    /** Подпись кнопки перехода к представлению месяца для программ чтения с экрана */
    switchToMonthViewLabel = 'Change to month view';

    /** Подпись кнопки перехода к представлению года для программ чтения с экрана */
    switchToMultiYearViewLabel = 'Choose month and year';

    /** Подпись кнопки отмены */
    cancelBtnLabel = 'Cancel';

    /** Подпись кнопки подтверждения */
    setBtnLabel = 'Set';

    /** Подпись начала диапазона ('from') в информации о выбранных датах */
    rangeFromLabel = 'From';

    /** Подпись конца диапазона ('to') в информации о выбранных датах */
    rangeToLabel = 'To';

    /** Подпись кнопки AM в 12-часовом формате */
    hour12AMLabel = 'AM';

    /** Подпись кнопки PM в 12-часовом формате */
    hour12PMLabel = 'PM';
}
