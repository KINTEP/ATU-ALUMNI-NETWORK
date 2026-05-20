import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  newPassword: string = '';
  confirmPassword: string = '';
  token: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;
  tokenMissing: boolean = false;

  // Password strength
  passwordStrength: 'weak' | 'fair' | 'strong' | '' = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Read token from URL query param: /reset-password?token=xxx
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.tokenMissing = true;
    }
  }

  checkPasswordStrength(): void {
    const p = this.newPassword;
    if (!p) { this.passwordStrength = ''; return; }

    const hasUpper = /[A-Z]/.test(p);
    const hasLower = /[a-z]/.test(p);
    const hasNumber = /[0-9]/.test(p);
    const hasSpecial = /[^A-Za-z0-9]/.test(p);
    const score = [hasUpper, hasLower, hasNumber, hasSpecial, p.length >= 8].filter(Boolean).length;

    if (score <= 2) this.passwordStrength = 'weak';
    else if (score <= 3) this.passwordStrength = 'fair';
    else this.passwordStrength = 'strong';
  }

  get strengthColor(): string {
    return {
      weak: 'bg-red-500',
      fair: 'bg-amber-400',
      strong: 'bg-green-500',
      '': 'bg-gray-200'
    }[this.passwordStrength];
  }

  get strengthWidth(): string {
    return { weak: 'w-1/3', fair: 'w-2/3', strong: 'w-full', '': 'w-0' }[this.passwordStrength];
  }

  get strengthLabel(): string {
    return { weak: 'Weak', fair: 'Fair', strong: 'Strong', '': '' }[this.passwordStrength];
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Please fill in both password fields';
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.isLoading = true;

    this.authService.resetPassword({ token: this.token, new_password: this.newPassword })
      .subscribe({
        next: () => {
          this.successMessage = 'Your password has been reset successfully.';
          // Redirect to login after 3 seconds
          setTimeout(() => this.router.navigate(['/login']), 3000);
        },
        error: (error) => {
          this.errorMessage = error.error?.error || 'Failed to reset password. The link may have expired.';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  toggleNewPassword(): void { this.showNewPassword = !this.showNewPassword; }
  toggleConfirmPassword(): void { this.showConfirmPassword = !this.showConfirmPassword; }
}