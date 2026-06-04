// src/app/admin/edit-job/edit-job.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { JobsService } from '../../../services/jobs.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user';
import { Job } from '../../../models/job';

@Component({
  selector: 'app-edit-job',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './edit-job.component.html',
  styleUrl: './edit-job.component.scss'
})
export class EditJobComponent implements OnInit {
  jobForm!: FormGroup;
  currentUser: User | null = null;
  job: Job | null = null;
  jobId!: number;

  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

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
    { value: "Bachelor's Degree", label: "Bachelor's Degree" },
    { value: "Master's Degree", label: "Master's Degree" },
    { value: 'PhD', label: 'PhD' },
    { value: 'Not Required', label: 'Not Required' }
  ];

  benefitsList = [
    'Health Insurance', 'Dental Insurance', 'Vision Insurance',
    'Retirement Plan', 'Paid Time Off', 'Flexible Hours',
    'Remote Work', 'Professional Development', 'Stock Options'
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private jobsService: JobsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.today = new Date().toISOString().split('T')[0];

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user) this.router.navigate(['/login']);
    });

    this.initializeForm();

    // Get job ID from route and load job
    this.route.params.subscribe(params => {
      this.jobId = +params['id'];
      if (this.jobId) {
        this.loadJob();
      } else {
        this.errorMessage = 'Invalid job ID';
      }
    });
  }

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
      notify_alumni: [false]
    });
  }

  loadJob(): void {
    this.isLoading = true;
    this.jobsService.getJobById(this.jobId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.job = response.data;
          this.populateForm(response.data);
        } else {
          this.errorMessage = 'Job not found';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading job:', error);
        this.errorMessage = 'Failed to load job details';
        this.isLoading = false;
      }
    });
  }

  populateForm(job: Job): void {
    // Populate array fields
    this.skills = Array.isArray(job.skills_required) ? [...job.skills_required] : [];
    this.responsibilities = Array.isArray(job.responsibilities) ? [...job.responsibilities] : [];
    this.qualifications = Array.isArray(job.qualifications) ? [...job.qualifications] : [];
    this.selectedBenefits = Array.isArray(job.benefits) ? [...job.benefits] : [];

    // Format deadline date for input
    const deadline = job.application_deadline
      ? new Date(job.application_deadline).toISOString().split('T')[0]
      : '';

    this.jobForm.patchValue({
      company_name: job.company_name || '',
      company_logo: job.company_logo || '',
      company_website: job.company_website || '',
      industry: job.industry || '',
      job_title: job.job_title || '',
      job_description: job.job_description || '',
      job_type: job.job_type || '',
      location: job.location || '',
      location_type: job.location_type || '',
      salary_min: job.salary_min || null,
      salary_max: job.salary_max || null,
      salary_currency: job.salary_currency || 'GHS',
      salary_period: job.salary_period || 'per year',
      experience_level: job.experience_level || '',
      education_required: job.education_required || '',
      skills_required: this.skills,
      responsibilities: this.responsibilities,
      qualifications: this.qualifications,
      benefits: this.selectedBenefits,
      application_deadline: deadline,
      application_url: job.application_url || '',
      application_email: job.application_email || '',
      positions_available: job.positions_available || 1,
      is_featured: job.is_featured || false,
      is_active: job.is_active !== undefined ? job.is_active : true,
      notify_alumni: false
    });
  }

  // ── Skills ────────────────────────────────────────────────────────────────
  addSkill(): void {
    const input = document.getElementById('skillInput') as HTMLInputElement;
    const skill = input?.value.trim();
    if (skill && !this.skills.includes(skill)) {
      this.skills.push(skill);
      this.jobForm.patchValue({ skills_required: this.skills });
      input.value = '';
    }
  }

  removeSkill(index: number): void {
    this.skills.splice(index, 1);
    this.jobForm.patchValue({ skills_required: this.skills });
  }

  // ── Responsibilities ──────────────────────────────────────────────────────
  addResponsibility(): void {
    const input = document.getElementById('responsibilityInput') as HTMLInputElement;
    const value = input?.value.trim();
    if (value && !this.responsibilities.includes(value)) {
      this.responsibilities.push(value);
      this.jobForm.patchValue({ responsibilities: this.responsibilities });
      input.value = '';
    }
  }

  removeResponsibility(index: number): void {
    this.responsibilities.splice(index, 1);
    this.jobForm.patchValue({ responsibilities: this.responsibilities });
  }

  // ── Qualifications ────────────────────────────────────────────────────────
  addQualification(): void {
    const input = document.getElementById('qualificationInput') as HTMLInputElement;
    const value = input?.value.trim();
    if (value && !this.qualifications.includes(value)) {
      this.qualifications.push(value);
      this.jobForm.patchValue({ qualifications: this.qualifications });
      input.value = '';
    }
  }

  removeQualification(index: number): void {
    this.qualifications.splice(index, 1);
    this.jobForm.patchValue({ qualifications: this.qualifications });
  }

  // ── Benefits ──────────────────────────────────────────────────────────────
  toggleBenefit(benefit: string): void {
    const index = this.selectedBenefits.indexOf(benefit);
    if (index > -1) {
      this.selectedBenefits.splice(index, 1);
    } else {
      this.selectedBenefits.push(benefit);
    }
    this.jobForm.patchValue({ benefits: this.selectedBenefits });
  }

  isBenefitSelected(benefit: string): boolean {
    return this.selectedBenefits.includes(benefit);
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  saveAsDraft(): void {
    const formData = { ...this.jobForm.value, is_active: false };
    this.submitJob(formData, 'Job saved as draft');
  }

  onSubmit(): void {
    if (this.jobForm.invalid) {
      this.markFormGroupTouched(this.jobForm);
      this.errorMessage = 'Please fill in all required fields';
      return;
    }
    const formData = { ...this.jobForm.value, is_active: true };
    this.submitJob(formData, 'Job updated successfully');
  }

  private submitJob(jobData: any, successMessage: string): void {
    this.isSubmitting = true;
    this.errorMessage = '';

    this.jobsService.updateJob(this.jobId, jobData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.successMessage = successMessage;
          setTimeout(() => this.router.navigate(['/admin/jobs']), 2000);
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error updating job:', error);
        this.errorMessage = error.error?.error || 'Failed to update job';
        this.isSubmitting = false;
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  hasError(fieldName: string, errorType: string = 'required'): boolean {
    const field = this.jobForm.get(fieldName);
    return !!(field?.hasError(errorType) && field?.touched);
  }

  navigateToJobManagement(): void {
    if (this.jobForm.dirty) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        this.router.navigate(['/admin/jobs']);
      }
    } else {
      this.router.navigate(['/admin/jobs']);
    }
  }
}