/**
 * dialog.service
 */

import { ComponentRef, Inject, Injectable, InjectionToken, Injector, Optional, SkipSelf, TemplateRef } from '@angular/core';
import { Location } from '@angular/common';
import { OwlDialogConfig, OwlDialogConfigInterface } from './dialog-config.class';
import { OwlDialogRef } from './dialog-ref.class';
import { OwlDialogContainerComponent } from './dialog-container.component';
import { extendObject } from '../utils';
import { defer, Observable, Subject } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { Overlay, OverlayConfig, OverlayContainer, OverlayRef, ScrollStrategy } from '@angular/cdk/overlay';
import { ComponentPortal, ComponentType } from '@angular/cdk/portal';

export const OWL_DIALOG_DATA = new InjectionToken<any>('OwlDialogData');

/**
 * Токен DI, определяющий обработку прокрутки при открытом диалоговом окне
 * */
export const OWL_DIALOG_SCROLL_STRATEGY = new InjectionToken<
    () => ScrollStrategy
>('owl-dialog-scroll-strategy');

export function OWL_DIALOG_SCROLL_STRATEGY_PROVIDER_FACTORY(
    overlay: Overlay
): () => ScrollStrategy {
    const fn = () => overlay.scrollStrategies.block();
    return fn;
}

/** @docs-private */
export const OWL_DIALOG_SCROLL_STRATEGY_PROVIDER = {
    provide: OWL_DIALOG_SCROLL_STRATEGY,
    deps: [Overlay],
    useFactory: OWL_DIALOG_SCROLL_STRATEGY_PROVIDER_FACTORY
};

/**
 * Токен DI для задания параметров диалогового окна по умолчанию
 * */
export const OWL_DIALOG_DEFAULT_OPTIONS = new InjectionToken<OwlDialogConfig>(
    'owl-dialog-default-options'
);

@Injectable()
export class OwlDialogService {
    /**
     * Поток событий завершения закрытия всех диалоговых окон
     * Если открытых окон нет, событие отправляется сразу при подписке
     */

    afterAllClosed: Observable<{}> = defer(
        () =>
            this.openDialogs.length
                ? this._afterAllClosed
                : this._afterAllClosed.pipe(startWith(undefined))
    );
    private readonly _ariaHiddenElements = new Map<Element, string | null>();

    private _openDialogsAtThisLevel: OwlDialogRef<any>[] = [];
    private _beforeOpenAtThisLevel = new Subject<OwlDialogRef<any>>();
    private _afterOpenAtThisLevel = new Subject<OwlDialogRef<any>>();
    private _afterAllClosedAtThisLevel = new Subject<void>();

    /** Хранит текущие открытые диалоговые окна */
    get openDialogs(): OwlDialogRef<any>[] {
        return this.parentDialog
            ? this.parentDialog.openDialogs
            : this._openDialogsAtThisLevel;
    }

    /** Поток событий открытия диалогового окна */
    get beforeOpen(): Subject<OwlDialogRef<any>> {
        return this.parentDialog
            ? this.parentDialog.beforeOpen
            : this._beforeOpenAtThisLevel;
    }

    /** Поток событий открытия диалогового окна */
    get afterOpen(): Subject<OwlDialogRef<any>> {
        return this.parentDialog
            ? this.parentDialog.afterOpen
            : this._afterOpenAtThisLevel;
    }

    get _afterAllClosed(): any {
        const parent = this.parentDialog;
        return parent
            ? parent._afterAllClosed
            : this._afterAllClosedAtThisLevel;
    }

    private get ariaHiddenElements(): Map<Element, string | null> {
        return this.parentDialog ? this.parentDialog.ariaHiddenElements : this._ariaHiddenElements;
    }

    private readonly scrollStrategy: () => ScrollStrategy;

    constructor(
        private overlay: Overlay,
        private injector: Injector,
        @Optional() private location: Location,
        @Inject(OWL_DIALOG_SCROLL_STRATEGY) scrollStrategy: any,
        @Optional()
        @Inject(OWL_DIALOG_DEFAULT_OPTIONS)
        private defaultOptions: OwlDialogConfigInterface,
        @Optional()
        @SkipSelf()
        private parentDialog: OwlDialogService,
        private overlayContainer: OverlayContainer
    ) {
        this.scrollStrategy = scrollStrategy;
    }

    public open<T>(
        componentOrTemplateRef: ComponentType<T> | TemplateRef<T>,
        config?: OwlDialogConfigInterface
    ): OwlDialogRef<any> {
        config = applyConfigDefaults(config, this.defaultOptions);

        if (config.id && this.getDialogById(config.id)) {
            throw Error(
                `Dialog with id "${
                    config.id
                }" exists already. The dialog id must be unique.`
            );
        }

        const overlayRef = this.createOverlay(config);
        const dialogContainer = this.attachDialogContainer(overlayRef, config);
        const dialogRef = this.attachDialogContent<T>(
            componentOrTemplateRef,
            dialogContainer,
            overlayRef,
            config
        );

        if (!this.openDialogs.length) {
            this.hideNonDialogContentFromAssistiveTechnology();
        }

        this.openDialogs.push(dialogRef);
        dialogRef
            .afterClosed()
            .subscribe(() => this.removeOpenDialog(dialogRef));
        this.beforeOpen.next(dialogRef);
        this.afterOpen.next(dialogRef);
        return dialogRef;
    }

    /**
     * Закрывает все открытые диалоговые окна
     */
    public closeAll(): void {
        let i = this.openDialogs.length;

        while (i--) {
            this.openDialogs[i].close();
        }
    }

    /**
     * Находит открытое диалоговое окно по ID
     * @param id ID искомого диалогового окна
     */
    public getDialogById(id: string): OwlDialogRef<any> | undefined {
        return this.openDialogs.find(dialog => dialog.id === id);
    }

    private attachDialogContent<T>(
        componentOrTemplateRef: ComponentType<T> | TemplateRef<T>,
        dialogContainer: OwlDialogContainerComponent,
        overlayRef: OverlayRef,
        config: OwlDialogConfigInterface
    ) {
        const dialogRef = new OwlDialogRef<T>(
            overlayRef,
            dialogContainer,
            config.id,
            this.location
        );

        if (config.hasBackdrop) {
            overlayRef.backdropClick().subscribe(() => {
                if (!dialogRef.disableClose) {
                    dialogRef.close();
                }
            });
        }

        if (componentOrTemplateRef instanceof TemplateRef) {
        } else {
            const injector = this.createInjector<T>(
                config,
                dialogRef,
                dialogContainer
            );
            const contentRef = dialogContainer.attachComponentPortal(
                new ComponentPortal(componentOrTemplateRef, undefined, injector)
            );
            dialogRef.componentInstance.set(contentRef.instance);
        }

        dialogRef
            .updateSize(config.width, config.height)
            .updatePosition(config.position);

        return dialogRef;
    }

    private createInjector<T>(
        config: OwlDialogConfigInterface,
        dialogRef: OwlDialogRef<T>,
        dialogContainer: OwlDialogContainerComponent
    ) {
        const userInjector =
            config?.viewContainerRef?.injector;
        const providers = [
            { provide: OwlDialogRef, useValue: dialogRef },
            { provide: OwlDialogContainerComponent, useValue: dialogContainer },
            { provide: OWL_DIALOG_DATA, useValue: config?.data },
        ];

        return Injector.create({
            providers,
            parent: userInjector || this.injector,
        });
    }

    private createOverlay(config: OwlDialogConfigInterface): OverlayRef {
        const overlayConfig = this.getOverlayConfig(config);
        return this.overlay.create(overlayConfig);
    }

    private attachDialogContainer(
        overlayRef: OverlayRef,
        config: OwlDialogConfigInterface
    ): OwlDialogContainerComponent {
        const containerPortal = new ComponentPortal(
            OwlDialogContainerComponent,
            config.viewContainerRef
        );
        const containerRef: ComponentRef<
            OwlDialogContainerComponent
        > = overlayRef.attach(containerPortal);
        containerRef.instance.setConfig(config);

        return containerRef.instance;
    }

    private getOverlayConfig(dialogConfig: OwlDialogConfigInterface): OverlayConfig {
        const state = new OverlayConfig({
            positionStrategy: this.overlay.position().global(),
            scrollStrategy:
                dialogConfig.scrollStrategy || this.scrollStrategy(),
            panelClass: dialogConfig.paneClass,
            hasBackdrop: dialogConfig.hasBackdrop,
            minWidth: dialogConfig.minWidth,
            minHeight: dialogConfig.minHeight,
            maxWidth: dialogConfig.maxWidth,
            maxHeight: dialogConfig.maxHeight
        });

        if (dialogConfig.backdropClass) {
            state.backdropClass = dialogConfig.backdropClass;
        }

        return state;
    }

    private removeOpenDialog(dialogRef: OwlDialogRef<any>): void {
        const index = this.openDialogs.indexOf(dialogRef);

        if (index > -1) {
            this.openDialogs.splice(index, 1);
            // Если все диалоговые окна закрыты, удаляем или восстанавливаем `aria-hidden`
            // у соседних элементов и отправляем событие в поток `afterAllClosed`
            if (!this.openDialogs.length) {
                this.ariaHiddenElements.forEach((previousValue, element) => {
                    if (previousValue) {
                        element.setAttribute('aria-hidden', previousValue);
                    } else {
                        element.removeAttribute('aria-hidden');
                    }
                });

                this.ariaHiddenElements.clear();
                this._afterAllClosed.next();
            }
        }
    }

    /**
     * Скрывает от вспомогательных технологий всё содержимое за пределами overlay
     */
    private hideNonDialogContentFromAssistiveTechnology() {
        const overlayContainer = this.overlayContainer.getContainerElement();

        // Проверяем, что контейнер overlay подключён к DOM
        if (overlayContainer.parentElement) {
            const siblings = overlayContainer.parentElement.children;

            for (let i = siblings.length - 1; i > -1; i--) {
                const sibling = siblings[i];

                if (
                    sibling !== overlayContainer &&
                    sibling.nodeName !== 'SCRIPT' &&
                    sibling.nodeName !== 'STYLE' &&
                    !sibling.hasAttribute('aria-live')
                ) {
                    this.ariaHiddenElements.set(
                        sibling,
                        sibling.getAttribute('aria-hidden')
                    );
                    sibling.setAttribute('aria-hidden', 'true');
                }
            }
        }
    }
}

/**
 * Применяет параметры по умолчанию к конфигурации диалогового окна
 * @param config Изменяемая конфигурация
 * @param defaultOptions Параметры конфигурации по умолчанию
 * @returns Новый объект конфигурации
 */
function applyConfigDefaults(
    config?: OwlDialogConfigInterface,
    defaultOptions?: OwlDialogConfigInterface
): OwlDialogConfig {
    return extendObject(new OwlDialogConfig(), defaultOptions, config);
}
