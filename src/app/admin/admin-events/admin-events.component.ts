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
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadEvents();
        this.loadStatistics();
      }
    });
  }

  /**
   * Compute the real status from event dates, ignoring the DB status field.
   */
  getComputedStatus(event: AlumniEvent): string {
    if (event.status === 'cancelled') return 'cancelled';

    const now = new Date();

    const start = event.start_date ? new Date(event.start_date) : null;
    // Use end_date if available and valid, otherwise fall back to start_date
    const endRaw = event.end_date || event.start_date;
    const end = endRaw ? new Date(endRaw) : null;

    if (!start || !end) return event.status || 'upcoming';

    if (now > end) return 'completed';
    if (now >= start && now <= end) return 'ongoing';
    return 'upcoming';
  }

  loadEvents(): void {
    this.isLoading = true;

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };

    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedType !== 'all') params.event_type = this.selectedType;
    // Don't pass status to API — we compute it client-side

    this.eventsService.getAllEvents(params).subscribe({
      next: (response: ApiResponse<AlumniEvent[]>) => {
        if (response.success && response.data) {
          this.events = response.data;
          // DEBUG: remove after confirming dates are correct
          console.log('Sample event dates:', this.events.slice(0, 3).map(e => ({
            title: e.title,
            start_date: e.start_date,
            end_date: e.end_date,
            status: e.status,
            computed: this.getComputedStatus(e)
          })));
          this.totalEvents = response.total || 0;
          this.totalPages = Math.ceil(this.totalEvents / this.pageSize);
          this.computeStats();
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
   * Compute stats client-side from actual dates
   */
  computeStats(): void {
    const statuses = this.events.map(e => this.getComputedStatus(e));
    this.stats.total = this.events.length;
    this.stats.upcoming = statuses.filter(s => s === 'upcoming').length;
    this.stats.ongoing = statuses.filter(s => s === 'ongoing').length;
    this.stats.past = statuses.filter(s => s === 'completed').length;
    this.stats.totalAttendees = this.events.reduce((sum, e) => sum + (e.rsvp_count || 0), 0);
    this.stats.avgAttendance = this.events.reduce((sum, e) => {
      return sum + (e.capacity ? Math.round((e.rsvp_count / e.capacity) * 100) : 0);
    }, 0) / (this.events.length || 1);
  }

  loadStatistics(): void {
    // Stats are now computed client-side in computeStats().
    // Keep this call if the API provides additional data (e.g. totalAttendees across all pages).
    this.eventsService.getEventStats().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const data = response.data;
          // Only override totalAttendees from the API (it covers all pages)
          this.stats.totalAttendees = data.total_rsvps || this.stats.totalAttendees;
          this.stats.avgAttendance = parseFloat(data.avg_attendance_rate || this.stats.avgAttendance);
        }
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
      }
    });
  }

  /**
   * Filter by tab using computed status
   */
  filterEventsByTab(): void {
    let filtered = this.events;

    // Apply tab filter
    if (this.currentTab !== 'all') {
      const tabMap: { [key: string]: string } = {
        'upcoming': 'upcoming',
        'ongoing': 'ongoing',
        'past': 'completed'
      };
      const targetStatus = tabMap[this.currentTab];
      if (targetStatus) {
        filtered = filtered.filter(e => this.getComputedStatus(e) === targetStatus);
      }
    }

    // Apply status dropdown filter
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(e => this.getComputedStatus(e) === this.selectedStatus);
    }

    this.filteredEvents = filtered;
  }

  changeTab(tab: string): void {
    this.currentTab = tab;
    this.currentPage = 1;
    this.filterEventsByTab();
  }

  searchEvents(): void {
    this.currentPage = 1;
    this.loadEvents();
  }

  filterByType(type: string): void {
    this.selectedType = type;
    this.currentPage = 1;
    this.loadEvents();
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.filterEventsByTab(); // filter client-side, no API call needed
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadEvents();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  toggleEventSelection(eventId: number, event: Event): void {
    event.stopPropagation();
    const index = this.selectedEvents.indexOf(eventId);
    if (index > -1) {
      this.selectedEvents.splice(index, 1);
    } else {
      this.selectedEvents.push(eventId);
    }
  }

  toggleSelectAll(event: Event): void {
    event.stopPropagation();
    if (this.selectedEvents.length === this.filteredEvents.length) {
      this.selectedEvents = [];
    } else {
      this.selectedEvents = this.filteredEvents.map(e => e.id);
    }
  }

  isEventSelected(eventId: number): boolean {
    return this.selectedEvents.includes(eventId);
  }

  navigateToCreateEvent(): void {
    this.router.navigate(['/admin/create-event']);
  }

  editEvent(eventId: number): void {
    this.router.navigate(['/admin/edit-event', eventId]);
  }

  viewEvent(eventId: number): void {
    this.router.navigate(['/events', eventId]);
  }

  manageAttendees(eventId: number): void {
    this.router.navigate(['/admin/event-attendees', eventId]);
  }

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
   * Use computed status for badge class — not the DB field
   */
  getStatusClass(event: AlumniEvent): string {
    const status = this.getComputedStatus(event);
    const classes: { [key: string]: string } = {
      'upcoming': 'bg-green-100 text-green-700',
      'ongoing': 'bg-yellow-100 text-yellow-700',
      'completed': 'bg-gray-100 text-gray-600',
      'cancelled': 'bg-red-100 text-red-700'
    };
    return classes[status] || 'bg-gray-100 text-gray-600';
  }

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

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  getAttendancePercentage(event: AlumniEvent): number {
    if (!event.capacity) return 0;
    return Math.round((event.rsvp_count / event.capacity) * 100);
  }

  showAlert(type: 'success' | 'error', message: string): void {
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
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