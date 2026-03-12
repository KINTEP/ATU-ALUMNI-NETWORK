// src/app/event-details/event-details.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { User } from '../../models/user';
import { AlumniEvent, EventComment } from '../../models/event';
import { EventsService } from '../../services/events.service';
import { AuthService } from '../../services/auth.service';
import { ImageService } from '../../services/image.service';


@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './event-details.component.html',
  styleUrl: './event-details.component.scss'
})
export class EventDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Current user
  currentUser: User | null = null;

  // Event data
  event: AlumniEvent | null = null;
  eventId!: number;

  // Comments
  comments: EventComment[] = [];
  newComment = '';
  replyingTo: number | null = null;
  replyTexts: { [commentId: number]: string } = {};
  commentReplies: { [commentId: number]: EventComment[] } = {};

  // RSVP
  userRsvpStatus: 'going' | 'maybe' | 'not_going' | null = null;
  showRsvpModal = false;
  rsvpForm = {
    status: 'going' as 'going' | 'maybe' | 'not_going',
    guests_count: 0,
    notes: ''
  };

  // Loading states
  isLoadingEvent = false;
  isLoadingComments = false;
  isSubmittingComment = false;
  isSubmittingRsvp = false;

  // Messages
  successMessage = '';
  errorMessage = '';

  // Comment pagination
  commentsPage = 1;
  commentsLimit = 50;
  totalComments = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private eventsService: EventsService,
    private authService: AuthService,
    private imageService: ImageService
  ) {}

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
    });

    // Get event ID from route
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.eventId = +params['id'];
      if (this.eventId) {
        this.loadEvent();
        this.loadComments();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load event details
   */
  loadEvent(): void {
    this.isLoadingEvent = true;
    this.errorMessage = '';

    this.eventsService.getEventById(this.eventId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.event = response.data;
            // Increment view count
            this.incrementViewCount();
            // Note: RSVP status would need to be fetched separately
            // or included in the event response from backend
            this.checkUserRsvpStatus();
          }
          this.isLoadingEvent = false;
        },
        error: (error) => {
          console.error('Error loading event:', error);
          this.errorMessage = 'Failed to load event details';
          this.isLoadingEvent = false;
        }
      });
  }

  /**
   * Check user RSVP status
   */
  checkUserRsvpStatus(): void {
    if (!this.currentUser || !this.eventId) return;

    // Get user's events to check if they've RSVP'd
    this.eventsService.getMyEvents(this.currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const rsvpedEvent = response.data.find(e => e.id === this.eventId);
            if (rsvpedEvent) {
              // Backend should include RSVP status in the event data
              // For now, we'll assume they're "going" if event is found
              this.userRsvpStatus = 'going';
            }
          }
        },
        error: (error) => {
          console.error('Error checking RSVP status:', error);
        }
      });
  }

  /**
   * Increment view count
   */
  incrementViewCount(): void {
    if (this.eventId) {
      this.eventsService.incrementViewCount(this.eventId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // View count updated
          },
          error: (error) => {
            console.error('Error incrementing view count:', error);
          }
        });
    }
  }

  /**
   * Load comments
   */
  loadComments(): void {
    this.isLoadingComments = true;

    this.eventsService.getEventComments(this.eventId, this.commentsPage, this.commentsLimit)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.comments = response.data;
            this.totalComments = response.total || 0;
          }
          this.isLoadingComments = false;
        },
        error: (error) => {
          console.error('Error loading comments:', error);
          this.isLoadingComments = false;
        }
      });
  }

  /**
   * Add comment
   */
  addComment(): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    const comment = this.newComment.trim();
    if (!comment) {
      this.showError('Please enter a comment');
      return;
    }

    this.isSubmittingComment = true;

    this.eventsService.addComment(this.eventId, {
      user_id: this.currentUser.id,
      comment: comment
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Add new comment to the beginning of the list
          this.comments.unshift(response.data);
          this.newComment = '';
          this.showSuccess('Comment added successfully');
          // Reload comments to get updated list
          this.loadComments();
        }
        this.isSubmittingComment = false;
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        this.showError('Failed to add comment');
        this.isSubmittingComment = false;
      }
    });
  }

  /**
   * Reply to comment
   */
  replyToComment(commentId: number): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    const reply = this.replyTexts[commentId]?.trim();
    if (!reply) {
      this.showError('Please enter a reply');
      return;
    }

    this.eventsService.replyToComment(this.eventId, commentId, {
      user_id: this.currentUser.id,
      comment: reply
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Add reply to local replies list
          if (!this.commentReplies[commentId]) {
            this.commentReplies[commentId] = [];
          }
          this.commentReplies[commentId].push(response.data);
          
          // Update reply count
          const parentComment = this.comments.find(c => c.id === commentId);
          if (parentComment) {
            parentComment.reply_count = (parentComment.reply_count || 0) + 1;
          }
          
          this.replyTexts[commentId] = '';
          this.replyingTo = null;
          this.showSuccess('Reply added successfully');
        }
      },
      error: (error) => {
        console.error('Error adding reply:', error);
        this.showError('Failed to add reply');
      }
    });
  }

  /**
   * Load replies for a comment
   */
  loadCommentReplies(commentId: number): void {
    if (this.commentReplies[commentId]) return; // Already loaded

    this.eventsService.getCommentReplies(this.eventId, commentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.commentReplies[commentId] = response.data;
          }
        },
        error: (error) => {
          console.error('Error loading replies:', error);
        }
      });
  }

  /**
   * Get replies for a comment
   */
  getCommentReplies(commentId: number): EventComment[] {
    return this.commentReplies[commentId] || [];
  }

  /**
   * Toggle reply form
   */
  toggleReply(commentId: number): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    this.replyingTo = this.replyingTo === commentId ? null : commentId;
  }

  /**
   * Like comment
   */
  likeComment(comment: EventComment, event: Event): void {
    event.stopPropagation();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    const action = comment.user_has_liked
      ? this.eventsService.unlikeComment(this.eventId, comment.id, this.currentUser.id)
      : this.eventsService.likeComment(this.eventId, comment.id, this.currentUser.id);

    action.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        if (response.success) {
          comment.user_has_liked = !comment.user_has_liked;
          comment.likes_count = comment.user_has_liked 
            ? (comment.likes_count || 0) + 1 
            : Math.max((comment.likes_count || 0) - 1, 0);
        }
      },
      error: (error) => {
        console.error('Error toggling like:', error);
      }
    });
  }

  /**
   * Delete comment
   */
  deleteComment(comment: EventComment): void {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    if (!this.currentUser) {
      return;
    }

    this.eventsService.deleteComment(this.eventId, comment.id, this.currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Remove comment from list
            this.comments = this.comments.filter(c => c.id !== comment.id);
            this.showSuccess('Comment deleted successfully');
            // Reload to get accurate count
            this.loadComments();
          }
        },
        error: (error) => {
          console.error('Error deleting comment:', error);
          this.showError('Failed to delete comment');
        }
      });
  }

  /**
   * Check if user can delete comment
   */
  canDeleteComment(comment: EventComment): boolean {
    if (!this.currentUser) return false;
    return comment.user_id === this.currentUser.id || this.currentUser.role === 'admin';
  }

  /**
   * Open RSVP modal
   */
  openRsvpModal(): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    // Pre-fill form if user already RSVP'd
    if (this.userRsvpStatus) {
      this.rsvpForm.status = this.userRsvpStatus;
    }

    this.showRsvpModal = true;
  }

  /**
   * Close RSVP modal
   */
  closeRsvpModal(): void {
    this.showRsvpModal = false;
    this.rsvpForm = {
      status: 'going',
      guests_count: 0,
      notes: ''
    };
  }

  /**
   * Submit RSVP
   */
  submitRsvp(): void {
    if (!this.currentUser) return;

    this.isSubmittingRsvp = true;

    const data = {
      user_id: this.currentUser.id,
      ...this.rsvpForm
    };

    const action = this.userRsvpStatus
      ? this.eventsService.updateRsvp(this.eventId, data)
      : this.eventsService.rsvpToEvent(this.eventId, data);

    action.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        if (response.success) {
          this.userRsvpStatus = this.rsvpForm.status;
          this.showSuccess('RSVP updated successfully');
          this.closeRsvpModal();
          // Reload event to get updated RSVP count
          this.loadEvent();
        }
        this.isSubmittingRsvp = false;
      },
      error: (error) => {
        console.error('Error submitting RSVP:', error);
        this.showError('Failed to RSVP');
        this.isSubmittingRsvp = false;
      }
    });
  }

  /**
   * Cancel RSVP
   */
  cancelRsvp(): void {
    if (!this.currentUser || !confirm('Are you sure you want to cancel your RSVP?')) {
      return;
    }

    this.eventsService.cancelRsvp(this.eventId, this.currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.userRsvpStatus = null;
            this.showSuccess('RSVP cancelled successfully');
            // Reload event to get updated RSVP count
            this.loadEvent();
          }
        },
        error: (error) => {
          console.error('Error cancelling RSVP:', error);
          this.showError('Failed to cancel RSVP');
        }
      });
  }

  /**
   * Get RSVP button text
   */
  getRsvpButtonText(): string {
    if (!this.userRsvpStatus) return 'RSVP Now';
    
    const statusText = {
      'going': 'Going',
      'maybe': 'Maybe',
      'not_going': 'Not Going'
    };

    return statusText[this.userRsvpStatus] || 'Update RSVP';
  }

  /**
   * Get RSVP button class
   */
  getRsvpButtonClass(): string {
    if (!this.userRsvpStatus) {
      return 'bg-primary hover:bg-opacity-90';
    }

    const statusClasses = {
      'going': 'bg-green-600 hover:bg-green-700',
      'maybe': 'bg-yellow-600 hover:bg-yellow-700',
      'not_going': 'bg-red-600 hover:bg-red-700'
    };

    return statusClasses[this.userRsvpStatus] || 'bg-primary hover:bg-opacity-90';
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
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
  getTimeRange(): string {
    if (!this.event) return '';
    
    const startTime = this.formatTime(this.event.start_date);
    const endTime = this.formatTime(this.event.end_date);
    
    const startDate = new Date(this.event.start_date);
    const endDate = new Date(this.event.end_date);
    
    if (startDate.toDateString() === endDate.toDateString()) {
      return `${startTime} - ${endTime}`;
    }
    
    return `${this.formatDate(this.event.start_date)} ${startTime} - ${this.formatDate(this.event.end_date)} ${endTime}`;
  }

  /**
   * Get time ago
   */
  getTimeAgo(dateString: string): string {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return past.toLocaleDateString();
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
   * Check if event is past
   */
  isEventPast(): boolean {
    if (!this.event) return false;
    return new Date(this.event.end_date) < new Date();
  }

  /**
   * Check if event is today
   */
  isEventToday(): boolean {
    if (!this.event) return false;
    const today = new Date().toDateString();
    const eventDate = new Date(this.event.start_date).toDateString();
    return today === eventDate;
  }

  /**
   * Share event
   */
  shareEvent(): void {
    if (navigator.share && this.event) {
      navigator.share({
        title: this.event.title,
        text: this.event.description,
        url: window.location.href
      }).catch(error => console.log('Error sharing:', error));
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.showSuccess('Link copied to clipboard');
      });
    }
  }

  /**
   * Go back to events
   */
  goBackToEvents(): void {
    this.router.navigate(['/events']);
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 3000);
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = '', 3000);
  }


    getProfilePictureUrl(picturePath: string | null | undefined): string {
    return this.imageService.getProfilePictureUrl(picturePath);
  }

  /**
   * Check if user has profile picture
   */
  hasProfilePicture(picturePath: string | null | undefined): boolean {
    return this.imageService.hasImage(picturePath);
  }

  /**
   * Get event image URL
   */
  getEventImageUrl(imagePath: string | null | undefined): string {
    return this.imageService.getEventImageUrl(imagePath);
  }

}