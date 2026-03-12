// src/app/services/tracer-study.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response';
import { 
  TracerStudyAnalytics, 
  TracerStudyResponse,
  Mentor 
} from '../models/tracer-study';
import { environment } from '../environments/environment';

// Interface for response with user info (from joined query)
export interface TracerResponseWithUser extends TracerStudyResponse {
  user_name?: string;
  user_email?: string;
  user_picture?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TracerStudyService {
  private apiUrl = `${environment.apiUrl}/tracer-study`;

  constructor(private http: HttpClient) {}

  // ==================== USER METHODS ====================

  /**
   * Check if user has submitted
   */
  checkSubmissionStatus(userId: number): Observable<ApiResponse<{ 
    has_submitted: boolean; 
    submission_date: string | null 
  }>> {
    const params = new HttpParams().set('user_id', userId.toString());
    return this.http.get<ApiResponse<{ has_submitted: boolean; submission_date: string | null }>>(
      `${this.apiUrl}/check-status`,
      { params }
    );
  }

  /**
   * Get user's own response
   */
  getMyResponse(userId: number): Observable<ApiResponse<TracerStudyResponse>> {
    const params = new HttpParams().set('user_id', userId.toString());
    return this.http.get<ApiResponse<TracerStudyResponse>>(`${this.apiUrl}/my-response`, { params });
  }

  /**
   * Submit tracer study response
   */
  submitResponse(data: TracerStudyResponse): Observable<ApiResponse<TracerStudyResponse>> {
    return this.http.post<ApiResponse<TracerStudyResponse>>(`${this.apiUrl}/submit`, data);
  }

  /**
   * Update response
   */
  updateResponse(id: number, data: Partial<TracerStudyResponse>): Observable<ApiResponse<TracerStudyResponse>> {
    return this.http.put<ApiResponse<TracerStudyResponse>>(`${this.apiUrl}/responses/${id}`, data);
  }

  // ==================== ANALYTICS METHODS ====================

  /**
   * Get overall analytics
   */
  getAnalytics(): Observable<ApiResponse<TracerStudyAnalytics>> {
    return this.http.get<ApiResponse<TracerStudyAnalytics>>(`${this.apiUrl}/analytics`);
  }

  /**
   * Get analytics by programme
   */
  getAnalyticsByProgramme(programme: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/analytics/programme/${encodeURIComponent(programme)}`);
  }

  /**
   * Get analytics by year
   */
  getAnalyticsByYear(year: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/analytics/year/${year}`);
  }

  // ==================== MENTORS METHODS ====================

  /**
   * Get mentors list
   */
  getMentorsList(programme?: string, sector?: string): Observable<ApiResponse<Mentor[]>> {
    let params = new HttpParams();
    if (programme) params = params.set('programme', programme);
    if (sector) params = params.set('sector', sector);
    return this.http.get<ApiResponse<Mentor[]>>(`${this.apiUrl}/mentors`, { params });
  }

  // ==================== ADMIN METHODS ====================

  /**
   * Get all responses (Admin only)
   */
  getAllResponses(params?: {
    programme?: string;
    year?: string;
    current_status?: string;
    sector?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: string;
  }): Observable<ApiResponse<TracerResponseWithUser[]>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = (params as any)[key];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<TracerResponseWithUser[]>>(
      `${this.apiUrl}/responses`,
      { params: httpParams }
    );
  }

  /**
   * Get response by ID (Admin only)
   */
  getResponseById(id: number): Observable<ApiResponse<TracerResponseWithUser>> {
    return this.http.get<ApiResponse<TracerResponseWithUser>>(`${this.apiUrl}/responses/${id}`);
  }

  /**
   * Delete response (Admin only)
   */
  deleteResponse(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/responses/${id}`);
  }

  /**
   * Export responses to CSV (Admin only)
   */
  exportResponses(filters?: {
    programme?: string;
    year?: string;
  }): Observable<Blob> {
    let params = new HttpParams();
    if (filters?.programme) params = params.set('programme', filters.programme);
    if (filters?.year) params = params.set('year', filters.year);

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Helper method to download exported CSV
   */
  downloadCsv(filters?: { programme?: string; year?: string }): void {
    this.exportResponses(filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tracer_study_export_${new Date().getTime()}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Export failed:', error);
      }
    });
  }
}