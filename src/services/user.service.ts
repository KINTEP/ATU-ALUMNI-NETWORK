// src/app/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, CreateUserRequest, UserQueryParams } from '../models/user';
import { ApiResponse } from '../models/api-response';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  /**
   * Get all users with filters
   */
  getAllUsers(params?: UserQueryParams): Observable<ApiResponse<User[]>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = (params as any)[key];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<User[]>>(this.apiUrl, { params: httpParams });
  }

  /**
   * Get user by ID
   */
  getUserById(id: number): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new user (Admin only)
   */
  createUser(userData: CreateUserRequest): Observable<ApiResponse<any>> {
    const payload = {
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      other_name: userData.other_name,
      phone_number: userData.phone_number,
      graduation_year: userData.graduation_year,
      program_of_study: userData.program_of_study,
      major: userData.major,
      faculty: userData.faculty,
      department: userData.department,
      current_company: userData.current_company,
      job_title: userData.job_title,
      current_city: userData.current_city,
      current_country: userData.current_country,
      sendCredentials: userData.send_welcome_email !== false,
      notifyVia: 'both'
    };

    return this.http.post<ApiResponse<any>>(
      `${environment.apiUrl}/admin/users/add-alumni`, 
      payload
    );
  }

  /**
   * Register user via auth endpoint
   */
  registerUser(userData: CreateUserRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/auth/register`, {
      email: userData.email,
      password: userData.password,
      first_name: userData.first_name,
      last_name: userData.last_name,
      other_name: userData.other_name,
      phone_number: userData.phone_number,
      role: userData.role || 'alumni'
    });
  }

  /**
   * Update user profile
   */
  updateUser(id: number, data: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Delete user (Admin only)
   */
  deleteUser(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${environment.apiUrl}/admin/users/${id}`);
  }

  /**
   * Reactivate user (Admin only)
   */
  reactivateUser(id: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${environment.apiUrl}/admin/users/${id}/reactivate`, {});
  }

  /**
   * Get user stats
   */
  getUserStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/stats/overview`);
  }

  /**
   * Upload profile picture
   * Returns the relative URL path
   */
 
  /**
   * Upload cover photo
   * Returns the relative URL path
   */
  uploadCoverPhoto(file: File): Observable<ApiResponse<{url: string; filename: string}>> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<ApiResponse<{url: string; filename: string; size: number; mimetype: string}>>(
      `${environment.apiUrl}/upload/cover-photo`, 
      formData
    ).pipe(
      map(response => {
        // Backend returns: /uploads/profiles/filename.jpg
        // We need to convert to: /api/uploads/profiles/filename.jpg
        if (response.success && response.data) {
          response.data.url = `/api${response.data.url}`;
        }
        return response;
      })
    );
  }

  /**
   * Get full image URL
   * Helper method to convert relative path to absolute URL
   */
 

  /**
   * Delete uploaded file
   */
  deleteUploadedFile(filename: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${environment.apiUrl}/upload/${filename}`);
  }


  



  // Add these methods to your UserService class

/**
 * Get base URL without /api suffix
 */
getBaseUrl(): string {
  return environment.apiUrl.replace('/api', '');
}

/**
 * Get full image URL from relative path
 * Handles all possible path formats from backend
 */
getFullImageUrl(relativePath: string | null | undefined): string {
  if (!relativePath) {
    return 'assets/images/default-avatar.png';
  }

  // If it's already a full URL, return as-is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }

  const baseUrl = this.getBaseUrl();

  // If path starts with /api, use it directly
  if (relativePath.startsWith('/api')) {
    return `${baseUrl}${relativePath}`;
  }

  // If path starts with /uploads, add /api prefix
  if (relativePath.startsWith('/uploads')) {
    return `${baseUrl}/api${relativePath}`;
  }

  // Otherwise, add /api prefix
  return `${baseUrl}/api${relativePath}`;
}

/**
 * Upload profile picture
 * Returns the relative URL path
 */
uploadProfilePicture(file: File): Observable<ApiResponse<{url: string; filename: string}>> {
  const formData = new FormData();
  formData.append('file', file);
  
  return this.http.post<ApiResponse<{url: string; filename: string; size: number; mimetype: string}>>(
    `${environment.apiUrl}/upload/profile-picture`, 
    formData
  ).pipe(
    map(response => {
      console.log('Backend response:', response); // Debug
      
      if (response.success && response.data) {
        // Backend might return /uploads/profiles/filename.jpg
        // We need to ensure it has /api prefix for consistency
        let url = response.data.url;
        
        // If it doesn't start with /api, add it
        if (!url.startsWith('/api') && !url.startsWith('http')) {
          url = `/api${url}`;
        }
        
        console.log('Processed URL:', url); // Debug
        response.data.url = url;
      }
      
      return response;
    })
  );
}
}