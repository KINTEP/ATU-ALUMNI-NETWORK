import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  showPassword: boolean = false;
  emailError: string = '';
  passwordError: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // If user is already logged in, redirect to home
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }

  onSubmit(): void {
    // Reset error message
    this.errorMessage = '';

    // Validate inputs
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both email and password';
      return;
    }

    // Set loading state
    this.isLoading = true;

    // Call login service
    this.authService.login({ email: this.email, password: this.password })
      .subscribe({
        next: (response) => {
          console.log('Login successful:', response);
          
          // Check user role and redirect accordingly
          const user = this.authService.getCurrentUser();
          if (user?.role === 'admin') {
            this.router.navigate(['admin/dashboard']);
          } else {
            this.router.navigate(['/home']);
          }
        },
        error: (error) => {
          console.error('Login error:', error);
          this.errorMessage = error.message || 'Invalid email or password';
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