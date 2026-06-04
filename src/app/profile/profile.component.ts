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
import { UploadService } from '../../services/upload.service';
import { User } from '../../models/user';
import { ApiResponse } from '../../models/api-response';
import { ImageService } from '../../services/image.service';
import {
  PROGRAMME_LEVELS, PROGRAMMES, FACULTIES, DEPARTMENTS,
  ProgrammeLevel, Programme, Faculty, Department
} from '../open-register/programme-data';

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

  // Programme dropdowns
  readonly programLevels: ProgrammeLevel[] = PROGRAMME_LEVELS;
  readonly faculties: Faculty[] = FACULTIES;
  readonly departments: Department[] = DEPARTMENTS;
  editLevel = '';
  editFilteredPrograms: Programme[] = PROGRAMMES;
  editFilteredDepartments: Department[] = [];

  // Image upload
  profilePictureFile: File | null = null;
  profilePicturePreview: string | null = null;
  coverPhotoFile: File | null = null;
  coverPhotoPreview: string | null = null;
  uploadingProfilePicture = false;
  uploadingCoverPhoto = false;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private connectionService: ConnectionService,
    private uploadService: UploadService,
    private route: ActivatedRoute,
    private router: Router,
    public imageService: ImageService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(loggedInUser => {
      this.currentUser = loggedInUser;
      this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
        const userId = params.get('id');
        if (userId) {
          this.loadUserProfile(parseInt(userId));
        } else if (loggedInUser) {
          this.isOwnProfile = true;
          this.user = loggedInUser;
          this.editForm = { ...loggedInUser };
          this.initEditSelects();
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

  loadUserProfile(userId: number): void {
    this.loading = true;
    this.isOwnProfile = userId === this.currentUser?.id;

    this.userService.getUserById(userId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: ApiResponse<User>) => {
        if (response.success && response.data) {
          this.user = response.data;
          this.editForm = { ...response.data };
          this.initEditSelects();
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

  // ── Dropdown helpers ─────────────────────────────────────────────────────

  /**
   * On entering edit mode, pre-select level/faculty/department
   * based on what's already saved in the user's profile.
   */
  initEditSelects(): void {
    const currentProgram = this.editForm.program_of_study;
    const currentFaculty = this.editForm.faculty;

    // Pre-select level from saved programme
    if (currentProgram && !this.isNumeric(currentProgram)) {
      const match = PROGRAMMES.find(
        p => p.name.toLowerCase() === currentProgram.toLowerCase()
      );
      this.editLevel = match?.level ?? '';
      this.editFilteredPrograms = this.editLevel
        ? PROGRAMMES.filter(p => p.level === this.editLevel)
        : PROGRAMMES;
    } else {
      this.editLevel = '';
      this.editFilteredPrograms = PROGRAMMES;
      // Clear the bad numeric value
      if (currentProgram && this.isNumeric(currentProgram)) {
        this.editForm.program_of_study = '';
      }
    }

    // Pre-populate departments from saved faculty
    if (currentFaculty) {
      this.editFilteredDepartments = DEPARTMENTS.filter(d => d.faculty === currentFaculty);
    } else {
      this.editFilteredDepartments = [];
    }
  }

  onEditLevelChange(levelCode: string): void {
    this.editLevel = levelCode;
    this.editForm.program_of_study = '';
    this.editFilteredPrograms = levelCode
      ? PROGRAMMES.filter(p => p.level === levelCode)
      : PROGRAMMES;
  }

  onEditProgrammeChange(programmeName: string): void {
    this.editForm.program_of_study = programmeName;
    if (!programmeName) return;

    const match = PROGRAMMES.find(p => p.name === programmeName);
    if (match) {
      this.editForm.faculty    = match.faculty;
      this.editForm.department = match.department;
      this.editFilteredDepartments = DEPARTMENTS.filter(d => d.faculty === match.faculty);
    }
  }

  onEditFacultyChange(facultyName: string): void {
    this.editForm.faculty = facultyName;
    this.editForm.department = '';
    this.editFilteredDepartments = facultyName
      ? DEPARTMENTS.filter(d => d.faculty === facultyName)
      : [];
  }

  /** Returns true if a string is purely numeric (bad old ID data) */
  isNumeric(value: string | null | undefined): boolean {
    if (!value) return false;
    return /^\d+$/.test(value.trim());
  }

  /** Safe display for programme — hides numeric IDs */
  safeProgram(value: string | null | undefined): string {
    if (!value || this.isNumeric(value)) return '';
    return value;
  }

  checkConnectionStatus(): void {
    if (!this.currentUser || !this.user) return;
    this.connectionService.getMyConnections(1, 100, '').subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.isConnected = response.data.some(conn => conn.user.id === this.user?.id);
        }
      }
    });
    this.connectionService.getSentRequests().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.hasPendingRequest = response.data.some(req => req.receiver_id === this.user?.id);
        }
      }
    });
  }

  // ── Image handling ────────────────────────────────────────────────────────

  onProfilePictureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Image size must be less than 5MB'); return; }
    this.profilePictureFile = file;
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.profilePicturePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  onCoverPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('Image size must be less than 10MB'); return; }
    this.coverPhotoFile = file;
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.coverPhotoPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    this.uploadCoverPhoto();
  }

  uploadProfilePicture(): void {
    if (!this.profilePictureFile || !this.user?.id) return;
    this.uploadingProfilePicture = true;
    this.uploadService.uploadAndSaveProfilePicture(
      this.user.id, this.profilePictureFile, this.user.profile_picture
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.user!.profile_picture = response.data.profile_picture;
          this.editForm.profile_picture = response.data.profile_picture;
          this.authService.updateCurrentUser(this.user!);
          this.profilePictureFile = null;
          this.profilePicturePreview = null;
          alert('Profile picture updated successfully!');
        } else { alert('Failed to upload profile picture'); }
        this.uploadingProfilePicture = false;
      },
      error: (err) => {
        alert(err.message || 'Failed to upload profile picture');
        this.uploadingProfilePicture = false;
      }
    });
  }

  uploadCoverPhoto(): void {
    if (!this.coverPhotoFile || !this.user?.id) return;
    this.uploadingCoverPhoto = true;
    this.uploadService.uploadAndSaveCoverPhoto(
      this.user.id, this.coverPhotoFile, this.user.cover_photo
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.user!.cover_photo = response.data.cover_photo;
          this.editForm.cover_photo = response.data.cover_photo;
          this.authService.updateCurrentUser(this.user!);
          this.coverPhotoFile = null;
          this.coverPhotoPreview = null;
          alert('Cover photo updated successfully!');
        } else { alert('Failed to upload cover photo'); }
        this.uploadingCoverPhoto = false;
      },
      error: (err) => {
        alert(err.message || 'Failed to upload cover photo');
        this.uploadingCoverPhoto = false;
      }
    });
  }

  removeProfilePicturePreview(): void { this.profilePictureFile = null; this.profilePicturePreview = null; }
  removeCoverPhotoPreview(): void { this.coverPhotoFile = null; this.coverPhotoPreview = null; }

  getProfilePictureUrl(picturePath: string | null | undefined): string {
    if (this.profilePicturePreview) return this.profilePicturePreview;
    return this.imageService.getProfilePictureUrl(picturePath, this.getUserFullName());
  }

  getCoverPhotoUrl(): string {
    if (this.coverPhotoPreview) return this.coverPhotoPreview;
    return this.imageService.getImageUrl(this.user?.cover_photo) || '';
  }

  hasProfilePicture(picturePath: string | null | undefined): boolean {
    return this.imageService.hasImage(picturePath) || !!this.profilePicturePreview;
  }

  // ── Profile actions ───────────────────────────────────────────────────────

  sendConnectionRequest(): void {
    if (!this.user || !this.currentUser) return;
    this.connectionService.sendConnectionRequest(this.user.id).subscribe({
      next: (response) => { if (response.success) { this.hasPendingRequest = true; alert('Connection request sent!'); } },
      error: () => alert('Failed to send connection request')
    });
  }

  messageUser(): void {
    if (!this.user) return;
    this.router.navigate(['/messages'], { queryParams: { user: this.user.id } });
  }

  goBack(): void { this.router.navigate(['/networks']); }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing && this.user) {
      this.editForm = { ...this.user };
      this.initEditSelects();
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
          alert((response as any).error || 'Failed to update profile');
        }
      },
      error: () => alert('Failed to update profile')
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.profilePictureFile = null;
    this.profilePicturePreview = null;
    this.coverPhotoFile = null;
    this.coverPhotoPreview = null;
    if (this.user) { this.editForm = { ...this.user }; this.initEditSelects(); }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getInitials(): string {
    if (!this.user) return '??';
    return ((this.user.first_name?.[0] || '') + (this.user.last_name?.[0] || '')).toUpperCase();
  }

  getUserFullName(): string {
    if (!this.user) return 'User';
    return `${this.user.first_name} ${this.user.last_name}`.trim();
  }

  getUserGraduationInfo(): string {
    if (!this.user) return '';
    const program = this.safeProgram(this.user.program_of_study) || 'Alumni';
    const year = this.user.graduation_year;
    return year ? `${program} · Class of ${year}` : program;
  }
}