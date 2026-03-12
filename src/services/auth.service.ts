import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

import { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse,
  ChangePasswordRequest,
  PasswordResetRequest,
  ResetPasswordRequest
} from '../models/user';
import { ApiResponse } from '../models/api-response';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    // Load user from localStorage on service initialization (only in browser)
    if (this.isBrowser) {
      this.loadUserFromStorage();
    }
  }

  /**
   * Register a new user
   */
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setSession(response.data.token, response.data.user);
          }
        })
      );
  }

  /**
   * Login user
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setSession(response.data.token, response.data.user);
          }
        })
      );
  }

  /**
   * Get current user profile
   */
  getMe(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.currentUserSubject.next(response.data);
            if (this.isBrowser) {
              localStorage.setItem('currentUser', JSON.stringify(response.data));
            }
          }
        })
      );
  }

  /**
   * Change password
   */
  changePassword(data: ChangePasswordRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/change-password`, data);
  }

  /**
   * Request password reset
   */
  requestPasswordReset(data: PasswordResetRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/request-password-reset`, data);
  }

  /**
   * Reset password with token
   */
  resetPassword(data: ResetPasswordRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/reset-password`, data);
  }

  /**
   * Verify email
   */
  verifyEmail(token: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/verify-email`, { token });
  }

  /**
   * Logout user
   */
  logout(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/logout`, {})
      .pipe(
        tap(() => {
          this.clearSession();
        })
      );
  }

  /**
   * Set user session (save token and user data)
   */
  private setSession(token: string, user: User): void {
    if (this.isBrowser) {
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  /**
   * Clear user session
   */
  private clearSession(): void {
    if (this.isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
  }

  /**
   * Load user from localStorage (browser only)
   */
  private loadUserFromStorage(): void {
    if (!this.isBrowser) return;

    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing user from localStorage', error);
        this.clearSession();
      }
    }
  }

  /**
   * Get authentication token (browser only)
   */
  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('token');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'admin';
  }

  /**
   * Get current user value (synchronous)
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  updateCurrentUser(user: User): void {
  if (this.isBrowser) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
  this.currentUserSubject.next(user);
}

/**
 * Get current user ID (synchronous)
 */
getCurrentUserId(): number | null {
  const user = this.currentUserSubject.value;
  return user?.id || null;
}

}