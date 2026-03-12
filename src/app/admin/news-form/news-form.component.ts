// src/app/components/news-form/news-form.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { NewsService } from '../../../services/news.service';
import { AuthService } from '../../../services/auth.service';
import { UploadService } from '../../../services/upload.service'; // ✅ Add this
import { User } from '../../../models/user';

@Component({
  selector: 'app-news-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './news-form.component.html',
  styleUrls: ['./news-form.component.scss']
})
export class NewsFormComponent implements OnInit, OnDestroy {
  articleForm!: FormGroup;
  isEditMode = false;
  articleId: number | null = null;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  
  // Authentication
  currentUser: User | null = null;
  
  // File upload
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isUploadingImage = false;
  
  // Categories
  categories = ['Academic', 'Career', 'Social', 'Alumni', 'University', 'General'];
  
  // Character counters
  titleLength = 0;
  excerptLength = 0;
  contentLength = 0;
  metaDescLength = 0;
  
  // Auto-save
  private destroy$ = new Subject<void>();
  private autoSaveEnabled = false;

  constructor(
    private fb: FormBuilder,
    private newsService: NewsService,
    private authService: AuthService,
    private uploadService: UploadService, // ✅ Add this
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
      if (!user) {
        this.errorMessage = 'You must be logged in to create articles';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      }
    });

    this.initializeForm();
    this.checkEditMode();
    this.setupCharacterCounters();
    this.setupAutoSave();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the form
   */
  initializeForm(): void {
    this.articleForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(255)]],
      category: ['', Validators.required],
      tags: [''],
      excerpt: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      content: ['', [Validators.required, Validators.minLength(50)]],
      meta_description: ['', Validators.maxLength(160)],
      keywords: [''],
      is_featured: [false]
    });
  }

  /**
   * Setup character counters
   */
  setupCharacterCounters(): void {
    this.articleForm.get('title')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.titleLength = value?.length || 0);

    this.articleForm.get('excerpt')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.excerptLength = value?.length || 0);

    this.articleForm.get('content')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.contentLength = value?.length || 0);

    this.articleForm.get('meta_description')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.metaDescLength = value?.length || 0);
  }

  /**
   * Setup auto-save (saves draft every 30 seconds if form is dirty)
   */
  setupAutoSave(): void {
    this.articleForm.valueChanges
      .pipe(
        debounceTime(30000), // 30 seconds
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.autoSaveEnabled && this.articleForm.dirty && !this.isSubmitting) {
          this.autoSaveDraft();
        }
      });
  }

  /**
   * Auto-save draft silently
   */
  private autoSaveDraft(): void {
    console.log('Auto-saving draft...');
    // Could implement silent save to localStorage or backend
    // localStorage.setItem('article_draft', JSON.stringify(this.articleForm.value));
  }

  /**
   * Check if we're in edit mode
   */
  checkEditMode(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.articleId = +params['id'];
        this.loadArticle(this.articleId);
      }
    });
  }

  /**
   * Load article for editing
   */
  loadArticle(id: number): void {
    this.newsService.getArticleById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const article = response.data;
          this.articleForm.patchValue({
            title: article.title,
            category: article.category,
            tags: article.tags?.join(', ') || '',
            excerpt: article.excerpt,
            content: article.content,
            meta_description: article.meta_description || '',
            keywords: article.keywords || '',
            is_featured: article.is_featured
          });
          
          if (article.featured_image) {
            this.imagePreview = article.featured_image;
          }

          // Mark form as pristine after loading
          this.articleForm.markAsPristine();
        }
      },
      error: (error) => {
        console.error('Error loading article:', error);
        this.showError('Failed to load article. Please try again.');
      }
    });
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.showError('Please select an image file (PNG, JPG, GIF)');
        return;
      }
      
      // Validate file size (10MB for news images)
      if (file.size > 10 * 1024 * 1024) {
        this.showError('Image size must be less than 10MB');
        return;
      }
      
      this.selectedFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
      
      this.errorMessage = '';
    }
  }

  /**
   * Remove selected image
   */
  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    
    // Clear file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Generate slug from title
   */
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Parse tags from string
   */
  parseTags(tagsString: string): string[] {
    if (!tagsString || !tagsString.trim()) return [];
    
    return tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  /**
   * Save article as draft
   */
  saveDraft(): void {
    if (!this.validateForm()) {
      return;
    }

    this.submitForm(false);
  }

  /**
   * Publish article
   */
  publishNow(): void {
    if (!this.validateForm()) {
      return;
    }

    this.submitForm(true);
  }

  /**
   * Validate form before submission
   */
  private validateForm(): boolean {
    if (!this.currentUser) {
      this.showError('You must be logged in to create articles');
      return false;
    }

    if (this.articleForm.invalid) {
      this.markFormGroupTouched(this.articleForm);
      this.showError('Please fill in all required fields correctly');
      return false;
    }

    return true;
  }

  /**
   * Submit the form
   */
  async submitForm(isPublished: boolean): Promise<void> {
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const formValue = this.articleForm.value;
      const tags = this.parseTags(formValue.tags);
      const slug = this.generateSlug(formValue.title);

      const articleData: any = {
        author_id: this.currentUser!.id,
        title: formValue.title,
        slug: slug,
        excerpt: formValue.excerpt,
        content: formValue.content,
        category: formValue.category,
        tags: tags,
        meta_description: formValue.meta_description || null,
        keywords: formValue.keywords || null,
        is_featured: formValue.is_featured || false,
        is_published: isPublished
      };

      // ✅ Handle image upload to Firebase Storage
      if (this.selectedFile) {
        this.isUploadingImage = true;
        
        try {
          // Upload to Firebase Storage in the 'news' folder
          const uploadResult = await this.uploadService.uploadNewsImage(
            this.selectedFile,
            this.imagePreview || undefined // Pass old image URL for deletion
          ).toPromise();

          if (uploadResult?.url) {
            articleData.featured_image = uploadResult.url;
          } else {
            throw new Error('Failed to get image URL from upload');
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          this.showError('Failed to upload image. Please try again.');
          this.isSubmitting = false;
          this.isUploadingImage = false;
          return;
        } finally {
          this.isUploadingImage = false;
        }
      } else if (this.imagePreview && this.isEditMode) {
        // Keep existing image if in edit mode and no new image selected
        articleData.featured_image = this.imagePreview;
      }

      const request$ = this.isEditMode && this.articleId
        ? this.newsService.updateArticle(this.articleId, articleData)
        : this.newsService.createArticle(articleData);

      request$.subscribe({
        next: (response) => {
          if (response.success && (response.data || this.isEditMode)) {
            const message = isPublished
              ? 'Article published successfully!'
              : 'Article saved as draft!';
            this.showSuccess(message);
            this.articleForm.markAsPristine();
            setTimeout(() => this.router.navigate(['/admin/news']), 1500);
          } else {
            this.showError(response.message || 'Operation failed');
          }
        },
        error: (error) => {
          console.error('Submission error:', error);
          this.handleError(error);
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });

    } catch (error: any) {
      console.error('Unexpected error:', error);
      this.showError('An unexpected error occurred. Please try again.');
      this.isSubmitting = false;
      this.isUploadingImage = false;
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): void {
    if (error.status === 401) {
      this.showError('You must be logged in to perform this action');
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    } else if (error.status === 403) {
      this.showError('You do not have permission to perform this action');
    } else if (error.error?.error) {
      this.showError(error.error.error);
    } else if (error.error?.message) {
      this.showError(error.error.message);
    } else {
      this.showError('An error occurred. Please try again.');
    }
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    
    // Scroll to top to show message
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    
    // Scroll to top to show message
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Mark all form fields as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Cancel and go back
   */
  cancel(): void {
    if (this.articleForm.dirty) {
      if (confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        this.router.navigate(['/admin/news']);
      }
    } else {
      this.router.navigate(['/admin/news']);
    }
  }

  /**
   * Check if field has error
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.articleForm.get(fieldName);
    return !!(field && field.hasError(errorType) && (field.dirty || field.touched));
  }

  /**
   * Get error message for field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.articleForm.get(fieldName);
    if (!field) return '';

    if (field.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (field.hasError('minlength')) {
      const minLength = field.getError('minlength').requiredLength;
      const currentLength = field.getError('minlength').actualLength;
      return `${this.getFieldLabel(fieldName)} must be at least ${minLength} characters (currently ${currentLength})`;
    }
    if (field.hasError('maxlength')) {
      const maxLength = field.getError('maxlength').requiredLength;
      const currentLength = field.getError('maxlength').actualLength;
      return `${this.getFieldLabel(fieldName)} must not exceed ${maxLength} characters (currently ${currentLength})`;
    }
    return '';
  }

  /**
   * Get friendly field label
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      title: 'Title',
      category: 'Category',
      excerpt: 'Excerpt',
      content: 'Content',
      meta_description: 'Meta description',
      keywords: 'Keywords'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Get character count class for styling
   */
  getCharCountClass(current: number, max: number): string {
    const percentage = (current / max) * 100;
    
    if (percentage >= 100) return 'text-red-500 font-semibold';
    if (percentage >= 90) return 'text-orange-500 font-medium';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-gray-500';
  }
}