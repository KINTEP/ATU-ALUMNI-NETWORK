// src/app/admin/edit-event/edit-event.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { User } from '../../../models/user';
import { AlumniEvent } from '../../../models/event';
import { EventsService } from '../../../services/events.service';
import { AuthService } from '../../../services/auth.service';
import { UploadService } from '../../../services/upload.service';

@Component({
  selector: 'app-edit-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './edit-event.component.html',
  styleUrl: './edit-event.component.scss'
})
export class EditEventComponent implements OnInit {
  eventForm!: FormGroup;
  currentUser: User | null = null;
  event: AlumniEvent | null = null;
  eventId!: number;

  isLoading = false;
  isSubmitting = false;
  isUploadingImage = false;
  errorMessage = '';
  successMessage = '';

  isPaidEvent = false;
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  existingImage: string | null = null;

  eventTypes = [
    'Networking', 'Workshop', 'Conference', 'Social',
    'Fundraiser', 'Webinar', 'Career Fair', 'Reunion', 'Sports', 'Other'
  ];

  locationTypes = [
    { value: 'In-person', label: 'In-person' },
    { value: 'Virtual', label: 'Virtual' },
    { value: 'Hybrid', label: 'Hybrid' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private eventsService: EventsService,
    private authService: AuthService,
    private uploadService: UploadService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user) this.router.navigate(['/login']);
    });

    this.initializeForm();

    this.route.params.subscribe(params => {
      this.eventId = +params['id'];
      if (this.eventId) {
        this.loadEvent();
      } else {
        this.errorMessage = 'Invalid event ID';
      }
    });
  }

  initializeForm(): void {
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      event_type: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(20)]],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      location: ['', Validators.required],
      location_type: ['', Validators.required],
      venue_name: [''],
      meeting_link: [''],
      capacity: [null, Validators.min(1)],
      registration_deadline: [''],
      is_free: [true],
      ticket_price: [null],
      currency: ['GHS'],
      organizer_name: [''],
      organizer_email: ['', Validators.email],
      organizer_phone: [''],
      tags: [''],
      requirements: [''],
      agenda: [''],
      speakers: [''],
      is_featured: [false],
      is_published: [true],
      category: [''],
      allow_comments: [true],
      require_approval: [false],
      send_notification: [false]
    });

    this.eventForm.get('is_free')?.valueChanges.subscribe(isFree => {
      this.isPaidEvent = !isFree;
      if (isFree) this.eventForm.patchValue({ ticket_price: null });
    });
  }

  loadEvent(): void {
    this.isLoading = true;
    this.eventsService.getEventById(this.eventId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.event = response.data;
          this.populateForm(response.data);
        } else {
          this.errorMessage = 'Event not found';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading event:', error);
        this.errorMessage = 'Failed to load event details';
        this.isLoading = false;
      }
    });
  }

  populateForm(event: AlumniEvent): void {
    this.existingImage = event.event_image || null;
    if (this.existingImage) this.imagePreview = this.existingImage;
    this.isPaidEvent = !event.is_free;

    const formatDateTime = (dateStr: string | null | undefined) => {
      if (!dateStr) return '';
      return new Date(dateStr).toISOString().slice(0, 16);
    };

    const formatDate = (dateStr: string | null | undefined) => {
      if (!dateStr) return '';
      return new Date(dateStr).toISOString().split('T')[0];
    };

    const tags = Array.isArray(event.tags) ? event.tags.join(', ') : event.tags || '';

    this.eventForm.patchValue({
      title: event.title || '',
      event_type: event.event_type || '',
      description: event.description || '',
      start_date: formatDateTime(event.start_date),
      end_date: formatDateTime(event.end_date),
      location: event.location || '',
      location_type: event.location_type || '',
      venue_name: event.venue_name || '',
      meeting_link: event.meeting_link || '',
      capacity: event.capacity || null,
      registration_deadline: formatDate(event.registration_deadline),
      is_free: event.is_free !== undefined ? event.is_free : true,
      ticket_price: event.ticket_price || null,
      currency: event.currency || 'GHS',
      organizer_name: event.organizer_name || '',
      organizer_email: event.organizer_email || '',
      organizer_phone: event.organizer_phone || '',
      tags: tags,
      requirements: event.requirements || '',
      agenda: event.agenda || '',
      speakers: event.speakers || '',
      is_featured: event.is_featured || false,
      is_published: event.is_published !== undefined ? event.is_published : true,
      category: event.category || '',
      allow_comments: event.allow_comments !== undefined ? event.allow_comments : true,
      require_approval: event.require_approval || false,
      send_notification: false
    });
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.errorMessage = 'Please select a valid image file'; return; }
    if (file.size > 10 * 1024 * 1024) { this.errorMessage = 'Image size should not exceed 10MB'; return; }
    this.selectedImage = file;
    const reader = new FileReader();
    reader.onload = () => { this.imagePreview = reader.result as string; };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
    this.existingImage = null;
  }

  triggerFileInput(): void {
    (document.getElementById('imageUpload') as HTMLInputElement)?.click();
  }

  validateDates(): boolean {
    const start = new Date(this.eventForm.value.start_date);
    const end = new Date(this.eventForm.value.end_date);
    if (end <= start) { this.errorMessage = 'End date must be after start date'; return false; }
    return true;
  }

  hasError(fieldName: string, errorType: string = 'required'): boolean {
    const field = this.eventForm.get(fieldName);
    return !!(field?.hasError(errorType) && field?.touched);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => formGroup.get(key)?.markAsTouched());
  }

  saveAsDraft(): void {
    this.submitEvent({ ...this.eventForm.value, is_published: false }, 'Event saved as draft');
  }

  onSubmit(): void {
    this.markFormGroupTouched(this.eventForm);
    this.errorMessage = '';
    if (this.eventForm.invalid) {
      this.errorMessage = 'Please fill in all required fields';
      document.querySelector('.border-red-400')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!this.validateDates()) return;
    this.submitEvent({ ...this.eventForm.value, is_published: true }, 'Event updated successfully');
  }

  private async submitEvent(eventData: any, successMessage: string): Promise<void> {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.errorMessage = '';

    // Strip fields that don't exist in the DB schema to avoid 500 errors
    const allowedFields = [
      'title', 'description', 'event_type', 'category', 'start_date', 'end_date',
      'location', 'location_type', 'venue_name', 'meeting_link', 'event_image',
      'capacity', 'registration_deadline', 'is_free', 'ticket_price', 'currency',
      'organizer_name', 'organizer_email', 'organizer_phone', 'tags',
      'requirements', 'agenda', 'speakers', 'is_featured', 'is_published'
    ];
    const cleanData: any = {};
    allowedFields.forEach(field => {
      if (eventData[field] !== undefined) cleanData[field] = eventData[field];
    });

    try {
      if (this.selectedImage) {
        this.isUploadingImage = true;
        try {
          const uploadResult = await this.uploadService.uploadEventImage(
            this.selectedImage, (this.imagePreview ?? undefined) as any
          ).toPromise();
          if (uploadResult?.url) {
            cleanData.event_image = uploadResult.url;
          } else {
            throw new Error('Failed to get image URL from upload');
          }
        } catch (uploadError) {
          this.errorMessage = 'Failed to upload image. Please try again.';
          this.isSubmitting = false;
          this.isUploadingImage = false;
          return;
        } finally {
          this.isUploadingImage = false;
        }
      } else if (this.existingImage) {
        cleanData.event_image = this.existingImage;
      } else {
        cleanData.event_image = null;
      }

      this.eventsService.updateEvent(this.eventId, cleanData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.successMessage = successMessage;
            setTimeout(() => this.router.navigate(['/admin/events']), 2000);
          } else {
            this.errorMessage = response.error || 'Failed to update event';
          }
          this.isSubmitting = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.error || 'Failed to update event';
          this.isSubmitting = false;
        }
      });
    } catch (error: unknown) {
      this.errorMessage = 'An unexpected error occurred. Please try again.';
      this.isSubmitting = false;
      this.isUploadingImage = false;
    }
  }

  navigateBackToAdminEvents(): void {
    if (this.eventForm.dirty) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        this.router.navigate(['/admin/events']);
      }
    } else {
      this.router.navigate(['/admin/events']);
    }
  }
}