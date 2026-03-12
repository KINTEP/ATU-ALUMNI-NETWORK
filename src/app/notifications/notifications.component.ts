import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { Notification, NotificationStats } from '../../models/notification';
import { User } from '../../models/user';
import { ApiResponse } from '../../models/api-response';
import { NotificationService } from '../../services/notifications.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  stats: NotificationStats | null = null;
  
  // Filter and pagination
  selectedFilter: 'all' | 'unread' | string = 'all';
  currentPage = 1;
  pageSize = 20;
  totalNotifications = 0;
  
  // Loading states
  isLoading = false;
  isMarkingRead = false;
  
  // Unsubscribe subject
  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadNotifications();
        this.loadStats();
        
        // Poll for new notifications every 30 seconds
        interval(30000).pipe(
          takeUntil(this.destroy$)
        ).subscribe(() => {
          this.loadStats();
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load notifications
   */
  loadNotifications(): void {
    this.isLoading = true;

    const type = this.selectedFilter !== 'all' && this.selectedFilter !== 'unread' 
      ? this.selectedFilter 
      : undefined;

    this.notificationService.getNotifications(this.currentPage, this.pageSize, type).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: ApiResponse<Notification[]>) => {
        if (response.success && response.data) {
          this.notifications = response.data;
          this.filterNotifications();
          this.totalNotifications = response.total || this.notifications.length;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Load notification stats
   */
  loadStats(): void {
    this.notificationService.getNotificationStats().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: ApiResponse<NotificationStats>) => {
        if (response.success && response.data) {
          this.stats = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  /**
   * Filter notifications based on selected filter
   */
  filterNotifications(): void {
    if (this.selectedFilter === 'all') {
      this.filteredNotifications = this.notifications;
    } else if (this.selectedFilter === 'unread') {
      this.filteredNotifications = this.notifications.filter(n => !n.is_read);
    } else {
      this.filteredNotifications = this.notifications.filter(n => n.type === this.selectedFilter);
    }
  }

  /**
   * Apply filter
   */
  applyFilter(filter: 'all' | 'unread' | string): void {
    this.selectedFilter = filter;
    this.currentPage = 1;
    this.loadNotifications();
  }

  /**
   * Mark notification as read and navigate
   */
  handleNotificationClick(notification: Notification): void {
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.is_read = true;
          if (this.stats) {
            this.stats.total_unread = Math.max(0, this.stats.total_unread - 1);
          }
        }
      });
    }

    // Navigate if link exists
    if (notification.link) {
      this.router.navigateByUrl(notification.link);
    }
  }

  /**
   * Mark all as read
   */
  markAllAsRead(): void {
    if (!confirm('Mark all notifications as read?')) return;

    this.isMarkingRead = true;
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.is_read = true);
        this.filterNotifications();
        if (this.stats) {
          this.stats.total_unread = 0;
        }
        this.isMarkingRead = false;
        this.showAlert('success', 'All notifications marked as read');
      },
      error: (error) => {
        console.error('Error marking all as read:', error);
        this.isMarkingRead = false;
        this.showAlert('error', 'Failed to mark notifications as read');
      }
    });
  }

  /**
   * Delete notification
   */
  deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation();
    
    if (!confirm('Delete this notification?')) return;

    this.notificationService.deleteNotification(notification.id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== notification.id);
        this.filterNotifications();
        this.totalNotifications--;
        
        if (!notification.is_read && this.stats) {
          this.stats.total_unread = Math.max(0, this.stats.total_unread - 1);
        }
        
        this.showAlert('success', 'Notification deleted');
      },
      error: (error) => {
        console.error('Error deleting notification:', error);
        this.showAlert('error', 'Failed to delete notification');
      }
    });
  }

  /**
   * Delete all read notifications
   */
  deleteAllRead(): void {
    if (!confirm('Delete all read notifications?')) return;

    this.notificationService.deleteAllRead().subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => !n.is_read);
        this.filterNotifications();
        this.showAlert('success', 'All read notifications deleted');
        this.loadNotifications();
      },
      error: (error) => {
        console.error('Error deleting notifications:', error);
        this.showAlert('error', 'Failed to delete notifications');
      }
    });
  }

  /**
   * Get notification icon based on type
   */
  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'connection_request': 'fa-user-plus',
      'connection_accepted': 'fa-check-circle',
      'event_rsvp': 'fa-calendar-check',
      'event_reminder': 'fa-bell',
      'job_application': 'fa-briefcase',
      'message': 'fa-comment',
      'forum_reply': 'fa-comments',
      'system': 'fa-info-circle'
    };
    return icons[type] || 'fa-bell';
  }

  /**
   * Get notification color based on type
   */
  getNotificationColor(type: string): string {
    const colors: { [key: string]: string } = {
      'connection_request': 'bg-blue-500',
      'connection_accepted': 'bg-green-500',
      'event_rsvp': 'bg-purple-500',
      'event_reminder': 'bg-yellow-500',
      'job_application': 'bg-indigo-500',
      'message': 'bg-pink-500',
      'forum_reply': 'bg-orange-500',
      'system': 'bg-gray-500'
    };
    return colors[type] || 'bg-gray-500';
  }

  /**
   * Get time ago
   */
  getTimeAgo(date: string): string {
    const now = new Date();
    const notificationDate = new Date(date);
    const seconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return notificationDate.toLocaleDateString();
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
}