/**
 * dialog-ref.class
 */
import { ESCAPE } from '@angular/cdk/keycodes';
import { GlobalPositionStrategy, OverlayRef } from '@angular/cdk/overlay';
import { Location } from '@angular/common';
import { Signal, signal } from '@angular/core';
import { filter, Observable, Subject, Subscription, SubscriptionLike, take } from 'rxjs';
import { IDateTimePickerAnimationEvent } from '../date-time/date-time-picker-animation-event';
import { DialogPosition } from './dialog-config.class';
import { OwlDialogContainerComponent } from './dialog-container.component';

export class OwlDialogRef<T> {

    private result: any;
    /**
     * Экземпляр компонента, открытого в диалоговом окне
     * */
    public componentInstance = signal<T | undefined>(undefined);

    private _beforeClose$ = new Subject<any>();

    private _beforeOpen$ = new Subject<any>();

    private _afterOpen$ = new Subject<any>();

    private _afterClosed$ = new Subject<any>();
    /** Разрешено ли пользователю закрывать диалоговое окно */
    public disableClose = true;
    private closing = false;
    /** Подписка на изменения адреса в браузере */
    private locationChanged: SubscriptionLike = Subscription.EMPTY;

    constructor(private overlayRef: OverlayRef,
        private container: OwlDialogContainerComponent,
        public readonly id: string,
        location?: Location) {
        this.disableClose = this.container.config.disableClose;

        this.container.animationStateChanged
            .pipe(
                filter(( event: IDateTimePickerAnimationEvent ) => event.phaseName === 'start' && event.toState === 'enter'),
                take(1)
            )
            .subscribe(() => {
                this._beforeOpen$.next(null);
                this._beforeOpen$.complete();
            });

        this.container.animationStateChanged
            .pipe(
                filter(( event: IDateTimePickerAnimationEvent ) => event.phaseName === 'done' && event.toState === 'enter'),
                take(1)
            )
            .subscribe(() => {
                this._afterOpen$.next(null);
                this._afterOpen$.complete();
            });

        this.container.animationStateChanged
            .pipe(
                filter((event: IDateTimePickerAnimationEvent) => event.phaseName === 'done' && event.toState === 'leave'),
                take(1)
            )
            .subscribe(() => {
                this.overlayRef.dispose();
                this.locationChanged.unsubscribe();
                this._afterClosed$.next(this.result);
                this._afterClosed$.complete();
                this._beforeOpen$.complete();
                this._afterOpen$.complete();
                this._beforeClose$.complete();
                this.componentInstance.set(undefined);
            });

        this.overlayRef.keydownEvents()
            .pipe(filter(event => event.keyCode === ESCAPE && !this.disableClose))
            .subscribe(() => this.close());

        if (location) {
            this.locationChanged = location.subscribe(() => {
                if (this.container.config.closeOnNavigation) {
                    this.close();
                }
            });
        }
    }

    public close(dialogResult?: any) {
        if (this.closing) {
            return;
        }
        this.closing = true;
        this.result = dialogResult;

        this.container.animationStateChanged
            .pipe(
                filter(event => event.phaseName === 'start' && event.toState === 'leave'),
                take(1)
            )
            .subscribe(() => {
                this._beforeClose$.next(dialogResult);
                this._beforeClose$.complete();
                this.overlayRef.detachBackdrop();
            });

        this.container.startExitAnimation();
    }

    /**
     * Возвращает Observable нажатий на фон overlay
     */
    public backdropClick(): Observable<any> {
        return this.overlayRef.backdropClick();
    }

    /**
     * Возвращает Observable событий keydown, направленных на overlay
     */
    public keydownEvents(): Observable<KeyboardEvent> {
        return this.overlayRef.keydownEvents();
    }

    /**
     * Обновляет положение диалогового окна
     * @param position Новое положение диалогового окна
     */
    public updatePosition(position?: DialogPosition): this {
        const strategy = this.getPositionStrategy();

        if (position && (position.left || position.right)) {
            position.left ? strategy.left(position.left) : strategy.right(position.right);
        } else {
            strategy.centerHorizontally();
        }

        if (position && (position.top || position.bottom)) {
            position.top ? strategy.top(position.top) : strategy.bottom(position.bottom);
        } else {
            strategy.centerVertically();
        }

        this.overlayRef.updatePosition();

        return this;
    }

    /**
     * Обновляет ширину и высоту диалогового окна
     * @param width Новая ширина диалогового окна
     * @param height Новая высота диалогового окна
     */
    updateSize(width: string = 'auto', height: string = 'auto'): this {
        this.getPositionStrategy().width(width).height(height);
        this.overlayRef.updatePosition();
        return this;
    }

    public isAnimating(): Signal<boolean> {
        return this.container.isAnimating;
    }

    public beforeOpen(): Observable<any> {
        return this._beforeOpen$.asObservable();
    }

    public afterOpen(): Observable<any> {
        return this._afterOpen$.asObservable();
    }

    public beforeClose(): Observable<any> {
        return this._beforeClose$.asObservable();
    }

    public afterClosed(): Observable<any> {
        return this._afterClosed$.asObservable();
    }

    /** Возвращает стратегию позиционирования из ссылки на overlay */
    private getPositionStrategy(): GlobalPositionStrategy {
        return this.overlayRef.getConfig().positionStrategy as GlobalPositionStrategy;
    }
}
