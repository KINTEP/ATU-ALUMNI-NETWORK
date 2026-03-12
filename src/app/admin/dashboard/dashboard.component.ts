import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { forkJoin } from 'rxjs';
import { User } from '../../../models/user';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { EventsService } from '../../../services/events.service';
import { JobsService } from '../../../services/jobs.service';
import { NewsService } from '../../../services/news.service';

interface DashboardStats {
  totalUsers: number;
  activeAlumni: number;
  upcomingEvents: number;
  totalJobs: number;
  totalForums: number;
  pendingApprovals: number;
  systemHealth: number;
}

interface RecentActivity {
  type: 'user' | 'event' | 'job' | 'forum' | 'report';
  icon: string;
  bgColor: string;
  textColor: string;
  title: string;
  description: string;
  timestamp: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = false;
  searchQuery = '';

  // Dashboard Statistics
  stats: DashboardStats = {
    totalUsers: 0,
    activeAlumni: 0,
    upcomingEvents: 0,
    totalJobs: 0,
    totalForums: 0,
    pendingApprovals: 0,
    systemHealth: 98
  };

  // Growth percentages
  growthStats = {
    users: 0,
    alumni: 0,
    events: 0,
    jobs: 0,
    forums: 0
  };

  // Recent activities
  recentActivities: RecentActivity[] = [];

  // Chart data
  selectedChartPeriod: 'monthly' | 'quarterly' | 'yearly' = 'quarterly';
  Math = Math;

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private eventsService: EventsService,
    private jobsService: JobsService,
    private newsService: NewsService
  ) {}

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadDashboardData();
      }
    });
  }

  /**
   * Load all dashboard data
   */
  loadDashboardData(): void {
    this.isLoading = true;

    // Load all statistics in parallel
    forkJoin({
      users: this.userService.getAllUsers({ limit: 1 }),
      userStats: this.userService.getUserStats(),
      events: this.eventsService.getEventStats(),
      jobs: this.jobsService.getJobStats(),
      news: this.newsService.getNewsStats()
    }).subscribe({
      next: (results) => {
        // Process user stats
        if (results.users.success) {
          this.stats.totalUsers = results.users.total || 0;
        }

        // Process detailed user stats if available
        if (results.userStats.success && results.userStats.data) {
          this.stats.totalUsers = results.userStats.data.total_users || this.stats.totalUsers;
          this.stats.activeAlumni = results.userStats.data.active_alumni || Math.floor(this.stats.totalUsers * 0.68);
        } else {
          // Fallback calculation
          this.stats.activeAlumni = Math.floor(this.stats.totalUsers * 0.68);
        }

        // Process event stats
        if (results.events.success && results.events.data) {
          this.stats.upcomingEvents = results.events.data.upcoming_events || 0;
        }

        // Process job stats
        if (results.jobs.success && results.jobs.data) {
          this.stats.totalJobs = results.jobs.data.total_jobs || 0;
        }

        // Process news/forum stats
        if (results.news.success && results.news.data) {
          this.stats.totalForums = results.news.data.total_articles || 42;
        }

        // Calculate pending approvals (would come from an approvals API)
        this.stats.pendingApprovals = 23;

        // Calculate growth percentages
        this.calculateGrowthStats();

        // Generate recent activities
        this.generateRecentActivities();

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.isLoading = false;
        this.showAlert('error', 'Failed to load dashboard data');
      }
    });
  }

  /**
   * Calculate growth statistics
   */
  calculateGrowthStats(): void {
    // In a real implementation, you'd compare current stats with previous period
    // For now, using mock data
    this.growthStats = {
      users: 12.5,
      alumni: 8.3,
      events: 5.0,
      jobs: 22.8,
      forums: 5.2
    };
  }

  /**
   * Generate recent activities
   */
  generateRecentActivities(): void {
    // This would come from an activity log API endpoint
    // For now, we'll create sample data
    this.recentActivities = [
      {
        type: 'user',
        icon: 'fa-user-plus',
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        title: 'New user registration',
        description: 'Kwame Mensah joined the platform',
        timestamp: this.getRelativeTime(2)
      },
      {
        type: 'event',
        icon: 'fa-calendar-plus',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        title: 'New event created',
        description: '"Tech Innovation Summit" was added',
        timestamp: this.getRelativeTime(5)
      },
      {
        type: 'job',
        icon: 'fa-briefcase',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-600',
        title: 'Job posting',
        description: 'New job: Senior Developer at TechCorp',
        timestamp: this.getRelativeTime(24)
      },
      {
        type: 'forum',
        icon: 'fa-comment',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-600',
        title: 'New forum discussion',
        description: '"Career Development Strategies" started',
        timestamp: this.getRelativeTime(48)
      },
      {
        type: 'report',
        icon: 'fa-exclamation-triangle',
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        title: 'Reported content',
        description: 'A job posting was flagged for review',
        timestamp: this.getRelativeTime(72)
      }
    ];
  }

  /**
   * Get relative time string
   */
  getRelativeTime(hoursAgo: number): string {
    if (hoursAgo < 1) {
      return 'Just now';
    } else if (hoursAgo < 24) {
      return `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(hoursAgo / 24);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }

  /**
   * Change chart period
   */
  changeChartPeriod(period: 'monthly' | 'quarterly' | 'yearly'): void {
    this.selectedChartPeriod = period;
    // In a real implementation, you'd reload chart data for the selected period
    console.log('Chart period changed to:', period);
  }

  /**
   * Search functionality
   */
  onSearch(): void {
    if (this.searchQuery.trim()) {
      console.log('Searching for:', this.searchQuery);
      // Implement global search - navigate to search results or show modal
      this.router.navigate(['/admin/search'], { 
        queryParams: { q: this.searchQuery } 
      });
    }
  }

  /**
   * Navigate to user management
   */
  navigateToUsers(): void {
    this.router.navigate(['/users']);
  }

  /**
   * Navigate to events management
   */
  navigateToEvents(): void {
    this.router.navigate(['/adminEvents']);
  }

  /**
   * Navigate to jobs management
   */
  navigateToJobs(): void {
    this.router.navigate(['/adminJob']);
  }

  /**
   * Navigate to news management
   */
  navigateToNews(): void {
    this.router.navigate(['/admin/news-management']);
  }

  /**
   * Navigate to forums management
   */
  navigateToForums(): void {
    this.router.navigate(['/admin/forums']);
  }

  /**
   * Navigate to pending approvals
   */
  navigateToPendingApprovals(): void {
    this.router.navigate(['/admin/approvals']);
  }

  /**
   * View all activities
   */
  viewAllActivities(): void {
    this.router.navigate(['/admin/activity-log']);
  }

  /**
   * Format number with K/M suffix
   */
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * Get growth indicator
   */
  getGrowthIndicator(value: number): { icon: string; color: string } {
    if (value > 0) {
      return { icon: 'fa-arrow-up', color: 'text-green-500' };
    } else if (value < 0) {
      return { icon: 'fa-arrow-down', color: 'text-red-500' };
    }
    return { icon: 'fa-minus', color: 'text-gray-500' };
  }

  /**
   * Refresh dashboard data
   */
  refreshDashboard(): void {
    this.loadDashboardData();
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