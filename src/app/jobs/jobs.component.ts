import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { User } from '../../models/user';
import { Job } from '../../models/job';
import { JobsService } from '../../services/jobs.service';
import { AuthService } from '../../services/auth.service';
import { ApiResponse } from '../../models/api-response';

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './jobs.component.html',
  styleUrl: './jobs.component.scss'
})
export class JobsComponent implements OnInit {
  currentUser: User | null = null;

  // Jobs data
  allJobs: Job[] = [];
  savedJobs: Job[] = [];

  // For instant heart icon updates
  savedJobIds = new Set<number>();

  // Filter values
  searchQuery = '';
  selectedJobType = '';
  selectedLocation = '';
  selectedSalaryRange = '';
  selectedExperience = '';

  // View state
  activeTab: 'all' | 'saved' = 'all';

  // Loading and pagination
  isLoading = false;
  isLoadingSavedIds = false;
  currentPage = 1;
  totalJobs = 0;
  totalPages = 0;
  limit = 12;

  // Error handling
  errorMessage = '';

  // Dropdown options
  jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'];
  locations = ['Accra', 'Kumasi', 'Lagos', 'Remote', 'Worldwide'];
  salaryRanges = [
    { label: '$0 - $30,000', value: '0-30000' },
    { label: '$30,000 - $50,000', value: '30000-50000' },
    { label: '$50,000 - $70,000', value: '50000-70000' },
    { label: '$70,000 - $90,000', value: '70000-90000' },
    { label: '$90,000+', value: '90000+' }
  ];
  experienceLevels = ['Intern', 'Entry Level', 'Mid Level', 'Senior Level', 'Executive'];

  constructor(
    private jobsService: JobsService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      
      if (user) {
        // Load saved job IDs first
        this.loadSavedJobIds();
      }
      
      // Always load jobs (even if not logged in)
      this.loadJobs();
    });
  }

  /**
   * Load all jobs with current filters
   */
  loadJobs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const params: any = {
      page: this.currentPage,
      limit: this.limit
    };

    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedJobType) params.job_type = this.selectedJobType;
    if (this.selectedLocation) params.location = this.selectedLocation;
    if (this.selectedExperience) params.experience_level = this.selectedExperience;

    // Handle salary range (including 90000+)
    if (this.selectedSalaryRange) {
      if (this.selectedSalaryRange.endsWith('+')) {
        params.salary_min = this.selectedSalaryRange.replace('+', '');
      } else {
        const [min, max] = this.selectedSalaryRange.split('-');
        params.salary_min = min;
        if (max) params.salary_max = max;
      }
    }

    this.jobsService.getAllJobs(params).subscribe({
      next: (response: ApiResponse<Job[]>) => {
        if (response.success && response.data) {
          this.allJobs = response.data;
          this.totalJobs = response.total || 0;
          this.totalPages = Math.ceil(this.totalJobs / this.limit);
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading jobs:', error);
        this.errorMessage = 'Failed to load jobs. Please try again.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Load saved jobs with pagination
   */
  loadSavedJobs(): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.jobsService.getSavedJobs(this.currentPage, this.limit).subscribe({
      next: (response: ApiResponse<Job[]>) => {
        if (response.success && response.data) {
          this.savedJobs = response.data;
          this.totalJobs = response.total || 0;
          this.totalPages = Math.ceil(this.totalJobs / this.limit);
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading saved jobs:', error);
        this.errorMessage = 'Failed to load saved jobs.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Load all saved job IDs for instant heart icon updates
   * Using the new lightweight endpoint
   */
  private loadSavedJobIds(): void {
    if (!this.currentUser) {
      this.savedJobIds.clear();
      return;
    }

    this.isLoadingSavedIds = true;

    this.jobsService.getSavedJobIds().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.savedJobIds = new Set(response.data);
          console.log('✅ Loaded saved job IDs:', Array.from(this.savedJobIds));
        }
        this.isLoadingSavedIds = false;
      },
      error: (err) => {
        console.error('❌ Failed to load saved job IDs:', err);
        this.savedJobIds.clear();
        this.isLoadingSavedIds = false;
      }
    });
  }

  /**
   * Apply filters
   */
  applyFilters(): void {
    this.currentPage = 1;
    this.loadJobs();
  }

  /**
   * Reset all filters
   */
  resetFilters(): void {
    this.searchQuery = '';
    this.selectedJobType = '';
    this.selectedLocation = '';
    this.selectedSalaryRange = '';
    this.selectedExperience = '';
    this.currentPage = 1;
    this.loadJobs();
  }

  /**
   * Switch between All and Saved tabs
   */
  switchTab(tab: 'all' | 'saved'): void {
    this.activeTab = tab;
    this.currentPage = 1;

    if (tab === 'all') {
      this.loadJobs();
    } else {
      this.loadSavedJobs();
    }
  }

  /**
   * View job details
   */
  viewJob(jobId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/jobs', jobId]);
  }

  /**
   * Toggle save/unsave job
   */
  toggleSaveJob(job: Job, event: Event): void {
    event.stopPropagation();

    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    const wasSaved = this.savedJobIds.has(job.id);

    if (wasSaved) {
      // Optimistic update: remove immediately
      this.savedJobIds.delete(job.id);
      
      this.jobsService.unsaveJob(job.id).subscribe({
        next: (response) => {
          if (response.success) {
            console.log('✅ Job unsaved:', job.id);
            
            // If we're on the saved tab, remove from the list
            if (this.activeTab === 'saved') {
              this.savedJobs = this.savedJobs.filter(j => j.id !== job.id);
              this.totalJobs = Math.max(0, this.totalJobs - 1);
              this.totalPages = Math.ceil(this.totalJobs / this.limit);
            }
            
            this.showToast('Job removed from saved');
          }
        },
        error: (error) => {
          console.error('❌ Error unsaving job:', error);
          // Revert optimistic update
          this.savedJobIds.add(job.id);
          this.showToast('Failed to unsave job', 'error');
        }
      });
    } else {
      // Optimistic update: add immediately
      this.savedJobIds.add(job.id);
      
      this.jobsService.saveJob(job.id).subscribe({
        next: (response) => {
          if (response.success) {
            console.log('✅ Job saved:', job.id);
            this.showToast('Job saved successfully!');
            
            // Reload saved jobs if we're on that tab
            if (this.activeTab === 'saved') {
              this.loadSavedJobs();
            }
          }
        },
        error: (error) => {
          console.error('❌ Error saving job:', error);
          
          const msg = error.error?.error || 'Failed to save job';
          
          if (msg.includes('already saved')) {
            // It's actually saved, so keep it in the set
            this.showToast('You have already saved this job');
          } else {
            // Real error, revert optimistic update
            this.savedJobIds.delete(job.id);
            this.showToast(msg, 'error');
          }
        }
      });
    }
  }

  /**
   * Apply to job
   */
  applyToJob(job: Job, event: Event): void {
    event.stopPropagation();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    this.router.navigate(['/jobs', job.id]);
  }

  /**
   * Pagination: Next page
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadCurrentTab();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Pagination: Previous page
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadCurrentTab();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Load current tab data
   */
  private loadCurrentTab(): void {
    if (this.activeTab === 'all') {
      this.loadJobs();
    } else {
      this.loadSavedJobs();
    }
  }

  /**
   * Check if job is saved (O(1) lookup)
   */
  isJobSaved(jobId: number): boolean {
    return this.savedJobIds.has(jobId);
  }

  /**
   * Format salary range
   */
  formatSalary(job: Job): string {
    if (!job.salary_min && !job.salary_max) return 'Competitive';

    const currency = job.salary_currency || '$';
    const min = job.salary_min ? `${currency}${(job.salary_min / 1000).toFixed(0)}k` : '';
    const max = job.salary_max ? `${currency}${(job.salary_max / 1000).toFixed(0)}k` : '';

    if (min && max) return `${min} - ${max}`;
    if (min) return `${min}+`;
    if (max) return `Up to ${max}`;
    return 'Competitive';
  }

  /**
   * Get job type badge color
   */
  getJobTypeBadgeClass(jobType: string): string {
    const colorMap: { [key: string]: string } = {
      'Full-time': 'bg-green-50 text-green-700 border-green-100',
      'Part-time': 'bg-purple-50 text-purple-700 border-purple-100',
      'Remote': 'bg-blue-50 text-blue-700 border-blue-100',
      'Internship': 'bg-orange-50 text-orange-700 border-orange-100',
      'Contract': 'bg-yellow-50 text-yellow-700 border-yellow-100',
      'Temporary': 'bg-gray-50 text-gray-700 border-gray-100'
    };
    return colorMap[jobType] || 'bg-gray-50 text-gray-700 border-gray-100';
  }

  /**
   * Get skill badge colors
   */
  getSkillBadgeClass(index: number): string {
    const colors = [
      'bg-blue-50 text-blue-700 border-blue-100',
      'bg-purple-50 text-purple-700 border-purple-100',
      'bg-green-50 text-green-700 border-green-100',
      'bg-pink-50 text-pink-700 border-pink-100',
      'bg-red-50 text-red-700 border-red-100'
    ];
    return colors[index % colors.length];
  }

  /**
   * Get company initials
   */
  getCompanyInitials(companyName: string): string {
    if (!companyName) return 'CO';
    const words = companyName.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return companyName.substring(0, 2).toUpperCase();
  }

  /**
   * Show toast message (replace with real toast service later)
   */
  private showToast(message: string, type: 'success' | 'error' = 'success'): void {
    // Simple alert for now — replace with Toast service
    alert(message);
  }
}