// src/app/admin/forum-management/forum-management.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { ForumCategory, ForumPost, ForumStats } from '../../../models/forum';
import { ForumService } from '../../../services/forum.service';


@Component({
  selector: 'app-forum-management',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './forum-management.component.html',
  styleUrls: ['./forum-management.component.scss']
})
export class ForumManagementComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // Data
  posts: ForumPost[] = [];
  categories: ForumCategory[] = [];
  stats: ForumStats | null = null;
  selectedPosts: Set<number> = new Set();

  // Filters
  searchQuery = '';
  selectedCategory: number | null = null;
  selectedStatus: string = 'all';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  totalPosts = 0;

  // Active Tab
  activeTab: 'posts' | 'categories' | 'reported' | 'statistics' = 'posts';

  // Loading states
  isLoading = false;
  isLoadingStats = false;
  isProcessingBulk = false;
  
  // Messages
  successMessage = '';
  errorMessage = '';

  // Modal states
  showCategoryModal = false;
  editingCategory: ForumCategory | null = null;
  
  // Category form fields
  categoryName = '';
  categorySlug = '';
  categoryDescription = '';
  categoryIcon = '';
  categoryColor = '#3B82F6';
  categoryOrder = 0;

  // Bulk action
  selectedBulkAction = '';

  // Math for template
  Math = Math;

  constructor(
    private forumService: ForumService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadPosts();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load forum categories
   */
  loadCategories(): void {
    this.forumService.getAllCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.categories = response.data;
          }
        },
        error: (error) => console.error('Error loading categories:', error)
      });
  }

  /**
   * Load forum posts
   */
  loadPosts(): void {
    this.isLoading = true;
    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };

    if (this.selectedCategory) {
      params.category_id = this.selectedCategory;
    }

    if (this.searchQuery.trim()) {
      params.search = this.searchQuery.trim();
    }

    if (this.selectedStatus === 'pinned') {
      params.is_pinned = true;
    } else if (this.selectedStatus === 'locked') {
      params.is_locked = true;
    }

    this.forumService.getAllPosts(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.posts = response.data;
            this.totalPosts = response.total || 0;
            if (response.pagination) {
              this.totalPages = response.pagination.total_pages;
            }
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading posts:', error);
          this.showError('Failed to load forum posts');
          this.isLoading = false;
        }
      });
  }

  /**
   * Load forum statistics
   */
  loadStats(): void {
    this.isLoadingStats = true;
    this.forumService.getForumStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.stats = response.data;
          }
          this.isLoadingStats = false;
        },
        error: (error) => {
          console.error('Error loading stats:', error);
          this.isLoadingStats = false;
        }
      });
  }

  /**
   * Apply filters
   */
  applyFilters(): void {
    this.currentPage = 1;
    this.loadPosts();
  }

  /**
   * Change page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadPosts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Switch tabs
   */
  switchTab(tab: 'posts' | 'categories' | 'reported' | 'statistics'): void {
    this.activeTab = tab;
    if (tab === 'statistics' && !this.stats) {
      this.loadStats();
    }
  }

  /**
   * Toggle post selection
   */
  togglePostSelection(postId: number): void {
    if (this.selectedPosts.has(postId)) {
      this.selectedPosts.delete(postId);
    } else {
      this.selectedPosts.add(postId);
    }
  }

  /**
   * Toggle all posts selection
   */
  toggleAllPosts(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.posts.forEach(post => this.selectedPosts.add(post.id));
    } else {
      this.selectedPosts.clear();
    }
  }

  /**
   * Check if all posts are selected
   */
  areAllPostsSelected(): boolean {
    return this.posts.length > 0 && this.posts.every(post => this.selectedPosts.has(post.id));
  }

  /**
   * Check if post is selected
   */
  isPostSelected(postId: number): boolean {
    return this.selectedPosts.has(postId);
  }

  /**
   * Pin/Unpin post
   */
  togglePin(post: ForumPost, event: Event): void {
    event.stopPropagation();
    
    const action = post.is_pinned 
      ? this.forumService.unpinPost(post.id)
      : this.forumService.pinPost(post.id);

    action.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        if (response.success) {
          post.is_pinned = !post.is_pinned;
          this.showSuccess(post.is_pinned ? 'Post pinned successfully' : 'Post unpinned successfully');
        }
      },
      error: (error) => {
        console.error('Error toggling pin:', error);
        this.showError('Failed to update post');
      }
    });
  }

  /**
   * Lock/Unlock post
   */
  toggleLock(post: ForumPost, event: Event): void {
    event.stopPropagation();
    
    const action = post.is_locked 
      ? this.forumService.unlockPost(post.id)
      : this.forumService.lockPost(post.id);

    action.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        if (response.success) {
          post.is_locked = !post.is_locked;
          this.showSuccess(post.is_locked ? 'Post locked successfully' : 'Post unlocked successfully');
        }
      },
      error: (error) => {
        console.error('Error toggling lock:', error);
        this.showError('Failed to update post');
      }
    });
  }

  /**
   * Delete post
   */
  deletePost(post: ForumPost, event: Event): void {
    event.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete "${post.title}"?`)) {
      return;
    }

    this.forumService.deletePost(post.id, post.user_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Post deleted successfully');
            this.loadPosts();
            this.loadStats();
          }
        },
        error: (error) => {
          console.error('Error deleting post:', error);
          this.showError('Failed to delete post');
        }
      });
  }

  /**
   * View post
   */
  viewPost(post: ForumPost): void {
    this.router.navigate(['/forum/posts', post.id]);
  }

  /**
   * Edit post
   */
  editPost(post: ForumPost, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/forum/edit', post.id]);
  }

  /**
   * Open category modal
   */
  openCategoryModal(category?: ForumCategory): void {
    if (category) {
      this.editingCategory = category;
      this.categoryName = category.name;
      this.categorySlug = category.slug;
      this.categoryDescription = category.description || '';
      this.categoryIcon = category.icon || '';
      this.categoryColor = category.color || '#3B82F6';
      this.categoryOrder = category.order_position || 0;
    } else {
      this.editingCategory = null;
      this.categoryName = '';
      this.categorySlug = '';
      this.categoryDescription = '';
      this.categoryIcon = '';
      this.categoryColor = '#3B82F6';
      this.categoryOrder = 0;
    }
    this.showCategoryModal = true;
  }

  /**
   * Close category modal
   */
  closeCategoryModal(): void {
    this.showCategoryModal = false;
    this.editingCategory = null;
    this.categoryName = '';
    this.categorySlug = '';
    this.categoryDescription = '';
    this.categoryIcon = '';
    this.categoryColor = '#3B82F6';
    this.categoryOrder = 0;
  }

  /**
   * Save category
   */
  saveCategory(): void {
    const categoryData: Partial<ForumCategory> = {
      name: this.categoryName,
      slug: this.categorySlug,
      description: this.categoryDescription,
      icon: this.categoryIcon || undefined,
      color: this.categoryColor,
      order_position: this.categoryOrder
    };

    const action = this.editingCategory
      ? this.forumService.updateCategory(this.editingCategory.id, categoryData)
      : this.forumService.createCategory(categoryData);

    action.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess(this.editingCategory 
            ? 'Category updated successfully' 
            : 'Category created successfully');
          this.loadCategories();
          this.closeCategoryModal();
        }
      },
      error: (error) => {
        console.error('Error saving category:', error);
        this.showError(error.error?.error || 'Failed to save category');
      }
    });
  }

  /**
   * Delete category
   */
  deleteCategory(category: ForumCategory, event: Event): void {
    event.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete "${category.name}"? This will affect all posts in this category.`)) {
      return;
    }

    this.forumService.deleteCategory(category.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Category deleted successfully');
            this.loadCategories();
            this.loadPosts();
            this.loadStats();
          }
        },
        error: (error) => {
          console.error('Error deleting category:', error);
          this.showError(error.error?.error || 'Failed to delete category');
        }
      });
  }

  /**
   * Apply bulk action
   */
  applyBulkAction(): void {
    if (this.selectedPosts.size === 0) {
      this.showError('Please select at least one post');
      return;
    }

    if (!this.selectedBulkAction) {
      this.showError('Please select an action');
      return;
    }

    const postIds = Array.from(this.selectedPosts);
    
    switch (this.selectedBulkAction) {
      case 'pin':
        this.bulkPinPosts(postIds);
        break;
      case 'unpin':
        this.bulkUnpinPosts(postIds);
        break;
      case 'lock':
        this.bulkLockPosts(postIds);
        break;
      case 'unlock':
        this.bulkUnlockPosts(postIds);
        break;
      case 'delete':
        this.bulkDeletePosts(postIds);
        break;
      default:
        this.showError('Invalid action selected');
    }
  }

  /**
   * Bulk pin posts
   */
  private bulkPinPosts(postIds: number[]): void {
    if (!confirm(`Are you sure you want to pin ${postIds.length} post(s)?`)) {
      return;
    }

    this.isProcessingBulk = true;
    const pinActions = postIds.map(id => this.forumService.pinPost(id));

    forkJoin(pinActions).pipe(takeUntil(this.destroy$)).subscribe({
      next: (responses) => {
        const successCount = responses.filter(r => r.success).length;
        this.showSuccess(`Successfully pinned ${successCount} post(s)`);
        this.selectedPosts.clear();
        this.selectedBulkAction = '';
        this.loadPosts();
        this.isProcessingBulk = false;
      },
      error: (error) => {
        console.error('Error pinning posts:', error);
        this.showError('Failed to pin some posts');
        this.isProcessingBulk = false;
      }
    });
  }

  /**
   * Bulk unpin posts
   */
  private bulkUnpinPosts(postIds: number[]): void {
    if (!confirm(`Are you sure you want to unpin ${postIds.length} post(s)?`)) {
      return;
    }

    this.isProcessingBulk = true;
    const unpinActions = postIds.map(id => this.forumService.unpinPost(id));

    forkJoin(unpinActions).pipe(takeUntil(this.destroy$)).subscribe({
      next: (responses) => {
        const successCount = responses.filter(r => r.success).length;
        this.showSuccess(`Successfully unpinned ${successCount} post(s)`);
        this.selectedPosts.clear();
        this.selectedBulkAction = '';
        this.loadPosts();
        this.isProcessingBulk = false;
      },
      error: (error) => {
        console.error('Error unpinning posts:', error);
        this.showError('Failed to unpin some posts');
        this.isProcessingBulk = false;
      }
    });
  }

  /**
   * Bulk lock posts
   */
  private bulkLockPosts(postIds: number[]): void {
    if (!confirm(`Are you sure you want to lock ${postIds.length} post(s)?`)) {
      return;
    }

    this.isProcessingBulk = true;
    const lockActions = postIds.map(id => this.forumService.lockPost(id));

    forkJoin(lockActions).pipe(takeUntil(this.destroy$)).subscribe({
      next: (responses) => {
        const successCount = responses.filter(r => r.success).length;
        this.showSuccess(`Successfully locked ${successCount} post(s)`);
        this.selectedPosts.clear();
        this.selectedBulkAction = '';
        this.loadPosts();
        this.isProcessingBulk = false;
      },
      error: (error) => {
        console.error('Error locking posts:', error);
        this.showError('Failed to lock some posts');
        this.isProcessingBulk = false;
      }
    });
  }

  /**
   * Bulk unlock posts
   */
  private bulkUnlockPosts(postIds: number[]): void {
    if (!confirm(`Are you sure you want to unlock ${postIds.length} post(s)?`)) {
      return;
    }

    this.isProcessingBulk = true;
    const unlockActions = postIds.map(id => this.forumService.unlockPost(id));

    forkJoin(unlockActions).pipe(takeUntil(this.destroy$)).subscribe({
      next: (responses) => {
        const successCount = responses.filter(r => r.success).length;
        this.showSuccess(`Successfully unlocked ${successCount} post(s)`);
        this.selectedPosts.clear();
        this.selectedBulkAction = '';
        this.loadPosts();
        this.isProcessingBulk = false;
      },
      error: (error) => {
        console.error('Error unlocking posts:', error);
        this.showError('Failed to unlock some posts');
        this.isProcessingBulk = false;
      }
    });
  }

  /**
   * Bulk delete posts
   */
  private bulkDeletePosts(postIds: number[]): void {
    if (!confirm(`⚠️ Are you sure you want to DELETE ${postIds.length} post(s)? This action cannot be undone!`)) {
      return;
    }

    this.isProcessingBulk = true;
    
    // Get user IDs for each post
    const deleteActions = postIds.map(postId => {
      const post = this.posts.find(p => p.id === postId);
      if (post) {
        return this.forumService.deletePost(postId, post.user_id);
      }
      return null;
    }).filter(action => action !== null);

    if (deleteActions.length === 0) {
      this.showError('No valid posts to delete');
      this.isProcessingBulk = false;
      return;
    }

    forkJoin(deleteActions).pipe(takeUntil(this.destroy$)).subscribe({
      next: (responses) => {
        const successCount = responses.filter(r => r && r.success).length;
        this.showSuccess(`Successfully deleted ${successCount} post(s)`);
        this.selectedPosts.clear();
        this.selectedBulkAction = '';
        this.loadPosts();
        this.loadStats();
        this.isProcessingBulk = false;
      },
      error: (error) => {
        console.error('Error deleting posts:', error);
        this.showError('Failed to delete some posts');
        this.loadPosts(); // Reload to show which ones were deleted
        this.isProcessingBulk = false;
      }
    });
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(post: ForumPost): string {
    if (post.is_locked) return 'bg-red-100 text-red-800';
    if (post.is_pinned) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }

  /**
   * Get status text
   */
  getStatusText(post: ForumPost): string {
    if (post.is_locked) return 'Locked';
    if (post.is_pinned) return 'Pinned';
    return 'Active';
  }

  /**
   * Get category badge class
   */
  getCategoryBadgeClass(categoryName: string): string {
    const colorMap: { [key: string]: string } = {
      'General': 'bg-blue-100 text-blue-800',
      'Career': 'bg-green-100 text-green-800',
      'Technical': 'bg-purple-100 text-purple-800',
      'Alumni': 'bg-orange-100 text-orange-800',
      'Academic': 'bg-indigo-100 text-indigo-800',
      'Social': 'bg-pink-100 text-pink-800'
    };
    return colorMap[categoryName] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Format time ago
   */
  getTimeAgo(date: string): string {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
    
    return past.toLocaleDateString();
  }

  /**
   * Get author initials
   */
  getAuthorInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
    }
    return name[0].toUpperCase();
  }

  /**
   * Export forum data
   */
  exportData(): void {
    // Create CSV content
    const headers = ['ID', 'Title', 'Category', 'Author', 'Replies', 'Views', 'Status', 'Created'];
    const rows = this.posts.map(post => [
      post.id,
      `"${post.title.replace(/"/g, '""')}"`, // Escape quotes in title
      post.category_name,
      post.author_name,
      post.replies_count,
      post.views_count,
      this.getStatusText(post),
      new Date(post.created_at).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `forum-posts-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showSuccess('Forum data exported successfully');
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 3000);
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = '', 3000);
  }

    

}