import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminTracerReportsComponent } from './admin-tracer-reports.component';

describe('AdminTracerReportsComponent', () => {
  let component: AdminTracerReportsComponent;
  let fixture: ComponentFixture<AdminTracerReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTracerReportsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminTracerReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
