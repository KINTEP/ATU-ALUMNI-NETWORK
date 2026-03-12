import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { JobsService } from '../../../services/jobs.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user';


@Component({
  selector: 'app-post-job',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './post-job.component.html',
  styleUrl: './post-job.component.scss'
})
export class PostJobComponent implements OnInit {
  jobForm!: FormGroup;
  currentUser: User | null = null;
  isSubmitting = false;
  today: string = '';
  skills: string[] = [];
  responsibilities: string[] = [];
  qualifications: string[] = [];
  selectedBenefits: string[] = [];

  jobTypes = [
    { value: 'Full-time', label: 'Full-time' },
    { value: 'Part-time', label: 'Part-time' },
    { value: 'Contract', label: 'Contract' },
    { value: 'Internship', label: 'Internship' },
    { value: 'Temporary', label: 'Temporary' }
  ];

  experienceLevels = [
    { value: 'Internship', label: 'Internship' },
    { value: 'Entry', label: 'Entry Level (0-2 years)' },
    { value: 'Mid', label: 'Mid Level (2-5 years)' },
    { value: 'Senior', label: 'Senior Level (5+ years)' },
    { value: 'Executive', label: 'Executive' }
  ];

  educationLevels = [
    { value: 'High School', label: 'High School' },
    { value: 'Diploma', label: 'Diploma' },
    { value: 'Associate Degree', label: 'Associate Degree' },
    { value: 'Bachelor\'s Degree', label: "Bachelor's Degree" },
    { value: 'Master\'s Degree', label: "Master's Degree" },
    { value: 'PhD', label: 'PhD' },
    { value: 'Not Required', label: 'Not Required' }
  ];

  benefitsList = [
    'Health Insurance',
    'Dental Insurance',
    'Vision Insurance',
    'Retirement Plan',
    'Paid Time Off',
    'Flexible Hours',
    'Remote Work',
    'Professional Development',
    'Stock Options'
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private jobsService: JobsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.today = new Date().toISOString().split('T')[0];

    // Get current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user) {
        this.router.navigate(['/login']);
      }
    });

    // Initialize form
    this.initializeForm();
  }

  /**
   * Initialize the form
   */
  initializeForm(): void {
    this.jobForm = this.fb.group({
      company_name: ['', [Validators.required, Validators.minLength(2)]],
      company_logo: [''],
      company_website: [''],
      industry: [''],
      job_title: ['', [Validators.required, Validators.minLength(3)]],
      job_description: ['', [Validators.required, Validators.minLength(100)]],
      job_type: ['', Validators.required],
      location: ['', Validators.required],
      location_type: [''],
      salary_min: [null],
      salary_max: [null],
      salary_currency: ['GHS'],
      salary_period: ['per year'],
      experience_level: [''],
      education_required: [''],
      skills_required: [[]],
      responsibilities: [[]],
      qualifications: [[]],
      benefits: [[]],
      application_deadline: [''],
      application_url: [''],
      application_email: ['', Validators.email],
      positions_available: [1],
      is_featured: [false],
      is_active: [true],
      notify_alumni: [true]
    });
  }

  /**
   * Add skill
   */
  addSkill(): void {
    const skillInput = document.getElementById('skillInput') as HTMLInputElement;
    const skill = skillInput?.value.trim();

    if (skill && !this.skills.includes(skill)) {
      this.skills.push(skill);
      this.jobForm.patchValue({ skills_required: this.skills });
      skillInput.value = '';
    }
  }

  /**
   * Remove skill
   */
  removeSkill(index: number): void {
    this.skills.splice(index, 1);
    this.jobForm.patchValue({ skills_required: this.skills });
  }

  /**
   * Add responsibility
   */
  addResponsibility(): void {
    const input = document.getElementById('responsibilityInput') as HTMLInputElement;
    const responsibility = input?.value.trim();

    if (responsibility && !this.responsibilities.includes(responsibility)) {
      this.responsibilities.push(responsibility);
      this.jobForm.patchValue({ responsibilities: this.responsibilities });
      input.value = '';
    }
  }

  /**
   * Remove responsibility
   */
  removeResponsibility(index: number): void {
    this.responsibilities.splice(index, 1);
    this.jobForm.patchValue({ responsibilities: this.responsibilities });
  }

  /**
   * Add qualification
   */
  addQualification(): void {
    const input = document.getElementById('qualificationInput') as HTMLInputElement;
    const qualification = input?.value.trim();

    if (qualification && !this.qualifications.includes(qualification)) {
      this.qualifications.push(qualification);
      this.jobForm.patchValue({ qualifications: this.qualifications });
      input.value = '';
    }
  }

  /**
   * Remove qualification
   */
  removeQualification(index: number): void {
    this.qualifications.splice(index, 1);
    this.jobForm.patchValue({ qualifications: this.qualifications });
  }

  /**
   * Toggle benefit
   */
  toggleBenefit(benefit: string): void {
    const index = this.selectedBenefits.indexOf(benefit);
    if (index > -1) {
      this.selectedBenefits.splice(index, 1);
    } else {
      this.selectedBenefits.push(benefit);
    }
    this.jobForm.patchValue({ benefits: this.selectedBenefits });
  }

  /**
   * Check if benefit is selected
   */
  isBenefitSelected(benefit: string): boolean {
    return this.selectedBenefits.includes(benefit);
  }

  /**
   * Save as draft
   */
  saveAsDraft(): void {
    if (!this.jobForm.get('job_title')?.value || !this.jobForm.get('company_name')?.value) {
      this.showAlert('error', 'Please enter at least the job title and company name');
      return;
    }

    const formData = {
      ...this.jobForm.value,
      posted_by: this.currentUser?.id,
      is_active: false
    };

    this.submitJob(formData, 'Job saved as draft');
  }

  /**
   * Submit form
   */
  onSubmit(): void {
    if (this.jobForm.invalid) {
      this.markFormGroupTouched(this.jobForm);
      this.showAlert('error', 'Please fill in all required fields');
      return;
    }

    if (!this.currentUser) {
      this.showAlert('error', 'User not authenticated');
      return;
    }

    const formData = {
      ...this.jobForm.value,
      posted_by: this.currentUser.id,
      is_active: true
    };

    this.submitJob(formData, 'Job published successfully');
  }

  /**
   * Submit job to backend
   */
  private submitJob(jobData: any, successMessage: string): void {
    this.isSubmitting = true;

    this.jobsService.createJob(jobData).subscribe({
      next: (response) => {
        if (response.success) {
          this.showAlert('success', successMessage);
          
          // Navigate back after delay
          setTimeout(() => {
            this.router.navigate(['/adminJob']);
          }, 2000);
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error creating job:', error);
        this.showAlert('error', error.error?.error || 'Failed to create job');
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Mark all fields as touched to show validation errors
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
   * Check if field has error
   */
  hasError(fieldName: string, errorType: string = 'required'): boolean {
    const field = this.jobForm.get(fieldName);
    return !!(field?.hasError(errorType) && field?.touched);
  }

  /**
   * Navigate back
   */
  navigateToJobManagement(): void {
    if (this.jobForm.dirty) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        this.router.navigate(['/adminJob']);
      }
    } else {
      this.router.navigate(['/adminJob']);
    }
  }

  /**
   * Show alert message
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
}