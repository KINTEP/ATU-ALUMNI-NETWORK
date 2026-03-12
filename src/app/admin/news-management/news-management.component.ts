import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { AuthService } from '../../../services/auth.service';
import { NewsService } from '../../../services/news.service';
import { NewsArticle } from '../../../models/news';
import { ApiResponse } from '../../../models/api-response';
import { User } from '../../../models/user';


@Component({
  selector: 'app-news-management',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './news-management.component.html',
  styleUrl: './news-management.component.scss'
})
export class NewsManagementComponent implements OnInit {
  currentUser: User | null = null;
  articles: NewsArticle[] = [];
  filteredArticles: NewsArticle[] = [];
  selectedArticles: number[] = [];
  
  // Filters
  searchQuery = '';
  selectedCategory = 'all';
  selectedStatus = 'all';
  currentTab = 'all';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalArticles = 0;
  totalPages = 0;
  
  // Loading states
  isLoading = false;
  
  // Statistics
  stats = {
    total: 0,
    published: 0,
    views: 0,
    drafts: 0
  };

  categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'General', label: 'General' },
    { value: 'Academic', label: 'Academic' },
    { value: 'Career', label: 'Career' },
    { value: 'Alumni', label: 'Alumni Stories' },
    { value: 'University', label: 'University' },
    { value: 'Social', label: 'Social' }
  ];

  constructor(
    private router: Router,
    private newsService: NewsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadArticles();
        this.loadStatistics();
      }
    });
  }

  /**
   * Load articles
   */
  loadArticles(): void {
    this.isLoading = true;

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };

    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedCategory !== 'all') params.category = this.selectedCategory;

    this.newsService.getAllArticles(params).subscribe({
      next: (response: ApiResponse<NewsArticle[]>) => {
        if (response.success && response.data) {
          this.articles = response.data;
          this.totalArticles = response.total || 0;
          this.totalPages = Math.ceil(this.totalArticles / this.pageSize);
          this.filterArticlesByTab();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading articles:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Load statistics
   */
  loadStatistics(): void {
    this.newsService.getNewsStats().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const data = response.data;
          this.stats = {
            total: data.total_articles || 0,
            published: this.articles.filter(a => a.is_published).length,
            views: this.articles.reduce((sum, a) => sum + (a.views_count || 0), 0),
            drafts: this.articles.filter(a => !a.is_published).length
          };
        }
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
      }
    });
  }

  /**
   * Filter articles by tab
   */
  filterArticlesByTab(): void {
    if (this.currentTab === 'all') {
      this.filteredArticles = this.articles;
    } else if (this.currentTab === 'published') {
      this.filteredArticles = this.articles.filter(a => a.is_published);
    } else if (this.currentTab === 'drafts') {
      this.filteredArticles = this.articles.filter(a => !a.is_published);
    } else if (this.currentTab === 'featured') {
      this.filteredArticles = this.articles.filter(a => a.is_featured);
    } else if (this.currentTab === 'scheduled') {
      // Filter scheduled articles (you may need to add a scheduled_at field)
      this.filteredArticles = this.articles.filter(a => !a.is_published);
    }
  }

  /**
   * Change tab
   */
  changeTab(tab: string): void {
    this.currentTab = tab;
    this.currentPage = 1;
    this.filterArticlesByTab();
  }

  /**
   * Search articles
   */
  searchArticles(): void {
    this.currentPage = 1;
    this.loadArticles();
  }

  /**
   * Filter by category
   */
  filterByCategory(): void {
    this.currentPage = 1;
    this.loadArticles();
  }

  /**
   * Filter by status
   */
  filterByStatus(): void {
    this.currentPage = 1;
    this.loadArticles();
  }

  /**
   * Change page
   */
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadArticles();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Toggle article selection
   */
  toggleArticleSelection(articleId: number, event: Event): void {
    event.stopPropagation();
    const index = this.selectedArticles.indexOf(articleId);
    if (index > -1) {
      this.selectedArticles.splice(index, 1);
    } else {
      this.selectedArticles.push(articleId);
    }
  }

  /**
   * Toggle select all
   */
  toggleSelectAll(event: Event): void {
    event.stopPropagation();
    if (this.selectedArticles.length === this.filteredArticles.length) {
      this.selectedArticles = [];
    } else {
      this.selectedArticles = this.filteredArticles.map(a => a.id);
    }
  }

  /**
   * Check if article is selected
   */
  isArticleSelected(articleId: number): boolean {
    return this.selectedArticles.includes(articleId);
  }

  /**
   * Navigate to create article
   */
  navigateToCreateArticle(): void {
    this.router.navigate(['admin/news-form']);
  }

  /**
   * Edit article
   */
  editArticle(articleId: number): void {
    this.router.navigate(['/admin/edit-article', articleId]);
  }

  /**
   * View article
   */
  viewArticle(articleId: number): void {
    this.router.navigate(['/news', articleId]);
  }

  /**
   * View comments
   */
  viewComments(articleId: number): void {
    this.router.navigate(['/admin/article-comments', articleId]);
  }

  /**
   * View analytics
   */
  viewAnalytics(articleId: number): void {
    this.router.navigate(['/admin/article-analytics', articleId]);
  }

  /**
   * Delete article
   */
  deleteArticle(article: NewsArticle): void {
    if (!confirm(`Are you sure you want to delete "${article.title}"?`)) return;

    this.newsService.deleteArticle(article.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.showAlert('success', 'Article deleted successfully');
          this.loadArticles();
          this.loadStatistics();
        }
      },
      error: (error) => {
        console.error('Error deleting article:', error);
        this.showAlert('error', 'Failed to delete article');
      }
    });
  }

  /**
   * Publish article
   */
  publishArticle(article: NewsArticle): void {
    this.newsService.publishArticle(article.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.showAlert('success', 'Article published successfully');
          this.loadArticles();
          this.loadStatistics();
        }
      },
      error: (error) => {
        console.error('Error publishing article:', error);
        this.showAlert('error', 'Failed to publish article');
      }
    });
  }

  /**
   * Feature article
   */
  featureArticle(article: NewsArticle): void {
    this.newsService.updateArticle(article.id, { is_featured: !article.is_featured }).subscribe({
      next: (response) => {
        if (response.success) {
          this.showAlert('success', article.is_featured ? 'Article unfeatured' : 'Article featured successfully');
          this.loadArticles();
        }
      },
      error: (error) => {
        console.error('Error featuring article:', error);
        this.showAlert('error', 'Failed to feature article');
      }
    });
  }

  /**
   * Get category badge class
   */
  getCategoryClass(category: string): string {
    const classes: { [key: string]: string } = {
      'Academic': 'bg-green-100 text-green-800',
      'Career': 'bg-orange-100 text-orange-800',
      'Alumni': 'bg-purple-100 text-purple-800',
      'University': 'bg-indigo-100 text-indigo-800',
      'Social': 'bg-pink-100 text-pink-800',
      'General': 'bg-gray-100 text-gray-800'
    };
    return classes[category] || 'bg-blue-100 text-blue-800';
  }

  /**
   * Get status badge class
   */
  getStatusClass(article: NewsArticle): string {
    if (article.is_published) return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  }

  /**
   * Get status text
   */
  getStatusText(article: NewsArticle): string {
    if (article.is_published) return 'Published';
    return 'Draft';
  }

  /**
   * Get author initials
   */
  getAuthorInitials(authorName: string): string {
    if (!authorName) return 'U';
    return authorName
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  /**
   * Format date
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Format number
   */
  formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * Show alert
   */
  showAlert(type: 'success' | 'error', message: string): void {
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md animate-slide-in ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    
    alertDiv.innerHTML = `
      <div class="flex items-center space-x-3">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-2xl"></i>
        <p class="flex-1">${message}</p>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
  }

  // Make Math available in template
  Math = Math;
}