import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ProjectsService, CreateProjectData } from '../../../services/projects.service';
import { UploadService } from '../../../services/upload.service';

interface ProjectForm {
  title: string;
  description: string;
  long_description: string;
  category: string;
  status: 'proposed' | 'ongoing';
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
  selector: 'app-create-project',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  templateUrl: './create-project.component.html',
  styleUrl: './create-project.component.scss'
})
export class CreateProjectComponent implements OnInit {

  // ── Wizard State ──────────────────────────────────────────────────────────
  currentStep = 1;
  submitted = false;
  isSubmitting = false;
  isUploadingImage = false;
  showSuccess = false;
  createdProjectId: number | null = null;

  // ── Upload State ──────────────────────────────────────────────────────────
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  uploadProgress: number | null = null;
  uploadError: string | null = null;

  // ── Error State ───────────────────────────────────────────────────────────
  submitError: string | null = null;

  // ── Form Model ────────────────────────────────────────────────────────────
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
    private projectsService: ProjectsService,
    private uploadService: UploadService
  ) {}

  ngOnInit(): void {}

  // ── Step Navigation ───────────────────────────────────────────────────────

  nextStep(): void {
    this.submitted = true;
    if (this.currentStep === 1 && !this.validateStep1()) return;
    if (this.currentStep === 2 && !this.validateStep2()) return;
    this.submitted = false;
    if (this.currentStep < 3) this.currentStep++;
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.submitted = false;
    }
  }

  // ── Validation ────────────────────────────────────────────────────────────

  private validateStep1(): boolean {
    return !!(
      this.project.title?.trim() &&
      this.project.description?.trim() &&
      this.project.category &&
      this.project.location?.trim() &&
      this.project.startDate
    );
  }

  private validateStep2(): boolean {
    return !!(this.project.fundingGoal && this.project.fundingGoal > 0);
  }

  // ── Image Handling ────────────────────────────────────────────────────────

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.showAlert('error', 'Please select a valid image file (PNG, JPG, WEBP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.showAlert('error', 'Image must be less than 5MB');
      return;
    }

    this.selectedImage = file;
    this.project.coverImage = file;

    const reader = new FileReader();
    reader.onload = () => { this.imagePreview = reader.result as string; };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
    this.project.coverImage = null;
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async submitProject(): Promise<void> {
    this.submitted = true;
    this.submitError = null;

    if (!this.validateStep1() || !this.validateStep2()) {
      this.submitError = 'Please fill in all required fields before publishing.';
      return;
    }

    if (this.isSubmitting) return;
    this.isSubmitting = true;

    try {
      const projectData: CreateProjectData = {
        title: this.project.title.trim(),
        description: this.project.description.trim(),
        long_description: this.project.long_description?.trim() || undefined,
        category: this.project.category,
        status: this.project.status,
        location: this.project.location.trim(),
        start_date: this.project.startDate,
        target_date: this.project.targetDate || undefined,
        funding_goal: this.project.fundingGoal!,
        current_amount: this.project.currentAmount || 0,
        accept_donations: this.project.acceptDonations,
        accept_volunteers: this.project.acceptVolunteers,
        max_volunteers: this.project.maxVolunteers ?? undefined,
        is_featured: this.project.isFeatured,
      };

      // Upload image if selected — same pattern as create-event
      if (this.selectedImage) {
        this.isUploadingImage = true;

        try {
          const uploadResult = await this.uploadService.uploadProjectImage(
            this.selectedImage,
            this.imagePreview || undefined
          ).toPromise();

          if (uploadResult?.url) {
            projectData.cover_image = uploadResult.url;
          } else {
            throw new Error('Failed to get image URL from upload');
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          this.showAlert('error', 'Failed to upload image. Please try again.');
          this.isSubmitting = false;
          this.isUploadingImage = false;
          return;
        } finally {
          this.isUploadingImage = false;
        }
      }

      // Create project
      this.projectsService.createProject(projectData).subscribe({
        next: (response) => {
          if (response.success) {
            this.createdProjectId = response.data?.id ?? null;
            this.isSubmitting = false;
            this.showSuccess = true;
          } else {
            this.showAlert('error', response.message || 'Failed to create project');
            this.isSubmitting = false;
          }
        },
        error: (error) => {
          console.error('Create project error:', error);
          const msg = error.error?.error || error.message || 'Failed to create project. Please try again.';
          this.showAlert('error', msg);
          this.isSubmitting = false;
        }
      });

    } catch (error: any) {
      console.error('Unexpected error:', error);
      this.showAlert('error', 'An unexpected error occurred. Please try again.');
      this.isSubmitting = false;
      this.isUploadingImage = false;
    }
  }

  async saveAsDraft(): Promise<void> {
    if (!this.project.title?.trim()) {
      this.showAlert('error', 'Please enter a project title');
      return;
    }

    if (this.isSubmitting) return;
    this.isSubmitting = true;

    try {
      const projectData: CreateProjectData = {
        title: this.project.title.trim(),
        description: this.project.description?.trim() || 'Draft',
        category: this.project.category || 'Other',
        status: 'proposed',
        location: this.project.location?.trim() || 'TBD',
        start_date: this.project.startDate || new Date().toISOString().split('T')[0],
        funding_goal: this.project.fundingGoal ?? 0,
        accept_donations: this.project.acceptDonations,
        accept_volunteers: this.project.acceptVolunteers,
        is_featured: false,
      };

      if (this.selectedImage) {
        this.isUploadingImage = true;
        try {
          const uploadResult = await this.uploadService.uploadProjectImage(
            this.selectedImage
          ).toPromise();
          if (uploadResult?.url) projectData.cover_image = uploadResult.url;
        } catch (e) {
          console.error('Draft image upload failed:', e);
        } finally {
          this.isUploadingImage = false;
        }
      }

      this.projectsService.createProject(projectData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showAlert('success', 'Project saved as draft');
          setTimeout(() => this.router.navigate(['/admin/projects']), 1500);
        },
        error: (error) => {
          console.error('Save draft error:', error);
          this.showAlert('error', 'Failed to save draft.');
          this.isSubmitting = false;
        }
      });

    } catch (error: any) {
      this.showAlert('error', 'An unexpected error occurred.');
      this.isSubmitting = false;
    }
  }

  // ── Post-Create Navigation ────────────────────────────────────────────────

  viewProject(): void {
    if (this.createdProjectId) {
      this.router.navigate(['/projects', this.createdProjectId]);
    } else {
      this.router.navigate(['/admin/projects']);
    }
  }

  createAnother(): void {
    this.showSuccess = false;
    this.currentStep = 1;
    this.submitted = false;
    this.imagePreview = null;
    this.selectedImage = null;
    this.submitError = null;
    this.createdProjectId = null;
    this.project = {
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
  }

  goBack(): void {
    this.router.navigate(['/admin/projects']);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  formatNumber(num: number): string {
    return num.toLocaleString();
  }

  get descriptionLength(): number {
    return this.project.description?.length ?? 0;
  }

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      'proposed': 'bg-yellow-100 text-yellow-700',
      'ongoing':  'bg-green-100 text-green-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-700';
  }

  showAlert(type: 'success' | 'error', message: string): void {
    this.submitError = type === 'error' ? message : null;

    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
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
}