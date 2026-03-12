import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../models/user';
import { ConnectionRequest } from '../../models/connection';
import { UserService } from '../../services/user.service';
import { ConnectionService } from '../../services/connection.service';
import { AuthService } from '../../services/auth.service';
import { ApiResponse } from '../../models/api-response';

@Component({
  selector: 'app-suggested-networks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suggested-networks.component.html',
  styleUrl: './suggested-networks.component.scss'
})
export class SuggestedNetworksComponent implements OnInit {
  currentUser: User | null = null;
  suggestedUsers: User[] = [];
  allUsers: User[] = [];
  
  // Filters
  searchQuery = '';
  selectedDepartment = '';
  selectedYear = '';
  selectedLocation = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 12;
  totalUsers = 0;
  totalPages = 0;
  
  // Loading states
  isLoading = false;
  loadingConnectionId: number | null = null;
  
  // Dropdowns data
  departments = [
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical/Electronic Engineering',
    'Automobile Engineering',
    'Computer Science',
    'Fashion Design and Textiles',
    'Business Administration',
    'Marketing',
    'Architecture'
  ];
  
  graduationYears = ['2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015'];
  
  locations = ['Accra', 'Kumasi', 'Takoradi', 'Tamale', 'Cape Coast', 'Tema', 'International'];

  constructor(
    private userService: UserService,
    private connectionService: ConnectionService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadSuggestedUsers();
      }
    });
  }

  /**
   * Load suggested users with filters
   */
  loadSuggestedUsers(): void {
    this.isLoading = true;

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };

    if (this.searchQuery.trim()) params.search = this.searchQuery.trim();
    if (this.selectedDepartment) params.program_of_study = this.selectedDepartment;
    if (this.selectedYear) params.graduation_year = parseInt(this.selectedYear);
    if (this.selectedLocation) params.location = this.selectedLocation;

    this.userService.getAllUsers(params).subscribe({
      next: (response: ApiResponse<User[]>) => {
        if (response.success && response.data) {
          // Filter out current user
          this.allUsers = response.data.filter(user => user.id !== this.currentUser?.id);
          this.suggestedUsers = this.allUsers;
          
          // Calculate pagination
          this.totalUsers = response.total || this.allUsers.length;
          this.totalPages = Math.ceil(this.totalUsers / this.pageSize);
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Search users
   */
  searchUsers(): void {
    this.currentPage = 1;
    this.loadSuggestedUsers();
  }

  /**
   * Reset filters
   */
  resetFilters(): void {
    this.searchQuery = '';
    this.selectedDepartment = '';
    this.selectedYear = '';
    this.selectedLocation = '';
    this.currentPage = 1;
    this.loadSuggestedUsers();
  }

  /**
   * Change page
   */
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadSuggestedUsers();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Send connection request
   */
  sendConnectionRequest(user: User): void {
    if (!this.currentUser) {
      alert('Please log in to send connection requests.');
      return;
    }

    this.loadingConnectionId = user.id;

    this.connectionService.sendConnectionRequest(user.id).subscribe({
      next: (response: ApiResponse<ConnectionRequest>) => {
        if (response.success) {
          // Show success message
          this.showAlert('success', `Connection request sent to ${user.first_name} ${user.last_name}!`);
          
          // Remove from suggestions
          this.suggestedUsers = this.suggestedUsers.filter(u => u.id !== user.id);
          this.totalUsers--;
        }
        this.loadingConnectionId = null;
      },
      error: (error: any) => {
        console.error('Error sending connection request:', error);
        if (error.error?.error) {
          this.showAlert('error', error.error.error);
        } else {
          this.showAlert('error', 'Failed to send connection request. Please try again.');
        }
        this.loadingConnectionId = null;
      }
    });
  }

  /**
   * View user profile
   */
  viewProfile(userId: number): void {
    this.router.navigate(['/profile', userId]);
  }

  /**
   * Message user
   */
  messageUser(userId: number): void {
    this.router.navigate(['/messages'], { queryParams: { user: userId } });
  }

  /**
   * Go back
   */
  goBack(): void {
    this.router.navigate(['/networks']);
  }

  /**
   * Get user initials
   */
  getUserInitials(user: User): string {
    if (!user.first_name || !user.last_name) return 'U';
    return (user.first_name.charAt(0) + user.last_name.charAt(0)).toUpperCase();
  }

  /**
   * Get avatar color class
   */
  getAvatarColorClass(index: number): string {
    const colors = [
      'bg-gradient-to-r from-blue-600 to-indigo-600',
      'bg-gradient-to-r from-indigo-600 to-purple-600',
      'bg-gradient-to-r from-purple-600 to-pink-600',
      'bg-gradient-to-r from-pink-600 to-red-600',
      'bg-gradient-to-r from-red-600 to-orange-600',
      'bg-gradient-to-r from-orange-600 to-yellow-600',
      'bg-gradient-to-r from-green-600 to-teal-600',
      'bg-gradient-to-r from-teal-600 to-cyan-600'
    ];
    return colors[index % colors.length];
  }

  /**
   * Get page numbers for pagination
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  /**
   * Show alert message
   */
  showAlert(type: 'success' | 'error', message: string): void {
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md animate-slide-in ${
      type === 'success' 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    }`;
    
    alertDiv.innerHTML = `
      <div class="flex items-center space-x-3">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-2xl"></i>
        <div class="flex-1">
          <p class="font-medium">${type === 'success' ? 'Success!' : 'Error'}</p>
          <p class="text-sm opacity-90">${message}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
      if (alertDiv.parentElement) {
        alertDiv.remove();
      }
    }, 5000);
  }
}