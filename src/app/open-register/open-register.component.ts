// src/app/open-register/open-register.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, OpenRegisterRequest } from '../../services/auth.service';
import { PROGRAMME_LEVELS, PROGRAMMES, ProgrammeLevel, Programme } from './programme-data';

@Component({
  selector: 'app-open-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './open-register.component.html'
})
export class OpenRegisterComponent {
  registerForm: FormGroup;
  isLoading      = false;
  errorMessage   = '';
  successMessage = '';
  showPassword   = false;
  showConfirm    = false;
  graduationYears: number[] = [];

  // Static programme data from ATU records
  readonly programLevels: ProgrammeLevel[] = PROGRAMME_LEVELS;
  filteredPrograms: Programme[] = PROGRAMMES; // all shown until level chosen

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1990; y--) {
      this.graduationYears.push(y);
    }

    this.registerForm = this.fb.group({
      first_name:       ['', [Validators.required, Validators.minLength(2)]],
      last_name:        ['', [Validators.required, Validators.minLength(2)]],
      email:            ['', [Validators.required, Validators.email]],
      phone_number:     [''],
      student_id:       [''],
      level:            [''],
      program_of_study: [''],
      graduation_year:  ['', [Validators.required,
                               Validators.min(1990),
                               Validators.max(currentYear)]],
      password:         ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  onLevelChange(event: Event): void {
    const selectedCode = (event.target as HTMLSelectElement).value;
    this.registerForm.patchValue({ program_of_study: '' });

    if (!selectedCode) {
      this.filteredPrograms = PROGRAMMES;
    } else {
      this.filteredPrograms = PROGRAMMES.filter(p => p.level === selectedCode);
    }
  }

  passwordMatchValidator(group: AbstractControl) {
    const pass    = group.get('password')?.value;
    const confirm = group.get('confirm_password')?.value;
    return pass === confirm ? null : { passwordMismatch: true };
  }

  get f() { return this.registerForm.controls; }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage  = '';
    this.successMessage = '';

    const {
      first_name, last_name, email, phone_number,
      student_id, level, program_of_study, graduation_year, password
    } = this.registerForm.value;

    const payload: OpenRegisterRequest = {
      firstName:      first_name,
      lastName:       last_name,
      email,
      password,
      phoneNumber:    phone_number     || undefined,
      studentId:      student_id       || undefined,
      level:          level            || undefined,
      programOfStudy: program_of_study || undefined,
      graduationYear: graduation_year  || undefined
    };

    this.authService.openRegister(payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = 'Account created! A welcome email has been sent. Redirecting to login…';
          setTimeout(() => this.router.navigate(['/login']), 2500);
        }
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 429) {
          this.errorMessage = 'Too many registration attempts from this location. Please try again in an hour.';
        } else if (err.status === 409) {
          this.errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (err.status === 400) {
          this.errorMessage = err.error?.error || err.error?.message || 'Please check your details and try again.';
        } else {
          this.errorMessage = err.error?.message || err.error?.error || err.message || 'Registration failed. Please try again.';
        }
      }
    });
  }
}