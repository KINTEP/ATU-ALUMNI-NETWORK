// tracer-page.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../models/user';
import { AuthService } from '../../services/auth.service';
import { TracerStudyResponse } from '../../models/tracer-study';
import { TracerStudyService } from '../../services/tracer-study.service';
import { ApiResponse } from '../../models/api-response';

@Component({
  selector: 'app-tracer-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tracer-page.component.html',
  styleUrl: './tracer-page.component.scss'
})
export class TracerPageComponent implements OnInit {
  currentUser: User | null = null;
  currentSection = 1;
  hasSubmitted = false;
  isLoading = false;
  isSubmitting = false;

  // Form data with all fields
  formData: any = {
    user_id: 0,
    
    // Section 1: Personal Information
    full_name: '',
    index_number: '',
    programme_of_study: '',
    year_of_graduation: '',
    gender: '',
    age_range: '',
    current_location_type: '',
    current_country: '',
    email: '',
    phone_number: '',
    
    // Section 2: Current Status
    current_status: '',
    
    // Employment fields
    employment_type: '',
    time_to_first_job: '',
    job_title: '',
    employer_name: '',
    sector: '',
    industry: '',
    job_related_to_field: '',
    monthly_income_range: '',
    how_found_job: '',
    job_level: '',
    
    // Self-Employment fields
    business_time_dedication: '',
    time_to_start_business: '',
    business_type: '',
    business_sector: '',
    business_related_to_field: '',
    business_monthly_income: '',
    how_started_business: '',
    number_of_employees: '',
    
    // Unemployment fields
    unemployment_duration: '',
    main_challenge: '',
    currently_status: '',
    support_needed: [],
    
    // Further Studies fields
    further_study_type: '',
    further_study_field: '',
    further_study_institution_type: '',
    further_study_reason: '',
    working_while_studying: '',
    study_job_title: '',
    study_job_related: '',
    study_job_sector: '',
    
    // Section 3: Experience During Studies
    worked_during_studies: '',
    work_related_to_field: '',
    
    // Section 4: Skills Assessment
    skills_relevance_rating: null,
    competency_technical: null,
    competency_communication: null,
    competency_problem_solving: null,
    competency_teamwork: null,
    competency_computer: null,
    competency_critical_thinking: null,
    competency_entrepreneurship: null,
    skills_to_strengthen: '',
    current_situation_satisfaction: null,
    
    // Section 5: Feedback on ATU
    programme_quality_rating: '',
    teaching_quality: '',
    curriculum_relevance: '',
    practical_training: '',
    facilities_equipment: '',
    internship_organization: '',
    career_guidance: '',
    student_support: '',
    would_recommend_atu: '',
    atu_did_well: '',
    atu_should_improve: '',
    
    // Section 6: Alumni Engagement
    is_alumni_member: null,
    willing_to_mentor: null,
    preferred_contact_method: '',
    willing_to_collaborate: null,
    
    // Section 7: Survey Feedback
    how_heard_about_survey: '',
    
    is_completed: false
  };

  // Dropdown options
  programmes = [
    'Computer Science',
    'Information Technology',
    'Business Administration',
    'Accounting',
    'Marketing',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Architecture',
    'Building Technology',
    'Other'
  ];

  graduationYears: number[] = [];
  
  genders = ['Male', 'Female', 'Prefer not to say'];
  
  ageRanges = [
    'Under 25',
    '25-29',
    '30-34',
    '35-39',
    '40-44',
    '45 and above'
  ];

  constructor(
    private tracerStudyService: TracerStudyService,
    private authService: AuthService
  ) {
    // Generate graduation years (last 10 years)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 10; i++) {
      this.graduationYears.push(currentYear - i);
    }
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.formData.user_id = user.id;
        this.formData.full_name = `${user.first_name} ${user.last_name}`;
        this.formData.email = user.email;
        this.checkSubmissionStatus();
      }
    });
  }

  checkSubmissionStatus(): void {
    if (!this.currentUser) return;

    this.isLoading = true;
    this.tracerStudyService.checkSubmissionStatus(this.currentUser.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.hasSubmitted = response.data.has_submitted;
          if (this.hasSubmitted) {
            this.loadMyResponse();
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error checking submission status:', error);
        this.isLoading = false;
      }
    });
  }

  loadMyResponse(): void {
    if (!this.currentUser) return;

    this.tracerStudyService.getMyResponse(this.currentUser.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.formData = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading response:', error);
      }
    });
  }

  showSection(sectionNumber: number): void {
    // Validate current section before moving forward
    if (sectionNumber > this.currentSection && !this.validateSection(this.currentSection)) {
      this.showAlert('error', 'Please fill in all required fields before proceeding.');
      return;
    }

    // Hide all sections
    for (let i = 1; i <= 7; i++) {
      const section = document.getElementById(`section${i}`);
      if (section) section.style.display = 'none';
    }
    
    // Show requested section
    const current = document.getElementById(`section${sectionNumber}`);
    if (current) current.style.display = 'block';
    this.currentSection = sectionNumber;

    // Update progress bar
    const progress = (this.currentSection / 7) * 100;
    const progressBar = document.getElementById('progressBar');
    if (progressBar) progressBar.style.width = `${progress}%`;
    
    const progressText = document.getElementById('progressText');
    if (progressText) progressText.textContent = `Step ${this.currentSection} of 7`;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  validateSection(sectionNumber: number): boolean {
    switch (sectionNumber) {
      case 1: // Personal Information
        return !!(
          this.formData.full_name &&
          this.formData.index_number &&
          this.formData.programme_of_study &&
          this.formData.year_of_graduation &&
          this.formData.gender &&
          this.formData.age_range &&
          this.formData.current_location_type &&
          this.formData.email &&
          this.formData.phone_number
        );
      case 2: // Current Status
        return !!this.formData.current_status;
      case 3: // Experience During Studies
        return !!this.formData.worked_during_studies;
      case 5: // Feedback - Programme Quality required
        return !!this.formData.programme_quality_rating && !!this.formData.would_recommend_atu;
      default:
        return true;
    }
  }

  // Conditional logic helpers
  shouldShowEmployedQuestions(): boolean {
    return this.formData.current_status === 'Employed';
  }

  shouldShowSelfEmployedQuestions(): boolean {
    return this.formData.current_status === 'Self-employed';
  }

  shouldShowUnemployedQuestions(): boolean {
    return this.formData.current_status === 'Unemployed';
  }

  shouldShowFurtherStudiesQuestions(): boolean {
    return this.formData.current_status === 'Pursuing further studies';
  }

  shouldShowSkillsSection(): boolean {
    return ['Employed', 'Self-employed', 'Pursuing further studies'].includes(this.formData.current_status);
  }

  getNextSection(currentSection: number): number {
    // Section 3 → 4 (Skills) if applicable, else skip to 5 (Feedback)
    if (currentSection === 3) {
      return this.shouldShowSkillsSection() ? 4 : 5;
    }
    
    // Default sequential navigation
    return currentSection + 1;
  }

  getPreviousSection(currentSection: number): number {
    // Section 5 (Feedback) → 4 (Skills) if it was shown, else 3 (Experience)
    if (currentSection === 5) {
      return this.shouldShowSkillsSection() ? 4 : 3;
    }
    
    // Section 4 (Skills) → always 3 (Experience)
    if (currentSection === 4) {
      return 3;
    }
    
    // Default sequential navigation
    return currentSection - 1;
  }

  onSubmit(): void {
    if (!this.currentUser) {
      this.showAlert('error', 'Please log in to submit the form.');
      return;
    }

    // Validate critical sections
    if (!this.validateSection(1) || !this.validateSection(2) || !this.validateSection(3) || !this.validateSection(5)) {
      this.showAlert('error', 'Please fill in all required fields before submitting.');
      return;
    }

    this.isSubmitting = true;

    const submissionData: TracerStudyResponse = {
      ...this.formData,
      year_of_graduation: parseInt(this.formData.year_of_graduation) || 0,
      is_completed: true
    };

    this.tracerStudyService.submitResponse(submissionData).subscribe({
      next: (response: ApiResponse<TracerStudyResponse>) => {
        if (response.success) {
          this.showAlert('success', 'Your tracer study response has been successfully submitted! Thank you for your feedback.');
          
          const form = document.getElementById('tracerForm');
          const thankYouMessage = document.getElementById('thankYouMessage');
          if (form) form.style.display = 'none';
          if (thankYouMessage) thankYouMessage.classList.remove('hidden');

          this.hasSubmitted = true;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        this.isSubmitting = false;
      },
      error: (error: any) => {
        console.error('Error submitting form:', error);
        this.isSubmitting = false;

        const errorMessage = error.message || error.error?.error || 'Failed to submit form. Please try again.';

        if (error.status === 409 || errorMessage.includes('already submitted')) {
          this.showAlert('error', 'You have already submitted a response to this tracer study. Each user can only submit once.');
          this.hasSubmitted = true;
          
          const form = document.getElementById('tracerForm');
          if (form) form.style.display = 'none';
          
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (error.status === 400) {
          this.showAlert('error', errorMessage);
        } else if (error.status === 401 || error.status === 403) {
          this.showAlert('error', 'You must be logged in to submit the form. Please log in and try again.');
        } else {
          this.showAlert('error', errorMessage);
        }
      }
    });
  }

  showAlert(type: 'success' | 'error', message: string): void {
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md animate-slide-in ${
      type === 'success' 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    }`;
    
    alertDiv.innerHTML = `
      <div class="flex items-center space-x-3">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-2xl"></i>
        <div class="flex-1">
          <p class="font-medium">${type === 'success' ? 'Success!' : 'Error'}</p>
          <p class="text-sm opacity-90">${message}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
      if (alertDiv.parentElement) {
        alertDiv.remove();
      }
    }, 5000);
  }
}