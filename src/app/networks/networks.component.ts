import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Connection, ConnectionRequest, ConnectionStats } from '../../models/connection';
import { User } from '../../models/user';
import { ConnectionService } from '../../services/connection.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { ApiResponse } from '../../models/api-response';
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-networks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './networks.component.html',
  styleUrl: './networks.component.scss'
})
export class NetworksComponent implements OnInit {
  currentUser: User | null = null;
  
  // Data
  pendingRequests: ConnectionRequest[] = [];
  sentRequests: ConnectionRequest[] = [];
  myConnections: Connection[] = [];
  suggestedUsers: User[] = [];
  connectionStats: ConnectionStats = {
    total_connections: 0,
    pending_requests: 0,
    sent_requests: 0
  };
  
  // Filters
  searchQuery = '';
  selectedDepartment = '';
  selectedYear = '';
  
  // Loading states
  isLoadingRequests = false;
  isLoadingConnections = false;
  isLoadingSuggestions = false;
  isInitialLoading = true;
  
  // Error handling
  errorMessage = '';
  
  // Dropdowns data
  departments = ['Computer Science', 'Business Administration', 'Electrical Engineering', 'Architecture', 'Marketing'];
  years = ['2023', '2022', '2021', '2020', '2019', '2018', '2017'];

  constructor(
    private connectionService: ConnectionService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private imageService: ImageService,
  ) {}

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadAllData();
      }
    });
  }

  /**
   * Load all data at once to prevent flickering
   */
  loadAllData(): void {
    this.isInitialLoading = true;
    this.isLoadingRequests = true;
    this.isLoadingConnections = true;
    this.isLoadingSuggestions = true;

    forkJoin({
      stats: this.connectionService.getConnectionStats(),
      pendingRequests: this.connectionService.getPendingRequests(),
      sentRequests: this.connectionService.getSentRequests(),
      connections: this.connectionService.getMyConnections(1, 20, this.searchQuery)
    }).subscribe({
      next: (results) => {
        if (results.stats.success && results.stats.data) {
          this.connectionStats = results.stats.data;
        }

        if (results.pendingRequests.success && results.pendingRequests.data) {
          this.pendingRequests = results.pendingRequests.data;
        }

        if (results.sentRequests.success && results.sentRequests.data) {
          this.sentRequests = results.sentRequests.data;
        }

        if (results.connections.success && results.connections.data) {
          this.myConnections = results.connections.data;
        }

        this.loadSuggestedUsersWithFilter();

        this.isLoadingRequests = false;
        this.isLoadingConnections = false;
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.isLoadingRequests = false;
        this.isLoadingConnections = false;
        this.isLoadingSuggestions = false;
        this.isInitialLoading = false;
        this.errorMessage = 'Failed to load network data';
      }
    });
  }

  /**
   * Load suggested users with proper filtering
   */
  loadSuggestedUsersWithFilter(): void {
    const params: any = {
      page: 1,
      limit: 30
    };

    if (this.selectedDepartment) params.program_of_study = this.selectedDepartment;
    if (this.selectedYear) params.graduation_year = parseInt(this.selectedYear);
    if (this.searchQuery) params.search = this.searchQuery;

    this.userService.getAllUsers(params).subscribe({
      next: (response: ApiResponse<User[]>) => {
        if (response.success && response.data) {
          this.suggestedUsers = response.data.filter(user => {
            if (user.id === this.currentUser?.id) return false;
            if (this.myConnections.some(conn => conn.user.id === user.id)) return false;
            if (this.pendingRequests.some(req => req.sender_id === user.id)) return false;
            if (this.sentRequests.some(req => req.receiver_id === user.id)) return false;
            return true;
          }).slice(0, 6);
        }
        this.isLoadingSuggestions = false;
        this.isInitialLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading suggestions:', error);
        this.isLoadingSuggestions = false;
        this.isInitialLoading = false;
      }
    });
  }

  /**
   * Search users
   */
  searchUsers(): void {
    this.isLoadingSuggestions = true;
    this.loadSuggestedUsersWithFilter();
  }

  /**
   * Accept connection request
   */
  acceptRequest(request: ConnectionRequest): void {
    this.connectionService.acceptRequest(request.id).subscribe({
      next: (response: ApiResponse) => {
        if (response.success) {
          this.pendingRequests = this.pendingRequests.filter(r => r.id !== request.id);
          this.connectionStats.pending_requests--;
          this.connectionStats.total_connections++;
          
          this.connectionService.getMyConnections(1, 20, this.searchQuery).subscribe({
            next: (connResponse) => {
              if (connResponse.success && connResponse.data) {
                this.myConnections = connResponse.data;
              }
            }
          });
          
          alert('Connection request accepted!');
        }
      },
      error: (error: any) => {
        console.error('Error accepting request:', error);
        alert('Failed to accept request');
      }
    });
  }

  /**
   * Decline connection request
   */
  declineRequest(request: ConnectionRequest): void {
    if (!confirm('Are you sure you want to decline this request?')) return;

    this.connectionService.declineRequest(request.id).subscribe({
      next: (response: ApiResponse) => {
        if (response.success) {
          this.pendingRequests = this.pendingRequests.filter(r => r.id !== request.id);
          this.connectionStats.pending_requests--;
          alert('Connection request declined');
        }
      },
      error: (error: any) => {
        console.error('Error declining request:', error);
        alert('Failed to decline request');
      }
    });
  }

  /**
   * Send connection request
   */
  sendConnectionRequest(user: User): void {
    this.connectionService.sendConnectionRequest(user.id).subscribe({
      next: (response: ApiResponse<ConnectionRequest>) => {
        if (response.success) {
          this.suggestedUsers = this.suggestedUsers.filter(u => u.id !== user.id);
          
          if (response.data) {
            this.sentRequests.push(response.data);
          }
          
          this.connectionStats.sent_requests++;
          
          alert('Connection request sent!');
        }
      },
      error: (error: any) => {
        console.error('Error sending request:', error);
        if (error.error?.error) {
          alert(error.error.error);
        } else {
          alert('Failed to send connection request');
        }
      }
    });
  }

  /**
   * Remove connection
   */
  removeConnection(connection: Connection): void {
    if (!confirm(`Are you sure you want to remove ${connection.user.name} from your connections?`)) return;

    this.connectionService.removeConnection(connection.connection_id).subscribe({
      next: (response: ApiResponse) => {
        if (response.success) {
          this.myConnections = this.myConnections.filter(c => c.connection_id !== connection.connection_id);
          this.connectionStats.total_connections--;
          alert('Connection removed');
        }
      },
      error: (error: any) => {
        console.error('Error removing connection:', error);
        alert('Failed to remove connection');
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
   * Get user initials
   */
  getUserInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  /**
   * Get avatar color class
   */
  getAvatarColorClass(index: number): string {
    const colors = [
      'bg-gradient-to-r from-blue-600 to-indigo-600',
      'bg-gradient-to-r from-indigo-600 to-purple-600',
      'bg-gradient-to-r from-purple-600 to-blue-600'
    ];
    return colors[index % colors.length];
  }

  /**
   * Get profile picture URL
   */
  getProfilePictureUrl(picturePath: string | null | undefined): string {
    return this.imageService.getProfilePictureUrl(picturePath);
  }

  hasProfilePicture(picturePath: string | null | undefined): boolean {
    return this.imageService.hasImage(picturePath);
  }
  
 
  /**
   * View all suggestions
   */
  viewAllSuggestions(): void {
    this.router.navigate(['/suggested-networks']);
  }
}