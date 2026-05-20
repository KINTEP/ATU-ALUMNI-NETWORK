// self-register.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-self-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './self-register.component.html'
})
export class SelfRegisterComponent {
  step = 1;

  // Returned from Stage 1
  verifiedToken = '';
  verifiedName = '';

  // Forms
  verifyForm: FormGroup;
  registerForm: FormGroup;

  isLoading = false;
  errorMessage = '';

  showPassword = false;
  showConfirm = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    
    // Replace verifyForm definition
    this.verifyForm = this.fb.group({
      index_number:    ['', [Validators.required, Validators.minLength(3)]],
      full_name:       ['', [Validators.required, Validators.minLength(3)]],
      graduation_year: ['', [Validators.required, Validators.min(1990), 
                            Validators.max(new Date().getFullYear())]]
    });

    this.registerForm = this.fb.group({
      email:        ['', [Validators.required, Validators.email]],
      phone_number: [''],
      password:     ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: AbstractControl) {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirm_password')?.value;
    return pass === confirm ? null : { passwordMismatch: true };
  }

  onVerify(): void {
  if (this.verifyForm.invalid) { this.verifyForm.markAllAsTouched(); return; }

  this.isLoading = true;
  this.errorMessage = '';

  const { index_number, full_name, graduation_year } = this.verifyForm.value;

  this.authService.verifyAlumni({ 
    index_number, 
    full_name,       // ← was first_name + last_name
    graduation_year 
  }).subscribe({
    next: (response) => {
      this.isLoading = false;
      if (response.success && response.data) {
        this.verifiedToken = response.data.verified_token;
        this.verifiedName = response.data.first_name;
        this.step = 2;
      }
    },
    error: (err) => {
      this.isLoading = false;
      this.errorMessage = err.error?.error || 'Verification failed. Please check your details.';
    }
  });
}

  onRegister(): void {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password, phone_number } = this.registerForm.value;

    this.authService.selfRegister({ 
      verified_token: this.verifiedToken, 
      email, 
      password, 
      phone_number: phone_number || undefined 
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Registration failed. Please try again.';
      }
    });
  }

  goBack(): void { this.step = 1; this.errorMessage = ''; }
  get f() { return this.verifyForm.controls; }
  get r() { return this.registerForm.controls; }
}