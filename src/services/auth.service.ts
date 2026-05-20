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
    if (this.isBrowser) {
      this.loadUserFromStorage();
    }
  }

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

  logout(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/logout`, {})
      .pipe(
        tap(() => {
          this.clearSession();
        })
      );
  }

  private setSession(token: string, user: User): void {
    if (this.isBrowser) {
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  clearSession(): void { // ← changed from private so interceptor can call it
    if (this.isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
  }

  private loadUserFromStorage(): void {
    if (!this.isBrowser) return;

    const token = localStorage.getItem('token');
    
    // ✅ Clear session immediately if token is already expired on app load
    if (token && this.isTokenExpired(token)) {
      this.clearSession();
      return;
    }

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

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('token');
  }

  /**
   * ✅ Decode JWT and check expiry against current time
   */
  /**
 * ✅ Decode JWT manually — no external library needed
 */
isTokenExpired(token?: string): boolean {
  const t = token ?? this.getToken();
  if (!t) return true;

  try {
    // JWT is 3 base64 parts: header.payload.signature
    const payload = t.split('.')[1];

    // Fix base64 padding if needed
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');

    const decoded = JSON.parse(atob(padded));

    // exp is in seconds, Date.now() is in milliseconds
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true; // treat malformed token as expired
  }
}

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'admin';
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  updateCurrentUser(user: User): void {
    if (this.isBrowser) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  getCurrentUserId(): number | null {
    const user = this.currentUserSubject.value;
    return user?.id || null;
  }

  verifyAlumni(data: { 
    index_number: string; 
    full_name: string;        // ← replaced first_name + last_name
    graduation_year: number 
}): Observable<ApiResponse<{ 
    verified_token: string; 
    first_name: string; 
    last_name: string; 
    graduation_year: number 
}>> {
    return this.http.post<any>(`${this.apiUrl}/verify-alumni`, data);
}

  selfRegister(data: { 
      verified_token: string; 
      email: string; 
      password: string; 
      phone_number?: string 
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
}