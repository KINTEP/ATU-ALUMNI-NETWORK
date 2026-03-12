import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminTracerAnalyticsComponent } from './admin-tracer-analytics.component';

describe('AdminTracerAnalyticsComponent', () => {
  let component: AdminTracerAnalyticsComponent;
  let fixture: ComponentFixture<AdminTracerAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTracerAnalyticsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminTracerAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
