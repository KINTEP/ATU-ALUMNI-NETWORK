// src/app/services/message.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Conversation, Message, MessageReaction, TypingIndicator, MessagingStats } from '../models/message';
import { ApiResponse } from '../models/api-response';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private apiUrl = `${environment.apiUrl}/messages`;

  // Observable for unread message count
  private unreadMessageCountSubject = new BehaviorSubject<number>(0);
  public unreadMessageCount$ = this.unreadMessageCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ==================== CONVERSATIONS ====================

  getUserConversations(userId: number, archived: boolean = false): Observable<ApiResponse<Conversation[]>> {
    const params = new HttpParams()
      .set('user_id', userId.toString())
      .set('archived', archived.toString());
    return this.http.get<ApiResponse<Conversation[]>>(`${this.apiUrl}/conversations`, { params });
  }

  getOrCreateConversation(user1Id: number, user2Id: number): Observable<ApiResponse<Conversation>> {
    return this.http.post<ApiResponse<Conversation>>(`${this.apiUrl}/conversations`, {
      user1_id: user1Id,
      user2_id: user2Id
    });
  }

  getConversationById(conversationId: number, userId: number): Observable<ApiResponse<Conversation>> {
    const params = new HttpParams().set('user_id', userId.toString());
    return this.http.get<ApiResponse<Conversation>>(`${this.apiUrl}/conversations/${conversationId}`, { params });
  }

  archiveConversation(conversationId: number, userId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/conversations/${conversationId}/archive`, {
      user_id: userId
    });
  }

  unarchiveConversation(conversationId: number, userId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/conversations/${conversationId}/unarchive`, {
      user_id: userId
    });
  }

  blockConversation(conversationId: number, userId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/conversations/${conversationId}/block`, {
      user_id: userId
    });
  }

  unblockConversation(conversationId: number, userId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/conversations/${conversationId}/unblock`, {
      user_id: userId
    });
  }

  deleteConversation(conversationId: number, userId: number): Observable<ApiResponse> {
    const params = new HttpParams().set('user_id', userId.toString());
    return this.http.delete<ApiResponse>(`${this.apiUrl}/conversations/${conversationId}`, { params });
  }

  // ==================== MESSAGES ====================

  getConversationMessages(conversationId: number, userId: number, page: number = 1, limit: number = 50): Observable<ApiResponse<Message[]>> {
    const params = new HttpParams()
      .set('user_id', userId.toString())
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<ApiResponse<Message[]>>(`${this.apiUrl}/conversations/${conversationId}/messages`, { params });
  }

  sendMessage(data: {
    conversation_id: number;
    sender_id: number;
    message_text: string;
    attachment_url?: string;
    attachment_type?: string;
    attachment_name?: string;
    attachment_size?: number;
  }): Observable<ApiResponse<Message>> {
    return this.http.post<ApiResponse<Message>>(`${this.apiUrl}/messages`, data);
  }

  editMessage(messageId: number, userId: number, messageText: string): Observable<ApiResponse<Message>> {
    return this.http.put<ApiResponse<Message>>(`${this.apiUrl}/messages/${messageId}`, {
      user_id: userId,
      message_text: messageText
    });
  }

  deleteMessage(messageId: number, userId: number): Observable<ApiResponse> {
    const params = new HttpParams().set('user_id', userId.toString());
    return this.http.delete<ApiResponse>(`${this.apiUrl}/messages/${messageId}`, { params });
  }

  markMessagesAsRead(conversationId: number, userId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/conversations/${conversationId}/mark-read`, {
      user_id: userId
    });
  }

  // ==================== REACTIONS ====================

  addReaction(messageId: number, userId: number, reactionType: string): Observable<ApiResponse<MessageReaction>> {
    return this.http.post<ApiResponse<MessageReaction>>(`${this.apiUrl}/messages/${messageId}/reactions`, {
      user_id: userId,
      reaction_type: reactionType
    });
  }

  removeReaction(messageId: number, userId: number): Observable<ApiResponse> {
    const params = new HttpParams().set('user_id', userId.toString());
    return this.http.delete<ApiResponse>(`${this.apiUrl}/messages/${messageId}/reactions`, { params });
  }

  // ==================== TYPING INDICATORS ====================

  setTypingIndicator(conversationId: number, userId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/typing`, {
      conversation_id: conversationId,
      user_id: userId
    });
  }

  getTypingStatus(conversationId: number, userId: number): Observable<ApiResponse<TypingIndicator>> {
    const params = new HttpParams().set('user_id', userId.toString());
    return this.http.get<ApiResponse<TypingIndicator>>(`${this.apiUrl}/conversations/${conversationId}/typing`, { params });
  }

  // ==================== STATISTICS ====================

  getMessagingStats(userId?: number): Observable<ApiResponse<MessagingStats>> {
    let params = new HttpParams();
    if (userId) {
      params = params.set('user_id', userId.toString());
    }
    return this.http.get<ApiResponse<MessagingStats>>(`${this.apiUrl}/stats`, { params });
  }



getOrCreateConversationWithUser(currentUserId: number, otherUserId: number): Observable<ApiResponse<any>> {
  return this.http.post<ApiResponse<any>>(`${this.apiUrl}/conversations`, {
    user1_id: currentUserId,
    user2_id: otherUserId
  });
}

getUnreadMessageCount(): Observable<ApiResponse<{ unread_count: number }>> {
    return this.http.get<ApiResponse<{ unread_count: number }>>(`${this.apiUrl}/unread-count`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.unreadMessageCountSubject.next(response.data.unread_count);
        }
      })
    );
  }

   updateUnreadCount(count: number): void {
    this.unreadMessageCountSubject.next(count);
  }

}
