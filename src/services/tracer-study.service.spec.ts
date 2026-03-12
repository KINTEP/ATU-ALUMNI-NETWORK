import { TestBed } from '@angular/core/testing';

import { TracerStudyService } from './tracer-study.service';

describe('TracerStudyService', () => {
  let service: TracerStudyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TracerStudyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
