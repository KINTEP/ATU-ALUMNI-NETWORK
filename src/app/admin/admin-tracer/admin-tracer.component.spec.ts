import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminTracerComponent } from './admin-tracer.component';

describe('AdminTracerComponent', () => {
  let component: AdminTracerComponent;
  let fixture: ComponentFixture<AdminTracerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTracerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminTracerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
