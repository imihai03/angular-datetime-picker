/**
 * dialog-config.class
 */
import { ViewContainerRef } from '@angular/core';
import { NoopScrollStrategy, ScrollStrategy } from '@angular/cdk/overlay';

let uniqueId = 0;

/** Возможные переопределения положения диалогового окна */
export interface DialogPosition {
    /** Переопределение отступа диалогового окна сверху */
    top?: string;

    /** Переопределение отступа диалогового окна снизу */
    bottom?: string;

    /** Переопределение отступа диалогового окна слева */
    left?: string;

    /** Переопределение отступа диалогового окна справа */
    right?: string;
}

export interface OwlDialogConfigInterface {
    /**
     * ID элемента с описанием диалогового окна
     */
    ariaDescribedBy?: string | null;

    /**
     * Нужно ли переводить фокус на диалоговое окно при открытии
     */
    autoFocus?: boolean;

    /** Есть ли у диалогового окна фон */
    hasBackdrop?: boolean;

    /**
     * Пользовательский стиль фона
     * */
    backdropStyle?: any;

    /** Данные, передаваемые в дочерний компонент через DI */
    data?: any ;

    /** Может ли пользователь закрыть диалоговое окно клавишей Escape или нажатием за его пределами */
    disableClose?: boolean;

    /**
     * ID диалогового окна; если не указан, создаётся уникальный ID
     */
    id?: string;

    /**
     * ARIA-роль элемента диалогового окна
     */
    role?: 'dialog' | 'alertdialog';

    /**
     * Пользовательский класс панели
     * */
    paneClass?: string | string[];

    /**
     * Событие мыши
     * */
    event?: MouseEvent;

    /**
     * Пользовательский класс фона
     * */
    backdropClass?: string | string[];

    /**
     * Нужно ли закрывать диалоговое окно при переходе назад или вперёд в истории браузера
     * */
    closeOnNavigation?: boolean;

    /** Ширина диалогового окна */
    width?: string ;

    /** Высота диалогового окна */
    height?: string;

    /**
     * Минимальная ширина overlay-панели
     * Числовое значение задаётся в пикселях
     * */
    minWidth?: number | string;

    /**
     * Минимальная высота overlay-панели
     * Числовое значение задаётся в пикселях
     * */
    minHeight?: number | string;

    /**
     * Максимальная ширина overlay-панели
     * Числовое значение задаётся в пикселях
     * */
    maxWidth?: number | string;

    /**
     * Максимальная высота overlay-панели
     * Числовое значение задаётся в пикселях
     * */
    maxHeight?: number | string;

    /** Переопределения положения */
    position?: DialogPosition;

    /**
     * Стратегия прокрутки при открытом диалоговом окне
     * Подробнее: https://material.angular.io/cdk/overlay/overview#scroll-strategies
     * */
    scrollStrategy?: ScrollStrategy;

    viewContainerRef?: ViewContainerRef;
}

export class OwlDialogConfig implements OwlDialogConfigInterface {
    /**
     * ID элемента с описанием диалогового окна
     */
    public ariaDescribedBy: string | null = null;

    /**
     * Нужно ли переводить фокус на диалоговое окно при открытии
     */
    public autoFocus = true;

    /** Есть ли у диалогового окна фон */
    public hasBackdrop = true;

    /**
     * Пользовательский стиль фона
     * */
    public backdropStyle: any;

    /** Данные, передаваемые в дочерний компонент через DI */
    public data: any = null;

    /** Может ли пользователь закрыть диалоговое окно клавишей Escape или нажатием за его пределами */
    public disableClose = false;

    /**
     * ID диалогового окна; если не указан, создаётся уникальный ID
     */
    public id: string;

    /**
     * ARIA-роль элемента диалогового окна
     */
    public role: 'dialog' | 'alertdialog' = 'dialog';

    /**
     * Пользовательский класс панели
     * */
    public paneClass: string | string[] = '';

    /**
     * Событие мыши
     * */
    public event: MouseEvent = null;

    /**
     * Пользовательский класс фона
     * */
    public backdropClass: string | string[] = '';

    /**
     * Нужно ли закрывать диалоговое окно при переходе назад или вперёд в истории браузера
     * */
    public closeOnNavigation = true;

    /** Ширина диалогового окна */
    public width = '';

    /** Высота диалогового окна */
    public height = '';

    /**
     * Минимальная ширина overlay-панели
     * Числовое значение задаётся в пикселях
     * */
    public minWidth: number | string;

    /**
     * Минимальная высота overlay-панели
     * Числовое значение задаётся в пикселях
     * */
    public minHeight: number | string;

    /**
     * Максимальная ширина overlay-панели
     * Числовое значение задаётся в пикселях
     * */
    public maxWidth: number | string = '85vw';

    /**
     * Максимальная высота overlay-панели
     * Числовое значение задаётся в пикселях
     * */
    public maxHeight: number | string;

    /** Переопределения положения */
    public position: DialogPosition;

    /**
     * Стратегия прокрутки при открытом диалоговом окне
     * Подробнее: https://material.angular.io/cdk/overlay/overview#scroll-strategies
     * */
    public scrollStrategy: ScrollStrategy = new NoopScrollStrategy();

    public viewContainerRef: ViewContainerRef;

    constructor() {
        this.id = `owl-dialog-${uniqueId++}`;
    }
}
