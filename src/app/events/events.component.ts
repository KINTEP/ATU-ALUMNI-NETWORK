import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { User } from '../../models/user';
import { AlumniEvent, EventComment } from '../../models/event';
import { EventsService } from '../../services/events.service';
import { AuthService } from '../../services/auth.service';
import { ApiResponse } from '../../models/api-response';
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './events.component.html',
  styleUrl: './events.component.scss'
})
export class EventsComponent implements OnInit {
  currentUser: User | null = null;
  
  // Events data
  events: AlumniEvent[] = [];
  
  // View state
  activeTab: 'upcoming' | 'past' = 'upcoming';
  
  // Search and filters
  searchQuery = '';
  selectedSort = 'date-desc';
  
  // Loading and pagination
  isLoading = false;
  currentPage = 1;
  totalEvents = 0;
  totalPages = 0;
  limit = 12;
  
  // Error handling
  errorMessage = '';
  
  // Comments tracking
  eventComments: { [eventId: number]: EventComment[] } = {};
  newComments: { [eventId: number]: string } = {};
  showAllComments: { [eventId: number]: boolean } = {};

  constructor(
    private eventsService: EventsService,
    private authService: AuthService,
    private router: Router,
    private imageService: ImageService
  ) {}

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    // Load initial events
    this.loadEvents();
  }

  /**
   * Load events based on active tab
   */
  loadEvents(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const loadMethod = this.activeTab === 'upcoming' 
      ? this.eventsService.getUpcomingEvents(this.currentPage, this.limit)
      : this.eventsService.getPastEvents(this.currentPage, this.limit);

    loadMethod.subscribe({
      next: (response: ApiResponse<AlumniEvent[]>) => {
        if (response.success && response.data) {
          this.events = response.data;
          this.totalEvents = response.total || 0;
          this.totalPages = Math.ceil(this.totalEvents / this.limit);
          
          // Load comments for each event
          this.events.forEach(event => {
            this.loadEventComments(event.id);
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.errorMessage = 'Failed to load events. Please try again.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Search events
   */
  searchEvents(): void {
    if (!this.searchQuery.trim()) {
      this.loadEvents();
      return;
    }

    this.isLoading = true;
    this.eventsService.getAllEvents({
      search: this.searchQuery,
      page: this.currentPage,
      limit: this.limit
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.events = response.data;
          this.totalEvents = response.total || 0;
          this.totalPages = Math.ceil(this.totalEvents / this.limit);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error searching events:', error);
        this.errorMessage = 'Failed to search events.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Sort events
   */
  sortEvents(): void {
    // Implement sorting based on selectedSort value
    this.loadEvents();
  }

  /**
   * Switch between upcoming and past events
   */
  switchTab(tab: 'upcoming' | 'past'): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.loadEvents();
  }

  /**
   * View event details
   */
  viewEvent(eventId: number): void {
    this.router.navigate(['/events', eventId]);
  }

  /**
   * Toggle bookmark/save event
   */
  toggleBookmark(event: AlumniEvent, $event: Event): void {
    $event.stopPropagation();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    
    // TODO: Implement save event functionality
    console.log('Toggle bookmark for event:', event.id);
  }

  /**
   * Load comments for an event
   */
  loadEventComments(eventId: number): void {
    this.eventsService.getEventComments(eventId).subscribe({
      next: (response: ApiResponse<EventComment[]>) => {
        if (response.success && response.data) {
          this.eventComments[eventId] = response.data;
        }
      },
      error: (error: any) => {
        console.error('Error loading comments:', error);
      }
    });
  }

  /**
   * Get comments for a specific event
   */
  getEventComments(eventId: number): EventComment[] {
    return this.eventComments[eventId] || [];
  }

  /**
   * Get visible comments (first comment or all if expanded)
   */
  getVisibleComments(eventId: number): EventComment[] {
    const comments = this.getEventComments(eventId);
    return this.showAllComments[eventId] ? comments : comments.slice(0, 1);
  }

  /**
   * Toggle show all comments
   */
  toggleShowComments(eventId: number, $event: Event): void {
    $event.stopPropagation();
    this.showAllComments[eventId] = !this.showAllComments[eventId];
  }

  /**
   * Add comment to event
   */
 addComment(event: AlumniEvent, $event: Event): void {
    $event.stopPropagation();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    const comment = this.newComments[event.id]?.trim();
    if (!comment) return;

    this.eventsService.addComment(event.id, {
      user_id: this.currentUser.id,
      comment: comment
    }).subscribe({
      next: (response: ApiResponse<EventComment>) => {
        if (response.success && response.data) {
          // Add new comment to the list
          if (!this.eventComments[event.id]) {
            this.eventComments[event.id] = [];
          }
          this.eventComments[event.id].unshift(response.data);
          
          // Clear input
          this.newComments[event.id] = '';
        }
      },
      error: (error: any) => {
        console.error('Error adding comment:', error);
        alert('Failed to add comment');
      }
    });
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Format time
   */
  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Get time range
   */
  getTimeRange(event: AlumniEvent): string {
    const startTime = this.formatTime(event.start_date);
    const endTime = this.formatTime(event.end_date);
    
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    
    if (startDate.toDateString() === endDate.toDateString()) {
      return `${startTime} - ${endTime}`;
    }
    return startTime;
  }

  /**
   * Get user initials
   */
  getUserInitials(firstName?: string, lastName?: string): string {
    if (!firstName && !lastName) return 'U';
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  /**
   * Pagination: Next page
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadEvents();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Pagination: Previous page
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadEvents();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }


  getProfilePictureUrl(picturePath: string | null | undefined): string {
    return this.imageService.getProfilePictureUrl(picturePath);
  }

  hasProfilePicture(picturePath: string | null | undefined): boolean {
    return this.imageService.hasImage(picturePath);
  }

  getEventImageUrl(imagePath: string | null | undefined): string {
    return this.imageService.getEventImageUrl(imagePath);
  }



}