// src/app/admin/users/users.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { debounceTime, Subject } from 'rxjs';
import { User, UserQueryParams } from '../../../models/user';
import { UserService } from '../../../services/user.service';

interface UserStats {
  total_users: number;
  by_role: Array<{ role: string; count: number }>;
  by_graduation_year: Array<{ graduation_year: number; count: number }>;
  by_faculty: Array<{ faculty: string; count: number }>;
  recent_registrations: number;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  // Users data
  users: User[] = [];
  selectedUsers: Set<number> = new Set();
  allSelected = false;

  // Filters
  searchQuery = '';
  selectedRole = 'all';
  selectedStatus = 'all';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalUsers = 0;
  totalPages = 0;

  // Stats
  stats: UserStats | null = null;

  // Loading states
  isLoading = false;
  isLoadingStats = false;

  // Error/Success messages
  errorMessage = '';
  successMessage = '';

  // Search debounce
  private searchSubject = new Subject<string>();
  Math = Math;

  constructor(
    private router: Router,
    private userService: UserService
  ) {
    // Setup search debounce
    this.searchSubject.pipe(
      debounceTime(500)
    ).subscribe(searchTerm => {
      this.searchQuery = searchTerm;
      this.currentPage = 1;
      this.loadUsers();
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadStats();
  }

  /**
   * Load users from API
   */
  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const params: UserQueryParams = {
      page: this.currentPage,
      limit: this.pageSize
    };

    // Apply filters
    if (this.searchQuery.trim()) {
      params.search = this.searchQuery.trim();
    }

    if (this.selectedRole !== 'all') {
      params.role = this.selectedRole;
    }

    // Note: Status filter would need backend support
    // For now, we'll filter on frontend after getting data

    this.userService.getAllUsers(params).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.users = response.data;
          this.totalUsers = response.total || 0;
          this.totalPages = response.pagination?.total_pages || 1;

          // Apply status filter on frontend if needed
          if (this.selectedStatus !== 'all') {
            this.users = this.users.filter(user => {
              if (this.selectedStatus === 'active') return user.is_active;
              if (this.selectedStatus === 'inactive') return !user.is_active;
              return true;
            });
          }
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load users. Please try again.';
        console.error('Load users error:', error);
      }
    });
  }

  /**
   * Load user statistics
   */
  loadStats(): void {
    this.isLoadingStats = true;

    this.userService.getUserStats().subscribe({
      next: (response) => {
        this.isLoadingStats = false;
        if (response.success && response.data) {
          this.stats = response.data;
        }
      },
      error: (error) => {
        this.isLoadingStats = false;
        console.error('Load stats error:', error);
      }
    });
  }

  /**
   * Handle search input
   */
  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  /**
   * Handle role filter change
   */
  onRoleFilterChange(event: Event): void {
    this.selectedRole = (event.target as HTMLSelectElement).value;
    this.currentPage = 1;
    this.loadUsers();
  }

  /**
   * Handle status filter change
   */
  onStatusFilterChange(event: Event): void {
    this.selectedStatus = (event.target as HTMLSelectElement).value;
    this.currentPage = 1;
    this.loadUsers();
  }

  /**
   * Navigate to add user page
   */
  navigateToAddUser(): void {
    this.router.navigate(['/addUser']);
  }

  /**
   * Navigate to user profile
   */
  viewUserProfile(userId: number): void {
    this.router.navigate(['/profile', userId]);
  }

  /**
   * Edit user (navigate to edit page)
   */
  editUser(userId: number): void {
    // TODO: Create edit user page
    this.router.navigate(['/users/edit', userId]);
  }

  /**
   * Delete user
   */
  deleteUser(user: User): void {
    if (!confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}?`)) {
      return;
    }

    this.userService.deleteUser(user.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'User deleted successfully';
          this.loadUsers();
          this.loadStats();
          setTimeout(() => this.successMessage = '', 3000);
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Failed to delete user';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  /**
   * Reactivate user
   */
  reactivateUser(user: User): void {
    if (!confirm(`Reactivate ${user.first_name} ${user.last_name}?`)) {
      return;
    }

    this.userService.reactivateUser(user.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'User reactivated successfully';
          this.loadUsers();
          this.loadStats();
          setTimeout(() => this.successMessage = '', 3000);
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Failed to reactivate user';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  /**
   * Toggle user selection
   */
  toggleUserSelection(userId: number): void {
    if (this.selectedUsers.has(userId)) {
      this.selectedUsers.delete(userId);
    } else {
      this.selectedUsers.add(userId);
    }
    this.updateAllSelectedState();
  }

  /**
   * Check if user is selected
   */
  isUserSelected(userId: number): boolean {
    return this.selectedUsers.has(userId);
  }

  /**
   * Toggle all users selection
   */
  toggleAllSelection(): void {
    if (this.allSelected) {
      this.selectedUsers.clear();
    } else {
      this.users.forEach(user => this.selectedUsers.add(user.id));
    }
    this.allSelected = !this.allSelected;
  }

  /**
   * Update all selected state
   */
  private updateAllSelectedState(): void {
    this.allSelected = this.users.length > 0 && 
                       this.users.every(user => this.selectedUsers.has(user.id));
  }

  /**
   * Get user initials
   */
  getUserInitials(user: User): string {
    const first = user.first_name?.charAt(0) || '';
    const last = user.last_name?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  /**
   * Get role badge class
   */
  getRoleBadgeClass(role: string): string {
    const classes: { [key: string]: string } = {
      'admin': 'bg-purple-100 text-purple-800',
      'alumni': 'bg-blue-100 text-blue-800',
      'staff': 'bg-green-100 text-green-800'
    };
    return classes[role] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(isActive: boolean): string {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }

  /**
   * Format last active time
   */
  formatLastActive(lastLogin: string | undefined): string {
    if (!lastLogin) return 'Never';

    const now = new Date();
    const loginDate = new Date(lastLogin);
    const diffMs = now.getTime() - loginDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return loginDate.toLocaleDateString();
  }

  /**
   * Format join date
   */
  formatJoinDate(createdAt: string): string {
    return new Date(createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get alumni count from stats
   */
  getAlumniCount(): number {
    if (!this.stats) return 0;
    const alumniRole = this.stats.by_role.find(r => r.role === 'alumni');
    return alumniRole ? Number(alumniRole.count) : 0;
  }

  /**
   * Pagination methods
   */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadUsers();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadUsers();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadUsers();
    }
  }

  getPaginationPages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  /**
   * Bulk actions
   */
  applyBulkAction(action: string): void {
    if (this.selectedUsers.size === 0) {
      alert('Please select users first');
      return;
    }

    switch (action) {
      case 'activate':
        this.bulkActivate();
        break;
      case 'deactivate':
        this.bulkDeactivate();
        break;
      case 'delete':
        this.bulkDelete();
        break;
      default:
        alert('Please select an action');
    }
  }

  private bulkDelete(): void {
  if (!confirm(`Delete ${this.selectedUsers.size} selected users? This cannot be undone.`)) return;
  
  let completed = 0;
  let failed = 0;
  const total = this.selectedUsers.size;

  Array.from(this.selectedUsers).forEach(userId => {
    this.userService.deleteUser(userId).subscribe({
      next: (response) => {
        if (response.success) {
          completed++;
          if (completed + failed === total) {
            this.showBulkResult(completed, failed, 'deleted');
          }
        }
      },
      error: () => {
        failed++;
        if (completed + failed === total) {
          this.showBulkResult(completed, failed, 'deleted');
        }
      }
    });
  });
}

private bulkActivate(): void {
  if (!confirm(`Activate ${this.selectedUsers.size} selected users?`)) return;
  
  let completed = 0;
  let failed = 0;
  const total = this.selectedUsers.size;

  Array.from(this.selectedUsers).forEach(userId => {
    this.userService.reactivateUser(userId).subscribe({
      next: (response) => {
        if (response.success) {
          completed++;
          if (completed + failed === total) {
            this.showBulkResult(completed, failed, 'activated');
          }
        }
      },
      error: () => {
        failed++;
        if (completed + failed === total) {
          this.showBulkResult(completed, failed, 'activated');
        }
      }
    });
  });
}

private bulkDeactivate(): void {
  if (!confirm(`Deactivate ${this.selectedUsers.size} selected users?`)) return;
  
  let completed = 0;
  let failed = 0;
  const total = this.selectedUsers.size;

  Array.from(this.selectedUsers).forEach(userId => {
    this.userService.deleteUser(userId).subscribe({
      next: (response) => {
        if (response.success) {
          completed++;
          if (completed + failed === total) {
            this.showBulkResult(completed, failed, 'deactivated');
          }
        }
      },
      error: () => {
        failed++;
        if (completed + failed === total) {
          this.showBulkResult(completed, failed, 'deactivated');
        }
      }
    });
  });
}

private showBulkResult(completed: number, failed: number, action: string): void {
  this.selectedUsers.clear();
  this.allSelected = false;
  this.loadUsers();
  this.loadStats();
  
  if (failed === 0) {
    this.successMessage = `${completed} user(s) ${action} successfully`;
  } else {
    this.errorMessage = `${completed} succeeded, ${failed} failed`;
  }
  
  setTimeout(() => {
    this.successMessage = '';
    this.errorMessage = '';
  }, 3000);
}

  
  /**
   * Export users
   */
  exportUsers(): void {
    // TODO: Implement export functionality
    console.log('Export users');
    alert('Export functionality coming soon!');
  }



  // In your component
getProfileImageUrl(imageUrl: string): string {
  if (!imageUrl) return '/assets/default-avatar.png';
  
  // If URL already starts with http, return as is
  if (imageUrl.startsWith('http')) return imageUrl;
  
  // Otherwise, prepend the API URL
  return `http://localhost:8080${imageUrl}`;
}
}