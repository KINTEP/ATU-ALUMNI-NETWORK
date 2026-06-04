// src/app/services/messaging.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Conversation, Message, MessageReaction, TypingIndicator, MessagingStats } from '../models/message';
import { ApiResponse } from '../models/api-response';
import { environment } from '../environments/environment';

// ✅ All user_id parameters removed from service methods.
// The backend now reads the current user from the JWT token (req.user)
// so the frontend never needs to pass user_id explicitly.

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private apiUrl = `${environment.apiUrl}/messages`;

  private unreadMessageCountSubject = new BehaviorSubject<number>(0);
  public unreadMessageCount$ = this.unreadMessageCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ==================== CONVERSATIONS ====================

  // ✅ FIX: removed user_id and archived params — backend reads from token
  getUserConversations(archived: boolean = false): Observable<ApiResponse<Conversation[]>> {
    const params = new HttpParams().set('archived', archived.toString());
    return this.http.get<ApiResponse<Conversation[]>>(`${this.apiUrl}/conversations`, { params });
  }

  // ✅ FIX: backend accepts both { user1_id, user2_id } and { other_user_id }
  // Sending other_user_id only — cleaner and works with new backend
  getOrCreateConversation(otherUserId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<Conversation>>(`${this.apiUrl}/conversations`, {
      other_user_id: otherUserId
    });
  }

  // Alias kept for backward compatibility with component calls
  getOrCreateConversationWithUser(currentUserId: number, otherUserId: number): Observable<ApiResponse<any>> {
    return this.getOrCreateConversation(otherUserId);
  }

  // ✅ FIX: removed user_id query param
  getConversationById(conversationId: number): Observable<ApiResponse<Conversation>> {
    return this.http.get<ApiResponse<Conversation>>(`${this.apiUrl}/conversations/${conversationId}`);
  }

  // ✅ FIX: removed user_id from body — backend reads from token
  archiveConversation(conversationId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/conversations/${conversationId}/archive`, {});
  }

  unarchiveConversation(conversationId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/conversations/${conversationId}/unarchive`, {});
  }

  blockConversation(conversationId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/conversations/${conversationId}/block`, {});
  }

  unblockConversation(conversationId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/conversations/${conversationId}/unblock`, {});
  }

  // ✅ FIX: removed user_id query param
  deleteConversation(conversationId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/conversations/${conversationId}`);
  }

  // ==================== MESSAGES ====================

  // ✅ FIX: removed user_id query param
  getConversationMessages(conversationId: number, page: number = 1, limit: number = 50): Observable<ApiResponse<Message[]>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<ApiResponse<Message[]>>(`${this.apiUrl}/conversations/${conversationId}/messages`, { params });
  }

  // ✅ FIX: removed sender_id from body — backend reads from token
  sendMessage(data: {
    conversation_id: number;
    message_text: string;
    attachment_url?: string;
    attachment_type?: string;
    attachment_name?: string;
    attachment_size?: number;
  }): Observable<ApiResponse<Message>> {
    return this.http.post<ApiResponse<Message>>(`${this.apiUrl}/messages`, data);
  }

  // ✅ FIX: removed user_id from body
  editMessage(messageId: number, messageText: string): Observable<ApiResponse<Message>> {
    return this.http.put<ApiResponse<Message>>(`${this.apiUrl}/messages/${messageId}`, {
      message_text: messageText
    });
  }

  // ✅ FIX: removed user_id query param
  deleteMessage(messageId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/messages/${messageId}`);
  }

  // ✅ FIX: removed user_id from body
  markMessagesAsRead(conversationId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/conversations/${conversationId}/mark-read`, {});
  }

  // ==================== REACTIONS ====================

  // ✅ FIX: removed user_id from body
  addReaction(messageId: number, reactionType: string): Observable<ApiResponse<MessageReaction>> {
    return this.http.post<ApiResponse<MessageReaction>>(`${this.apiUrl}/messages/${messageId}/reactions`, {
      reaction_type: reactionType
    });
  }

  // ✅ FIX: removed user_id query param
  removeReaction(messageId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/messages/${messageId}/reactions`);
  }

  // ==================== TYPING INDICATORS ====================

  // ✅ FIX: removed user_id from body
  setTypingIndicator(conversationId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/typing`, {
      conversation_id: conversationId
    });
  }

  // ✅ FIX: removed user_id query param
  getTypingStatus(conversationId: number): Observable<ApiResponse<TypingIndicator>> {
    return this.http.get<ApiResponse<TypingIndicator>>(`${this.apiUrl}/conversations/${conversationId}/typing`);
  }

  // ==================== STATISTICS ====================

  // ✅ FIX: removed user_id — backend always scopes to current user
  getMessagingStats(): Observable<ApiResponse<MessagingStats>> {
    return this.http.get<ApiResponse<MessagingStats>>(`${this.apiUrl}/stats`);
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