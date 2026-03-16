import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  sessionExpiredMessage: string = ''; // ✅ new
  showPassword: boolean = false;
  emailError: string = '';
  passwordError: string = '';
  private returnUrl: string = '/home'; // ✅ new

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute // ✅ new
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
      return;
    }

    // ✅ Read returnUrl and session_expired reason from interceptor redirect
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/home';
    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'session_expired') {
      this.sessionExpiredMessage = 'Your session has expired. Please sign in again.';
    }
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.sessionExpiredMessage = ''; // ✅ clear on new attempt

    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both email and password';
      return;
    }

    this.isLoading = true;

    this.authService.login({ email: this.email, password: this.password })
      .subscribe({
        next: (response) => {
          const user = this.authService.getCurrentUser();
          if (user?.role === 'admin') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate([this.returnUrl]); // ✅ redirect to where they were
          }
        },
        error: (error) => {
          // ✅ backend error is in error.error.error, not error.message
          this.errorMessage = error.error?.error || 'Invalid email or password';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}