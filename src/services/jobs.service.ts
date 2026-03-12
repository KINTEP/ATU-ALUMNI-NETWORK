import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Job } from '../models/job';
import { ApiResponse } from '../models/api-response';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JobsService {
  private apiUrl = `${environment.apiUrl}/jobs`;

  constructor(private http: HttpClient) {}

  /**
   * Get all jobs with filters
   */
  getAllJobs(params?: {
    job_type?: string;
    location?: string;
    location_type?: string;
    experience_level?: string;
    salary_min?: string;
    salary_max?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
  }): Observable<ApiResponse<Job[]>> {
    let httpParams = new HttpParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<Job[]>>(this.apiUrl, { params: httpParams });
  }

  /**
   * Get single job by ID
   */
  getJobById(id: number): Observable<ApiResponse<Job>> {
    return this.http.get<ApiResponse<Job>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get saved jobs (authenticated user only)
   * No user_id in query — handled by verifyToken middleware
   */
  getSavedJobs(page: number = 1, limit: number = 12): Observable<ApiResponse<Job[]>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ApiResponse<Job[]>>(`${this.apiUrl}/saved`, { params });
  }

  /**
   * Save job (empty body — user from JWT)
   */
  saveJob(jobId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/${jobId}/save`, {});
  }

  /**
   * Unsave job (no query/body — user from JWT)
   */
  unsaveJob(jobId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${jobId}/unsave`);
  }

  /**
   * Apply to job
   */
  applyToJob(jobId: number, data: {
    cover_letter?: string;
    resume_url?: string;
  }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/${jobId}/apply`, data);
  }

  /**
   * Increment view count
   */
  incrementViewCount(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/${id}/view`, {});
  }

  // Optional: Get job stats
  getJobStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/stats`);
  }


  getSavedJobIds(): Observable<ApiResponse<number[]>> {
  return this.http.get<ApiResponse<number[]>>(`${this.apiUrl}/saved/ids`);
}

/**
 * Delete job (Admin only)
 */
deleteJob(id: number): Observable<ApiResponse> {
  return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`);
}

/**
 * Update job (Admin only)
 */
updateJob(id: number, data: Partial<Job>): Observable<ApiResponse<Job>> {
  return this.http.put<ApiResponse<Job>>(`${this.apiUrl}/${id}`, data);
}


/**
 * Create new job (Admin only)
 */
createJob(jobData: any): Observable<ApiResponse<Job>> {
  return this.http.post<ApiResponse<Job>>(this.apiUrl, jobData);
}
}