import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { EventsService } from '../../../services/events.service';
import { AuthService } from '../../../services/auth.service';
import { AlumniEvent } from '../../../models/event';
import { ApiResponse } from '../../../models/api-response';
import { User } from '../../../models/user';

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './admin-events.component.html',
  styleUrl: './admin-events.component.scss'
})
export class AdminEventsComponent implements OnInit {
  currentUser: User | null = null;
  events: AlumniEvent[] = [];
  filteredEvents: AlumniEvent[] = [];
  selectedEvents: number[] = [];
  
  // Filters
  searchQuery = '';
  selectedType = 'all';
  selectedStatus = 'all';
  currentTab = 'all';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalEvents = 0;
  totalPages = 0;
  
  // Loading states
  isLoading = false;
  
  // Statistics
  stats = {
    total: 0,
    upcoming: 0,
    ongoing: 0,
    past: 0,
    totalAttendees: 0,
    avgAttendance: 0
  };

    Math = Math;


  constructor(
    private router: Router,
    private eventsService: EventsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadEvents();
        this.loadStatistics();
      }
    });
  }

  /**
   * Load events
   */
  loadEvents(): void {
    this.isLoading = true;

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };

    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedType !== 'all') params.event_type = this.selectedType;
    if (this.selectedStatus !== 'all') params.status = this.selectedStatus;

    this.eventsService.getAllEvents(params).subscribe({
      next: (response: ApiResponse<AlumniEvent[]>) => {
        if (response.success && response.data) {
          this.events = response.data;
          this.totalEvents = response.total || 0;
          this.totalPages = Math.ceil(this.totalEvents / this.pageSize);
          this.filterEventsByTab();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Load statistics
   */
  loadStatistics(): void {
    this.eventsService.getEventStats().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const data = response.data;
          this.stats = {
            total: data.total_events || 0,
            upcoming: data.upcoming_events || 0,
            ongoing: data.by_status?.find((s: any) => s.status === 'ongoing')?.count || 0,
            past: data.by_status?.find((s: any) => s.status === 'completed')?.count || 0,
            totalAttendees: data.total_rsvps || 0,
            avgAttendance: parseFloat(data.avg_attendance_rate || 0)
          };
        }
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
      }
    });
  }

  /**
   * Filter events by tab
   */
  filterEventsByTab(): void {
    if (this.currentTab === 'all') {
      this.filteredEvents = this.events;
    } else if (this.currentTab === 'upcoming') {
      this.filteredEvents = this.events.filter(e => e.status === 'upcoming');
    } else if (this.currentTab === 'ongoing') {
      this.filteredEvents = this.events.filter(e => e.status === 'ongoing');
    } else if (this.currentTab === 'past') {
      this.filteredEvents = this.events.filter(e => e.status === 'completed');
    }
  }

  /**
   * Change tab
   */
  changeTab(tab: string): void {
    this.currentTab = tab;
    this.currentPage = 1;
    this.filterEventsByTab();
  }

  /**
   * Search events
   */
  searchEvents(): void {
    this.currentPage = 1;
    this.loadEvents();
  }

  /**
   * Filter by type
   */
  filterByType(type: string): void {
    this.selectedType = type;
    this.currentPage = 1;
    this.loadEvents();
  }

  /**
   * Filter by status
   */
  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.loadEvents();
  }

  /**
   * Change page
   */
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadEvents();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Toggle event selection
   */
  toggleEventSelection(eventId: number, event: Event): void {
    event.stopPropagation();
    const index = this.selectedEvents.indexOf(eventId);
    if (index > -1) {
      this.selectedEvents.splice(index, 1);
    } else {
      this.selectedEvents.push(eventId);
    }
  }

  /**
   * Toggle select all
   */
  toggleSelectAll(event: Event): void {
    event.stopPropagation();
    if (this.selectedEvents.length === this.filteredEvents.length) {
      this.selectedEvents = [];
    } else {
      this.selectedEvents = this.filteredEvents.map(e => e.id);
    }
  }

  /**
   * Check if event is selected
   */
  isEventSelected(eventId: number): boolean {
    return this.selectedEvents.includes(eventId);
  }

  /**
   * Navigate to create event
   */
  navigateToCreateEvent(): void {
    this.router.navigate(['/admin/create-event']);
  }

  /**
   * Edit event
   */
  editEvent(eventId: number): void {
    this.router.navigate(['/admin/edit-event', eventId]);
  }

  /**
   * View event
   */
  viewEvent(eventId: number): void {
    this.router.navigate(['/events', eventId]);
  }

  /**
   * Manage attendees
   */
  manageAttendees(eventId: number): void {
    this.router.navigate(['/admin/event-attendees', eventId]);
  }

  /**
   * Delete event
   */
  deleteEvent(event: AlumniEvent): void {
    if (!confirm(`Are you sure you want to delete "${event.title}"?`)) return;

    this.eventsService.deleteEvent(event.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.showAlert('success', 'Event deleted successfully');
          this.loadEvents();
          this.loadStatistics();
        }
      },
      error: (error) => {
        console.error('Error deleting event:', error);
        this.showAlert('error', 'Failed to delete event');
      }
    });
  }

  /**
   * Get event status badge class
   */
  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'upcoming': 'bg-green-100 text-green-800',
      'ongoing': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get event icon
   */
  getEventIcon(eventType: string): string {
    const icons: { [key: string]: string } = {
      'Networking': 'fa-users',
      'Workshop': 'fa-laptop',
      'Conference': 'fa-microphone',
      'Social': 'fa-utensils',
      'Fundraiser': 'fa-hand-holding-usd',
      'Webinar': 'fa-video',
      'Career Fair': 'fa-briefcase',
      'Reunion': 'fa-graduation-cap',
      'Sports': 'fa-basketball-ball',
      'Other': 'fa-calendar'
    };
    return icons[eventType] || 'fa-calendar';
  }

  /**
   * Format date
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Format time
   */
  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Get attendance percentage
   */
  getAttendancePercentage(event: AlumniEvent): number {
    if (!event.capacity) return 0;
    return Math.round((event.rsvp_count / event.capacity) * 100);
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