import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NewsArticle } from '../../models/news';
import { User } from '../../models/user';
import { NewsService } from '../../services/news.service';
import { AuthService } from '../../services/auth.service';
import { ApiResponse } from '../../models/api-response';


@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './news.component.html',
  styleUrl: './news.component.scss'
})
export class NewsComponent implements OnInit {
  currentUser: User | null = null;
  
  // News data
  featuredArticle: NewsArticle | null = null;
  newsArticles: NewsArticle[] = [];
  
  // Filter and search
  searchQuery = '';
  selectedCategory = '';
  
  // Loading and pagination
  isLoading = false;
  isLoadingFeatured = false;
  currentPage = 1;
  totalArticles = 0;
  totalPages = 0;
  limit = 6;
  
  // Error handling
  errorMessage = '';
  
  // Categories
  categories = ['Academic', 'Career', 'Social', 'Alumni', 'University', 'General'];

  constructor(
    private newsService: NewsService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Load data
    this.loadFeaturedArticle();
    this.loadNewsArticles();
  }

  /**
   * Load featured article
   */
  loadFeaturedArticle(): void {
    this.isLoadingFeatured = true;
    this.newsService.getFeaturedArticles(1).subscribe({
      next: (response: ApiResponse<NewsArticle[]>) => {
        if (response.success && response.data && response.data.length > 0) {
          this.featuredArticle = response.data[0];
        }
        this.isLoadingFeatured = false;
      },
      error: (error: any) => {
        console.error('Error loading featured article:', error);
        this.isLoadingFeatured = false;
      }
    });
  }

  /**
   * Load news articles
   */
  loadNewsArticles(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const params: any = {
      page: this.currentPage,
      limit: this.limit
    };

    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedCategory) params.category = this.selectedCategory;

    this.newsService.getAllArticles(params).subscribe({
      next: (response: ApiResponse<NewsArticle[]>) => {
        if (response.success && response.data) {
          this.newsArticles = response.data;
          this.totalArticles = response.total || 0;
          this.totalPages = Math.ceil(this.totalArticles / this.limit);
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading news:', error);
        this.errorMessage = 'Failed to load news articles. Please try again.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Search articles
   */
  searchArticles(): void {
    this.currentPage = 1;
    this.loadNewsArticles();
  }

  /**
   * Filter by category
   */
  filterByCategory(): void {
    this.currentPage = 1;
    this.loadNewsArticles();
  }

  /**
   * Reset filters
   */
  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.currentPage = 1;
    this.loadNewsArticles();
  }

  /**
   * View article details
   */
  viewArticle(articleId: number): void {
    // Increment view count
    this.newsService.incrementViewCount(articleId).subscribe();
    
    // Navigate to article details
    this.router.navigate(['/news', articleId]);
  }

  /**
   * Like article
   */
  likeArticle(article: NewsArticle, event: Event): void {
    event.stopPropagation();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    if (article.user_has_liked) {
      // Unlike
      this.newsService.unlikeArticle(article.id, this.currentUser.id).subscribe({
        next: (response: ApiResponse) => {
          if (response.success) {
            article.likes_count--;
            article.user_has_liked = false;
          }
        },
        error: (error: any) => {
          console.error('Error unliking article:', error);
        }
      });
    } else {
      // Like
      this.newsService.likeArticle(article.id, this.currentUser.id).subscribe({
        next: (response: ApiResponse) => {
          if (response.success) {
            article.likes_count++;
            article.user_has_liked = true;
          }
        },
        error: (error: any) => {
          console.error('Error liking article:', error);
        }
      });
    }
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadNewsArticles();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Go to previous page
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadNewsArticles();
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  /**
   * Format view count
   */
  formatViewCount(count: number): string {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }
}