import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response';
import { environment } from '../environments/environment';

// ── Models ──────────────────────────────────────────────────────────────────

export interface Project {
  id: number;
  title: string;
  description: string;
  long_description: string | null;
  category: string;
  status: 'proposed' | 'ongoing' | 'completed' | 'draft';
  location: string;
  cover_image: string | null;
  start_date: string;
  target_date: string | null;
  funding_goal: number;
  current_amount: number;
  funding_percentage: number;
  accept_donations: boolean;
  accept_volunteers: boolean;
  max_volunteers: number | null;
  is_featured: boolean;
  votes_required: number;
  volunteers_count: number;
  votes_count: number;
  donors_count: number;
  days_left: number | null;
  created_by: {
    id: number;
    first_name: string;
    last_name: string;
    profile_picture: string | null;
  } | null;
  created_at: string;
  updated_at: string;
  // Only present on getProjectById
  donations?: ProjectDonation[];
  volunteers?: ProjectVolunteer[];
  updates?: ProjectUpdate[];
}

export interface ProjectDonation {
  id: number;
  amount: string;
  anonymous: boolean;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  profile_picture: string | null;
}

export interface ProjectVolunteer {
  id: number;
  project_id: number;
  user_id: number;
  joined_at: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture: string | null;
}

export interface ProjectUpdate {
  id: number;
  project_id: number;
  title: string;
  content: string;
  type: 'update' | 'milestone';
  image: string | null;
  posted_by: number;
  created_at: string;
}

export interface ProjectStats {
  total: string;
  ongoing: string;
  proposed: string;
  completed: string;
  total_raised: string;
  total_funding_goal: string;
  total_donors: number;
  total_donations: number;
  total_volunteers: number;
}

export interface TopDonor {
  user_id: number;
  total_donated: string;
  donation_count: string;
  first_name: string;
  last_name: string;
  profile_picture: string | null;
}

export interface RecentActivity {
  type: 'donation' | 'volunteer';
  project_title: string;
  project_id: number;
  amount?: number;
  anonymous?: boolean;
  first_name: string;
  last_name: string;
  profile_picture: string | null;
  created_at: string;
}

export interface DonationTrend {
  year: number;
  month: number;
  total: string;
  count: string;
}

export interface CreateProjectData {
  title: string;
  description: string;
  long_description?: string;
  category: string;
  status?: 'proposed' | 'ongoing' | 'draft';
  location: string;
  cover_image?: string;
  start_date: string;
  target_date?: string;
  funding_goal: number;
  current_amount?: number;
  accept_donations?: boolean;
  accept_volunteers?: boolean;
  max_volunteers?: number;
  is_featured?: boolean;
  votes_required?: number;
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  long_description?: string;
  category?: string;
  status?: 'proposed' | 'ongoing' | 'completed' | 'draft';
  location?: string;
  cover_image?: string;
  start_date?: string;
  target_date?: string;
  funding_goal?: number;
  current_amount?: number;
  accept_donations?: boolean;
  accept_volunteers?: boolean;
  max_volunteers?: number;
  is_featured?: boolean;
  votes_required?: number;
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private apiUrl = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) {}

  // ── Public / Alumni ────────────────────────────────────────────────────────

  /**
   * Get all projects with optional filters
   */
  getAllProjects(params?: {
    status?: 'proposed' | 'ongoing' | 'completed' | 'draft';
    category?: string;
    search?: string;
    featured?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
  }): Observable<ApiResponse<Project[]>> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        const value = (params as any)[key];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<Project[]>>(this.apiUrl, { params: httpParams });
  }

  /**
   * Get project statistics (totals, raised, donors, volunteers)
   */
  getProjectStats(): Observable<ApiResponse<ProjectStats>> {
    return this.http.get<ApiResponse<ProjectStats>>(`${this.apiUrl}/stats`);
  }

  /**
   * Get top donors across all projects
   */
  getTopDonors(limit: number = 10): Observable<ApiResponse<TopDonor[]>> {
    return this.http.get<ApiResponse<TopDonor[]>>(`${this.apiUrl}/top-donors`, {
      params: { limit: limit.toString() }
    });
  }

  /**
   * Get recent donation and volunteer activity
   */
  getRecentActivity(limit: number = 10): Observable<ApiResponse<RecentActivity[]>> {
    return this.http.get<ApiResponse<RecentActivity[]>>(`${this.apiUrl}/recent-activity`, {
      params: { limit: limit.toString() }
    });
  }

  /**
   * Get a single project by ID (includes donations, volunteers, updates)
   */
  getProjectById(id: number): Observable<ApiResponse<Project>> {
    return this.http.get<ApiResponse<Project>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get paginated donors for a specific project
   */
  getProjectDonors(id: number, page: number = 1, limit: number = 10): Observable<ApiResponse<ProjectDonation[]>> {
    return this.http.get<ApiResponse<ProjectDonation[]>>(`${this.apiUrl}/${id}/donors`, {
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

  // ── Authenticated User Actions ─────────────────────────────────────────────

  /**
   * Donate to a project (project must be ongoing)
   */
  donate(projectId: number, data: {
    amount: number;
    reference?: string;
    payment_method?: 'paystack' | 'momo' | 'bank_transfer' | 'cash';
    anonymous?: boolean;
  }): Observable<ApiResponse<{ current_amount: string; funding_percentage: number }>> {
    return this.http.post<ApiResponse<{ current_amount: string; funding_percentage: number }>>(
      `${this.apiUrl}/${projectId}/donate`, data
    );
  }

  /**
   * Sign up as a volunteer for a project (project must be ongoing)
   */
  volunteer(projectId: number): Observable<ApiResponse<{ volunteers_count: number }>> {
    return this.http.post<ApiResponse<{ volunteers_count: number }>>(
      `${this.apiUrl}/${projectId}/volunteer`, {}
    );
  }

  /**
   * Withdraw from volunteering for a project
   */
  withdrawVolunteer(projectId: number): Observable<ApiResponse<{ volunteers_count: number }>> {
    return this.http.delete<ApiResponse<{ volunteers_count: number }>>(
      `${this.apiUrl}/${projectId}/volunteer`
    );
  }

  /**
   * Vote for a proposed project
   */
  vote(projectId: number): Observable<ApiResponse<{ votes_count: number; votes_required: number }>> {
    return this.http.post<ApiResponse<{ votes_count: number; votes_required: number }>>(
      `${this.apiUrl}/${projectId}/vote`, {}
    );
  }

  /**
   * Retract a vote from a proposed project
   */
  retractVote(projectId: number): Observable<ApiResponse<{ votes_count: number; votes_required: number }>> {
    return this.http.delete<ApiResponse<{ votes_count: number; votes_required: number }>>(
      `${this.apiUrl}/${projectId}/vote`
    );
  }

  // ── Admin Only ─────────────────────────────────────────────────────────────

  /**
   * Create a new project (Admin only)
   */
  createProject(data: CreateProjectData): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(this.apiUrl, data);
  }

  /**
   * Update an existing project (Admin only)
   */
  updateProject(id: number, data: UpdateProjectData): Observable<ApiResponse<Project>> {
    return this.http.put<ApiResponse<Project>>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Delete a project permanently (Admin only)
   */
  deleteProject(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Approve a proposed project — moves status to ongoing (Admin only)
   */
  approveProject(id: number): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(`${this.apiUrl}/${id}/approve`, {});
  }

  /**
   * Reject a proposed project — moves status to draft (Admin only)
   */
  rejectProject(id: number, reason?: string): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(`${this.apiUrl}/${id}/reject`, { reason });
  }

  /**
   * Mark an ongoing project as completed (Admin only)
   */
  completeProject(id: number): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(`${this.apiUrl}/${id}/complete`, {});
  }

  /**
   * Add a progress update or milestone to a project (Admin only)
   */
  addProjectUpdate(id: number, data: {
    title: string;
    content: string;
    type?: 'update' | 'milestone';
    image?: string;
  }): Observable<ApiResponse<ProjectUpdate>> {
    return this.http.post<ApiResponse<ProjectUpdate>>(`${this.apiUrl}/${id}/updates`, data);
  }

  /**
   * Delete a project update (Admin only)
   */
  deleteProjectUpdate(projectId: number, updateId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${projectId}/updates/${updateId}`);
  }

  /**
   * Get all volunteers for a project (Admin only)
   */
  getProjectVolunteers(projectId: number): Observable<ApiResponse<ProjectVolunteer[]>> {
    return this.http.get<ApiResponse<ProjectVolunteer[]>>(`${this.apiUrl}/${projectId}/volunteers`);
  }

  /**
   * Get all projects including drafts (Admin only)
   */
  adminGetAllProjects(params?: {
    status?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<ApiResponse<Project[]>> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        const value = (params as any)[key];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<Project[]>>(`${this.apiUrl}/admin/all`, { params: httpParams });
  }

  /**
   * Get donation trends over time (Admin only)
   */
  getDonationTrends(months: number = 6): Observable<ApiResponse<DonationTrend[]>> {
    return this.http.get<ApiResponse<DonationTrend[]>>(`${this.apiUrl}/admin/donation-trends`, {
      params: { months: months.toString() }
    });
  }
}