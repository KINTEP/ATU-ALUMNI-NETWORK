import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { User } from '../../models/user';
import { NewsArticle } from '../../models/news';
import { AlumniEvent } from '../../models/event';
import { Job } from '../../models/job';
import { ForumPost } from '../../models/forum';
import { AuthService } from '../../services/auth.service';
import { NewsService } from '../../services/news.service';
import { EventsService } from '../../services/events.service';
import { JobsService } from '../../services/jobs.service';
import { ForumService } from '../../services/forum.service';
import { ApiResponse } from '../../models/api-response';
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  currentUser: User | null = null;

  // Data arrays
  featuredNews: NewsArticle[] = [];
  latestNews: NewsArticle[] = [];
  upcomingEvents: AlumniEvent[] = [];
  myEvents: AlumniEvent[] = [];
  recentJobs: Job[] = [];
  savedJobs: Job[] = [];
  activeForums: ForumPost[] = [];

  // For instant heart icon updates
  savedJobIds = new Set<number>();

  // Loading states
  isLoadingNews = true;
  isLoadingEvents = true;
  isLoadingJobs = true;
  isLoadingForums = true;

  // Error states
  newsError = '';
  eventsError = '';
  jobsError = '';
  forumsError = '';

  constructor(
    private authService: AuthService,
    private newsService: NewsService,
    private eventsService: EventsService,
    private jobsService: JobsService,
    private forumService: ForumService,
    private router: Router,
    private imageService: ImageService
  ) {}

  ngOnInit(): void {
    // Subscribe to current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadSavedJobIds();
        this.loadSavedJobs();
        //this.loadMyEvents();
      }
    });

    // Load public data
    this.loadFeaturedNews();
    this.loadUpcomingEvents();
    this.loadRecentJobs();
    this.loadActiveForums();
  }

  /**
   * Load saved job IDs for instant heart icon updates
   */
  private loadSavedJobIds(): void {
    if (!this.currentUser) return;

    this.jobsService.getSavedJobs(1, 1000).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.savedJobIds = new Set(response.data.map(job => job.id));
        }
      },
      error: (err) => {
        console.error('Failed to load saved job IDs:', err);
      }
    });
  }

  /**
   * Load featured news articles
   */
  loadFeaturedNews(): void {
    this.isLoadingNews = true;
    this.newsService.getFeaturedArticles(2).subscribe({
      next: (response: ApiResponse<NewsArticle[]>) => {
        if (response.success && response.data) {
          this.featuredNews = response.data;
        }
        this.isLoadingNews = false;
      },
      error: (error: any) => {
        console.error('Error loading news:', error);
        this.newsError = 'Failed to load news';
        this.isLoadingNews = false;
      }
    });
  }

  /**
   * Load upcoming events
   */
  loadUpcomingEvents(): void {
    this.isLoadingEvents = true;
    this.eventsService.getUpcomingEvents(1, 2).subscribe({
      next: (response: ApiResponse<AlumniEvent[]>) => {
        if (response.success && response.data) {
          this.upcomingEvents = response.data;
        }
        this.isLoadingEvents = false;
      },
      error: (error: any) => {
        console.error('Error loading events:', error);
        this.eventsError = 'Failed to load events';
        this.isLoadingEvents = false;
      }
    });
  }

  /**
   * Load my events (events user is attending)
   */
  /*
  loadMyEvents(): void {
    if (!this.currentUser) return;

    this.eventsService.getMyEvents(this.currentUser.id, 'going').subscribe({
      next: (response: ApiResponse<AlumniEvent[]>) => {
        if (response.success && response.data) {
          this.myEvents = response.data.slice(0, 2);
        }
      },
      error: (error: any) => {
        console.error('Error loading my events:', error);
      }
    });
  }
  */

  /**
   * Load recent jobs
   */
  loadRecentJobs(): void {
    this.isLoadingJobs = true;
    this.jobsService.getAllJobs({ page: 1, limit: 3 }).subscribe({
      next: (response: ApiResponse<Job[]>) => {
        if (response.success && response.data) {
          this.recentJobs = response.data;
        }
        this.isLoadingJobs = false;
      },
      error: (error: any) => {
        console.error('Error loading jobs:', error);
        this.jobsError = 'Failed to load jobs';
        this.isLoadingJobs = false;
      }
    });
  }

  /**
   * Load saved jobs (for "My Saved Jobs" section)
   */
  loadSavedJobs(): void {
    if (!this.currentUser) return;

    this.jobsService.getSavedJobs(1, 3).subscribe({
      next: (response: ApiResponse<Job[]>) => {
        if (response.success && response.data) {
          this.savedJobs = response.data;
        }
      },
      error: (error: any) => {
        console.error('Error loading saved jobs:', error);
      }
    });
  }

  /**
   * Load active forum posts
   */
  loadActiveForums(): void {
    this.isLoadingForums = true;
    this.forumService.getTrendingPosts(1, 3).subscribe({
      next: (response: ApiResponse<ForumPost[]>) => {
        if (response.success && response.data) {
          this.activeForums = response.data;
        }
        this.isLoadingForums = false;
      },
      error: (error: any) => {
        console.error('Error loading forums:', error);
        this.forumsError = 'Failed to load forums';
        this.isLoadingForums = false;
      }
    });
  }

  // Navigation
  viewProfile(): void { this.router.navigate(['/profile']); }
  browseEvents(): void { this.router.navigate(['/events']); }
  findJobs(): void { this.router.navigate(['/jobs']); }
  joinForums(): void { this.router.navigate(['/forum']); }
  viewAllNews(): void { this.router.navigate(['/news']); }
  viewEvent(eventId: number): void { this.router.navigate(['/events', eventId]); }
  viewJob(jobId: number): void { this.router.navigate(['/jobs', jobId]); }
  viewForumPost(postId: number): void { this.router.navigate(['/forum', postId]); }
  viewNews(newsId: number): void { this.router.navigate(['/news', newsId]); }

  /**
   * Like a news article
   */
  likeNews(newsId: number, index: number): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.newsService.likeArticle(newsId, this.currentUser.id).subscribe({
      next: (response: ApiResponse) => {
        if (response.success) {
          const article = this.featuredNews[index] || this.latestNews[index];
          if (article) {
            article.likes_count++;
            article.user_has_liked = true;
          }
        }
      },
      error: (error: any) => {
        console.error('Error liking news:', error);
      }
    });
  }

  /**
   * Save a job (optimistic UI + instant feedback)
   */
  saveJob(jobId: number, index: number): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    // Optimistically update UI
    this.savedJobIds.add(jobId);

    this.jobsService.saveJob(jobId).subscribe({
      next: (response) => {
        if (response.success) {
          this.showToast('Job saved successfully!', 'success');
          const job = this.recentJobs[index];
          if (job) job.is_saved = true;
        }
      },
      error: (error) => {
        // Revert optimistic update
        this.savedJobIds.delete(jobId);
        const job = this.recentJobs[index];
        if (job) job.is_saved = false;

        console.error('Error saving job:', error);
        const msg = error.error?.error || 'Failed to save job';

        if (msg.includes('already saved')) {
          this.showToast('You have already saved this job', 'warning');
        } else {
          this.showToast(msg, 'error');
        }
      }
    });
  }

  /**
   * Check if job is saved
   */
  isJobSaved(jobId: number): boolean {
    return this.savedJobIds.has(jobId);
  }

  /**
   * Show toast message
   */
  private showToast(message: string, type: 'success' | 'warning' | 'error' = 'success'): void {
    alert(message);
  }

  /**
   * Format date to readable string
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Format date and time
   */
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    const dateOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    return `${date.toLocaleDateString('en-US', dateOptions)} • ${date.toLocaleTimeString('en-US', timeOptions)}`;
  }

  /**
   * Get user initials for avatar
   */
  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    const firstInitial = this.currentUser.first_name?.[0] || '';
    const lastInitial = this.currentUser.last_name?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase() || 'U';
  }

  /**
   * Get full user name
   */
  getUserFullName(): string {
    if (!this.currentUser) return 'User';
    return `${this.currentUser.first_name} ${this.currentUser.last_name}`.trim();
  }

  /**
   * Get user graduation info
   */
  getUserGraduationInfo(): string {
    if (!this.currentUser) return '';
    const program = this.currentUser.program_of_study || 'Alumni';
    const year = this.currentUser.graduation_year;
    return year ? `${program}, ${year}` : program;
  }

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

  /**
   * Get current user profile picture
   */
  getCurrentUserProfilePicture(): string {
    return this.getProfilePictureUrl(this.currentUser?.profile_picture);
  }

  /**
   * Handle image loading error
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && this.currentUser) {
      const userName = `${this.currentUser.first_name} ${this.currentUser.last_name}`;
      img.src = this.imageService.getDefaultAvatar(userName);
    }
  }

  /**
   * Handle author image error
   */
  onAuthorImageError(event: Event, authorName?: string): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = this.imageService.getDefaultAvatar(authorName || 'Author');
    }
  }


  /**
 * Get news image URL
 */
/**
 * Get news image URL
 */
getNewsImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath || imagePath.trim() === '') {
    return 'https://images.unsplash.com/photo-1585829365295-ab7cd400d7e9?auto=format&fit=crop&w=800&q=80';
  }
  
  const cleanPath = imagePath.trim();
  
  // Handle different URL types
  if (cleanPath.startsWith('http://') || 
      cleanPath.startsWith('https://') || 
      cleanPath.startsWith('data:image/')) {
    return cleanPath;
  }
  
  // Otherwise, use ImageService to handle backend paths
  return this.imageService.getImageUrl(cleanPath);
}

/**
 * Handle news image error - show placeholder
 */
onNewsImageError(event: Event): void {
  const img = event.target as HTMLImageElement;
  if (img) {
    img.src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400d7e9?auto=format&fit=crop&w=800&q=80';
  }
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
 * Truncate job description for preview
 */
truncateDescription(description: string | null | undefined, maxLength: number = 150): string {
  if (!description) return 'No description available';
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength).trim() + '...';
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

}