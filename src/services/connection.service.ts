import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConnectionRequest, Connection, ConnectionStats } from '../models/connection';
import { ApiResponse } from '../models/api-response';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  private apiUrl = `${environment.apiUrl}/connections`;

  constructor(private http: HttpClient) {}

  /**
   * Send connection request
   */
  sendConnectionRequest(receiverId: number, message?: string): Observable<ApiResponse<ConnectionRequest>> {
    return this.http.post<ApiResponse<ConnectionRequest>>(`${this.apiUrl}/requests`, {
      receiver_id: receiverId,
      message: message
    });
  }

  /**
   * Get pending requests (received)
   */
  getPendingRequests(): Observable<ApiResponse<ConnectionRequest[]>> {
    return this.http.get<ApiResponse<ConnectionRequest[]>>(`${this.apiUrl}/requests/pending`);
  }

  /**
   * Get sent requests
   */
  /**
 * Get sent requests
 */
getSentRequests(): Observable<ApiResponse<ConnectionRequest[]>> {
  return this.http.get<ApiResponse<ConnectionRequest[]>>(`${this.apiUrl}/requests/sent`);
}

  /**
   * Accept connection request
   */
  acceptRequest(requestId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/requests/${requestId}/accept`, {});
  }

  /**
   * Decline connection request
   */
  declineRequest(requestId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/requests/${requestId}/decline`, {});
  }

  /**
   * Cancel connection request
   */
  cancelRequest(requestId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/requests/${requestId}/cancel`, {});
  }

  /**
   * Get my connections
   */
  getMyConnections(page: number = 1, limit: number = 20, search?: string): Observable<ApiResponse<Connection[]>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<ApiResponse<Connection[]>>(this.apiUrl, { params });
  }

  /**
   * Remove connection
   */
  removeConnection(connectionId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${connectionId}`);
  }

  /**
   * Check connection status with a user
   */
  checkConnectionStatus(userId: number): Observable<ApiResponse<{
    status: 'connected' | 'request_sent' | 'request_received' | 'not_connected';
    connection_id?: number;
    request_id?: number;
  }>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/status/${userId}`);
  }

  /**
   * Get connection stats
   */
  getConnectionStats(): Observable<ApiResponse<ConnectionStats>> {
    return this.http.get<ApiResponse<ConnectionStats>>(`${this.apiUrl}/stats/overview`);
  }



}