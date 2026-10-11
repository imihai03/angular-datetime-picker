/**
 * dialog-container.component
 */

import { Component, ComponentRef, ElementRef, EmbeddedViewRef, EventEmitter, Inject, OnDestroy, OnInit, Optional, signal, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { BasePortalOutlet, CdkPortalOutlet, ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { OwlDateTimeContainerComponent } from '../date-time/date-time-picker-container.component';
import { IDateTimePickerAnimationEvent } from '../date-time/date-time-picker-animation-event';
import { OwlDialogConfigInterface } from './dialog-config.class';

@Component({
    selector: 'owl-dialog-container',
    templateUrl: './dialog-container.component.html',
    standalone: false,
    host: {
        '[class.owl-dialog-container]': 'owlDialogContainerClass',
        '[attr.tabindex]': 'owlDialogContainerTabIndex',
        '[attr.id]': 'owlDialogContainerId',
        '[attr.role]': 'owlDialogContainerRole',
        '[attr.aria-labelledby]': 'owlDialogContainerAriaLabelledby',
        '[attr.aria-describedby]': 'owlDialogContainerAriaDescribedby'
    }
})
export class OwlDialogContainerComponent extends BasePortalOutlet
    implements OnInit, OnDestroy {
    @ViewChild(CdkPortalOutlet, { static: true })
    portalOutlet: CdkPortalOutlet | null = null;

    /** ID элемента, используемого как заголовок диалогового окна */
    public ariaLabelledBy: string | null = null;
    /** Событие изменения состояния анимации */
    public animationStateChanged = new EventEmitter<IDateTimePickerAnimationEvent>();
    /** Класс, удерживающий фокус внутри диалогового окна и управляющий им */
    private focusTrap: FocusTrap;
    private contentAnimationSubscription = Subscription.EMPTY;
    private exiting = false;
    private destroyed = false;

    public isAnimating = signal(false);

    private _config: OwlDialogConfigInterface;
    private _component: ComponentRef<unknown>;
    get config(): OwlDialogConfigInterface {
        return this._config;
    }
    // Для анимации
    private params: any = {
        x: '0px',
        y: '0px',
        ox: '50%',
        oy: '50%',
        scale: 0
    };

    // Сохраняет элемент, находившийся в фокусе до открытия диалогового окна
    // Позволяет вернуть фокус на этот элемент после закрытия окна
    private elementFocusedBeforeDialogWasOpened: HTMLElement | null = null;

    get owlDialogContainerClass(): boolean {
        return true;
    }

    get owlDialogContainerTabIndex(): number {
        return -1;
    }

    get owlDialogContainerId(): string {
        return this._config.id;
    }

    get owlDialogContainerRole(): string {
        return this._config.role || null;
    }

    get owlDialogContainerAriaLabelledby(): string {
        return this.ariaLabelledBy;
    }

    get owlDialogContainerAriaDescribedby(): string {
        return this._config.ariaDescribedBy || null;
    }

    constructor(
        private elementRef: ElementRef,
        private focusTrapFactory: FocusTrapFactory,
        @Optional()
        @Inject(DOCUMENT)
        private document: any,
    ) {
        super();
    }

    public ngOnInit() {}

    public ngOnDestroy(): void {
        this.destroyed = true;
        this.contentAnimationSubscription.unsubscribe();
        this.restoreFocus();
        this.animationStateChanged.complete();
    }

    /**
     * Подключает ComponentPortal как содержимое контейнера диалогового окна
     */
    public attachComponentPortal<T>(
        portal: ComponentPortal<T>,
    ): ComponentRef<T> {
        if (this.portalOutlet.hasAttached()) {
            throw Error(
                'Attempting to attach dialog content after content is already attached',
            );
        }

        this.savePreviouslyFocusedElement();
        const component = this.portalOutlet.attachComponentPortal(portal);
        const pickerContainer = component.instance as OwlDateTimeContainerComponent<unknown>;
        this.contentAnimationSubscription = pickerContainer.animationStateChanged.subscribe(state => {
            if (state.phaseName === 'start') {
                this.onAnimationStart(state);
            } else {
                this.onAnimationDone(state);
            }
        });
        this._component = component;
        return component;
    }

    public attachTemplatePortal<C>(
        portal: TemplatePortal<C>,
    ): EmbeddedViewRef<C> {
        throw new Error('Method not implemented.');
    }

    public setConfig(config: OwlDialogConfigInterface): void {
        this._config = config;

        if (config.event) {
            this.calculateZoomOrigin(config.event);
        }
    }

    public onAnimationStart(event: IDateTimePickerAnimationEvent): void {
        if (this.exiting && event.toState === 'enter') {
            return;
        }
        this.isAnimating.set(true);
        this.animationStateChanged.emit(event);
    }

    public onAnimationDone(event: IDateTimePickerAnimationEvent): void {
        if (this.exiting && event.toState === 'enter') {
            return;
        }
        if (event.toState === 'enter') {
            this.trapFocus();
        } else if (event.toState === 'leave') {
            this.restoreFocus();
        }

        this.animationStateChanged.emit(event);
        this.isAnimating.set(false);
    }

    public startExitAnimation() {
        this.exiting = true;
        this._component.destroy();
    }

    /**
     * Вычисляет точку начала, используемую в `zoomFadeInFrom()`,
     * Для анимации
     */
    private calculateZoomOrigin(event: any): void {
        if (!event) {
            return;
        }

        const clientX = event.clientX;
        const clientY = event.clientY;

        const wh = window.innerWidth / 2;
        const hh = window.innerHeight / 2;
        const x = clientX - wh;
        const y = clientY - hh;
        const ox = clientX / window.innerWidth;
        const oy = clientY / window.innerHeight;

        this.params.x = `${x}px`;
        this.params.y = `${y}px`;
        this.params.ox = `${ox * 100}%`;
        this.params.oy = `${oy * 100}%`;
        this.params.scale = 0;

        return;
    }

    /**
     * Сохраняет элемент, находившийся в фокусе до открытия диалогового окна
     */
    private savePreviouslyFocusedElement(): void {
        if (this.document) {
            this.elementFocusedBeforeDialogWasOpened = this.document
                .activeElement as HTMLElement;

            Promise.resolve()
                .then(() => {
                    if (!this.destroyed && !this.exiting) {
                        this.elementRef.nativeElement.focus();
                    }
                });
        }
    }

    private trapFocus(): void {
        if (!this.focusTrap) {
            this.focusTrap = this.focusTrapFactory.create(
                this.elementRef.nativeElement,
            );
        }

        if (this._config.autoFocus) {
            this.focusTrap.focusInitialElementWhenReady();
        }
    }

    private restoreFocus(): void {
        const toFocus = this.elementFocusedBeforeDialogWasOpened;

        // Дополнительная проверка нужна, поскольку IE иногда задаёт `activeElement` равным null
        const activeElement = this.document?.activeElement;
        if (toFocus && typeof toFocus.focus === 'function' &&
            (!activeElement || activeElement === this.document.body ||
                this.elementRef.nativeElement.contains(activeElement))) {
            toFocus.focus();
        }

        if (this.focusTrap) {
            this.focusTrap.destroy();
            this.focusTrap = null;
        }
        this.elementFocusedBeforeDialogWasOpened = null;
    }
}
