// src/app/admin/edit-project/edit-project.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ProjectsService, CreateProjectData } from '../../../services/projects.service';
import { UploadService } from '../../../services/upload.service';

interface ProjectForm {
  title: string;
  description: string;
  long_description: string;
  category: string;
  status: 'proposed' | 'ongoing' | 'completed' | 'cancelled';
  location: string;
  startDate: string;
  targetDate: string;
  fundingGoal: number | null;
  currentAmount: number;
  acceptDonations: boolean;
  acceptVolunteers: boolean;
  maxVolunteers: number | null;
  isFeatured: boolean;
  coverImage: File | null;
}

@Component({
  selector: 'app-edit-project',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  templateUrl: './edit-project.component.html',
  styleUrl: './edit-project.component.scss'
})
export class EditProjectComponent implements OnInit {

  projectId!: number;
  isLoading = false;
  isSubmitting = false;
  isUploadingImage = false;
  submitted = false;
  successMessage = '';
  errorMessage = '';

  // Image state
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  existingImage: string | null = null;
  uploadProgress: number | null = null;
  uploadError: string | null = null;

  // Form model — same shape as create
  project: ProjectForm = {
    title: '',
    description: '',
    long_description: '',
    category: '',
    status: 'proposed',
    location: '',
    startDate: '',
    targetDate: '',
    fundingGoal: null,
    currentAmount: 0,
    acceptDonations: true,
    acceptVolunteers: true,
    maxVolunteers: null,
    isFeatured: false,
    coverImage: null
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private projectsService: ProjectsService,
    private uploadService: UploadService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.projectId = +params['id'];
      if (this.projectId) {
        this.loadProject();
      } else {
        this.errorMessage = 'Invalid project ID';
      }
    });
  }

  // ── Load ──────────────────────────────────────────────────────────────────

  loadProject(): void {
    this.isLoading = true;
    this.projectsService.getProjectById(this.projectId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.populateForm(response.data);
        } else {
          this.errorMessage = 'Project not found';
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading project:', error);
        this.errorMessage = 'Failed to load project details';
        this.isLoading = false;
      }
    });
  }

  populateForm(p: any): void {
    // Store existing image
    this.existingImage = p.cover_image || p.image_url || null;
    if (this.existingImage) this.imagePreview = this.existingImage;

    const formatDate = (d: string | null) =>
      d ? new Date(d).toISOString().split('T')[0] : '';

    this.project = {
      title: p.title || '',
      description: p.description || '',
      long_description: p.long_description || '',
      category: p.category || '',
      status: p.status || 'proposed',
      location: p.location || '',
      startDate: formatDate(p.start_date),
      targetDate: formatDate(p.target_date),
      fundingGoal: p.funding_goal ?? null,
      currentAmount: p.current_amount || 0,
      acceptDonations: p.accept_donations !== undefined ? p.accept_donations : true,
      acceptVolunteers: p.accept_volunteers !== undefined ? p.accept_volunteers : true,
      maxVolunteers: p.max_volunteers ?? null,
      isFeatured: p.is_featured || false,
      coverImage: null
    };
  }

  // ── Validation ────────────────────────────────────────────────────────────

  private validateForm(): boolean {
    return !!(
      this.project.title?.trim() &&
      this.project.description?.trim() &&
      this.project.category &&
      this.project.location?.trim() &&
      this.project.startDate &&
      this.project.fundingGoal && this.project.fundingGoal > 0
    );
  }

  // ── Image Handling ────────────────────────────────────────────────────────

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.uploadError = 'Please select a valid image file (PNG, JPG, WEBP)';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.uploadError = 'Image must be less than 5MB';
      return;
    }

    this.selectedImage = file;
    this.project.coverImage = file;
    this.uploadError = null;

    const reader = new FileReader();
    reader.onload = () => { this.imagePreview = reader.result as string; };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
    this.existingImage = null;
    this.project.coverImage = null;
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async saveAsDraft(): Promise<void> {
    await this.submitProject(false);
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    if (!this.validateForm()) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }
    await this.submitProject(true);
  }

  private async submitProject(isPublished: boolean): Promise<void> {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const projectData: any = {
        title: this.project.title.trim(),
        description: this.project.description.trim(),
        long_description: this.project.long_description?.trim() || undefined,
        category: this.project.category,
        status: this.project.status,
        location: this.project.location.trim(),
        start_date: this.project.startDate,
        target_date: this.project.targetDate || undefined,
        funding_goal: this.project.fundingGoal,
        current_amount: this.project.currentAmount || 0,
        accept_donations: this.project.acceptDonations,
        accept_volunteers: this.project.acceptVolunteers,
        max_volunteers: this.project.maxVolunteers ?? undefined,
        is_featured: this.project.isFeatured,
        is_published: isPublished
      };

      // Handle image
      if (this.selectedImage) {
        this.isUploadingImage = true;
        try {
          const uploadResult = await this.uploadService.uploadProjectImage(
            this.selectedImage,
            (this.imagePreview ?? undefined) as any
          ).toPromise();

          if (uploadResult?.url) {
            projectData.cover_image = uploadResult.url;
          } else {
            throw new Error('Failed to get image URL from upload');
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          this.errorMessage = 'Failed to upload image. Please try again.';
          this.isSubmitting = false;
          this.isUploadingImage = false;
          return;
        } finally {
          this.isUploadingImage = false;
        }
      } else if (this.existingImage) {
        projectData.cover_image = this.existingImage;
      } else {
        projectData.cover_image = null;
      }

      this.projectsService.updateProject(this.projectId, projectData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.successMessage = isPublished
              ? 'Project updated successfully!'
              : 'Project saved as draft!';
            setTimeout(() => this.router.navigate(['/admin/projects']), 1500);
          } else {
            this.errorMessage = response.message || 'Failed to update project';
          }
          this.isSubmitting = false;
        },
        error: (error: any) => {
          console.error('Update project error:', error);
          this.errorMessage = error.error?.error || 'Failed to update project. Please try again.';
          this.isSubmitting = false;
        }
      });

    } catch (error: any) {
      console.error('Unexpected error:', error);
      this.errorMessage = 'An unexpected error occurred. Please try again.';
      this.isSubmitting = false;
      this.isUploadingImage = false;
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  goBack(): void {
    if (this.hasUnsavedChanges()) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        this.router.navigate(['/admin/projects']);
      }
    } else {
      this.router.navigate(['/admin/projects']);
    }
  }

  private hasUnsavedChanges(): boolean {
    return !!(this.project.title || this.project.description || this.selectedImage);
  }

  formatNumber(num: number): string {
    return num.toLocaleString();
  }

  get descriptionLength(): number {
    return this.project.description?.length ?? 0;
  }

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      'proposed':  'bg-yellow-100 text-yellow-700',
      'ongoing':   'bg-green-100 text-green-700',
      'completed': 'bg-blue-100 text-blue-700',
      'cancelled': 'bg-red-100 text-red-700'
    };
    return map[status] ?? 'bg-gray-100 text-gray-700';
  }
}