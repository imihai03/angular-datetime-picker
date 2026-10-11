/**
 * date-time-picker.component.spec
 */

import { DateTime } from 'luxon';
import { OwlDateTimeComponent } from './date-time-picker.component';
import { ComponentFixture, fakeAsync, flush, inject, TestBed } from '@angular/core/testing';
import { ChangeDetectionStrategy, Component, FactoryProvider, provideZoneChangeDetection, Type, ValueProvider, ViewChild } from '@angular/core';
import { OwlDateTimeInputDirective } from './date-time-picker-input.directive';
import { FormsModule, ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { OwlDateTimeModule } from './date-time.module';
import { OverlayContainer } from '@angular/cdk/overlay';
import { OwlLuxonDateTimeModule } from './adapter/luxon-date-time.module';
import { createKeyboardEvent, createTestDateTime, dispatchEvent, dispatchFakeEvent, dispatchKeyboardEvent, dispatchMouseEvent } from '../../test-helpers';
import { ENTER, ESCAPE, RIGHT_ARROW, UP_ARROW } from '@angular/cdk/keycodes';
import { By } from '@angular/platform-browser';
import { OwlDateTimeContainerComponent } from './date-time-picker-container.component';
import { OwlDateTimeTriggerDirective } from './date-time-picker-trigger.directive';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { DateView } from './date-time.class';

const JAN = 0,
    FEB = 1,
    MAR = 2,
    APR = 3,
    MAY = 4,
    JUN = 5,
    JUL = 6,
    AUG = 7,
    SEP = 8,
    OCT = 9,
    NOV = 10,
    DEC = 11;

describe('Компонент OwlDateTimeComponent', () => {
    const SUPPORTS_INTL = typeof Intl !== 'undefined';

    // Создаёт fixture тестового компонента
    function createComponent(
        component: Type<any>,
        imports: Type<any>[] = [],
        providers: (FactoryProvider | ValueProvider)[] = [],
        entryComponents: Type<any>[] = []
    ): ComponentFixture<any> {
        TestBed.configureTestingModule({
            imports: [
                FormsModule,
                OwlDateTimeModule,
                ReactiveFormsModule,
                ...imports
            ],
            providers: [provideZoneChangeDetection(), ...providers],
            declarations: [component, ...entryComponents],
            animationsEnabled: true // Необходимо для анимаций открытия и закрытия контейнера пикера
        });

        TestBed.overrideModule(BrowserDynamicTestingModule, {

        }).compileComponents();

        return TestBed.createComponent(component);
    }

    beforeEach(() => {
        spyOn(HTMLElement.prototype, 'animate').and.callFake(() => {
            return {
                finished: new Promise(resolve => setTimeout(resolve, 100)), // Завершаем анимацию через 100 мс
                play: () => {},
                cancel: () => {}
            } as any;
        });
    });

    afterEach(inject([OverlayContainer], (container: OverlayContainer) => {
        container.ngOnDestroy();
    }));

    describe('С модулем OwlLuxonDateTimeModule', () => {
        describe('Стандартный DateTimePicker', () => {
            let fixture: ComponentFixture<StandardDateTimePickerComponent>;
            let testComponent: StandardDateTimePickerComponent;
            let containerElement: HTMLElement;

            beforeEach(fakeAsync(() => {
                fixture = createComponent(StandardDateTimePickerComponent, [
                    OwlLuxonDateTimeModule
                ]);
                fixture.detectChanges();
                testComponent = fixture.componentInstance;
            }));

            afterEach(fakeAsync(() => {
                testComponent.dateTimePicker.close();
                fixture.detectChanges();
                flush();
            }));

            it('при инициализации отображает правильное значение в поле', () => {
                if (SUPPORTS_INTL) {
                    expect(
                        fixture.nativeElement.querySelector('input').value
                    )
                        .toBe('01.01.2020 00:00');
                }
            });

            it('открывает всплывающий пикер при pickerMode равном "popup"', () => {
                expect(
                    document.querySelector('.cdk-overlay-pane.owl-dt-popup')
                ).toBeNull();

                testComponent.dateTimePicker.open();
                fixture.detectChanges();

                expect(
                    document.querySelector('.cdk-overlay-pane.owl-dt-popup')
                ).not.toBeNull();
            });

            it('открывает диалог при pickerMode равном "dialog"', () => {
                testComponent.pickerMode = 'dialog';
                fixture.detectChanges();

                expect(
                    document.querySelector(
                        '.owl-dt-dialog owl-dialog-container'
                    )
                ).toBeNull();

                testComponent.dateTimePicker.open();
                fixture.detectChanges();

                expect(
                    document.querySelector(
                        '.owl-dt-dialog owl-dialog-container'
                    )
                ).not.toBeNull();
            });

            it('открывает dateTimePicker при входном параметре opened равном true', fakeAsync(() => {
                testComponent.opened = true;
                fixture.detectChanges();
                flush();

                expect(
                    document.querySelector('.owl-dt-container')
                ).not.toBeNull();

                testComponent.opened = false;
                fixture.detectChanges();
                flush();

                expect(document.querySelector('.owl-dt-container')).toBeNull();
            }));

            it('не открывает заблокированный dateTimePicker', () => {
                testComponent.disabled = true;
                fixture.detectChanges();

                expect(document.querySelector('.cdk-overlay-pane')).toBeNull();
                expect(
                    document.querySelector('owl-date-time-container')
                ).toBeNull();

                testComponent.dateTimePicker.open();
                fixture.detectChanges();

                expect(document.querySelector('.cdk-overlay-pane')).toBeNull();
                expect(
                    document.querySelector('owl-date-time-container')
                ).toBeNull();
            });

            it('открывает панель для заблокированного поля, если сам dateTimePicker включён', () => {
                testComponent.dateTimePicker.disabled = false;
                testComponent.dateTimePickerInput.disabled = true;
                fixture.detectChanges();

                expect(document.querySelector('.cdk-overlay-pane')).toBeNull();

                testComponent.dateTimePicker.open();
                fixture.detectChanges();

                expect(
                    document.querySelector('.cdk-overlay-pane')
                ).not.toBeNull();
            });

            it('закрывает всплывающий пикер при вызове close', fakeAsync(() => {
                testComponent.dateTimePicker.open();
                fixture.detectChanges();
                flush();

                const popup = document.querySelector('.cdk-overlay-pane');
                expect(popup).not.toBeNull();
                expect(
                    parseInt(getComputedStyle(popup).height, 10)
                ).not.toBe(0);

                testComponent.dateTimePicker.close();
                fixture.detectChanges();
                flush();

                const newHeight = getComputedStyle(popup).height;
                expect(newHeight).toBe('0px');
            }));

            it('закрывает всплывающий пикер по Escape', fakeAsync(() => {
                testComponent.dateTimePicker.open();
                fixture.detectChanges();
                flush();

                expect(testComponent.dateTimePicker.opened).toBe(
                    true,
                    'Expected dateTimePicker to be open.'
                );

                dispatchKeyboardEvent(document.body, 'keydown', ESCAPE);
                fixture.detectChanges();
                flush();

                expect(testComponent.dateTimePicker.opened).toBe(
                    false,
                    'Expected dateTimePicker to be closed.'
                );
            }));

            it('закрывает диалог при вызове close', fakeAsync(() => {
                testComponent.pickerMode = 'dialog';
                fixture.detectChanges();

                testComponent.dateTimePicker.open();
                fixture.detectChanges();
                flush();

                expect(
                    document.querySelector('owl-dialog-container')
                ).not.toBeNull();

                testComponent.dateTimePicker.close();
                fixture.detectChanges();
                flush();

                expect(
                    document.querySelector('owl-dialog-container')
                ).toBeNull();
            }));

            it('закрывает всплывающую панель при нажатии кнопки отмены', fakeAsync(() => {
                testComponent.dateTimePicker.open();
                fixture.detectChanges();
                flush();
                expect(testComponent.dateTimePicker.opened).toBe(
                    true,
                    'Expected dateTimePicker to be opened.'
                );

                const containerDebugElement = fixture.debugElement.query(
                    By.directive(OwlDateTimeContainerComponent)
                );
                containerElement = containerDebugElement.nativeElement;

                const btns = containerElement.querySelectorAll(
                    '.owl-dt-container-control-button'
                );
                dispatchMouseEvent(btns[0], 'click'); // Кнопка 'Cancel'
                fixture.detectChanges();
                flush();

                expect(testComponent.dateTimePicker.opened).toBe(
                    false,
                    'Expected dateTimePicker to be closed.'
                );
            }));

            it('закрывает всплывающую панель без изменения поля при нажатии кнопки отмены', fakeAsync(() => {
                testComponent.dateTimePicker.open();
                fixture.detectChanges();
                flush();
                expect(testComponent.dateTimePicker.opened).toBe(
                    true,
                    'Expected dateTimePicker to be opened.'
                );

                const containerDebugElement = fixture.debugElement.query(
                    By.directive(OwlDateTimeContainerComponent)
                );
                containerElement = containerDebugElement.nativeElement;

                const monthCell = containerElement.querySelector(
                    '[aria-label="02.01.2020"]'
                );
                (monthCell as HTMLElement).click();
                fixture.detectChanges();

                const btns = containerElement.querySelectorAll(
                    '.owl-dt-container-control-button'
                );
                dispatchMouseEvent(btns[0], 'click'); // Кнопка 'Cancel'
                fixture.detectChanges();
                flush();

                expect(testComponent.dateTimePicker.opened).toBe(
                    false,
                    'Expected dateTimePicker to be closed.'
                );
                expect(testComponent.dateTimePickerInput.value).toEqual(
                    createTestDateTime(2020, JAN, 1)
                ); // Не обновляем значение на выбранное при нажатии
            }));

            it('записывает pickerDateTime в поле и закрывает всплывающую панель при подтверждении', fakeAsync(() => {
                testComponent.dateTimePicker.open();
                fixture.detectChanges();
                flush();
                expect(testComponent.dateTimePicker.opened).toBe(
                    true,
                    'Expected dateTimePicker to be opened.'
                );

                const containerDebugElement = fixture.debugElement.query(
                    By.directive(OwlDateTimeContainerComponent)
                );
                containerElement = containerDebugElement.nativeElement;
                expect(
                    containerDebugElement.componentInstance.pickerDateTime
                ).toEqual(createTestDateTime(2020, JAN, 1));

                const btns = containerElement.querySelectorAll(
                    '.owl-dt-container-control-button'
                );
                dispatchMouseEvent(btns[1], 'click'); // Кнопка 'Set'
                fixture.detectChanges();
                flush();

                expect(testComponent.dateTimePicker.opened).toBe(
                    false,
                    'Expected dateTimePicker to be closed.'
                );
                expect(testComponent.dateTimePickerInput.value).toEqual(
                    createTestDateTime(2020, JAN, 1)
                );
            }));

            it('записывает выбранную дату в поле и закрывает всплывающую панель при подтверждении', fakeAsync(() => {
                testComponent.dateTimePicker.open();
                fixture.detectChanges();
                flush();
                expect(testComponent.dateTimePicker.opened).toBe(
                    true,
                    'Expected dateTimePicker to be opened.'
                );

                const containerDebugElement = fixture.debugElement.query(
                    By.directive(OwlDateTimeContainerComponent)
                );
                containerElement = containerDebugElement.nativeElement;
                expect(
                    containerDebugElement.componentInstance.pickerDateTime
                ).toEqual(createTestDateTime(2020, JAN, 1));

                const monthCell = containerElement.querySelector(
                    '[aria-label="02.01.2020"]'
                );
                (monthCell as HTMLElement).click();
                fixture.detectChanges();

                const btns = containerElement.querySelectorAll(
                    '.owl-dt-container-control-button'
                );
                dispatchMouseEvent(btns[1], 'click'); // Кнопка 'Set'
                fixture.detectChanges();
                flush();

                expect(testComponent.dateTimePicker.opened).toBe(
                    false,
                    'Expected dateTimePicker to be closed.'
                );
                expect(testComponent.dateTimePickerInput.value).toEqual(
                    createTestDateTime(2020, JAN, 2)
                );
            }));

            it('использует значение поля при отсутствии startAt', () => {
                expect(testComponent.dateTimePicker.startAt).toEqual(
                    createTestDateTime(2020, JAN, 1)
                );
            });

            it(
                'связывает поле с owl-date-time-container через aria-owns после открытия всплывающего пикера',
                fakeAsync(() => {
                const inputEl = fixture.debugElement.query(By.css('input'))
                    .nativeElement;
                expect(inputEl.getAttribute('aria-owns')).toBeNull();

                testComponent.dateTimePicker.open();
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                const ownedElementId = inputEl.getAttribute('aria-owns');
                expect(ownedElementId).not.toBeNull();

                const ownedElement = document.getElementById(ownedElementId);
                expect(ownedElement).not.toBeNull();
                expect((ownedElement as Element).tagName.toLowerCase()).toBe(
                    'owl-date-time-container'
                );
            }));

            it('связывает поле с owl-date-time-container через aria-owns после открытия диалога', fakeAsync(() => {
                testComponent.pickerMode = 'dialog';
                fixture.detectChanges();

                const inputEl = fixture.debugElement.query(By.css('input'))
                    .nativeElement;
                expect(inputEl.getAttribute('aria-owns')).toBeNull();

                testComponent.dateTimePicker.open();
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                const ownedElementId = inputEl.getAttribute('aria-owns');
                expect(ownedElementId).not.toBeNull();

                const ownedElement = document.getElementById(ownedElementId);
                expect(ownedElement).not.toBeNull();
                expect((ownedElement as Element).tagName.toLowerCase()).toBe(
                    'owl-date-time-container'
                );
            }));

            it('закрывает всплывающую панель по Alt + ArrowUp', fakeAsync(() => {
                testComponent.dateTimePicker.open();
                fixture.detectChanges();
                flush();

                expect(testComponent.dateTimePicker.opened).toBe(true);

                const event = createKeyboardEvent('keydown', UP_ARROW);
                Object.defineProperty(event, 'altKey', { get: () => true });

                dispatchEvent(document.body, event);
                fixture.detectChanges();
                flush();

                expect(testComponent.dateTimePicker.opened).toBe(false);
            }));

            describe('Только с календарём', () => {
                beforeEach(() => {
                    testComponent.pickerType = 'calendar';
                    fixture.detectChanges();
                });

                it('при инициализации отображает правильное значение в поле', () => {
                    if (SUPPORTS_INTL) {
                        expect(
                            fixture.nativeElement.querySelector('input').value
                        )
                            .toBe('01.01.2020');
                    }
                });

                it('не отображает кнопки управления контейнера', fakeAsync(() => {
                    testComponent.dateTimePicker.open();
                    fixture.detectChanges();
                    flush();
                    expect(testComponent.dateTimePicker.opened).toBe(
                        true,
                        'Expected dateTimePicker to be opened.'
                    );

                    const containerDebugElement = fixture.debugElement.query(
                        By.directive(OwlDateTimeContainerComponent)
                    );
                    containerElement = containerDebugElement.nativeElement;
                    const btns = containerElement.querySelectorAll(
                        '.owl-dt-container-control-button'
                    );

                    expect(btns.length).toBe(0);
                }));

                it(
                    'записывает выбранную дату в поле и закрывает всплывающую панель при нажатии на ячейку',
                    fakeAsync(() => {
                    testComponent.dateTimePicker.open();
                    fixture.detectChanges();
                    flush();
                    expect(testComponent.dateTimePicker.opened).toBe(
                        true,
                        'Expected dateTimePicker to be opened.'
                    );

                    const containerDebugElement = fixture.debugElement.query(
                        By.directive(OwlDateTimeContainerComponent)
                    );
                    containerElement = containerDebugElement.nativeElement;
                    expect(
                        containerDebugElement.componentInstance.pickerDateTime
                    ).toEqual(createTestDateTime(2020, JAN, 1));

                    const dateCell = containerElement.querySelector(
                        '[aria-label="02.01.2020"]'
                    );
                    dispatchMouseEvent(dateCell, 'click');
                    fixture.detectChanges();
                    flush();

                    expect(testComponent.dateTimePicker.opened).toBe(
                        false,
                        'Expected dateTimePicker to be closed.'
                    );
                    expect(testComponent.dateTimePickerInput.value).toEqual(
                        createTestDateTime(2020, JAN, 2)
                    );
                }));

                it(
                    'записывает выбранную дату в поле и закрывает всплывающую панель при выборе ячейки по Enter',
                    fakeAsync(() => {
                        testComponent.dateTimePicker.open();
                        fixture.detectChanges();
                        flush();
                        expect(testComponent.dateTimePicker.opened).toBe(
                            true,
                            'Expected dateTimePicker to be opened.'
                        );

                        const containerDebugElement = fixture.debugElement.query(
                            By.directive(OwlDateTimeContainerComponent)
                        );
                        containerElement = containerDebugElement.nativeElement;
                        expect(
                            containerDebugElement.componentInstance.pickerDateTime
                        ).toEqual(createTestDateTime(2020, JAN, 1));

                        const calendarBodyEl = containerElement.querySelector(
                            '.owl-dt-calendar-body'
                        );

                        dispatchKeyboardEvent(
                            calendarBodyEl,
                            'keydown',
                            RIGHT_ARROW
                        );
                        fixture.detectChanges();
                        flush();
                        dispatchKeyboardEvent(calendarBodyEl, 'keydown', ENTER);
                        fixture.detectChanges();
                        flush();

                        expect(testComponent.dateTimePicker.opened).toBe(
                            false,
                            'Expected dateTimePicker to be closed.'
                        );
                        expect(testComponent.dateTimePickerInput.value).toEqual(
                            createTestDateTime(2020, JAN, 2)
                        );
                    }));

                it('закрывает всплывающую панель при нажатии на выбранную дату', fakeAsync(() => {
                    testComponent.dateTimePicker.open();
                    fixture.detectChanges();
                    flush();
                    expect(testComponent.dateTimePicker.opened).toBe(
                        true,
                        'Expected dateTimePicker to be opened.'
                    );

                    const containerDebugElement = fixture.debugElement.query(
                        By.directive(OwlDateTimeContainerComponent)
                    );
                    containerElement = containerDebugElement.nativeElement;
                    expect(
                        containerDebugElement.componentInstance.pickerDateTime
                    ).toEqual(createTestDateTime(2020, JAN, 1));
                    expect(testComponent.dateTimePicker.selected).toEqual(
                        createTestDateTime(2020, JAN, 1)
                    );

                    const dateCell = containerElement.querySelector(
                        '[aria-label="01.01.2020"]'
                    );
                    dispatchMouseEvent(dateCell, 'click');
                    fixture.detectChanges();
                    flush();

                    expect(testComponent.dateTimePicker.opened).toBe(
                        false,
                        'Expected dateTimePicker to be closed.'
                    );
                    expect(testComponent.dateTimePickerInput.value).toEqual(
                        createTestDateTime(2020, JAN, 1)
                    );
                }));
            });

            describe('Только с таймером', () => {
                beforeEach(() => {
                    testComponent.pickerType = 'timer';
                    fixture.detectChanges();
                });

                it('при инициализации отображает правильное значение в поле', () => {
                    if (SUPPORTS_INTL) {
                        expect(
                            fixture.nativeElement.querySelector('input').value
                        )
                            .toBe('00:00');
                    }
                });

                it('отображает кнопки управления контейнера', fakeAsync(() => {
                    testComponent.dateTimePicker.open();
                    fixture.detectChanges();
                    flush();
                    expect(testComponent.dateTimePicker.opened).toBe(
                        true,
                        'Expected dateTimePicker to be opened.'
                    );

                    const containerDebugElement = fixture.debugElement.query(
                        By.directive(OwlDateTimeContainerComponent)
                    );
                    containerElement = containerDebugElement.nativeElement;
                    const btns = containerElement.querySelectorAll(
                        '.owl-dt-container-control-button'
                    );

                    expect(btns.length).toBe(2);
                }));
            });
        });

        describe('DateTimePicker в режиме диапазона', () => {
            let fixture: ComponentFixture<RangeDateTimePickerComponent>;
            let testComponent: RangeDateTimePickerComponent;
            let containerElement: HTMLElement;

            beforeEach(fakeAsync(() => {
                fixture = createComponent(RangeDateTimePickerComponent, [
                    OwlLuxonDateTimeModule
                ]);
                fixture.detectChanges();
                testComponent = fixture.componentInstance;
            }));

            afterEach(fakeAsync(() => {
                testComponent.dateTimePicker.close();
                fixture.detectChanges();
                flush();
            }));

            it('при инициализации отображает правильное значение в поле', () => {
                if (SUPPORTS_INTL) {
                    expect(
                        fixture.nativeElement.querySelector('input').value
                    )
                        .toBe('01.01.2020 00:00 - 01.02.2020 00:00');
                }
            });

            it('по умолчанию устанавливает activeSelectedIndex равным 0', () => {
                testComponent.dateTimePicker.open();
                fixture.detectChanges();

                const containerDebugElement = fixture.debugElement.query(
                    By.directive(OwlDateTimeContainerComponent)
                );
                expect(
                    containerDebugElement.componentInstance.activeSelectedIndex
                ).toBe(0);
            });

            it('устанавливает rangeFrom при нажатии на ячейку, если обе границы не заполнены', fakeAsync(() => {
                testComponent.dates = [];
                fixture.detectChanges();

                testComponent.dateTimePicker.open();
                fixture.detectChanges();
                flush();

                expect(testComponent.dateTimePicker.selecteds.length).toBe(0);

                const containerDebugElement = fixture.debugElement.query(
                    By.directive(OwlDateTimeContainerComponent)
                );
                containerElement = containerDebugElement.nativeElement;

                const dateCell = containerElement.querySelector(
                    '[aria-label="02.01.2020"]'
                );
                dispatchMouseEvent(dateCell, 'click');
                fixture.detectChanges();
                flush();

                expect(
                    containerDebugElement.componentInstance.activeSelectedIndex
                ).toBe(0);
                expect(testComponent.dateTimePicker.selecteds.length).toBe(2);
                expect(testComponent.dateTimePicker.selecteds[0]).toEqual(
                    createTestDateTime(2020, JAN, 2)
                );
                expect(testComponent.dateTimePicker.selecteds[1]).toBe(null);
            }));

            it('устанавливает rangeFrom при нажатии на ячейку, если обе границы уже заполнены', fakeAsync(() => {
                testComponent.dateTimePicker.open();
                fixture.detectChanges();
                flush();

                expect(testComponent.dateTimePicker.selecteds.length).toBe(2);

                const containerDebugElement = fixture.debugElement.query(
                    By.directive(OwlDateTimeContainerComponent)
                );
                containerElement = containerDebugElement.nativeElement;

                const dateCell = containerElement.querySelector(
                    '[aria-label="02.01.2020"]'
                );
                dispatchMouseEvent(dateCell, 'click');
                fixture.detectChanges();
                flush();

                expect(
                    containerDebugElement.componentInstance.activeSelectedIndex
                ).toBe(0);
                expect(testComponent.dateTimePicker.selecteds.length).toBe(2);
                expect(testComponent.dateTimePicker.selecteds[0]).toEqual(
                    createTestDateTime(2020, JAN, 2)
                );
                expect(testComponent.dateTimePicker.selecteds[1]).toBe(null);
            }));

            it(
                'устанавливает rangeFrom при выборе даты раньше прежней начальной границы',
                fakeAsync(() => {
                    testComponent.dates = [createTestDateTime(2020, JAN, 2), null];
                    fixture.detectChanges();

                    testComponent.dateTimePicker.open();
                    fixture.detectChanges();
                    flush();

                    expect(testComponent.dateTimePicker.selecteds.length).toBe(2);

                    const containerDebugElement = fixture.debugElement.query(
                        By.directive(OwlDateTimeContainerComponent)
                    );
                    containerElement = containerDebugElement.nativeElement;

                    const dateCell = containerElement.querySelector(
                        '[aria-label="01.01.2020"]'
                    );
                    dispatchMouseEvent(dateCell, 'click');
                    fixture.detectChanges();
                    flush();

                    expect(
                        containerDebugElement.componentInstance.activeSelectedIndex
                    ).toBe(0);
                    expect(testComponent.dateTimePicker.selecteds.length).toBe(2);
                    expect(testComponent.dateTimePicker.selecteds[0]).toEqual(
                        createTestDateTime(2020, JAN, 1)
                    );
                    expect(testComponent.dateTimePicker.selecteds[1]).toBe(null);
                }));

            it('устанавливает rangeTo при нажатии на ячейку, если rangeFrom уже заполнен', fakeAsync(() => {
                testComponent.dates = [createTestDateTime(2020, JAN, 2), null];
                fixture.detectChanges();

                testComponent.dateTimePicker.open();
                fixture.detectChanges();
                flush();

                expect(testComponent.dateTimePicker.selecteds.length).toBe(2);

                const containerDebugElement = fixture.debugElement.query(
                    By.directive(OwlDateTimeContainerComponent)
                );
                containerElement = containerDebugElement.nativeElement;

                const dateCell = containerElement.querySelector(
                    '[aria-label="03.01.2020"]'
                );
                dispatchMouseEvent(dateCell, 'click');
                fixture.detectChanges();
                flush();

                expect(
                    containerDebugElement.componentInstance.activeSelectedIndex
                ).toBe(1);
                expect(testComponent.dateTimePicker.selecteds.length).toBe(2);
                expect(testComponent.dateTimePicker.selecteds[0]).toEqual(
                    createTestDateTime(2020, JAN, 2)
                );
                expect(testComponent.dateTimePicker.selecteds[1]).toEqual(
                    createTestDateTime(2020, JAN, 3)
                );
            }));

            it('отображает заданное в startAt начальное время в календаре rangeTo', fakeAsync(() => {
                testComponent.startAt = createTestDateTime('1/19/2020, 09:33 AM');
                testComponent.dateTimePicker.open();
                fixture.detectChanges();
                flush();

                const containerDebugElement = fixture.debugElement.query(
                    By.directive(OwlDateTimeContainerComponent)
                );
                containerElement = containerDebugElement.nativeElement;
                const timeCells = containerElement.querySelectorAll<HTMLInputElement>('.owl-dt-timer-input');

                expect(timeCells[0].value).toEqual('09');
                expect(timeCells[1].value).toEqual('33');
            }));


            it('отображает заданное в endAt конечное время в календаре rangeTo', fakeAsync(() => {
                testComponent.dates = [createTestDateTime(2020, JAN, 2), null];
                testComponent.endAt = createTestDateTime('1/19/2020, 10:55 PM');
                fixture.detectChanges();

                testComponent.dateTimePicker.open();
                fixture.detectChanges();
                flush();

                const containerDebugElement = fixture.debugElement.query(
                    By.directive(OwlDateTimeContainerComponent)
                );
                containerElement = containerDebugElement.nativeElement;
                const dateCell = containerElement.querySelector(
                    '[aria-label="20.01.2020"]'
                );
                dispatchMouseEvent(dateCell, 'click');
                fixture.detectChanges();
                flush();

                const timeCells = containerElement.querySelectorAll<HTMLInputElement>('.owl-dt-timer-input');

                expect(timeCells[0].value).toEqual('22');
                expect(timeCells[1].value).toEqual('55');
            }));

            it('автоматически сохраняет прежнее время при выборе дат', fakeAsync(() => {
                testComponent.dates = [createTestDateTime('1/19/2020, 09:33 AM'), createTestDateTime('1/22/2020, 10:44 PM')];
                testComponent.dateTimePicker.open();
                fixture.detectChanges();

                const containerDebugElement = fixture.debugElement.query(
                    By.directive(OwlDateTimeContainerComponent)
                );
                containerElement = containerDebugElement.nativeElement;
                const dateCell = containerElement.querySelector(
                    '[aria-label="20.01.2020"]'
                );
                dispatchMouseEvent(dateCell, 'click');
                fixture.detectChanges();
                flush();

                const timeInput = containerElement.querySelectorAll<HTMLInputElement>('.owl-dt-timer-input');

                expect(timeInput[0].value).toEqual('09');
                expect(timeInput[1].value).toEqual('33');

            }));

            it('отображает информационную строку контейнера', () => {
                testComponent.dateTimePicker.open();
                fixture.detectChanges();

                const containerDebugElement = fixture.debugElement.query(
                    By.directive(OwlDateTimeContainerComponent)
                );
                containerElement = containerDebugElement.nativeElement;

                const infoRow = containerElement.querySelector(
                    '.owl-dt-container-info'
                );

                expect(infoRow).toBeTruthy();
            });

            it('задаёт activeSelectedIndex при нажатии на переключатель информационной строки', fakeAsync(() => {
                testComponent.dateTimePicker.open();
                fixture.detectChanges();

                const containerDebugElement = fixture.debugElement.query(
                    By.directive(OwlDateTimeContainerComponent)
                );
                containerElement = containerDebugElement.nativeElement;

                const radioBtns = containerElement.querySelectorAll(
                    '.owl-dt-container-range'
                );

                for (let i = 0; i < radioBtns.length; i++) {
                    dispatchMouseEvent(radioBtns[i], 'click');
                    fixture.detectChanges();
                    flush();

                    expect(
                        containerDebugElement.componentInstance
                            .activeSelectedIndex
                    ).toBe(i);
                }
            }));

            describe('Только с календарём', () => {
                beforeEach(() => {
                    testComponent.pickerType = 'calendar';
                    fixture.detectChanges();
                });

                it('при инициализации отображает правильное значение в поле', () => {
                    if (SUPPORTS_INTL) {
                        expect(
                            fixture.nativeElement.querySelector('input').value
                        )
                            .toBe('01.01.2020 - 01.02.2020');
                    }
                });

                it('не закрывает всплывающую панель, если выбрано только значение rangeFrom', fakeAsync(() => {
                    testComponent.dates = [];
                    fixture.detectChanges();

                    testComponent.dateTimePicker.open();
                    fixture.detectChanges();
                    flush();

                    expect(testComponent.dateTimePicker.selecteds.length).toBe(
                        0
                    );

                    const containerDebugElement = fixture.debugElement.query(
                        By.directive(OwlDateTimeContainerComponent)
                    );
                    containerElement = containerDebugElement.nativeElement;

                    const dateCell = containerElement.querySelector(
                        '[aria-label="02.01.2020"]'
                    );
                    dispatchMouseEvent(dateCell, 'click');
                    fixture.detectChanges();
                    flush();

                    expect(testComponent.dateTimePicker.opened).toBe(
                        true,
                        'Expected dateTimePicker to be opened.'
                    );
                }));

                it(
                    'закрывает всплывающую панель после выбора rangeFrom и rangeTo',
                    fakeAsync(() => {
                        testComponent.dates = [];
                        fixture.detectChanges();

                        testComponent.dateTimePicker.open();
                        fixture.detectChanges();
                        flush();

                        expect(testComponent.dateTimePicker.selecteds.length).toBe(
                            0
                        );

                        const containerDebugElement = fixture.debugElement.query(
                            By.directive(OwlDateTimeContainerComponent)
                        );
                        containerElement = containerDebugElement.nativeElement;

                        let dateCell = containerElement.querySelector(
                            '[aria-label="02.01.2020"]'
                        );
                        dispatchMouseEvent(dateCell, 'click');
                        fixture.detectChanges();
                        flush();

                        dateCell = containerElement.querySelector(
                            '[aria-label="03.01.2020"]'
                        );
                        dispatchMouseEvent(dateCell, 'click');
                        fixture.detectChanges();
                        flush();

                        expect(testComponent.dateTimePicker.selecteds.length).toBe(
                            2
                        );
                        expect(testComponent.dateTimePicker.opened).toBe(
                            false,
                            'Expected dateTimePicker to be closed.'
                        );
                    }));
            });
        });

        describe('DateTimePicker с несколькими полями ввода', () => {
            it('выбрасывает ошибку при регистрации нескольких полей', fakeAsync(() => {
                const fixture = createComponent(MultiInputDateTimePickerComponent, [
                    OwlLuxonDateTimeModule
                ]);
                expect(() => fixture.detectChanges()).toThrow();
            }));
        });

        describe('DateTimePicker без поля ввода', () => {
            let fixture: ComponentFixture<NoInputDateTimePickerComponent>;
            let testComponent: NoInputDateTimePickerComponent;

            beforeEach(fakeAsync(() => {
                fixture = createComponent(NoInputDateTimePickerComponent, [
                    OwlLuxonDateTimeModule
                ]);
                fixture.detectChanges();

                testComponent = fixture.componentInstance;
            }));

            afterEach(fakeAsync(() => {
                testComponent.dateTimePicker.close();
                fixture.detectChanges();
            }));

            it('не выбрасывает ошибку при чтении свойства disabled', () => {
                expect(
                    () => testComponent.dateTimePicker.disabled
                ).not.toThrow();
            });

            it('выбрасывает ошибку при открытии без зарегистрированного поля', fakeAsync(() => {
                expect(() => testComponent.dateTimePicker.open()).toThrow();
            }));
        });

        describe('DateTimePicker с параметром startAt', () => {
            let fixture: ComponentFixture<DateTimePickerWithStartAtComponent>;
            let testComponent: DateTimePickerWithStartAtComponent;

            beforeEach(fakeAsync(() => {
                fixture = createComponent(DateTimePickerWithStartAtComponent, [
                    OwlLuxonDateTimeModule
                ]);
                fixture.detectChanges();

                testComponent = fixture.componentInstance;
            }));

            afterEach(fakeAsync(() => {
                testComponent.dateTimePicker.close();
                fixture.detectChanges();
            }));

            it('использует явно заданный startAt вместо значения поля', () => {
                expect(testComponent.dateTimePicker.startAt).toEqual(
                    createTestDateTime(2010, JAN, 1)
                );
            });
        });

        describe('DateTimePicker с параметром startView', () => {
            let fixture: ComponentFixture<DateTimePickerWithStartViewComponent>;
            let testComponent: DateTimePickerWithStartViewComponent;
            let containerDebugElement;
            let containerElement;

            beforeEach(() => {
                fixture = createComponent(DateTimePickerWithStartViewComponent, [
                    OwlLuxonDateTimeModule
                ]);
                fixture.detectChanges();

                testComponent = fixture.componentInstance;
            });

            afterEach(() => {
                testComponent.dateTimePicker.close();
                fixture.detectChanges();
            });

            describe('В режиме year', () => {
                beforeEach(() => {
                    testComponent.startView = DateView.YEAR;
                    fixture.detectChanges();
                });

                it('открывается в представлении года', () => {
                    testComponent.dateTimePicker.open();
                    fixture.detectChanges();

                    containerDebugElement = fixture.debugElement.query(
                        By.directive(OwlDateTimeContainerComponent)
                    );
                    containerElement = containerDebugElement.nativeElement;
                    const yearTable = containerElement.querySelector(
                        'table.owl-dt-calendar-year-table'
                    );
                    expect(yearTable).toBeTruthy();
                });

                it('отправляет monthSelected при выборе месяца в представлении года', fakeAsync(() => {
                    spyOn(testComponent, 'onMonthSelection');
                    expect(
                        testComponent.onMonthSelection
                    ).not.toHaveBeenCalled();

                    testComponent.dateTimePicker.open();
                    fixture.detectChanges();

                    containerDebugElement = fixture.debugElement.query(
                        By.directive(OwlDateTimeContainerComponent)
                    );
                    containerElement = containerDebugElement.nativeElement;
                    const cells = containerElement.querySelectorAll(
                        '.owl-dt-calendar-cell'
                    );

                    dispatchMouseEvent(cells[0], 'click');
                    fixture.detectChanges();
                    flush();

                    expect(testComponent.onMonthSelection).toHaveBeenCalled();
                }));
            });

            describe('В режиме multi-years', () => {
                beforeEach(() => {
                    testComponent.startView = DateView.MULTI_YEARS;
                    fixture.detectChanges();
                });

                it('открывается в представлении нескольких лет', () => {
                    testComponent.dateTimePicker.open();
                    fixture.detectChanges();

                    containerDebugElement = fixture.debugElement.query(
                        By.directive(OwlDateTimeContainerComponent)
                    );
                    containerElement = containerDebugElement.nativeElement;
                    const multiYearTable = containerElement.querySelector(
                        'table.owl-dt-calendar-multi-year-table'
                    );
                    expect(multiYearTable).toBeTruthy();
                });

                it('отправляет yearSelected при выборе года в представлении нескольких лет', fakeAsync(() => {
                    spyOn(testComponent, 'onYearSelection');
                    expect(
                        testComponent.onYearSelection
                    ).not.toHaveBeenCalled();

                    testComponent.dateTimePicker.open();
                    fixture.detectChanges();

                    containerDebugElement = fixture.debugElement.query(
                        By.directive(OwlDateTimeContainerComponent)
                    );
                    containerElement = containerDebugElement.nativeElement;
                    const cells = containerElement.querySelectorAll(
                        '.owl-dt-calendar-cell'
                    );

                    dispatchMouseEvent(cells[0], 'click');
                    fixture.detectChanges();
                    flush();

                    expect(testComponent.onYearSelection).toHaveBeenCalled();
                }));
            });
        });

        describe('DateTimePicker с директивой NgModel', () => {
            let fixture: ComponentFixture<DateTimePickerWithNgModelComponent>;
            let testComponent: DateTimePickerWithNgModelComponent;

            beforeEach(fakeAsync(() => {
                fixture = createComponent(DateTimePickerWithNgModelComponent, [
                    OwlLuxonDateTimeModule
                ]);
                fixture.detectChanges();
                fixture.whenStable().then(() => {
                    fixture.detectChanges();

                    testComponent = fixture.componentInstance;
                });
            }));

            afterEach(fakeAsync(() => {
                testComponent.dateTimePicker.close();
                fixture.detectChanges();
                flush();
            }));

            it('обновляет dateTimePicker при изменении модели', fakeAsync(() => {
                expect(testComponent.dateTimePickerInput.value).toBeNull();
                expect(testComponent.dateTimePicker.selected).toBeNull();

                const selected = createTestDateTime(2017, JAN, 1);
                testComponent.dateTime = selected;
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                expect(testComponent.dateTimePickerInput.value).toEqual(
                    selected
                );
                expect(testComponent.dateTimePicker.selected).toEqual(selected);
            }));

            it('обновляет модель при выборе даты', fakeAsync(() => {
                expect(testComponent.dateTime).toBeNull();
                expect(testComponent.dateTimePickerInput.value).toBeNull();

                const selected = createTestDateTime(2017, JAN, 1);
                testComponent.dateTimePicker.select(selected);
                fixture.detectChanges();
                flush();
                testComponent.dateTimePicker.confirmSelect();
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                expect(testComponent.dateTime).toEqual(selected);
                expect(testComponent.dateTimePickerInput.value).toEqual(
                    selected
                );
            }));

            it('отмечает поле как dirty после события input', () => {
                const inputEl = fixture.debugElement.query(By.css('input'))
                    .nativeElement;

                expect(inputEl.classList).toContain('ng-pristine');

                inputEl.value = '2001-01-01';
                dispatchFakeEvent(inputEl, 'input');
                fixture.detectChanges();

                expect(inputEl.classList).toContain('ng-dirty');
            });

            it('отмечает поле как dirty после выбора даты', fakeAsync(() => {
                const inputEl = fixture.debugElement.query(By.css('input'))
                    .nativeElement;

                expect(inputEl.classList).toContain('ng-pristine');

                testComponent.dateTimePicker.select(createTestDateTime(2017, JAN, 1));
                fixture.detectChanges();
                flush();
                testComponent.dateTimePicker.confirmSelect();
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                expect(inputEl.classList).toContain('ng-dirty');
            }));

            it('не отмечает поле как dirty после изменения модели', fakeAsync(() => {
                const inputEl = fixture.debugElement.query(By.css('input'))
                    .nativeElement;

                expect(inputEl.classList).toContain('ng-pristine');

                testComponent.dateTime = createTestDateTime(2017, JAN, 1);
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                expect(inputEl.classList).toContain('ng-pristine');
            }));

            it('отмечает поле как touched при потере фокуса', () => {
                const inputEl = fixture.debugElement.query(By.css('input'))
                    .nativeElement;

                expect(inputEl.classList).toContain('ng-untouched');

                dispatchFakeEvent(inputEl, 'focus');
                fixture.detectChanges();

                expect(inputEl.classList).toContain('ng-untouched');

                dispatchFakeEvent(inputEl, 'blur');
                fixture.detectChanges();

                expect(inputEl.classList).toContain('ng-touched');
            });

            it('не переформатирует некорректные даты при потере фокуса', () => {
                const inputEl = fixture.debugElement.query(By.css('input'))
                    .nativeElement;

                inputEl.value = 'very-valid-date';
                dispatchFakeEvent(inputEl, 'input');
                fixture.detectChanges();

                dispatchFakeEvent(inputEl, 'blur');
                fixture.detectChanges();

                expect(inputEl.value).toBe('very-valid-date');
            });

            it('отмечает поле как touched при выборе даты в календаре', fakeAsync(() => {
                const inputEl = fixture.debugElement.query(By.css('input'))
                    .nativeElement;

                expect(inputEl.classList).toContain('ng-untouched');

                testComponent.dateTimePicker.select(createTestDateTime(2017, JAN, 1));
                fixture.detectChanges();
                flush();
                testComponent.dateTimePicker.confirmSelect();
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                expect(inputEl.classList).toContain('ng-touched');
            }));

            describe('В режиме range', () => {
                beforeEach(() => {
                    testComponent.selectMode = 'range';
                    fixture.detectChanges();
                    expect(testComponent.dateTimePicker.selectMode).toBe(
                        'range'
                    );
                });

                it('обновляет dateTimePicker при изменении модели', fakeAsync(() => {
                    expect(
                        testComponent.dateTimePickerInput.values.length
                    ).toBe(0);
                    expect(testComponent.dateTimePicker.selecteds.length).toBe(
                        0
                    );

                    const from = createTestDateTime(2017, JAN, 1);
                    const to = createTestDateTime(2017, JAN, 3);
                    testComponent.dateTime = [from, to];
                    fixture.detectChanges();
                    flush();
                    fixture.detectChanges();

                    expect(
                        testComponent.dateTimePickerInput.values.length
                    ).toBe(2);
                    expect(testComponent.dateTimePickerInput.values[0]).toEqual(
                        from
                    );
                    expect(testComponent.dateTimePickerInput.values[1]).toEqual(
                        to
                    );
                    expect(testComponent.dateTimePicker.selecteds.length).toBe(
                        2
                    );
                    expect(testComponent.dateTimePicker.selecteds[0]).toEqual(
                        from
                    );
                    expect(testComponent.dateTimePicker.selecteds[1]).toEqual(
                        to
                    );
                }));

                it('обновляет модель при выборе даты', fakeAsync(() => {
                    expect(testComponent.dateTime).toBeNull();
                    expect(
                        testComponent.dateTimePickerInput.values.length
                    ).toBe(0);

                    const from = createTestDateTime(2017, JAN, 1);
                    const to = createTestDateTime(2017, JAN, 3);
                    testComponent.dateTimePicker.select([from, to]);
                    fixture.detectChanges();
                    flush();
                    testComponent.dateTimePicker.confirmSelect();
                    fixture.detectChanges();
                    flush();
                    fixture.detectChanges();

                    const selected = testComponent.dateTime as DateTime[];
                    expect(selected[0]).toEqual(from);
                    expect(selected[1]).toEqual(to);
                    expect(
                        testComponent.dateTimePickerInput.values.length
                    ).toBe(2);
                    expect(testComponent.dateTimePickerInput.values[0]).toEqual(
                        from
                    );
                    expect(testComponent.dateTimePickerInput.values[1]).toEqual(
                        to
                    );
                }));
            });

            describe('В режиме rangeFrom', () => {
                beforeEach(() => {
                    testComponent.selectMode = 'rangeFrom';
                    fixture.detectChanges();
                    expect(testComponent.dateTimePicker.selectMode).toBe(
                        'rangeFrom'
                    );
                });

                it('обновляет dateTimePicker при изменении модели', fakeAsync(() => {
                    expect(
                        testComponent.dateTimePickerInput.values.length
                    ).toBe(0);
                    expect(testComponent.dateTimePicker.selecteds.length).toBe(
                        0
                    );

                    const from = createTestDateTime(2017, JAN, 1);
                    testComponent.dateTime = [from];
                    fixture.detectChanges();
                    flush();
                    fixture.detectChanges();

                    expect(testComponent.dateTimePickerInput.values[0]).toEqual(
                        from
                    );
                    expect(
                        testComponent.dateTimePickerInput.values[1]
                    ).toBeFalsy();
                    expect(testComponent.dateTimePicker.selecteds[0]).toEqual(
                        from
                    );
                    expect(
                        testComponent.dateTimePicker.selecteds[1]
                    ).toBeFalsy();
                }));

                it('обновляет только fromValue при выборе даты', fakeAsync(() => {
                    const from = createTestDateTime(2017, JAN, 1);
                    const to = createTestDateTime(2017, JAN, 3);
                    testComponent.dateTime = [from, to];
                    fixture.detectChanges();
                    flush();
                    fixture.detectChanges();

                    testComponent.dateTimePicker.open();
                    fixture.detectChanges();
                    flush();

                    const newSelectedFrom = createTestDateTime(2017, JAN, 2);
                    const containerDebugElement = fixture.debugElement.query(
                        By.directive(OwlDateTimeContainerComponent)
                    );
                    containerDebugElement.componentInstance.dateSelected(
                        newSelectedFrom
                    );
                    fixture.detectChanges();
                    flush();
                    testComponent.dateTimePicker.confirmSelect();
                    fixture.detectChanges();
                    flush();
                    fixture.detectChanges();

                    expect(testComponent.dateTimePicker.selecteds[0]).toEqual(
                        newSelectedFrom
                    );
                    expect(testComponent.dateTimePicker.selecteds[1]).toEqual(
                        to
                    );
                    expect(testComponent.dateTimePickerInput.values[0]).toEqual(
                        newSelectedFrom
                    );
                    expect(testComponent.dateTimePickerInput.values[1]).toEqual(
                        to
                    );
                    expect(testComponent.dateTime[0]).toEqual(newSelectedFrom);
                    expect(testComponent.dateTime[1]).toEqual(to);
                }));

                it('обновляет fromValue и сбрасывает toValue в null при выборе даты после toValue', fakeAsync(() => {
                    const from = createTestDateTime(2017, JAN, 1);
                    const to = createTestDateTime(2017, JAN, 3);
                    testComponent.dateTime = [from, to];
                    fixture.detectChanges();
                    flush();
                    fixture.detectChanges();

                    testComponent.dateTimePicker.open();
                    fixture.detectChanges();
                    flush();

                    const newSelectedFrom = createTestDateTime(2017, JAN, 4);
                    const containerDebugElement = fixture.debugElement.query(
                        By.directive(OwlDateTimeContainerComponent)
                    );
                    containerDebugElement.componentInstance.dateSelected(
                        newSelectedFrom
                    );
                    fixture.detectChanges();
                    flush();
                    testComponent.dateTimePicker.confirmSelect();
                    fixture.detectChanges();
                    flush();
                    fixture.detectChanges();

                    expect(testComponent.dateTimePicker.selecteds[0]).toEqual(
                        newSelectedFrom
                    );
                    expect(
                        testComponent.dateTimePicker.selecteds[1]
                    ).toBeFalsy();
                    expect(testComponent.dateTimePickerInput.values[0]).toEqual(
                        newSelectedFrom
                    );
                    expect(
                        testComponent.dateTimePickerInput.values[1]
                    ).toBeFalsy();
                    expect(testComponent.dateTime[0]).toEqual(newSelectedFrom);
                    expect(testComponent.dateTime[1]).toBeFalsy();
                }));
            });

            describe('В режиме rangeTo', () => {
                beforeEach(() => {
                    testComponent.selectMode = 'rangeTo';
                    fixture.detectChanges();
                    expect(testComponent.dateTimePicker.selectMode).toBe(
                        'rangeTo'
                    );
                });

                it('обновляет dateTimePicker при изменении модели', fakeAsync(() => {
                    expect(
                        testComponent.dateTimePickerInput.values.length
                    ).toBe(0);
                    expect(testComponent.dateTimePicker.selecteds.length).toBe(
                        0
                    );

                    const to = createTestDateTime(2017, JAN, 3);
                    testComponent.dateTime = [null, to];
                    fixture.detectChanges();
                    flush();
                    fixture.detectChanges();

                    expect(
                        testComponent.dateTimePickerInput.values[0]
                    ).toBeFalsy();
                    expect(testComponent.dateTimePickerInput.values[1]).toEqual(
                        to
                    );
                    expect(
                        testComponent.dateTimePicker.selecteds[0]
                    ).toBeFalsy();
                    expect(testComponent.dateTimePicker.selecteds[1]).toEqual(
                        to
                    );
                }));

                it('обновляет только toValue при выборе даты', fakeAsync(() => {
                    const from = createTestDateTime(2017, JAN, 1);
                    const to = createTestDateTime(2017, JAN, 3);
                    testComponent.dateTime = [from, to];
                    fixture.detectChanges();
                    flush();
                    fixture.detectChanges();

                    testComponent.dateTimePicker.open();
                    fixture.detectChanges();
                    flush();

                    const newSelectedTo = createTestDateTime(2017, JAN, 4);
                    const containerDebugElement = fixture.debugElement.query(
                        By.directive(OwlDateTimeContainerComponent)
                    );
                    containerDebugElement.componentInstance.dateSelected(
                        newSelectedTo
                    );
                    fixture.detectChanges();
                    flush();
                    testComponent.dateTimePicker.confirmSelect();
                    fixture.detectChanges();
                    flush();
                    fixture.detectChanges();

                    expect(testComponent.dateTimePicker.selecteds[0]).toEqual(
                        from
                    );
                    expect(testComponent.dateTimePicker.selecteds[1]).toEqual(
                        newSelectedTo
                    );
                    expect(testComponent.dateTimePickerInput.values[0]).toEqual(
                        from
                    );
                    expect(testComponent.dateTimePickerInput.values[1]).toEqual(
                        newSelectedTo
                    );
                    expect(testComponent.dateTime[0]).toEqual(from);
                    expect(testComponent.dateTime[1]).toEqual(newSelectedTo);
                }));

                it('обновляет toValue и сбрасывает fromValue в null при выборе даты до fromValue', fakeAsync(() => {
                    const from = createTestDateTime(2017, JAN, 2);
                    const to = createTestDateTime(2017, JAN, 3);
                    testComponent.dateTime = [from, to];
                    fixture.detectChanges();
                    flush();
                    fixture.detectChanges();

                    testComponent.dateTimePicker.open();
                    fixture.detectChanges();
                    flush();

                    const newSelectedTo = createTestDateTime(2017, JAN, 1);
                    const containerDebugElement = fixture.debugElement.query(
                        By.directive(OwlDateTimeContainerComponent)
                    );
                    containerDebugElement.componentInstance.dateSelected(
                        newSelectedTo
                    );
                    fixture.detectChanges();
                    flush();
                    testComponent.dateTimePicker.confirmSelect();
                    fixture.detectChanges();
                    flush();
                    fixture.detectChanges();

                    expect(
                        testComponent.dateTimePicker.selecteds[0]
                    ).toBeFalsy();
                    expect(testComponent.dateTimePicker.selecteds[1]).toEqual(
                        newSelectedTo
                    );
                    expect(
                        testComponent.dateTimePickerInput.values[0]
                    ).toBeFalsy();
                    expect(testComponent.dateTimePickerInput.values[1]).toEqual(
                        newSelectedTo
                    );
                    expect(testComponent.dateTime[0]).toBeFalsy();
                    expect(testComponent.dateTime[1]).toEqual(newSelectedTo);
                }));
            });
        });

        describe('DateTimePicker с контролом FormControl', () => {
            let fixture: ComponentFixture<DateTimePickerWithFormControlComponent>;
            let testComponent: DateTimePickerWithFormControlComponent;

            beforeEach(fakeAsync(() => {
                fixture = createComponent(DateTimePickerWithFormControlComponent, [
                    OwlLuxonDateTimeModule
                ]);
                fixture.detectChanges();

                testComponent = fixture.componentInstance;
            }));

            afterEach(fakeAsync(() => {
                testComponent.dateTimePicker.close();
                fixture.detectChanges();
            }));

            it('обновляет dateTimePicker при изменении formControl', () => {
                expect(testComponent.dateTimePickerInput.value).toBeNull();
                expect(testComponent.dateTimePicker.selected).toBeNull();

                const selected = createTestDateTime(2017, JAN, 1);
                testComponent.formControl.setValue(selected);
                fixture.detectChanges();

                expect(testComponent.dateTimePickerInput.value).toEqual(
                    selected
                );
                expect(testComponent.dateTimePicker.selected).toEqual(selected);
            });

            it('обновляет formControl при выборе даты', fakeAsync(() => {
                expect(testComponent.formControl.value).toBeNull();
                expect(testComponent.dateTimePickerInput.value).toBeNull();

                const selected = createTestDateTime(2017, JAN, 1);
                testComponent.dateTimePicker.select(selected);
                fixture.detectChanges();
                flush();
                testComponent.dateTimePicker.confirmSelect();
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                expect(testComponent.formControl.value).toEqual(selected);
                expect(testComponent.dateTimePickerInput.value).toEqual(
                    selected
                );
            }));

            it('блокирует поле при отключении контрола формы', () => {
                const inputEl = fixture.debugElement.query(By.css('input'))
                    .nativeElement;

                expect(inputEl.disabled).toBe(false);

                testComponent.formControl.disable();
                fixture.detectChanges();

                expect(inputEl.disabled).toBe(true);
            });

            it('блокирует переключатель при отключении контрола формы', () => {
                expect(testComponent.dateTimePickerToggle.disabled).toBe(false);

                testComponent.formControl.disable();
                fixture.detectChanges();

                expect(testComponent.dateTimePickerToggle.disabled).toBe(true);
            });
        });

        describe('DateTimePicker с директивой owlDateTimeTrigger', () => {
            let fixture: ComponentFixture<DateTimePickerWithTriggerComponent>;
            let testComponent: DateTimePickerWithTriggerComponent;

            beforeEach(fakeAsync(() => {
                fixture = createComponent(DateTimePickerWithTriggerComponent, [
                    OwlLuxonDateTimeModule
                ]);
                fixture.detectChanges();

                testComponent = fixture.componentInstance;
            }));

            afterEach(fakeAsync(() => {
                testComponent.dateTimePicker.close();
                fixture.detectChanges();
                flush();
            }));

            it('открывает пикер при нажатии на триггер', () => {
                expect(
                    document.querySelector('owl-date-time-container')
                ).toBeNull();

                const toggle = fixture.debugElement.query(By.css('button'));
                dispatchMouseEvent(toggle.nativeElement, 'click');
                fixture.detectChanges();

                expect(
                    document.querySelector('owl-date-time-container')
                ).not.toBeNull();
            });

            it('не открывает заблокированный dateTimePicker при нажатии на триггер', () => {
                testComponent.dateTimePicker.disabled = true;
                fixture.detectChanges();
                const toggle = fixture.debugElement.query(By.css('button'))
                    .nativeElement;

                expect(toggle.classList).toContain('owl-dt-trigger-disabled');
                expect(
                    document.querySelector('owl-date-time-container')
                ).toBeNull();

                dispatchMouseEvent(toggle, 'click');
                fixture.detectChanges();

                expect(
                    document.querySelector('owl-date-time-container')
                ).toBeNull();
            });

            it('не открывает пикер при нажатии на триггер заблокированного поля', () => {
                expect(testComponent.dateTimePicker.disabled).toBe(false);

                testComponent.dateTimePickerInput.disabled = true;
                fixture.detectChanges();
                const toggle = fixture.debugElement.query(By.css('button'))
                    .nativeElement;

                expect(toggle.classList).toContain('owl-dt-trigger-disabled');
                expect(
                    document.querySelector('owl-date-time-container')
                ).toBeNull();

                dispatchMouseEvent(toggle, 'click');
                fixture.detectChanges();

                expect(
                    document.querySelector('owl-date-time-container')
                ).toBeNull();
            });
        });

        describe('DateTimePicker с проверкой границ min и max', () => {
            let fixture: ComponentFixture<
                DateTimePickerWithMinAndMaxValidationComponent
            >;
            let testComponent: DateTimePickerWithMinAndMaxValidationComponent;
            let minDateTime: DateTime;
            let maxDateTime: DateTime;

            beforeEach(fakeAsync(() => {
                fixture = createComponent(
                    DateTimePickerWithMinAndMaxValidationComponent,
                    [OwlLuxonDateTimeModule]
                );
                fixture.detectChanges();

                testComponent = fixture.componentInstance;

                minDateTime = createTestDateTime(2010, JAN, 1, 0, 30, 30);
                maxDateTime = createTestDateTime(2020, JAN, 1, 23, 30, 30);
                testComponent.min = minDateTime;
                testComponent.max = maxDateTime;
                fixture.detectChanges();
            }));

            afterEach(fakeAsync(() => {
                testComponent.dateTimePicker.close();
                fixture.detectChanges();
                flush();
            }));

            it('использует границы min и max, заданные в поле', () => {
                expect(testComponent.dateTimePicker.minDateTime).toEqual(
                    minDateTime
                );
                expect(testComponent.dateTimePicker.maxDateTime).toEqual(
                    maxDateTime
                );
            });

            it('считает значение невалидным, если оно раньше minDateTime', fakeAsync(() => {
                testComponent.date = createTestDateTime(2009, DEC, 31);
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                expect(
                    fixture.debugElement.query(By.css('input')).nativeElement
                        .classList
                ).toContain('ng-invalid');
            }));

            it('считает значение невалидным, если оно позже maxDateTime', fakeAsync(() => {
                testComponent.date = createTestDateTime(2020, JAN, 2);
                fixture.detectChanges();
                flush();

                fixture.detectChanges();

                expect(
                    fixture.debugElement.query(By.css('input')).nativeElement
                        .classList
                ).toContain('ng-invalid');
            }));

            it('считает значение валидным, если оно равно minDateTime', fakeAsync(() => {
                testComponent.date = createTestDateTime(minDateTime);
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                expect(
                    fixture.debugElement.query(By.css('input')).nativeElement
                        .classList
                ).not.toContain('ng-invalid');
            }));

            it('считает значение валидным, если оно равно maxDateTime', fakeAsync(() => {
                testComponent.date = createTestDateTime(maxDateTime);
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                expect(
                    fixture.debugElement.query(By.css('input')).nativeElement
                        .classList
                ).not.toContain('ng-invalid');
            }));

            it('считает значение валидным между minDateTime и maxDateTime', fakeAsync(() => {
                testComponent.date = createTestDateTime(2010, JAN, 2);
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                expect(
                    fixture.debugElement.query(By.css('input')).nativeElement
                        .classList
                ).not.toContain('ng-invalid');
            }));

            it('блокирует все кнопки уменьшения времени при значении minDateTime', fakeAsync(() => {
                testComponent.date = createTestDateTime(minDateTime);
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                testComponent.dateTimePicker.open();
                fixture.detectChanges();
                flush();
                fixture.detectChanges();
                const calendarDebugElement = fixture.debugElement.query(
                    By.directive(OwlDateTimeContainerComponent)
                );
                const calendarElement = calendarDebugElement.nativeElement;

                const decreaseHourBtn = calendarElement.querySelector(
                    '[aria-label="Minus a hour"]'
                );
                const decreaseMinuteBtn = calendarElement.querySelector(
                    '[aria-label="Minus a minute"]'
                );
                const decreaseSecondBtn = calendarElement.querySelector(
                    '[aria-label="Minus a second"]'
                );
                expect(decreaseHourBtn.hasAttribute('disabled')).toBe(true);
                expect(decreaseMinuteBtn.hasAttribute('disabled')).toBe(true);
                expect(decreaseSecondBtn.hasAttribute('disabled')).toBe(true);
            }));

            it('блокирует все кнопки увеличения времени при значении maxDateTime', fakeAsync(() => {
                testComponent.date = createTestDateTime(maxDateTime);
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                testComponent.dateTimePicker.open();
                fixture.detectChanges();
                flush();
                fixture.detectChanges();
                const calendarDebugElement = fixture.debugElement.query(
                    By.directive(OwlDateTimeContainerComponent)
                );
                const calendarElement = calendarDebugElement.nativeElement;

                const increaseHourBtn = calendarElement.querySelector(
                    '[aria-label="Add a hour"]'
                );
                const increaseMinuteBtn = calendarElement.querySelector(
                    '[aria-label="Add a minute"]'
                );
                const increaseSecondBtn = calendarElement.querySelector(
                    '[aria-label="Add a second"]'
                );
                expect(increaseHourBtn.hasAttribute('disabled')).toBe(true);
                expect(increaseMinuteBtn.hasAttribute('disabled')).toBe(true);
                expect(increaseSecondBtn.hasAttribute('disabled')).toBe(true);
            }));
        });

        describe('DateTimePicker с проверкой фильтра', () => {
            let fixture: ComponentFixture<DateTimePickerWithFilterValidationComponent>;
            let testComponent: DateTimePickerWithFilterValidationComponent;

            beforeEach(fakeAsync(() => {
                fixture = createComponent(DateTimePickerWithFilterValidationComponent, [
                    OwlLuxonDateTimeModule
                ]);
                fixture.detectChanges();
                testComponent = fixture.componentInstance;
            }));

            afterEach(fakeAsync(() => {
                testComponent.dateTimePicker.close();
                fixture.detectChanges();
                flush();
            }));

            it('отмечает поле как невалидное', fakeAsync(() => {
                testComponent.date = createTestDateTime(2017, JAN, 1);
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                expect(
                    fixture.debugElement.query(By.css('input')).nativeElement
                        .classList
                ).toContain('ng-invalid');

                testComponent.date = createTestDateTime(2017, JAN, 2);
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                expect(
                    fixture.debugElement.query(By.css('input')).nativeElement
                        .classList
                ).not.toContain('ng-invalid');
            }));

            it('блокирует ячейки календаря, исключённые фильтром', fakeAsync(() => {
                testComponent.date = createTestDateTime(2017, JAN, 3);
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                testComponent.dateTimePicker.open();
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                expect(
                    document.querySelector('owl-date-time-container')
                ).not.toBeNull();

                const cellOne = document.querySelector(
                    '[aria-label="01.01.2017"]'
                );
                const cellTwo = document.querySelector(
                    '[aria-label="02.01.2017"]'
                );

                expect(cellOne.classList).toContain(
                    'owl-dt-calendar-cell-disabled'
                );
                expect(cellTwo.classList).not.toContain(
                    'owl-dt-calendar-cell-disabled'
                );
            }));
        });

        describe('DateTimePicker с событиями change и input', () => {
            let fixture: ComponentFixture<
                DateTimePickerWithChangeAndInputEventsComponent
            >;
            let testComponent: DateTimePickerWithChangeAndInputEventsComponent;
            let inputEl: HTMLInputElement;

            beforeEach(fakeAsync(() => {
                fixture = createComponent(
                    DateTimePickerWithChangeAndInputEventsComponent,
                    [OwlLuxonDateTimeModule]
                );
                fixture.detectChanges();
                testComponent = fixture.componentInstance;
                inputEl = fixture.debugElement.query(By.css('input'))
                    .nativeElement;

                spyOn(testComponent, 'handleChange');
                spyOn(testComponent, 'handleInput');
                spyOn(testComponent, 'handleDateTimeChange');
                spyOn(testComponent, 'handleDateTimeInput');
            }));

            afterEach(fakeAsync(() => {
                testComponent.dateTimePicker.close();
                fixture.detectChanges();
                flush();
            }));

            it('отправляет input и dateTimeInput при вводе текста', () => {
                expect(testComponent.handleChange).not.toHaveBeenCalled();
                expect(
                    testComponent.handleDateTimeChange
                ).not.toHaveBeenCalled();
                expect(testComponent.handleInput).not.toHaveBeenCalled();
                expect(
                    testComponent.handleDateTimeInput
                ).not.toHaveBeenCalled();

                inputEl.value = '2001-01-01';
                dispatchFakeEvent(inputEl, 'input');
                fixture.detectChanges();

                expect(testComponent.handleChange).not.toHaveBeenCalled();
                expect(
                    testComponent.handleDateTimeChange
                ).not.toHaveBeenCalled();
                expect(testComponent.handleInput).toHaveBeenCalled();
                expect(testComponent.handleDateTimeInput).toHaveBeenCalled();
            });

            it('отправляет change и dateTimeChange при подтверждении введённого текста', () => {
                expect(testComponent.handleChange).not.toHaveBeenCalled();
                expect(
                    testComponent.handleDateTimeChange
                ).not.toHaveBeenCalled();
                expect(testComponent.handleInput).not.toHaveBeenCalled();
                expect(
                    testComponent.handleDateTimeInput
                ).not.toHaveBeenCalled();

                dispatchFakeEvent(inputEl, 'change');
                fixture.detectChanges();

                expect(testComponent.handleChange).toHaveBeenCalled();
                expect(testComponent.handleDateTimeChange).toHaveBeenCalled();
                expect(testComponent.handleInput).not.toHaveBeenCalled();
                expect(
                    testComponent.handleDateTimeInput
                ).not.toHaveBeenCalled();
            });

            it('отправляет dateTimeChange и dateTimeInput при выборе даты в календаре', fakeAsync(() => {
                expect(testComponent.handleChange).not.toHaveBeenCalled();
                expect(
                    testComponent.handleDateTimeChange
                ).not.toHaveBeenCalled();
                expect(testComponent.handleInput).not.toHaveBeenCalled();
                expect(
                    testComponent.handleDateTimeInput
                ).not.toHaveBeenCalled();

                testComponent.dateTimePicker.open();
                fixture.detectChanges();

                expect(
                    document.querySelector('owl-date-time-container')
                ).not.toBeNull();

                const cells = document.querySelectorAll(
                    '.owl-dt-calendar-cell'
                );
                dispatchMouseEvent(cells[0], 'click');
                fixture.detectChanges();
                flush();
                testComponent.dateTimePicker.confirmSelect();
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                expect(testComponent.handleChange).not.toHaveBeenCalled();
                expect(testComponent.handleDateTimeChange).toHaveBeenCalled();
                expect(testComponent.handleInput).not.toHaveBeenCalled();
                expect(testComponent.handleDateTimeInput).toHaveBeenCalled();
            }));

            it('отправляет dateTimeChange и dateTimeInput при изменении часа', fakeAsync(() => {
                expect(testComponent.handleChange).not.toHaveBeenCalled();
                expect(
                    testComponent.handleDateTimeChange
                ).not.toHaveBeenCalled();
                expect(testComponent.handleInput).not.toHaveBeenCalled();
                expect(
                    testComponent.handleDateTimeInput
                ).not.toHaveBeenCalled();

                testComponent.dateTimePicker.open();
                fixture.detectChanges();

                expect(
                    document.querySelector('owl-date-time-container')
                ).not.toBeNull();

                const increaseHourBtn = document.querySelector(
                    '[aria-label="Add a hour"]'
                );
                dispatchMouseEvent(increaseHourBtn, 'click');
                fixture.detectChanges();
                flush();
                testComponent.dateTimePicker.confirmSelect();
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                testComponent.dateTimePicker.open();
                fixture.detectChanges();

                const decreaseHourBtn = document.querySelector(
                    '[aria-label="Minus a hour"]'
                );
                dispatchMouseEvent(decreaseHourBtn, 'click');
                fixture.detectChanges();
                flush();
                testComponent.dateTimePicker.confirmSelect();
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                expect(testComponent.handleChange).not.toHaveBeenCalled();
                expect(
                    testComponent.handleDateTimeChange
                ).toHaveBeenCalledTimes(2);
                expect(testComponent.handleInput).not.toHaveBeenCalled();
                expect(testComponent.handleDateTimeInput).toHaveBeenCalledTimes(
                    2
                );
            }));

            it('отправляет dateTimeChange и dateTimeInput при изменении минуты', fakeAsync(() => {
                expect(testComponent.handleChange).not.toHaveBeenCalled();
                expect(
                    testComponent.handleDateTimeChange
                ).not.toHaveBeenCalled();
                expect(testComponent.handleInput).not.toHaveBeenCalled();
                expect(
                    testComponent.handleDateTimeInput
                ).not.toHaveBeenCalled();

                testComponent.dateTimePicker.open();
                fixture.detectChanges();

                expect(
                    document.querySelector('owl-date-time-container')
                ).not.toBeNull();

                const increaseMinuteBtn = document.querySelector(
                    '[aria-label="Add a minute"]'
                );
                dispatchMouseEvent(increaseMinuteBtn, 'click');
                fixture.detectChanges();
                flush();
                testComponent.dateTimePicker.confirmSelect();
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                testComponent.dateTimePicker.open();
                fixture.detectChanges();

                const decreaseMinuteBtn = document.querySelector(
                    '[aria-label="Minus a minute"]'
                );
                dispatchMouseEvent(decreaseMinuteBtn, 'click');
                fixture.detectChanges();
                flush();
                testComponent.dateTimePicker.confirmSelect();
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                expect(testComponent.handleChange).not.toHaveBeenCalled();
                expect(
                    testComponent.handleDateTimeChange
                ).toHaveBeenCalledTimes(2);
                expect(testComponent.handleInput).not.toHaveBeenCalled();
                expect(testComponent.handleDateTimeInput).toHaveBeenCalledTimes(
                    2
                );
            }));

            it('отправляет dateTimeChange и dateTimeInput при изменении секунды', fakeAsync(() => {
                expect(testComponent.handleChange).not.toHaveBeenCalled();
                expect(
                    testComponent.handleDateTimeChange
                ).not.toHaveBeenCalled();
                expect(testComponent.handleInput).not.toHaveBeenCalled();
                expect(
                    testComponent.handleDateTimeInput
                ).not.toHaveBeenCalled();

                testComponent.dateTimePicker.open();
                fixture.detectChanges();

                expect(
                    document.querySelector('owl-date-time-container')
                ).not.toBeNull();

                const increaseSecondBtn = document.querySelector(
                    '[aria-label="Add a second"]'
                );
                dispatchMouseEvent(increaseSecondBtn, 'click');
                fixture.detectChanges();
                flush();
                testComponent.dateTimePicker.confirmSelect();
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                testComponent.dateTimePicker.open();
                fixture.detectChanges();

                const decreaseSecondBtn = document.querySelector(
                    '[aria-label="Minus a second"]'
                );
                dispatchMouseEvent(decreaseSecondBtn, 'click');
                fixture.detectChanges();
                flush();
                testComponent.dateTimePicker.confirmSelect();
                fixture.detectChanges();
                flush();
                fixture.detectChanges();

                expect(testComponent.handleChange).not.toHaveBeenCalled();
                expect(
                    testComponent.handleDateTimeChange
                ).toHaveBeenCalledTimes(2);
                expect(testComponent.handleInput).not.toHaveBeenCalled();
                expect(testComponent.handleDateTimeInput).toHaveBeenCalledTimes(
                    2
                );
            }));

            it('не отправляет dateTimeInput, если значение не изменилось', () => {
                expect(
                    testComponent.handleDateTimeInput
                ).not.toHaveBeenCalled();

                inputEl.value = '12.12.2012 00:00';
                dispatchFakeEvent(inputEl, 'input');
                fixture.detectChanges();

                expect(testComponent.handleDateTimeInput).toHaveBeenCalledTimes(
                    1
                );
                dispatchFakeEvent(inputEl, 'input');
                fixture.detectChanges();

                expect(testComponent.handleDateTimeInput).toHaveBeenCalledTimes(
                    1
                );
            });
        });

        describe('DateTimePicker со строками ISO', () => {
            let fixture: ComponentFixture<DateTimePickerWithISOStringsComponent>;
            let testComponent: DateTimePickerWithISOStringsComponent;

            beforeEach(fakeAsync(() => {
                fixture = createComponent(DateTimePickerWithISOStringsComponent, [
                    OwlLuxonDateTimeModule
                ]);
                fixture.detectChanges();
                testComponent = fixture.componentInstance;
            }));

            afterEach(fakeAsync(() => {
                testComponent.dateTimePicker.close();
                fixture.detectChanges();
                flush();
            }));

            it('преобразует строки ISO в даты', fakeAsync(() => {
                expect(() => fixture.detectChanges()).not.toThrow();
                flush();
                fixture.detectChanges();

                expect(testComponent.dateTimePicker.startAt).toEqual(
                    createTestDateTime(2017, JUL, 1)
                );
                expect(testComponent.dateTimePickerInput.value).toEqual(
                    createTestDateTime(2017, JUN, 1)
                );
                expect(testComponent.dateTimePickerInput.min).toEqual(
                    createTestDateTime(2017, JAN, 1)
                );
                expect(testComponent.dateTimePickerInput.max).toEqual(
                    createTestDateTime(2017, DEC, 31)
                );
            }));
        });

        describe('DateTimePicker с событиями', () => {
            let fixture: ComponentFixture<DateTimePickerWithEventsComponent>;
            let testComponent: DateTimePickerWithEventsComponent;

            beforeEach(fakeAsync(() => {
                fixture = createComponent(DateTimePickerWithEventsComponent, [
                    OwlLuxonDateTimeModule
                ]);
                fixture.detectChanges();
                testComponent = fixture.componentInstance;
            }));

            afterEach(fakeAsync(() => {
                testComponent.dateTimePicker.close();
                fixture.detectChanges();
                flush();
            }));

            it('отправляет событие при открытии dateTimePicker', fakeAsync(() => {
                testComponent.dateTimePicker.open();
                fixture.detectChanges();
                flush();

                expect(testComponent.openedSpy).toHaveBeenCalled();
            }));

            it('отправляет событие при закрытии dateTimePicker', fakeAsync(() => {
                testComponent.dateTimePicker.open();
                fixture.detectChanges();
                flush();

                testComponent.dateTimePicker.close();
                flush();
                fixture.detectChanges();

                expect(testComponent.closedSpy).toHaveBeenCalled();
            }));
        });
    });

    describe('Без DateTimeAdapter и OWL_DATE_TIME_FORMATS', () => {
        it('выбрасывает ошибку при создании', () => {
            expect(() => createComponent(StandardDateTimePickerComponent)).toThrowError(
                /OwlDateTimePicker: No provider found for .*/
            );
        });
    });
});

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
        <input [owlDateTime]="dt" [value]="date">
        <owl-date-time [opened]="opened"
                       [disabled]="disabled"
                       [pickerType]="pickerType"
                       [pickerMode]="pickerMode" #dt></owl-date-time>
    `
})
class StandardDateTimePickerComponent {
    date: DateTime | null = createTestDateTime(2020, JAN, 1);
    pickerType = 'both';
    pickerMode = 'popup';
    opened = false;
    disabled = false;
    @ViewChild('dt', { static: true })
    dateTimePicker: OwlDateTimeComponent<DateTime>;
    @ViewChild(OwlDateTimeInputDirective, { static: true })
    dateTimePickerInput: OwlDateTimeInputDirective<DateTime>;
}

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
        <input [owlDateTime]="dt" [selectMode]="selectMode" [values]="dates">
        <owl-date-time [startAt]="startAt" [endAt]="endAt"
                       [pickerType]="pickerType" #dt></owl-date-time>
    `
})
class RangeDateTimePickerComponent {
     dates: DateTime[] | null = [createTestDateTime(2020, JAN, 1), createTestDateTime(2020, FEB, 1)];
    selectMode = 'range';
    pickerType = 'both';
    startAt = createTestDateTime(2020, JAN, 1);
    endAt = createTestDateTime(2020, JAN, 2);
    @ViewChild('dt', { static: true })
    dateTimePicker: OwlDateTimeComponent<DateTime>;
    @ViewChild(OwlDateTimeInputDirective, { static: true })
    dateTimePickerInput: OwlDateTimeInputDirective<DateTime>;
}

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
        <input [owlDateTime]="dt">
        <input [owlDateTime]="dt">
        <owl-date-time #dt></owl-date-time>
    `
})
class MultiInputDateTimePickerComponent { }

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
        <owl-date-time #dt></owl-date-time>
    `
})
class NoInputDateTimePickerComponent {
    @ViewChild('dt', { static: true })
    dateTimePicker: OwlDateTimeComponent<DateTime>;
}

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
        <input [owlDateTime]="dt" [value]="date">
        <owl-date-time #dt [startAt]="startDate"></owl-date-time>
    `
})
class DateTimePickerWithStartAtComponent {
    date = createTestDateTime(2020, JAN, 1);
    startDate = createTestDateTime(2010, JAN, 1);
    @ViewChild('dt', { static: true })
    dateTimePicker: OwlDateTimeComponent<DateTime>;
}

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
        <input [owlDateTime]="dt" [value]="date">
        <owl-date-time #dt [startView]="startView"
                       (monthSelected)="onMonthSelection()"
                       (yearSelected)="onYearSelection()"></owl-date-time>
    `
})
class DateTimePickerWithStartViewComponent {
    date = createTestDateTime(2020, JAN, 1);
    startView = 'month';
    @ViewChild('dt', { static: true })
    dateTimePicker: OwlDateTimeComponent<DateTime>;

    onMonthSelection() { }

    onYearSelection() { }
}

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
        <input [(ngModel)]="dateTime" [selectMode]="selectMode" [owlDateTime]="dt">
        <owl-date-time #dt></owl-date-time>
    `
})
class DateTimePickerWithNgModelComponent {
    dateTime: DateTime[] | DateTime | null = null;
    selectMode = 'single';
    @ViewChild('dt', { static: true })
    dateTimePicker: OwlDateTimeComponent<DateTime>;
    @ViewChild(OwlDateTimeInputDirective, { static: true })
    dateTimePickerInput: OwlDateTimeInputDirective<DateTime>;
}

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
        <input [formControl]="formControl"
               [owlDateTime]="dt"
               [owlDateTimeTrigger]="dt">
        <owl-date-time #dt></owl-date-time>
    `
})
class DateTimePickerWithFormControlComponent {
    formControl = new UntypedFormControl();
    @ViewChild('dt', { static: true })
    dateTimePicker: OwlDateTimeComponent<DateTime>;
    @ViewChild(OwlDateTimeInputDirective, { static: true })
    dateTimePickerInput: OwlDateTimeInputDirective<DateTime>;
    @ViewChild(OwlDateTimeTriggerDirective, { static: true })
    dateTimePickerToggle: OwlDateTimeTriggerDirective<DateTime>;
}

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
        <input [owlDateTime]="dt">
        <button [owlDateTimeTrigger]="dt">Icon</button>
        <owl-date-time #dt></owl-date-time>
    `
})
class DateTimePickerWithTriggerComponent {
    @ViewChild('dt', { static: true })
    dateTimePicker: OwlDateTimeComponent<DateTime>;
    @ViewChild(OwlDateTimeInputDirective, { static: true })
    dateTimePickerInput: OwlDateTimeInputDirective<DateTime>;
}

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
        <input [(ngModel)]="date" [min]="min" [max]="max"
               [owlDateTime]="dt"
               [owlDateTimeTrigger]="dt">
        <owl-date-time [showSecondsTimer]="true" #dt></owl-date-time>
    `
})
class DateTimePickerWithMinAndMaxValidationComponent {
    @ViewChild('dt', { static: true })
    dateTimePicker: OwlDateTimeComponent<DateTime>;
    @ViewChild(OwlDateTimeInputDirective, { static: true })
    dateTimePickerInput: OwlDateTimeInputDirective<DateTime>;
    @ViewChild(OwlDateTimeTriggerDirective, { static: true })
    dateTimePickerToggle: OwlDateTimeTriggerDirective<DateTime>;

    date: DateTime | null;
    min: DateTime;
    max: DateTime;
}

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
        <input [(ngModel)]="date"
               [owlDateTimeFilter]="filter"
               [owlDateTime]="dt"
               [owlDateTimeTrigger]="dt">
        <owl-date-time [showSecondsTimer]="true" #dt></owl-date-time>
    `
})
class DateTimePickerWithFilterValidationComponent {
    @ViewChild('dt', { static: true })
    dateTimePicker: OwlDateTimeComponent<DateTime>;
    @ViewChild(OwlDateTimeInputDirective, { static: true })
    dateTimePickerInput: OwlDateTimeInputDirective<DateTime>;
    @ViewChild(OwlDateTimeTriggerDirective, { static: true })
    dateTimePickerToggle: OwlDateTimeTriggerDirective<DateTime>;
    date: DateTime;
    filter = (date: DateTime) => date.day !== 1;
}

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
        <input [owlDateTime]="dt"
               [owlDateTimeTrigger]="dt"
               (change)="handleChange()"
               (input)="handleInput()"
               (dateTimeChange)="handleDateTimeChange()"
               (dateTimeInput)="handleDateTimeInput()">
        <owl-date-time [showSecondsTimer]="true" #dt></owl-date-time>
    `
})
class DateTimePickerWithChangeAndInputEventsComponent {
    @ViewChild('dt', { static: true })
    dateTimePicker: OwlDateTimeComponent<DateTime>;
    @ViewChild(OwlDateTimeInputDirective, { static: true })
    dateTimePickerInput: OwlDateTimeInputDirective<DateTime>;
    @ViewChild(OwlDateTimeTriggerDirective, { static: true })
    dateTimePickerToggle: OwlDateTimeTriggerDirective<DateTime>;

    handleChange() { }

    handleInput() { }

    handleDateTimeChange() { }

    handleDateTimeInput() { }
}

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
    <input [owlDateTime]="dt" [(ngModel)]="value" [min]="min" [max]="max">
    <owl-date-time #dt [startAt]="startAt"></owl-date-time>
  `
})
class DateTimePickerWithISOStringsComponent {
    value = createTestDateTime(2017, JUN, 1).toISO();
    min = createTestDateTime(2017, JAN, 1).toISO();
    max = createTestDateTime(2017, DEC, 31).toISO();
    startAt = createTestDateTime(2017, JUL, 1).toISO();
    @ViewChild('dt', { static: true })
    dateTimePicker: OwlDateTimeComponent<DateTime>;
    @ViewChild(OwlDateTimeInputDirective, { static: true })
    dateTimePickerInput: OwlDateTimeInputDirective<DateTime>;
}

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false,
    template: `
    <input [(ngModel)]="selected" [owlDateTime]="dt">
    <owl-date-time (afterPickerOpen)="openedSpy()" (afterPickerClosed)="closedSpy()" #dt></owl-date-time>
  `
})
class DateTimePickerWithEventsComponent {
    selected: DateTime | null = null;
    openedSpy = jasmine.createSpy('opened spy');
    closedSpy = jasmine.createSpy('closed spy');
    @ViewChild('dt', { static: true })
    dateTimePicker: OwlDateTimeComponent<DateTime>;
}
