import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuggestedNetworksComponent } from './suggested-networks.component';

describe('SuggestedNetworksComponent', () => {
  let component: SuggestedNetworksComponent;
  let fixture: ComponentFixture<SuggestedNetworksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuggestedNetworksComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuggestedNetworksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
