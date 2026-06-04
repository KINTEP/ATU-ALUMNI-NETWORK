// src/services/auth.service.ts
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

// ── Open-registration payload (no verified_token required) ──────────────────
export interface OpenRegisterRequest {
  firstName:       string;
  lastName:        string;
  email:           string;
  password:        string;
  phoneNumber?:    string;
  studentId?:      string;
  level?:          string;        // ← add
  programOfStudy?: string;
  graduationYear?: number;
}

// ── Response shape for open registration (no token; user must log in) ────────
export interface OpenRegisterResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id:                string;
      email:             string;
      firstName:         string;
      lastName:          string;
      fullName:          string;
      role:              string;
      isVerified:        boolean;
      isActive:          boolean;
      profileCompletion: number;
      createdAt:         string;
    };
    // Note: tokens intentionally omitted — user must log in after registration
  };
}

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
    if (this.isBrowser) {
      this.loadUserFromStorage();
    }
  }

  // ── Existing self-register flow (2-step, verify-first) ────────────────────

  /**
   * Stage 1 of the original self-register flow.
   * Verifies the alumni record exists before allowing account creation.
   */
  verifyAlumni(data: {
    index_number:    string;
    full_name:       string;
    graduation_year: number;
  }): Observable<ApiResponse<{
    verified_token:  string;
    first_name:      string;
    last_name:       string;
    graduation_year: number;
  }>> {
    return this.http.post<any>(`${this.apiUrl}/verify-alumni`, data);
  }

  /**
   * Stage 2 of the original self-register flow.
   * Uses the verified_token from Stage 1 to complete registration.
   * Auto-logs the user in on success.
   */
  selfRegister(data: {
    verified_token: string;
    email:          string;
    password:       string;
    phone_number?:  string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/self-register`, data)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setSession(response.data.token, response.data.user);
          }
        })
      );
  }

  // ── New open-registration flow (single form, no pre-verification) ──────────

  /**
   * Open registration — anyone can sign up.
   * Deliberately does NOT auto-login; user is redirected to /login after success.
   * Backend sends a welcome email on success.
   */
  openRegister(data: OpenRegisterRequest): Observable<OpenRegisterResponse> {
    return this.http.post<OpenRegisterResponse>(`${this.apiUrl}/register`, data);
    // No tap/setSession here — the component handles the redirect to /login
  }

  // ── Existing authenticated-user registration (admin creates a user) ────────

  /**
   * Admin-initiated user creation (used in AddUserComponent).
   * Auto-logs in the newly created session if a token is returned.
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

  // ── Auth ──────────────────────────────────────────────────────────────────

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

  logout(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/logout`, {})
      .pipe(
        tap(() => this.clearSession())
      );
  }

  // ── Current user ──────────────────────────────────────────────────────────

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

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserId(): number | null {
    return this.currentUserSubject.value?.id ?? null;
  }

  updateCurrentUser(user: User): void {
    if (this.isBrowser) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  // ── Password management ───────────────────────────────────────────────────

  changePassword(data: ChangePasswordRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/change-password`, data);
  }

  requestPasswordReset(data: PasswordResetRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/request-password-reset`, data);
  }

  resetPassword(data: ResetPasswordRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/reset-password`, data);
  }

  verifyEmail(token: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/verify-email`, { token });
  }

  // ── Session helpers ───────────────────────────────────────────────────────

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  isAdmin(): boolean {
    return this.currentUserSubject.value?.role === 'admin';
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem('token') : null;
  }

  isTokenExpired(token?: string): boolean {
    const t = token ?? this.getToken();
    if (!t) return true;

    try {
      const payload = t.split('.')[1];
      const base64  = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded  = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
      const decoded = JSON.parse(atob(padded));
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true; // malformed token → treat as expired
    }
  }

  // ← kept public so the HTTP interceptor can call it on 401
  clearSession(): void {
    if (this.isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
  }

  private setSession(token: string, user: User): void {
    if (this.isBrowser) {
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('token');

    if (token && this.isTokenExpired(token)) {
      this.clearSession();
      return;
    }

    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        this.currentUserSubject.next(JSON.parse(userStr));
      } catch {
        this.clearSession();
      }
    }
  }
}