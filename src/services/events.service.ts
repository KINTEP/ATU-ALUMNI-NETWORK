// src/app/services/events.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AlumniEvent, EventComment } from '../models/event';
import { ApiResponse } from '../models/api-response';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  private apiUrl = `${environment.apiUrl}/events`;

  constructor(private http: HttpClient) {}

  getAllEvents(params?: {
    event_type?: string;
    location_type?: string;
    is_featured?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<ApiResponse<AlumniEvent[]>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = (params as any)[key];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<AlumniEvent[]>>(this.apiUrl, { params: httpParams });
  }

  getUpcomingEvents(page: number = 1, limit: number = 20): Observable<ApiResponse<AlumniEvent[]>> {
    return this.http.get<ApiResponse<AlumniEvent[]>>(`${this.apiUrl}/upcoming`, {
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

  getPastEvents(page: number = 1, limit: number = 20): Observable<ApiResponse<AlumniEvent[]>> {
    return this.http.get<ApiResponse<AlumniEvent[]>>(`${this.apiUrl}/past`, {
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

  getEventById(id: number): Observable<ApiResponse<AlumniEvent>> {
    return this.http.get<ApiResponse<AlumniEvent>>(`${this.apiUrl}/${id}`);
  }

  getMyEvents(userId: number, status?: string): Observable<ApiResponse<AlumniEvent[]>> {
    let params = new HttpParams().set('user_id', userId.toString());
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<AlumniEvent[]>>(`${this.apiUrl}/my-events`, { params });
  }

  rsvpToEvent(eventId: number, data: {
    user_id: number;
    status: 'going' | 'maybe' | 'not_going';
    guests_count?: number;
    notes?: string;
  }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/${eventId}/rsvp`, data);
  }

  updateRsvp(eventId: number, data: {
    user_id: number;
    status?: 'going' | 'maybe' | 'not_going';
    guests_count?: number;
    notes?: string;
  }): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/${eventId}/rsvp`, data);
  }

  cancelRsvp(eventId: number, userId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${eventId}/rsvp`, {
      params: { user_id: userId.toString() }
    });
  }

  incrementViewCount(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/${id}/view`, {});
  }

  // ── Admin ────────────────────────────────────────────────────────────────

  createEvent(eventData: any): Observable<ApiResponse<AlumniEvent>> {
    return this.http.post<ApiResponse<AlumniEvent>>(this.apiUrl, eventData);
  }

  /** Update an existing event (Admin only) */
  updateEvent(id: number, eventData: any): Observable<ApiResponse<AlumniEvent>> {
    return this.http.put<ApiResponse<AlumniEvent>>(`${this.apiUrl}/${id}`, eventData);
  }

  deleteEvent(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`);
  }

  getEventStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/stats`);
  }

  // ── Comments ─────────────────────────────────────────────────────────────

  getEventComments(eventId: number, page: number = 1, limit: number = 50): Observable<ApiResponse<EventComment[]>> {
    return this.http.get<ApiResponse<EventComment[]>>(`${this.apiUrl}/${eventId}/comments`, {
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

  getCommentReplies(eventId: number, commentId: number): Observable<ApiResponse<EventComment[]>> {
    return this.http.get<ApiResponse<EventComment[]>>(`${this.apiUrl}/${eventId}/comments/${commentId}/replies`);
  }

  addComment(eventId: number, data: { user_id: number; comment: string }): Observable<ApiResponse<EventComment>> {
    return this.http.post<ApiResponse<EventComment>>(`${this.apiUrl}/${eventId}/comments`, data);
  }

  replyToComment(eventId: number, commentId: number, data: { user_id: number; comment: string }): Observable<ApiResponse<EventComment>> {
    return this.http.post<ApiResponse<EventComment>>(`${this.apiUrl}/${eventId}/comments/${commentId}/reply`, data);
  }

  updateComment(eventId: number, commentId: number, data: { user_id: number; comment: string }): Observable<ApiResponse<EventComment>> {
    return this.http.put<ApiResponse<EventComment>>(`${this.apiUrl}/${eventId}/comments/${commentId}`, data);
  }

  deleteComment(eventId: number, commentId: number, userId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${eventId}/comments/${commentId}`, {
      params: { user_id: userId.toString() }
    });
  }

  likeComment(eventId: number, commentId: number, userId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/${eventId}/comments/${commentId}/like`, { user_id: userId });
  }

  unlikeComment(eventId: number, commentId: number, userId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${eventId}/comments/${commentId}/unlike`, {
      params: { user_id: userId.toString() }
    });
  }
}