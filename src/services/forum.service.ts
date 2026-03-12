// src/app/services/forum.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ForumCategory, ForumPost, ForumReply, ForumStats } from '../models/forum';
import { environment } from '../environments/environment';
import { ApiResponse } from '../models/api-response';
import { AuthService } from './auth.service';


@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private apiUrl = `${environment.apiUrl}/forums`;
  

  constructor(private http: HttpClient, private authService: AuthService) {
    
  }

  // ==================== CATEGORIES ====================
  
  getAllCategories(): Observable<ApiResponse<ForumCategory[]>> {
    return this.http.get<ApiResponse<ForumCategory[]>>(`${this.apiUrl}/categories`);
  }

  getCategoryById(id: number): Observable<ApiResponse<ForumCategory>> {
    return this.http.get<ApiResponse<ForumCategory>>(`${this.apiUrl}/categories/${id}`);
  }

  createCategory(category: Partial<ForumCategory>): Observable<ApiResponse<ForumCategory>> {
    return this.http.post<ApiResponse<ForumCategory>>(`${this.apiUrl}/categories`, category);
  }

  updateCategory(id: number, updates: Partial<ForumCategory>): Observable<ApiResponse<ForumCategory>> {
    return this.http.put<ApiResponse<ForumCategory>>(`${this.apiUrl}/categories/${id}`, updates);
  }

  deleteCategory(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/categories/${id}`);
  }

  // ==================== POSTS ====================
  
  getAllPosts(params?: {
    category_id?: number;
    user_id?: number;
    tags?: string;
    is_pinned?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: string;
    current_user_id?: number;
  }): Observable<ApiResponse<ForumPost[]>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = (params as any)[key];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<ForumPost[]>>(`${this.apiUrl}/posts`, { params: httpParams });
  }

  getPopularPosts(page: number = 1, limit: number = 10): Observable<ApiResponse<ForumPost[]>> {
    return this.http.get<ApiResponse<ForumPost[]>>(`${this.apiUrl}/posts/popular`, {
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

  getTrendingPosts(page: number = 1, limit: number = 10): Observable<ApiResponse<ForumPost[]>> {
    return this.http.get<ApiResponse<ForumPost[]>>(`${this.apiUrl}/posts/trending`, {
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

  getMyPosts(userId: number, page: number = 1, limit: number = 20): Observable<ApiResponse<ForumPost[]>> {
    return this.http.get<ApiResponse<ForumPost[]>>(`${this.apiUrl}/posts/my-posts`, {
      params: { 
        user_id: userId.toString(),
        page: page.toString(), 
        limit: limit.toString() 
      }
    });
  }

  getPostById(id: number, userId?: number): Observable<ApiResponse<ForumPost>> {
    let params = new HttpParams();
    if (userId) {
      params = params.set('user_id', userId.toString());
    }
    return this.http.get<ApiResponse<ForumPost>>(`${this.apiUrl}/posts/${id}`, { params });
  }

  createPost(post: {
    category_id: number;
    user_id: number;
    title: string;
    content: string;
    slug: string;
    tags?: string[];
  }): Observable<ApiResponse<ForumPost>> {
    return this.http.post<ApiResponse<ForumPost>>(`${this.apiUrl}/posts`, post);
  }

  updatePost(id: number, updates: {
    user_id: number;
    title?: string;
    content?: string;
    tags?: string[];
  }): Observable<ApiResponse<ForumPost>> {
    return this.http.put<ApiResponse<ForumPost>>(`${this.apiUrl}/posts/${id}`, updates);
  }

  deletePost(id: number, userId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/posts/${id}`, {
      params: { user_id: userId.toString() }
    });
  }

  incrementPostViews(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/posts/${id}/view`, {});
  }

  likePost(postId: number, userId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/posts/${postId}/like`, { user_id: userId });
  }

  unlikePost(postId: number, userId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/posts/${postId}/unlike`, {
      params: { user_id: userId.toString() }
    });
  }

  subscribeToPost(postId: number, userId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/posts/${postId}/subscribe`, { user_id: userId });
  }

  unsubscribeFromPost(postId: number, userId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/posts/${postId}/unsubscribe`, {
      params: { user_id: userId.toString() }
    });
  }

  // Admin actions
  pinPost(id: number): Observable<ApiResponse<ForumPost>> {
    return this.http.post<ApiResponse<ForumPost>>(`${this.apiUrl}/posts/${id}/pin`, {});
  }

  unpinPost(id: number): Observable<ApiResponse<ForumPost>> {
    return this.http.post<ApiResponse<ForumPost>>(`${this.apiUrl}/posts/${id}/unpin`, {});
  }

  lockPost(id: number): Observable<ApiResponse<ForumPost>> {
    return this.http.post<ApiResponse<ForumPost>>(`${this.apiUrl}/posts/${id}/lock`, {});
  }

  unlockPost(id: number): Observable<ApiResponse<ForumPost>> {
    return this.http.post<ApiResponse<ForumPost>>(`${this.apiUrl}/posts/${id}/unlock`, {});
  }

  // ==================== REPLIES ====================
  
  getPostReplies(postId: number, page: number = 1, limit: number = 50, userId?: number): Observable<ApiResponse<ForumReply[]>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (userId) {
      params = params.set('user_id', userId.toString());
    }

    return this.http.get<ApiResponse<ForumReply[]>>(`${this.apiUrl}/posts/${postId}/replies`, { params });
  }

  getNestedReplies(postId: number, replyId: number, userId?: number): Observable<ApiResponse<ForumReply[]>> {
    let params = new HttpParams();
    if (userId) {
      params = params.set('user_id', userId.toString());
    }
    return this.http.get<ApiResponse<ForumReply[]>>(`${this.apiUrl}/posts/${postId}/replies/${replyId}/nested`, { params });
  }

  addReply(postId: number, userId: number, content: string): Observable<ApiResponse<ForumReply>> {
    return this.http.post<ApiResponse<ForumReply>>(`${this.apiUrl}/posts/${postId}/replies`, {
      user_id: userId,
      content
    });
  }

  replyToReply(postId: number, replyId: number, userId: number, content: string): Observable<ApiResponse<ForumReply>> {
    return this.http.post<ApiResponse<ForumReply>>(`${this.apiUrl}/posts/${postId}/replies/${replyId}/reply`, {
      user_id: userId,
      content
    });
  }

  updateReply(postId: number, replyId: number, userId: number, content: string): Observable<ApiResponse<ForumReply>> {
    return this.http.put<ApiResponse<ForumReply>>(`${this.apiUrl}/posts/${postId}/replies/${replyId}`, {
      user_id: userId,
      content
    });
  }

  deleteReply(postId: number, replyId: number, userId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/posts/${postId}/replies/${replyId}`, {
      params: { user_id: userId.toString() }
    });
  }

  likeReply(postId: number, replyId: number, userId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/posts/${postId}/replies/${replyId}/like`, {
      user_id: userId
    });
  }

  unlikeReply(postId: number, replyId: number, userId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/posts/${postId}/replies/${replyId}/unlike`, {
      params: { user_id: userId.toString() }
    });
  }

  markAsSolution(postId: number, replyId: number, userId: number): Observable<ApiResponse<ForumReply>> {
    return this.http.post<ApiResponse<ForumReply>>(`${this.apiUrl}/posts/${postId}/replies/${replyId}/solution`, {
      user_id: userId
    });
  }

  // ==================== STATISTICS ====================
  
  getForumStats(): Observable<ApiResponse<ForumStats>> {
    return this.http.get<ApiResponse<ForumStats>>(`${this.apiUrl}/stats`);
  }

   createReply(data: {
    post_id: number;
    content: string;
    parent_reply_id?: number;
  }): Observable<ApiResponse<ForumReply>> {
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id || 0;

    if (data.parent_reply_id) {
      // Reply to a reply
      return this.http.post<ApiResponse<ForumReply>>(
        `${this.apiUrl}/posts/${data.post_id}/replies/${data.parent_reply_id}/reply`,
        {
          user_id: userId,
          content: data.content
        }
      );
    } else {
      // Direct reply to post
      return this.http.post<ApiResponse<ForumReply>>(
        `${this.apiUrl}/posts/${data.post_id}/replies`,
        {
          user_id: userId,
          content: data.content
        }
      );
    }
  }
}