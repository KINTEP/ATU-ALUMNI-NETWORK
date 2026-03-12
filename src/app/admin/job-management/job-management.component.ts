import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { JobsService } from '../../../services/jobs.service';
import { AuthService } from '../../../services/auth.service';
import { ApiResponse } from '../../../models/api-response';
import { Job } from '../../../models/job';
import { User } from '../../../models/user';


@Component({
  selector: 'app-job-management',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './job-management.component.html',
  styleUrl: './job-management.component.scss'
})
export class JobManagementComponent implements OnInit {
  currentUser: User | null = null;
  jobs: Job[] = [];
  filteredJobs: Job[] = [];
  selectedJobs: number[] = [];
  
  // Filters
  searchQuery = '';
  selectedJobType = 'all';
  selectedStatus = 'all';
  currentTab = 'all';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalJobs = 0;
  totalPages = 0;
  
  // Loading states
  isLoading = false;
  
  // Statistics
  stats = {
    total: 0,
    active: 0,
    applications: 0,
    pendingReview: 0
  };

  // Job type options
  jobTypes = [
    { value: 'all', label: 'All Job Types' },
    { value: 'Full-time', label: 'Full-time' },
    { value: 'Part-time', label: 'Part-time' },
    { value: 'Contract', label: 'Contract' },
    { value: 'Internship', label: 'Internship' },
    { value: 'Temporary', label: 'Temporary' }
  ];

  constructor(
    private router: Router,
    private jobsService: JobsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadJobs();
        this.loadStatistics();
      }
    });
  }

  /**
   * Load jobs
   */
  loadJobs(): void {
    this.isLoading = true;

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize,
      sort_by: 'created_at',
      sort_order: 'DESC' as 'DESC'
    };

    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedJobType !== 'all') params.job_type = this.selectedJobType;

    this.jobsService.getAllJobs(params).subscribe({
      next: (response: ApiResponse<Job[]>) => {
        if (response.success && response.data) {
          this.jobs = response.data;
          this.totalJobs = response.total || 0;
          this.totalPages = Math.ceil(this.totalJobs / this.pageSize);
          this.filterJobsByTab();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading jobs:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Load statistics
   */
  loadStatistics(): void {
    this.jobsService.getJobStats().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const data = response.data;
          this.stats = {
            total: data.total_jobs || 0,
            active: this.jobs.filter(j => j.is_active).length,
            applications: data.total_applications || 0,
            pendingReview: data.applications_by_status?.find((s: any) => s.status === 'pending')?.count || 0
          };
        }
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
      }
    });
  }

  /**
   * Filter jobs by tab
   */
  filterJobsByTab(): void {
    if (this.currentTab === 'all') {
      this.filteredJobs = this.jobs;
    } else if (this.currentTab === 'published') {
      this.filteredJobs = this.jobs.filter(j => j.is_active);
    } else if (this.currentTab === 'draft') {
      this.filteredJobs = this.jobs.filter(j => !j.is_active);
    } else if (this.currentTab === 'expired') {
      const now = new Date();
      this.filteredJobs = this.jobs.filter(j => 
        j.application_deadline && new Date(j.application_deadline) < now
      );
    }
  }

  /**
   * Change tab
   */
  changeTab(tab: string): void {
    this.currentTab = tab;
    this.currentPage = 1;
    this.filterJobsByTab();
  }

  /**
   * Search jobs
   */
  searchJobs(): void {
    this.currentPage = 1;
    this.loadJobs();
  }

  /**
   * Filter by type
   */
  filterByType(): void {
    this.currentPage = 1;
    this.loadJobs();
  }

  /**
   * Filter by status
   */
  filterByStatus(): void {
    this.currentPage = 1;
    this.loadJobs();
  }

  /**
   * Change page
   */
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadJobs();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Toggle job selection
   */
  toggleJobSelection(jobId: number, event: Event): void {
    event.stopPropagation();
    const index = this.selectedJobs.indexOf(jobId);
    if (index > -1) {
      this.selectedJobs.splice(index, 1);
    } else {
      this.selectedJobs.push(jobId);
    }
  }

  /**
   * Toggle select all
   */
  toggleSelectAll(event: Event): void {
    event.stopPropagation();
    if (this.selectedJobs.length === this.filteredJobs.length) {
      this.selectedJobs = [];
    } else {
      this.selectedJobs = this.filteredJobs.map(j => j.id);
    }
  }

  /**
   * Check if job is selected
   */
  isJobSelected(jobId: number): boolean {
    return this.selectedJobs.includes(jobId);
  }

  /**
   * Navigate to post job
   */
  navigateToPostJob(): void {
    this.router.navigate(['/postJob']);
  }

  /**
   * Edit job
   */
  editJob(jobId: number): void {
    this.router.navigate(['/admin/edit-job', jobId]);
  }

  /**
   * View job
   */
  viewJob(jobId: number): void {
    this.router.navigate(['/jobs', jobId]);
  }

  /**
   * View applications
   */
  viewApplications(jobId: number): void {
    this.router.navigate(['/admin/job-applications', jobId]);
  }

  /**
   * Delete job
   */
  deleteJob(job: Job): void {
    if (!confirm(`Are you sure you want to delete "${job.job_title}"?`)) return;

    this.jobsService.deleteJob(job.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.showAlert('success', 'Job deleted successfully');
          this.loadJobs();
          this.loadStatistics();
        }
      },
      error: (error) => {
        console.error('Error deleting job:', error);
        this.showAlert('error', 'Failed to delete job');
      }
    });
  }

  /**
   * Publish job
   */
  publishJob(job: Job): void {
    this.jobsService.updateJob(job.id, { is_active: true }).subscribe({
      next: (response) => {
        if (response.success) {
          this.showAlert('success', 'Job published successfully');
          this.loadJobs();
          this.loadStatistics();
        }
      },
      error: (error) => {
        console.error('Error publishing job:', error);
        this.showAlert('error', 'Failed to publish job');
      }
    });
  }

  /**
   * Get job type badge class
   */
  getJobTypeClass(jobType: string): string {
    const classes: { [key: string]: string } = {
      'Full-time': 'bg-green-100 text-green-800',
      'Part-time': 'bg-purple-100 text-purple-800',
      'Contract': 'bg-orange-100 text-orange-800',
      'Internship': 'bg-blue-100 text-blue-800',
      'Remote': 'bg-blue-100 text-blue-800',
      'Temporary': 'bg-gray-100 text-gray-800'
    };
    return classes[jobType] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get status badge class
   */
  getStatusClass(job: Job): string {
    if (!job.is_active) {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (job.application_deadline && new Date(job.application_deadline) < new Date()) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-green-100 text-green-800';
  }

  /**
   * Get status text
   */
  getStatusText(job: Job): string {
    if (!job.is_active) return 'Draft';
    if (job.application_deadline && new Date(job.application_deadline) < new Date()) {
      return 'Expired';
    }
    return 'Published';
  }

  /**
   * Get company initials
   */
  getCompanyInitials(companyName: string): string {
    return companyName
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