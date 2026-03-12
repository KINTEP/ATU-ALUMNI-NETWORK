import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { JobsService } from '../../services/jobs.service';
import { AuthService } from '../../services/auth.service';
import { Job } from '../../models/job';
import { User } from '../../models/user';
import { ApiResponse } from '../../models/api-response';

@Component({
  selector: 'app-job-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './job-details.component.html',
  styleUrl: './job-details.component.scss'
})
export class JobDetailsComponent implements OnInit {
  job: Job | null = null;
  relatedJobs: Job[] = [];
  currentUser: User | null = null;
  isLoading = true;
  errorMessage = '';
  isSaved = false;
  jobId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jobsService: JobsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Get job ID from route
    this.route.params.subscribe(params => {
      this.jobId = +params['id'];
      if (this.jobId) {
        this.loadJobDetails();
        this.loadRelatedJobs();
        this.incrementViewCount();
        
        if (this.currentUser) {
          this.checkIfSaved();
        }
      }
    });
  }

  /**
   * Load job details
   */
  loadJobDetails(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.jobsService.getJobById(this.jobId).subscribe({
      next: (response: ApiResponse<Job>) => {
        if (response.success && response.data) {
          this.job = response.data;
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

  /**
   * Load related jobs (same job type or location)
   */
  loadRelatedJobs(): void {
    this.jobsService.getAllJobs({ limit: 3 }).subscribe({
      next: (response: ApiResponse<Job[]>) => {
        if (response.success && response.data) {
          // Filter out current job
          this.relatedJobs = response.data.filter(j => j.id !== this.jobId).slice(0, 3);
        }
      },
      error: (error) => {
        console.error('Error loading related jobs:', error);
      }
    });
  }

  /**
   * Check if job is saved
   */
  checkIfSaved(): void {
    if (!this.currentUser) return;

    this.jobsService.getSavedJobIds().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.isSaved = response.data.includes(this.jobId);
        }
      },
      error: (err) => {
        console.error('Failed to check saved status:', err);
      }
    });
  }

  /**
   * Increment view count
   */
  incrementViewCount(): void {
    this.jobsService.incrementViewCount(this.jobId).subscribe({
      next: () => {
        console.log('View count incremented');
      },
      error: (err) => {
        console.error('Failed to increment view count:', err);
      }
    });
  }

  /**
   * Toggle save/unsave job
   */
  toggleSaveJob(): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.isSaved) {
      this.jobsService.unsaveJob(this.jobId).subscribe({
        next: (response) => {
          if (response.success) {
            this.isSaved = false;
            this.showToast('Job removed from saved');
          }
        },
        error: (error) => {
          console.error('Error unsaving job:', error);
          this.showToast('Failed to unsave job', 'error');
        }
      });
    } else {
      this.jobsService.saveJob(this.jobId).subscribe({
        next: (response) => {
          if (response.success) {
            this.isSaved = true;
            this.showToast('Job saved successfully!');
          }
        },
        error: (error) => {
          console.error('Error saving job:', error);
          this.showToast('Failed to save job', 'error');
        }
      });
    }
  }

  /**
   * Apply to job
   */
  applyToJob(): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    // TODO: Implement application modal/form
    this.showToast('Application feature coming soon!');
  }

  /**
   * Navigate back to jobs list
   */
  goBack(): void {
    this.router.navigate(['/jobs']);
  }

  /**
   * View related job
   */
  viewRelatedJob(jobId: number): void {
    this.router.navigate(['/jobs', jobId]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
   * Get job type badge class
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
   * Get skill badge class
   */
  getSkillBadgeClass(index: number): string {
    const colors = [
      'bg-blue-50 text-blue-700 border-blue-100',
      'bg-green-50 text-green-700 border-green-100',
      'bg-purple-50 text-purple-700 border-purple-100',
      'bg-orange-50 text-orange-700 border-orange-100',
      'bg-red-50 text-red-700 border-red-100',
      'bg-indigo-50 text-indigo-700 border-indigo-100'
    ];
    return colors[index % colors.length];
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }

  /**
   * Show toast message
   */
  private showToast(message: string, type: 'success' | 'error' = 'success'): void {
    alert(message);
  }
}