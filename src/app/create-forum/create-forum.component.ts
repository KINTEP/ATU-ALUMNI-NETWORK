// src/app/components/create-forum/create-forum.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ForumService } from '../../services/forum.service';
import { AuthService } from '../../services/auth.service';
import { ForumCategory } from '../../models/forum';
import { User } from '../../models/user';

@Component({
  selector: 'app-create-forum',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-forum.component.html',
  styleUrl: './create-forum.component.scss'
})
export class CreateForumComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Current user
  currentUser: User | null = null;

  // Form data
  formData = {
    title: '',
    category_id: 0,
    content: '',
    tags: '',
    allow_comments: true,
    is_pinned: false,
    send_notification: true
  };

  // Categories
  categories: ForumCategory[] = [];

  // Loading and error states
  isLoadingCategories = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private router: Router,
    private forumService: ForumService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check if user is logged in
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
      
      if (!user) {
        // Redirect to login if not authenticated
        alert('Please login to create a forum topic');
        this.router.navigate(['/login']);
      }
    });

    // Load categories
    this.loadCategories();
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
          this.errorMessage = 'Failed to load categories';
          this.isLoadingCategories = false;
        }
      });
  }

  /**
   * Generate URL-friendly slug from title
   */
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/-+/g, '-')       // Replace multiple hyphens with single hyphen
      .substring(0, 255);        // Limit length
  }

  /**
   * Parse tags from comma-separated string
   */
  parseTags(tagsString: string): string[] {
    if (!tagsString || !tagsString.trim()) {
      return [];
    }
    
    return tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .slice(0, 10); // Limit to 10 tags
  }

  /**
   * Validate form
   */
  validateForm(): boolean {
    // Reset messages
    this.errorMessage = '';

    // Validate title
    if (!this.formData.title.trim()) {
      this.errorMessage = 'Title is required';
      return false;
    }

    if (this.formData.title.length < 5) {
      this.errorMessage = 'Title must be at least 5 characters';
      return false;
    }

    if (this.formData.title.length > 255) {
      this.errorMessage = 'Title must not exceed 255 characters';
      return false;
    }

    // Validate category
    if (!this.formData.category_id || this.formData.category_id === 0) {
      this.errorMessage = 'Please select a category';
      return false;
    }

    // Validate content
    if (!this.formData.content.trim()) {
      this.errorMessage = 'Description is required';
      return false;
    }

    if (this.formData.content.length < 10) {
      this.errorMessage = 'Description must be at least 10 characters';
      return false;
    }

    if (this.formData.content.length > 10000) {
      this.errorMessage = 'Description must not exceed 10,000 characters';
      return false;
    }

    return true;
  }

  /**
   * Submit form
   */
  submitForm(event: Event): void {
    event.preventDefault();

    // Validate
    if (!this.validateForm()) {
      return;
    }

    // Check user
    if (!this.currentUser) {
      alert('Please login to create a topic');
      this.router.navigate(['/login']);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    // Prepare post data
    const slug = this.generateSlug(this.formData.title);
    const tags = this.parseTags(this.formData.tags);

    const postData = {
      category_id: this.formData.category_id,
      user_id: this.currentUser.id,
      title: this.formData.title.trim(),
      content: this.formData.content.trim(),
      slug: slug,
      tags: tags.length > 0 ? tags : undefined
    };

    // Create post
    this.forumService.createPost(postData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.successMessage = 'Topic created successfully!';
            
            // If pinned (admin feature), pin the post
            if (this.formData.is_pinned && this.currentUser?.role === 'admin') {
              this.forumService.pinPost(response.data.id).subscribe();
            }

            // Navigate to the created post after a short delay
            setTimeout(() => {
              this.router.navigate(['/forum/posts', response.data!.id]);
            }, 1500);
          }
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error creating post:', error);
          this.errorMessage = error.error?.error || 'Failed to create topic. Please try again.';
          this.isSubmitting = false;
        }
      });
  }

  /**
   * Save as draft
   */
  saveAsDraft(): void {
    // TODO: Implement draft functionality
    // For now, just save to localStorage
    const draft = {
      title: this.formData.title,
      category_id: this.formData.category_id,
      content: this.formData.content,
      tags: this.formData.tags,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('forum_draft', JSON.stringify(draft));
    alert('Draft saved successfully!');
  }

  /**
   * Load draft from localStorage
   */
  loadDraft(): void {
    const draftJson = localStorage.getItem('forum_draft');
    if (draftJson) {
      try {
        const draft = JSON.parse(draftJson);
        this.formData.title = draft.title || '';
        this.formData.category_id = draft.category_id || 0;
        this.formData.content = draft.content || '';
        this.formData.tags = draft.tags || '';
        alert('Draft loaded successfully!');
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }

  /**
   * Navigate back to forum
   */
  navigateBackToForum(): void {
    // Check if there's unsaved content
    if (this.formData.title || this.formData.content) {
      if (confirm('You have unsaved changes. Do you want to leave?')) {
        this.router.navigate(['/forum']);
      }
    } else {
      this.router.navigate(['/forum']);
    }
  }

  /**
   * Get category name by ID
   */
  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : '';
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }
}