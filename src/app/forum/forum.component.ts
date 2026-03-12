// src/app/components/forum/forum.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ForumService } from '../../services/forum.service';
import { AuthService } from '../../services/auth.service';
import { ImageService } from '../../services/image.service'; // ✅ Add this
import { ForumCategory, ForumPost } from '../../models/forum';

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forum.component.html',
  styleUrl: './forum.component.scss'
})
export class ForumComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  posts: ForumPost[] = [];
  categories: ForumCategory[] = [];
  
  // Filters
  selectedCategory: number | null = null;
  searchQuery: string = '';
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 9;
  totalPages: number = 1;
  totalPosts: number = 0;
  
  // Loading states
  isLoading: boolean = false;
  isLoadingCategories: boolean = false;
  
  // Error handling
  errorMessage: string = '';
  
  // Current user
  currentUserId: number | null = null;

  constructor(
    private forumService: ForumService,
    private authService: AuthService,
    private imageService: ImageService, // ✅ Inject ImageService
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUserId = user?.id || null;
    });

    this.loadCategories();
    this.loadPosts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load forum categories
   */
  loadCategories(): void {
    this.isLoadingCategories = true;
    this.forumService.getAllCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.categories = response.data;
          }
          this.isLoadingCategories = false;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.isLoadingCategories = false;
        }
      });
  }

  /**
   * Load forum posts with current filters
   */
  loadPosts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize,
      current_user_id: this.currentUserId || undefined
    };

    if (this.selectedCategory) {
      params.category_id = this.selectedCategory;
    }

    if (this.searchQuery.trim()) {
      params.search = this.searchQuery.trim();
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
          this.errorMessage = 'Failed to load forum posts. Please try again.';
          this.isLoading = false;
        }
      });
  }

  /**
   * Filter posts by category
   */
  filterByCategory(categoryId: number | null): void {
    this.selectedCategory = categoryId;
    this.currentPage = 1;
    this.loadPosts();
  }

  /**
   * Search posts
   */
  onSearch(): void {
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
   * Navigate to post detail page
   */
  viewPost(post: ForumPost): void {
    this.forumService.incrementPostViews(post.id).subscribe();
    this.router.navigate(['/forum/posts', post.id]);
  }

  /**
   * Navigate to create new post page
   */
  createNewPost(): void {
    if (!this.currentUserId) {
      alert('Please login to create a post');
      this.router.navigate(['/login']);
      return;
    }
    this.router.navigate(['/forum/new-post']);
  }

  /**
   * Toggle like on a post
   */
  toggleLike(post: ForumPost, event: Event): void {
    event.stopPropagation();
    
    if (!this.currentUserId) {
      alert('Please login to like posts');
      this.router.navigate(['/login']);
      return;
    }

    if (post.user_has_liked) {
      this.forumService.unlikePost(post.id, this.currentUserId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              post.user_has_liked = false;
              post.likes_count--;
            }
          },
          error: (error) => console.error('Error unliking post:', error)
        });
    } else {
      this.forumService.likePost(post.id, this.currentUserId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              post.user_has_liked = true;
              post.likes_count++;
            }
          },
          error: (error) => console.error('Error liking post:', error)
        });
    }
  }

  /**
   * Get category name by ID
   */
  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'General';
  }

  /**
   * Get category color
   */
  getCategoryColor(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.color || '#3B82F6';
  }

  /**
   * Format time ago
   */
  getTimeAgo(date: string): string {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return postDate.toLocaleDateString();
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
   * Get pagination pages array
   */
  getPaginationPages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push(1);
        pages.push(-1);
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  // ✅ Add image helper methods

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


  navigateToCreateForum() {
 this.router.navigate(["/createForum"])
}
}