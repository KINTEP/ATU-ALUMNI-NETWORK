import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NewsArticle, NewsComment } from '../models/news';
import { ApiResponse } from '../models/api-response';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private apiUrl = `${environment.apiUrl}/news`;

  constructor(private http: HttpClient) {}

  /**
   * Get all news articles with filters
   */
  getAllArticles(params?: {
    category?: string;
    is_featured?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<ApiResponse<NewsArticle[]>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = (params as any)[key];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<NewsArticle[]>>(this.apiUrl, { params: httpParams });
  }

  /**
   * Get featured articles
   */
  getFeaturedArticles(limit: number = 5): Observable<ApiResponse<NewsArticle[]>> {
    return this.http.get<ApiResponse<NewsArticle[]>>(`${this.apiUrl}/featured`, {
      params: { limit: limit.toString() }
    });
  }

  /**
   * Get latest articles
   */
  getLatestArticles(limit: number = 10): Observable<ApiResponse<NewsArticle[]>> {
    return this.http.get<ApiResponse<NewsArticle[]>>(`${this.apiUrl}/latest`, {
      params: { limit: limit.toString() }
    });
  }

  /**
   * Get popular articles
   */
  getPopularArticles(limit: number = 10): Observable<ApiResponse<NewsArticle[]>> {
    return this.http.get<ApiResponse<NewsArticle[]>>(`${this.apiUrl}/popular`, {
      params: { limit: limit.toString() }
    });
  }

  /**
   * Get single article by ID
   */
  getArticleById(id: number, userId?: number): Observable<ApiResponse<NewsArticle>> {
    let params = new HttpParams();
    if (userId) {
      params = params.set('user_id', userId.toString());
    }
    return this.http.get<ApiResponse<NewsArticle>>(`${this.apiUrl}/${id}`, { params });
  }

  /**
   * Increment view count
   */
  incrementViewCount(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/${id}/view`, {});
  }

  /**
   * Like article
   */
  likeArticle(id: number, userId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/${id}/like`, { user_id: userId });
  }

  /**
   * Unlike article
   */
  unlikeArticle(id: number, userId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}/unlike`, {
      params: { user_id: userId.toString() }
    });
  }

  /**
   * Get article comments
   */
  getArticleComments(articleId: number, page: number = 1, limit: number = 50): Observable<ApiResponse<NewsComment[]>> {
    return this.http.get<ApiResponse<NewsComment[]>>(`${this.apiUrl}/${articleId}/comments`, {
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

  /**
   * Add comment to article
   */
  addComment(articleId: number, data: {
    user_id: number;
    comment: string;
  }): Observable<ApiResponse<NewsComment>> {
    return this.http.post<ApiResponse<NewsComment>>(`${this.apiUrl}/${articleId}/comments`, data);
  }

  /**
   * Update comment
   */
  updateComment(articleId: number, commentId: number, data: {
    user_id: number;
    comment: string;
  }): Observable<ApiResponse<NewsComment>> {
    return this.http.put<ApiResponse<NewsComment>>(`${this.apiUrl}/${articleId}/comments/${commentId}`, data);
  }

  /**
   * Delete comment
   */
  deleteComment(articleId: number, commentId: number, userId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${articleId}/comments/${commentId}`, {
      params: { user_id: userId.toString() }
    });
  }

  /**
   * Like comment
   */
  likeComment(articleId: number, commentId: number, userId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/${articleId}/comments/${commentId}/like`, {
      user_id: userId
    });
  }

  /**
   * Unlike comment
   */
  unlikeComment(articleId: number, commentId: number, userId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${articleId}/comments/${commentId}/unlike`, {
      params: { user_id: userId.toString() }
    });
  }


  /**
 * Create article (Admin only)
 */
createArticle(articleData: any): Observable<ApiResponse<NewsArticle>> {
  return this.http.post<ApiResponse<NewsArticle>>(this.apiUrl, articleData);
}

/**
 * Update article (Admin only)
 */
updateArticle(id: number, data: Partial<NewsArticle>): Observable<ApiResponse<NewsArticle>> {
  return this.http.put<ApiResponse<NewsArticle>>(`${this.apiUrl}/${id}`, data);
}

/**
 * Delete article (Admin only)
 */
deleteArticle(id: number): Observable<ApiResponse> {
  return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`);
}

/**
 * Publish article (Admin only)
 */
publishArticle(id: number): Observable<ApiResponse<NewsArticle>> {
  return this.http.post<ApiResponse<NewsArticle>>(`${this.apiUrl}/${id}/publish`, {});
}

/**
 * Unpublish article (Admin only)
 */
unpublishArticle(id: number): Observable<ApiResponse<NewsArticle>> {
  return this.http.post<ApiResponse<NewsArticle>>(`${this.apiUrl}/${id}/unpublish`, {});
}

/**
 * Get news statistics
 */
getNewsStats(): Observable<ApiResponse<any>> {
  return this.http.get<ApiResponse<any>>(`${this.apiUrl}/stats`);
}

}