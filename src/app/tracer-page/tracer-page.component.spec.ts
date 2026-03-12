import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TracerPageComponent } from './tracer-page.component';

describe('TracerPageComponent', () => {
  let component: TracerPageComponent;
  let fixture: ComponentFixture<TracerPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TracerPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TracerPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
