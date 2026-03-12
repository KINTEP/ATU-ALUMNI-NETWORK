// src/app/shared/header/header.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notifications.service';
import { MessagingService } from '../../services/messaging.service';
import { User } from '../../models/user';
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  profilePictureUrl: string = '';           // ← NEW: cached URL
  showUserMenu = false;
  unreadNotificationCount = 0;
  unreadMessageCount = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private messagingService: MessagingService,
    private router: Router,
    private imageService: ImageService
  ) {}

  ngOnInit(): void {
    console.log('Header component initialized');

    // Initial user
    this.currentUser = this.authService.getCurrentUser();
    this.updateProfilePictureUrl();

    // React to user changes (login/logout/profile update)
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        console.log('Header - Current user updated:', user);
        this.currentUser = user;
        this.updateProfilePictureUrl();           // ← Critical: recompute URL

        if (user) {
          this.loadNotificationStats();
          this.loadMessageStats();
        }
      });

    // Unread counts
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => this.unreadNotificationCount = count);

    this.messagingService.unreadMessageCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => this.unreadMessageCount = count);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ← NEW: Central place to compute the correct profile picture URL
  private updateProfilePictureUrl(): void {
    if (!this.currentUser) {
      this.profilePictureUrl = this.imageService.getDefaultAvatar('User');
      return;
    }

    const name = `${this.currentUser.first_name || ''} ${this.currentUser.last_name || ''}`.trim();

    if (this.currentUser.profile_picture) {
      this.profilePictureUrl = this.imageService.getProfilePictureUrl(this.currentUser.profile_picture);
    } else {
      this.profilePictureUrl = this.imageService.getDefaultAvatar(name || 'User');
    }
  }

  loadNotificationStats(): void {
    if (!this.currentUser) return;

    this.notificationService.getNotificationStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.notificationService.updateUnreadCount(res.data.total_unread);
          }
        },
        error: (err) => console.error('Error loading notification stats:', err)
      });
  }

  loadMessageStats(): void {
    if (!this.currentUser) return;

    this.messagingService.getUnreadMessageCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => console.error('Error loading message stats:', err)
      });
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  goToProfile(): void {
    this.closeUserMenu();
    if (this.currentUser) {
      this.router.navigate(['/profile', this.currentUser.id]);
    }
  }

  goToSettings(): void {
    this.closeUserMenu();
    this.router.navigate(['/settings']);
  }

  logout(): void {
    this.closeUserMenu();
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    const first = (this.currentUser.first_name || '').charAt(0);
    const last = (this.currentUser.last_name || '').charAt(0);
    return (first + last).toUpperCase() || 'U';
  }

  // ← NEW: Fallback when image fails to load
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (this.currentUser && img.src !== this.profilePictureUrl) {
      const name = `${this.currentUser.first_name || ''} ${this.currentUser.last_name || ''}`.trim();
      const fallback = this.imageService.getDefaultAvatar(name || 'User');
      img.src = fallback;
      this.profilePictureUrl = fallback;   // keep property in sync
    }
  }
}