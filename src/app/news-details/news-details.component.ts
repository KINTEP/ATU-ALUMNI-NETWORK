// src/app/components/news-details/news-details.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { User } from '../../models/user';
import { NewsArticle, NewsComment } from '../../models/news';
import { AuthService } from '../../services/auth.service';
import { NewsService } from '../../services/news.service';
import { ImageService } from '../../services/image.service'; // ✅ Add this
import { ApiResponse } from '../../models/api-response';

@Component({
  selector: 'app-news-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './news-details.component.html',
  styleUrl: './news-details.component.scss'
})
export class NewsDetailsComponent implements OnInit {
  currentUser: User | null = null;
  article: NewsArticle | null = null;
  comments: NewsComment[] = [];
  newComment = '';
  
  isLoading = false;
  isLoadingComments = false;
  isSubmittingComment = false; // ✅ Add this
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private newsService: NewsService,
    private authService: AuthService,
    private imageService: ImageService // ✅ Inject ImageService
  ) {}

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Get article ID from route
    const articleId = Number(this.route.snapshot.paramMap.get('id'));
    if (articleId) {
      this.loadArticle(articleId);
      this.loadComments(articleId);
    }
  }

  /**
   * Load article details
   */
  loadArticle(articleId: number): void {
    this.isLoading = true;
    
    const userId = this.currentUser?.id;
    this.newsService.getArticleById(articleId, userId).subscribe({
      next: (response: ApiResponse<NewsArticle>) => {
        if (response.success && response.data) {
          this.article = response.data;
          // Increment view count
          this.newsService.incrementViewCount(articleId).subscribe();
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading article:', error);
        this.errorMessage = 'Failed to load article.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Load comments
   */
  loadComments(articleId: number): void {
    this.isLoadingComments = true;
    
    this.newsService.getArticleComments(articleId).subscribe({
      next: (response: ApiResponse<NewsComment[]>) => {
        if (response.success && response.data) {
          this.comments = response.data;
        }
        this.isLoadingComments = false;
      },
      error: (error: any) => {
        console.error('Error loading comments:', error);
        this.isLoadingComments = false;
      }
    });
  }

  /**
   * Back to news list
   */
  goBack(): void {
    this.router.navigate(['/news']);
  }

  /**
   * Like/unlike article
   */
  toggleLike(): void {
    if (!this.currentUser || !this.article) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.article.user_has_liked) {
      // Unlike
      this.newsService.unlikeArticle(this.article.id, this.currentUser.id).subscribe({
        next: (response: ApiResponse) => {
          if (response.success && this.article) {
            this.article.likes_count--;
            this.article.user_has_liked = false;
          }
        },
        error: (error: any) => {
          console.error('Error unliking article:', error);
        }
      });
    } else {
      // Like
      this.newsService.likeArticle(this.article.id, this.currentUser.id).subscribe({
        next: (response: ApiResponse) => {
          if (response.success && this.article) {
            this.article.likes_count++;
            this.article.user_has_liked = true;
          }
        },
        error: (error: any) => {
          console.error('Error liking article:', error);
        }
      });
    }
  }

  /**
   * Add comment
   */
  addComment(): void {
    if (!this.currentUser || !this.article) {
      this.router.navigate(['/login']);
      return;
    }

    const comment = this.newComment.trim();
    if (!comment) return;

    this.isSubmittingComment = true;

    this.newsService.addComment(this.article.id, {
      user_id: this.currentUser.id,
      comment: comment
    }).subscribe({
      next: (response: ApiResponse<NewsComment>) => {
        if (response.success && response.data) {
          // Enhance the comment with current user's info
          const enhancedComment: NewsComment = {
            ...response.data,
            author_name: `${this.currentUser!.first_name} ${this.currentUser!.last_name}`,
            author_picture: this.currentUser!.profile_picture,
            user_has_liked: false
          };
          
          this.comments.unshift(enhancedComment);
          this.newComment = '';
          if (this.article) {
            this.article.comments_count++;
          }
        }
        this.isSubmittingComment = false;
      },
      error: (error: any) => {
        console.error('Error adding comment:', error);
        alert('Failed to add comment');
        this.isSubmittingComment = false;
      }
    });
  }

  /**
   * Like/unlike comment
   */
  toggleCommentLike(comment: NewsComment): void {
    if (!this.currentUser || !this.article) {
      this.router.navigate(['/login']);
      return;
    }

    if (comment.user_has_liked) {
      // Unlike
      this.newsService.unlikeComment(this.article.id, comment.id, this.currentUser.id).subscribe({
        next: (response: ApiResponse) => {
          if (response.success) {
            comment.likes_count--;
            comment.user_has_liked = false;
          }
        },
        error: (error: any) => {
          console.error('Error unliking comment:', error);
        }
      });
    } else {
      // Like
      this.newsService.likeComment(this.article.id, comment.id, this.currentUser.id).subscribe({
        next: (response: ApiResponse) => {
          if (response.success) {
            comment.likes_count++;
            comment.user_has_liked = true;
          }
        },
        error: (error: any) => {
          console.error('Error liking comment:', error);
        }
      });
    }
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Format relative time
   */
  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  /**
   * Get user initials
   */
  getUserInitials(name?: string): string {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  /**
   * Format view count
   */
  formatViewCount(count: number): string {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }

  /**
   * Get category badge class
   */
  getCategoryBadgeClass(category: string): string {
    const colorMap: { [key: string]: string } = {
      'Academic': 'bg-blue-600 text-white',
      'Career': 'bg-green-600 text-white',
      'Social': 'bg-purple-600 text-white',
      'Alumni': 'bg-indigo-600 text-white',
      'University': 'bg-orange-600 text-white',
      'General': 'bg-gray-600 text-white'
    };
    return colorMap[category] || 'bg-gray-600 text-white';
  }

  // ✅ Add these image helper methods
  
  /**
   * Get profile picture URL
   */
  getProfilePictureUrl(picturePath: string | null | undefined): string {
    return this.imageService.getProfilePictureUrl(picturePath);
  }

  /**
   * Check if user has profile picture
   */
  hasProfilePicture(picturePath: string | null | undefined): boolean {
    return this.imageService.hasImage(picturePath);
  }


  /**
 * Get article/news image URL
 */
/**
 * Get article/news image URL
 */
getNewsImageUrl(imagePath: string | null | undefined): string {
  // Check if imagePath exists and is not empty
  if (!imagePath || imagePath.trim() === '') {
    return 'https://images.unsplash.com/photo-1585829365295-ab7cd400d7e9?auto=format&fit=crop&w=800&q=80';
  }
  
  const cleanPath = imagePath.trim();
  
  // If it's already a full URL (Firebase Storage, Unsplash, etc.), return as-is
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }
  
  // If it's a base64 data URL, return as-is
  if (cleanPath.startsWith('data:image/')) {
    return cleanPath;
  }
  
  // Otherwise, use ImageService to handle backend paths
  return this.imageService.getImageUrl(cleanPath);
}

/**
 * Handle news image error - show placeholder
 */
onNewsImageError(event: Event): void {
  const img = event.target as HTMLImageElement;
  if (img) {
    img.src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400d7e9?auto=format&fit=crop&w=800&q=80';
  }
}

handleProfileImageError(event: Event, userName?: string): void {
  this.imageService.handleImageError(event, userName);
}
}