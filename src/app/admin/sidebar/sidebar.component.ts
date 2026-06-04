// src/app/admin/sidebar/sidebar.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { User } from '../../../models/user';
import { AuthService } from '../../../services/auth.service';

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
  isMobileMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'AD';
    const first = this.currentUser.first_name?.charAt(0) || '';
    const last = this.currentUser.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || 'AD';
  }

  getUserFullName(): string {
    if (!this.currentUser) return 'Admin User';
    return `${this.currentUser.first_name || ''} ${this.currentUser.last_name || ''}`.trim() || 'Admin User';
  }

  getUserRole(): string {
    if (!this.currentUser) return 'Administrator';
    const roleMap: { [key: string]: string } = {
      'admin': 'Super Administrator',
      'alumni': 'Alumni',
      'student': 'Student'
    };
    return roleMap[this.currentUser.role] || 'User';
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}