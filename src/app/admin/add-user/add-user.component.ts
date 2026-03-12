// src/app/admin/add-user/add-user.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { UserService } from '../../../services/user.service';
import { CreateUserRequest } from '../../../models/user';
import { AcademicService, DropdownData } from '../../../services/academic.service';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss']
})
export class AddUserComponent implements OnInit {
  userForm!: FormGroup;
  dropdownData: DropdownData | null = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  currentStep = 1;

  // Graduation years
  graduationYears: number[] = [];

  // Countries
  countries = [
    { value: 'ghana', label: 'Ghana' },
    { value: 'nigeria', label: 'Nigeria' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'usa', label: 'United States' },
    { value: 'canada', label: 'Canada' },
    { value: 'other', label: 'Other' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService,
    private academicService: AcademicService
  ) {
    // Generate graduation years (current year to 30 years ago)
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 30; i--) {
      this.graduationYears.push(i);
    }
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadDropdownData();
  }

  initializeForm(): void {
    this.userForm = this.fb.group({
      // Basic Information (Required)
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone_number: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      role: ['alumni', Validators.required],
      
      // Academic Information
      faculty: [''],
      department: [''],
      program_of_study: [''],
      graduation_year: [''],
      student_id: [''],
      
      // Professional Information
      job_title: [''],
      current_company: [''],
      
      // Location Information
      current_city: [''],
      current_country: ['ghana'],
      
      // Settings
      email_verified: [true],
      is_active: [true],
      send_welcome_email: [true],
      add_to_mailing_list: [true]
    }, { validators: this.passwordMatchValidator });
  }

  /**
   * Custom validator to check if passwords match
   */
  passwordMatchValidator(group: FormGroup): {[key: string]: boolean} | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  /**
   * Load dropdown data from API
   */
  loadDropdownData(): void {
    this.academicService.getDropdownData().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.dropdownData = response.data;
        }
      },
      error: (error) => {
        console.error('Failed to load dropdown data:', error);
        this.errorMessage = 'Failed to load form data. Please refresh the page.';
      }
    });
  }

  /**
   * Handle faculty selection change
   */
  onFacultyChange(event: Event): void {
    const facultyId = (event.target as HTMLSelectElement).value;
    if (facultyId && this.dropdownData) {
      // Filter departments by faculty
      const filteredDepartments = this.dropdownData.departments.filter(
        dept => dept.faculty_id === parseInt(facultyId)
      );
      // You can update a separate filteredDepartments array if needed
    }
    
    // Reset department and program when faculty changes
    this.userForm.patchValue({
      department: '',
      program_of_study: ''
    });
  }

  /**
   * Handle department selection change
   */
  onDepartmentChange(event: Event): void {
    const departmentId = (event.target as HTMLSelectElement).value;
    if (departmentId && this.dropdownData) {
      // Filter programs by department
      const filteredPrograms = this.dropdownData.programs.filter(
        prog => prog.department_id === parseInt(departmentId)
      );
      // You can update a separate filteredPrograms array if needed
    }
    
    // Reset program when department changes
    this.userForm.patchValue({
      program_of_study: ''
    });
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Please select an image file';
        return;
      }
      
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        this.errorMessage = 'File size must be less than 2MB';
        return;
      }
      
      this.selectedFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(): Promise<string | null> {
    if (!this.selectedFile) return null;
    
    try {
      const response = await this.userService.uploadProfilePicture(this.selectedFile).toPromise();
      if (response?.success && response.data) {
        return response.data.url;
      }
    } catch (error) {
      console.error('Profile picture upload failed:', error);
    }
    
    return null;
  }

  /**
   * Submit form
   */
  async onSubmit(): Promise<void> {
    // Mark all fields as touched to show validation errors
    this.markFormGroupTouched(this.userForm);
    
    if (this.userForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    try {
      // Upload profile picture if selected
      let profilePictureUrl: string | null = null;
      if (this.selectedFile) {
        profilePictureUrl = await this.uploadProfilePicture();
      }
      
      // Prepare user data
      const formValue = this.userForm.value;
      const userData: CreateUserRequest = {
        email: formValue.email,
        password: formValue.password,
        first_name: formValue.first_name,
        last_name: formValue.last_name,
        other_name: formValue.other_name || undefined,
        phone_number: formValue.phone_number || undefined,
        role: formValue.role,
        faculty: formValue.faculty || undefined,
        department: formValue.department || undefined,
        program_of_study: formValue.program_of_study || undefined,
        graduation_year: formValue.graduation_year ? parseInt(formValue.graduation_year) : undefined,
        student_id: formValue.student_id || undefined,
        current_company: formValue.current_company || undefined,
        job_title: formValue.job_title || undefined,
        current_city: formValue.current_city || undefined,
        current_country: formValue.current_country || undefined,
        email_verified: formValue.email_verified,
        is_active: formValue.is_active,
        send_welcome_email: formValue.send_welcome_email,
        add_to_mailing_list: formValue.add_to_mailing_list
      };
      
      // Create user
      this.userService.createUser(userData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.successMessage = 'User created successfully!';
            setTimeout(() => {
              this.router.navigate(['/users']);
            }, 2000);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.error || 'Failed to create user. Please try again.';
          console.error('Create user error:', error);
        }
      });
      
    } catch (error) {
      this.isLoading = false;
      this.errorMessage = 'An unexpected error occurred. Please try again.';
      console.error('Form submission error:', error);
    }
  }

  /**
   * Save as draft (store in localStorage)
   */
  saveAsDraft(): void {
    const draftData = this.userForm.value;
    localStorage.setItem('user_draft', JSON.stringify(draftData));
    this.successMessage = 'Draft saved successfully!';
    setTimeout(() => this.successMessage = '', 3000);
  }

  /**
   * Load draft from localStorage
   */
  loadDraft(): void {
    const draft = localStorage.getItem('user_draft');
    if (draft) {
      try {
        const draftData = JSON.parse(draft);
        this.userForm.patchValue(draftData);
        this.successMessage = 'Draft loaded successfully!';
        setTimeout(() => this.successMessage = '', 3000);
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }

  /**
   * Mark all form fields as touched
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
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.userForm.get(fieldName);
    if (!field) return false;
    
    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  /**
   * Navigate back to users list
   */
  navigateBackToUsers(): void {
    if (this.userForm.dirty) {
      if (confirm('You have unsaved changes. Do you want to save as draft before leaving?')) {
        this.saveAsDraft();
      }
    }
    this.router.navigate(['/users']);
  }
}