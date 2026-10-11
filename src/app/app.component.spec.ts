import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('Компонент AppComponent', () => {
  beforeEach(() => {
    TestBed
      .configureTestingModule({ imports: [AppComponent] })
      .compileComponents();
  });

    it('создаёт приложение', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });
});
