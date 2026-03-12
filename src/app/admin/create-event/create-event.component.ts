import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { User } from '../../../models/user';
import { EventsService } from '../../../services/events.service';
import { AuthService } from '../../../services/auth.service';
import { UploadService } from '../../../services/upload.service'; // ✅ Add this

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './create-event.component.html',
  styleUrl: './create-event.component.scss'
})
export class CreateEventComponent implements OnInit {
  eventForm!: FormGroup;
  currentUser: User | null = null;
  isSubmitting = false;
  currentStep = 1;
  isPaidEvent = false;
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  isUploadingImage = false; // ✅ Add this

  eventTypes = [
    'Networking',
    'Workshop',
    'Conference',
    'Social',
    'Fundraiser',
    'Webinar',
    'Career Fair',
    'Reunion',
    'Sports',
    'Other'
  ];

  locationTypes = [
    { value: 'In-person', label: 'In-person' },
    { value: 'Virtual', label: 'Virtual' },
    { value: 'Hybrid', label: 'Hybrid' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private eventsService: EventsService,
    private authService: AuthService,
    private uploadService: UploadService // ✅ Add this
  ) {}

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user) {
        this.router.navigate(['/login']);
      }
    });

    // Initialize form
    this.initializeForm();
  }

  /**
   * Initialize the form
   */
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
      send_notification: [true]
    });

    // Watch for pricing changes
    this.eventForm.get('is_free')?.valueChanges.subscribe(isFree => {
      this.isPaidEvent = !isFree;
      if (isFree) {
        this.eventForm.patchValue({ ticket_price: null });
      }
    });
  }

  /**
   * Handle image selection
   */
  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.showAlert('error', 'Please select a valid image file');
        return;
      }

      // Validate file size (10MB max for events)
      if (file.size > 10 * 1024 * 1024) {
        this.showAlert('error', 'Image size should not exceed 10MB');
        return;
      }

      this.selectedImage = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Remove selected image
   */
  removeImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
  }

  /**
   * Validate date range
   */
  validateDates(): boolean {
    const startDate = new Date(this.eventForm.value.start_date);
    const endDate = new Date(this.eventForm.value.end_date);

    if (endDate <= startDate) {
      this.showAlert('error', 'End date must be after start date');
      return false;
    }

    return true;
  }

  /**
   * Save as draft
   */
  saveAsDraft(): void {
    if (!this.eventForm.get('title')?.value) {
      this.showAlert('error', 'Please enter an event title');
      return;
    }

    const formData = {
      ...this.eventForm.value,
      created_by: this.currentUser?.id,
      is_published: false
    };

    this.submitEvent(formData, 'Event saved as draft', false);
  }

  /**
   * Submit form
   */
  onSubmit(): void {
    // Mark all fields as touched to show validation errors
    this.markFormGroupTouched(this.eventForm);

    if (this.eventForm.invalid) {
      this.showAlert('error', 'Please fill in all required fields');
      // Scroll to first error
      const firstError = document.querySelector('.border-red-500');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (!this.validateDates()) {
      return;
    }

    if (!this.currentUser) {
      this.showAlert('error', 'User not authenticated');
      return;
    }

    const formData = {
      ...this.eventForm.value,
      created_by: this.currentUser.id,
      is_published: true
    };

    this.submitEvent(formData, 'Event published successfully', true);
  }

  /**
   * Submit event to backend
   */
  private async submitEvent(eventData: any, successMessage: string, isPublished: boolean): Promise<void> {
    if (this.isSubmitting) return;

    this.isSubmitting = true;

    try {
      // ✅ Step 1: Upload image to Firebase Storage if selected
      if (this.selectedImage) {
        this.isUploadingImage = true;
        
        try {
          const uploadResult = await this.uploadService.uploadEventImage(
            this.selectedImage,
            this.imagePreview || undefined
          ).toPromise();

          if (uploadResult?.url) {
            eventData.event_image = uploadResult.url;
          } else {
            throw new Error('Failed to get image URL from upload');
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          this.showAlert('error', 'Failed to upload image. Please try again.');
          this.isSubmitting = false;
          this.isUploadingImage = false;
          return;
        } finally {
          this.isUploadingImage = false;
        }
      }

      // ✅ Step 2: Create event with image URL
      this.eventsService.createEvent(eventData).subscribe({
        next: (response) => {
          if (response.success) {
            this.showAlert('success', successMessage);
            
            // Navigate back after delay
            setTimeout(() => {
              this.router.navigate(['/adminEvents']);
            }, 2000);
          } else {
            this.showAlert('error', response.error || 'Failed to create event');
          }
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error creating event:', error);
          const errorMessage = error.error?.error || error.message || 'Failed to create event';
          this.showAlert('error', errorMessage);
          this.isSubmitting = false;
        }
      });

    } catch (error: any) {
      console.error('Unexpected error:', error);
      this.showAlert('error', 'An unexpected error occurred. Please try again.');
      this.isSubmitting = false;
      this.isUploadingImage = false;
    }
  }

  /**
   * Mark all fields as touched to show validation errors
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Check if field has error
   */
  hasError(fieldName: string, errorType: string = 'required'): boolean {
    const field = this.eventForm.get(fieldName);
    return !!(field?.hasError(errorType) && field?.touched);
  }

  /**
   * Navigate back
   */
  navigateBackToAdminEvents(): void {
    if (this.eventForm.dirty) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        this.router.navigate(['/adminEvents']);
      }
    } else {
      this.router.navigate(['/adminEvents']);
    }
  }

  /**
   * Show alert message
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

  /**
   * Trigger file input click
   */
  triggerFileInput(): void {
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    fileInput?.click();
  }
}