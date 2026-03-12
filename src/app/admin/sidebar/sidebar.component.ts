// src/app/admin/sidebar/sidebar.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { User } from '../../../models/user';
import { AuthService } from '../../../services/auth.service';
import { EventsService } from '../../../services/events.service';
import { JobsService } from '../../../services/jobs.service';
import { ForumService } from '../../../services/forum.service';
import { NewsService } from '../../../services/news.service';


interface SidebarCounts {
  users: number;
  events: number;
  jobs: number;
  forums: number;
  news: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentUser: User | null = null;
  counts: SidebarCounts = {
    users: 0,
    events: 0,
    jobs: 0,
    forums: 0,
    news: 0
  };

  isLoadingCounts = false;
  isMobileMenuOpen = false;

  constructor(
    private authService: AuthService,
    private eventsService: EventsService,
    private jobService: JobsService,
    private forumService: ForumService,
    private newsService: NewsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });

    // Load counts
    this.loadCounts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all counts from APIs
   */
  loadCounts(): void {
    this.isLoadingCounts = true;

    // Make parallel requests for all counts
    forkJoin({
      events: this.eventsService.getEventStats(),
      jobs: this.jobService.getJobStats(),
      forums: this.forumService.getForumStats(),
      news: this.newsService.getNewsStats()
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (results) => {
        // Events count
        if (results.events.success && results.events.data) {
          this.counts.events = results.events.data.total_events || 0;
        }

        // Jobs count
        if (results.jobs.success && results.jobs.data) {
          this.counts.jobs = results.jobs.data.total_jobs || 0;
        }

        // Forums count
        if (results.forums.success && results.forums.data) {
          this.counts.forums = results.forums.data.total_posts || 0;
        }

        // News count
        if (results.news.success && results.news.data) {
          this.counts.news = results.news.data.total_articles || 0;
        }

        // Users count - would need a users service/endpoint
        // For now using a placeholder
        this.counts.users = 0; // TODO: Add users endpoint

        this.isLoadingCounts = false;
      },
      error: (error) => {
        console.error('Error loading sidebar counts:', error);
        this.isLoadingCounts = false;
      }
    });
  }

  /**
   * Get user initials
   */
  getUserInitials(): string {
    if (!this.currentUser) return 'AD';
    const first = this.currentUser.first_name?.charAt(0) || '';
    const last = this.currentUser.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || 'AD';
  }

  /**
   * Get user full name
   */
  getUserFullName(): string {
    if (!this.currentUser) return 'Admin User';
    return `${this.currentUser.first_name || ''} ${this.currentUser.last_name || ''}`.trim() || 'Admin User';
  }

  /**
   * Get user role display
   */
  getUserRole(): string {
    if (!this.currentUser) return 'Administrator';
    
    const roleMap: { [key: string]: string } = {
      'admin': 'Super Administrator',
      'alumni': 'Alumni',
      'student': 'Student'
    };

    return roleMap[this.currentUser.role] || 'User';
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  /**
   * Logout
   */
  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  /**
   * Refresh counts manually
   */
  refreshCounts(): void {
    this.loadCounts();
  }
}