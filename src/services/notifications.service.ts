import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Notification, NotificationStats } from '../models/notification';
import { ApiResponse } from '../models/api-response';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  
  // Observable for unread count
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get all notifications for current user
   */
  getNotifications(page: number = 1, limit: number = 20, type?: string): Observable<ApiResponse<Notification[]>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (type) params = params.set('type', type);

    return this.http.get<ApiResponse<Notification[]>>(this.apiUrl, { params });
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(): Observable<ApiResponse<Notification[]>> {
    return this.http.get<ApiResponse<Notification[]>>(`${this.apiUrl}/unread`);
  }

  /**
   * Get notification stats
   */
  getNotificationStats(): Observable<ApiResponse<NotificationStats>> {
    return this.http.get<ApiResponse<NotificationStats>>(`${this.apiUrl}/stats`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.unreadCountSubject.next(response.data.total_unread);
        }
      })
    );
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: number): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      tap(() => {
        const currentCount = this.unreadCountSubject.value;
        this.unreadCountSubject.next(Math.max(0, currentCount - 1));
      })
    );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => this.unreadCountSubject.next(0))
    );
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${notificationId}`);
  }

  /**
   * Delete all read notifications
   */
  deleteAllRead(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/read`);
  }

  /**
   * Update unread count manually
   */
  updateUnreadCount(count: number): void {
    this.unreadCountSubject.next(count);
  }
}