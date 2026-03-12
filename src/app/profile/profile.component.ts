// profile.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { ConnectionService } from '../../services/connection.service';
import { UploadService } from '../../services/upload.service'; // ADD THIS
import { User } from '../../models/user';
import { ApiResponse } from '../../models/api-response';
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  user: User | null = null;
  currentUser: User | null = null;
  loading = true;
  error: string | null = null;
  
  isEditing = false;
  isOwnProfile = false;
  isConnected = false;
  hasPendingRequest = false;
  editForm: Partial<User> = {};
  
  // Image upload
  profilePictureFile: File | null = null;
  profilePicturePreview: string | null = null;
  coverPhotoFile: File | null = null;
  coverPhotoPreview: string | null = null;
  uploadingProfilePicture = false;
  uploadingCoverPhoto = false;
  
  // Unsubscribe subject
  private destroy$ = new Subject<void>();
  
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private connectionService: ConnectionService,
    private uploadService: UploadService, // ADD THIS
    private route: ActivatedRoute,
    private router: Router,
    public imageService: ImageService 
  ) {}
  
  ngOnInit(): void {
    // Get current logged-in user
    this.authService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(loggedInUser => {
      this.currentUser = loggedInUser;
      
      // Check if there's a user ID in the route
      this.route.paramMap.pipe(
        takeUntil(this.destroy$)
      ).subscribe(params => {
        const userId = params.get('id');
        
        if (userId) {
          // Viewing someone else's profile
          this.loadUserProfile(parseInt(userId));
        } else if (loggedInUser) {
          // Viewing own profile (no ID in route)
          this.isOwnProfile = true;
          this.user = loggedInUser;
          this.editForm = { ...loggedInUser };
          this.loading = false;
        } else {
          this.error = 'Please log in to view profiles';
          this.loading = false;
        }
      });
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Load a specific user's profile
   */
  loadUserProfile(userId: number): void {
    this.loading = true;
    this.isOwnProfile = userId === this.currentUser?.id;
    
    this.userService.getUserById(userId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: ApiResponse<User>) => {
        if (response.success && response.data) {
          this.user = response.data;
          this.editForm = { ...response.data };
          
          // Check connection status if not own profile
          if (!this.isOwnProfile && this.currentUser) {
            this.checkConnectionStatus();
          }
        } else {
          this.error = 'User not found';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.error = 'Failed to load profile';
        this.loading = false;
      }
    });
  }
  
  /**
   * Check if connected with this user
   */
  checkConnectionStatus(): void {
    if (!this.currentUser || !this.user) return;
    
    // Check if already connected
    this.connectionService.getMyConnections(1, 100, '').subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.isConnected = response.data.some(conn => conn.user.id === this.user?.id);
        }
      }
    });
    
    // Check if there's a pending request
    this.connectionService.getSentRequests().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.hasPendingRequest = response.data.some(req => req.receiver_id === this.user?.id);
        }
      }
    });
  }
  
  /**
   * Handle profile picture file selection
   */
  onProfilePictureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      
      this.profilePictureFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.profilePicturePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
  
  /**
   * Handle cover photo file selection
   */
  onCoverPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB');
        return;
      }
      
      this.coverPhotoFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.coverPhotoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
  
  /**
   * Upload profile picture to Firebase Storage
   */
  uploadProfilePicture(): void {
    if (!this.profilePictureFile || !this.user?.id) return;
    
    this.uploadingProfilePicture = true;
    
    const oldImageUrl = this.user.profile_picture;
    
    // Use Firebase Storage upload service
    this.uploadService.uploadAndSaveProfilePicture(
      this.user.id, 
      this.profilePictureFile, 
      oldImageUrl
    ).subscribe({
      next: (response) => {
        console.log('Firebase upload response:', response);
        
        if (response.success && response.data) {
          // Update local user object with Firebase Storage URL
          this.user!.profile_picture = response.data.profile_picture;
          this.editForm.profile_picture = response.data.profile_picture;
          this.authService.updateCurrentUser(this.user!);
          
          // Clear the file and preview
          this.profilePictureFile = null;
          this.profilePicturePreview = null;
          
          alert('Profile picture uploaded successfully!');
        } else {
          alert('Failed to upload profile picture');
        }
        this.uploadingProfilePicture = false;
      },
      error: (err) => {
        console.error('Firebase upload error:', err);
        alert(err.message || 'Failed to upload profile picture');
        this.uploadingProfilePicture = false;
      }
    });
  }
  
  /**
   * Upload cover photo to Firebase Storage
   */
  uploadCoverPhoto(): void {
    if (!this.coverPhotoFile || !this.user?.id) return;
    
    this.uploadingCoverPhoto = true;
    
    const oldImageUrl = this.user.cover_photo;
    
    // Use Firebase Storage upload service
    this.uploadService.uploadAndSaveCoverPhoto(
      this.user.id,
      this.coverPhotoFile,
      oldImageUrl
    ).subscribe({
      next: (response) => {
        console.log('Firebase upload response:', response);
        
        if (response.success && response.data) {
          // Update local user object with Firebase Storage URL
          this.user!.cover_photo = response.data.cover_photo;
          this.editForm.cover_photo = response.data.cover_photo;
          this.authService.updateCurrentUser(this.user!);
          
          // Clear the file and preview
          this.coverPhotoFile = null;
          this.coverPhotoPreview = null;
          
          alert('Cover photo uploaded successfully!');
        } else {
          alert('Failed to upload cover photo');
        }
        this.uploadingCoverPhoto = false;
      },
      error: (err) => {
        console.error('Firebase upload error:', err);
        alert(err.message || 'Failed to upload cover photo');
        this.uploadingCoverPhoto = false;
      }
    });
  }
  
  /**
   * Remove profile picture preview
   */
  removeProfilePicturePreview(): void {
    this.profilePictureFile = null;
    this.profilePicturePreview = null;
  }
  
  /**
   * Remove cover photo preview
   */
  removeCoverPhotoPreview(): void {
    this.coverPhotoFile = null;
    this.coverPhotoPreview = null;
  }
  
  getProfilePictureUrl(picturePath: string | null | undefined): string {
    // Show preview if available, otherwise use the stored image
    if (this.profilePicturePreview) {
      return this.profilePicturePreview;
    }
    return this.imageService.getProfilePictureUrl(picturePath, this.getUserFullName());
  }

  /**
   * Check if user has profile picture
   */
  hasProfilePicture(picturePath: string | null | undefined): boolean {
    return this.imageService.hasImage(picturePath) || !!this.profilePicturePreview;
  }

  getCoverPhotoUrl(): string {
    if (this.coverPhotoPreview) {
      return this.coverPhotoPreview;
    }
    return this.imageService.getImageUrl(this.user?.cover_photo) || '';
  }
  
  /**
   * Send connection request
   */
  sendConnectionRequest(): void {
    if (!this.user || !this.currentUser) return;
    
    this.connectionService.sendConnectionRequest(this.user.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.hasPendingRequest = true;
          alert('Connection request sent!');
        }
      },
      error: (err) => {
        console.error('Error sending request:', err);
        alert('Failed to send connection request');
      }
    });
  }
  
  /**
   * Message user
   */
  messageUser(): void {
    if (!this.user) return;
    this.router.navigate(['/messages'], { queryParams: { user: this.user.id } });
  }
  
  /**
   * Go back
   */
  goBack(): void {
    this.router.navigate(['/networks']);
  }
  
  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing && this.user) {
      this.editForm = { ...this.user };
    }
  }
  
  saveProfile(): void {
    if (!this.user?.id) return;
    
    this.userService.updateUser(this.user.id, this.editForm).subscribe({
      next: (response: ApiResponse<User>) => {
        if (response.success && response.data) {
          this.user = response.data;
          this.editForm = { ...response.data };
          this.authService.updateCurrentUser(response.data);
          this.isEditing = false;
          alert('Profile updated successfully!');
        } else {
          alert(response.error || 'Failed to update profile');
        }
      },
      error: (err) => {
        console.error('Update error:', err);
        alert('Failed to update profile');
      }
    });
  }
  
  cancelEdit(): void {
    this.isEditing = false;
    this.profilePictureFile = null;
    this.profilePicturePreview = null;
    this.coverPhotoFile = null;
    this.coverPhotoPreview = null;
  }
  
  getInitials(): string {
    if (!this.user) return '??';
    const first = this.user.first_name?.[0] || '';
    const last = this.user.last_name?.[0] || '';
    return (first + last).toUpperCase();
  }
  
  getUserFullName(): string {
    if (!this.user) return 'User';
    return `${this.user.first_name} ${this.user.last_name}`.trim();
  }
  
  getUserGraduationInfo(): string {
    if (!this.user) return '';
    const program = this.user.program_of_study || 'Alumni';
    const year = this.user.graduation_year;
    return year ? `${program}, ${year}` : program;
  }
}