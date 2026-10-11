import { Component, EventEmitter, Injector, OnDestroy, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideLocationMocks, SpyLocation } from '@angular/common/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { IDateTimePickerAnimationEvent } from '../date-time/date-time-picker-animation-event';
import { OwlDialogModule } from './dialog.module';
import { OWL_DIALOG_DEFAULT_OPTIONS, OwlDialogService } from './dialog.service';

@Component({ standalone: true, template: '<button>Dialog content</button>' })
class AnimatedDialogContent implements OnDestroy {
    readonly animationStateChanged = new EventEmitter<IDateTimePickerAnimationEvent>();

    ngOnDestroy(): void {
        this.animationStateChanged.emit({ phaseName: 'start', toState: 'leave' });
        queueMicrotask(() => this.animationStateChanged.emit({ phaseName: 'done', toState: 'leave' }));
    }
}

describe('Жизненный цикл OwlDialogService', () => {
    let service: OwlDialogService;
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [OwlDialogModule, AnimatedDialogContent],
            providers: [
                provideZonelessChangeDetection(), provideLocationMocks(),
                { provide: OWL_DIALOG_DEFAULT_OPTIONS, useValue: { disableClose: true, autoFocus: false } }
            ]
        });
        service = TestBed.inject(OwlDialogService);
    });
    afterEach(async () => {
        service.closeAll();
        await Promise.resolve();
        TestBed.inject(OverlayContainer)
            .ngOnDestroy();
    });

    it('отдаёт приоритет явно заданным параметрам перед внедрёнными значениями по умолчанию', () => {
        const ref = service.open(AnimatedDialogContent, { disableClose: false });
        expect(ref.disableClose)
            .toBeFalse();
    });

    it('сохраняет открытыми диалоги с соответствующей настройкой навигации', async () => {
        const keep = service.open(AnimatedDialogContent, { closeOnNavigation: false });
        const close = service.open(AnimatedDialogContent, { closeOnNavigation: true });
        (TestBed.inject(Location) as SpyLocation).simulateUrlPop('/next');
        await Promise.resolve();
        expect(service.openDialogs)
            .toEqual([keep]);
        expect(close.componentInstance())
            .toBeUndefined();
    });

    it('удаляет диалоги дочернего сервиса из общего реестра и восстанавливает состояние доступности', async () => {
        const sibling = document.createElement('main');
        sibling.setAttribute('aria-hidden', 'false');
        document.body.appendChild(sibling);
        const childInjector = Injector.create({ providers: [OwlDialogService], parent: TestBed.inject(Injector) });
        try {
            const parentRef = service.open(AnimatedDialogContent);
            const child = childInjector.get(OwlDialogService);
            const childRef = child.open(AnimatedDialogContent);
            expect(service.openDialogs.length)
                .toBe(2);
            expect(sibling.getAttribute('aria-hidden'))
                .toBe('true');
            parentRef.close();
            await Promise.resolve();
            expect(service.openDialogs)
                .toEqual([childRef]);
            childRef.close();
            await Promise.resolve();
            expect(service.openDialogs)
                .toEqual([]);
            expect(sibling.getAttribute('aria-hidden'))
                .toBe('false');
        } finally {
            childInjector.destroy();
            sibling.remove();
        }
    });

    it('не отправляет начальный afterAllClosed, пока диалог родительского сервиса открыт', () => {
        service.open(AnimatedDialogContent);
        const childInjector = Injector.create({ providers: [OwlDialogService], parent: TestBed.inject(Injector) });
        try {
            const callback = jasmine.createSpy('afterAllClosed');
            const subscription = childInjector.get(OwlDialogService)
                .afterAllClosed
                .subscribe(callback);
            expect(callback)
                .not
                .toHaveBeenCalled();
            subscription.unsubscribe();
        } finally {
            childInjector.destroy();
        }
    });

    it('не забирает фокус у нового оверлея после закрытия старого диалога', async () => {
        const previous = document.createElement('button');
        const next = document.createElement('button');
        document.body.append(previous, next);
        try {
            previous.focus();
            const ref = service.open(AnimatedDialogContent);
            await Promise.resolve();
            next.focus();
            ref.close();
            await Promise.resolve();
            expect(document.activeElement)
                .toBe(next);
        } finally {
            previous.remove();
            next.remove();
        }
    });

    it('игнорирует устаревшее завершение анимации открытия после начала закрытия', async () => {
        const ref = service.open(AnimatedDialogContent);
        const content = ref.componentInstance();
        const afterOpen = jasmine.createSpy('afterOpen');
        ref.afterOpen()
            .subscribe(afterOpen);
        ref.close();
        content.animationStateChanged.emit({ phaseName: 'done', toState: 'enter' });
        await Promise.resolve();
        expect(afterOpen)
            .not
            .toHaveBeenCalled();
    });

    it('отслеживает начало и завершение анимации и однократно отправляет первый результат закрытия', async () => {
        const ref = service.open(AnimatedDialogContent);
        const content = ref.componentInstance();
        content.animationStateChanged.emit({ phaseName: 'start', toState: 'enter' });
        expect(ref.isAnimating()())
            .toBeTrue();
        content.animationStateChanged.emit({ phaseName: 'done', toState: 'enter' });
        expect(ref.isAnimating()())
            .toBeFalse();
        const beforeClose = jasmine.createSpy('beforeClose');
        const closed = jasmine.createSpy('afterClosed');
        ref.beforeClose()
            .subscribe(beforeClose);
        ref.afterClosed()
            .subscribe(closed);
        ref.close('first');
        ref.close('second');
        await Promise.resolve();
        expect(beforeClose)
            .toHaveBeenCalledOnceWith('first');
        expect(closed)
            .toHaveBeenCalledOnceWith('first');
    });
});
