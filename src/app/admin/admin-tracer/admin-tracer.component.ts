// src/app/admin/admin-tracer/admin-tracer.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { SidebarComponent } from "../sidebar/sidebar.component";
import { TracerResponseWithUser, TracerStudyService } from '../../../services/tracer-study.service';
import { TracerStudyAnalytics } from '../../../models/tracer-study';
import { AuthService } from '../../../services/auth.service';
import jsPDF from 'jspdf';


interface FilterParams {
  programme?: string;
  year?: string;
  current_status?: string;
  sector?: string;
  search?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

@Component({
  selector: 'app-admin-tracer',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './admin-tracer.component.html',
  styleUrl: './admin-tracer.component.scss'
})
export class AdminTracerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Math helper for template
  Math = Math;

  // Data
  responses: TracerResponseWithUser[] = [];
  analytics: TracerStudyAnalytics | null = null;
  selectedResponses: Set<number> = new Set();

  // Loading states
  isLoading = false;
  isLoadingAnalytics = false;
  isExporting = false;

  // Filters
  filters: FilterParams = {};
  
  // Pagination
  pagination: PaginationInfo = {
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0
  };

  // Sort
  sortBy = 'submitted_at';
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  // Modals
  showViewModal = false;
  showDeleteModal = false;
  selectedResponse: TracerResponseWithUser | null = null;

  // Bulk actions
  bulkAction = '';

  // Filter options
  programmeOptions: string[] = [];
  yearOptions: string[] = [];
  statusOptions = [
    'Employed',
    'Self-employed',
    'Unemployed',
    'Pursuing further studies',
    'Not seeking employment'
  ];
  sectorOptions = [
    'Technology',
    'Education',
    'Healthcare',
    'Finance',
    'Manufacturing',
    'Retail',
    'Construction',
    'Agriculture',
    'Transportation',
    'Hospitality',
    'Other'
  ];

  constructor(
    private tracerService: TracerStudyService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if user is admin
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/']);
      return;
    }

    this.loadResponses();
    this.loadAnalytics();
    this.generateFilterOptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all responses with filters and pagination
   */
  loadResponses(): void {
    this.isLoading = true;

    const params: any = {
      page: this.pagination.page,
      limit: this.pagination.limit,
      sort_by: this.sortBy,
      sort_order: this.sortOrder
    };

    // Add filters
    if (this.filters.programme) params.programme = this.filters.programme;
    if (this.filters.year) params.year = this.filters.year;
    if (this.filters.current_status) params.current_status = this.filters.current_status;
    if (this.filters.sector) params.sector = this.filters.sector;

    this.tracerService.getAllResponses(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.responses = response.data;
            this.pagination = {
              page: response.pagination?.page || 1,
              limit: response.pagination?.limit || 20,
              total: response.total || 0,
              total_pages: response.pagination?.total_pages || 0
            };
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading responses:', error);
          this.isLoading = false;
          this.showError('Failed to load tracer study responses');
        }
      });
  }

  /**
   * Load analytics data
   */
  loadAnalytics(): void {
    this.isLoadingAnalytics = true;

    this.tracerService.getAnalytics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.analytics = response.data;
          }
          this.isLoadingAnalytics = false;
        },
        error: (error) => {
          console.error('Error loading analytics:', error);
          this.isLoadingAnalytics = false;
        }
      });
  }

  /**
   * Generate filter options from existing data
   */
  generateFilterOptions(): void {
    // Generate year options (last 10 years)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 10; i++) {
      this.yearOptions.push((currentYear - i).toString());
    }

    // Programme options will be populated from analytics
    this.tracerService.getAnalytics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data?.employment_by_programme) {
            this.programmeOptions = response.data.employment_by_programme
              .map(p => p.programme_of_study)
              .filter((v, i, a) => a.indexOf(v) === i); // Unique values
          }
        }
      });
  }

  /**
   * Apply filters
   */
  applyFilters(): void {
    this.pagination.page = 1; // Reset to first page
    this.loadResponses();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filters = {};
    this.pagination.page = 1;
    this.loadResponses();
  }

  /**
   * Change page
   */
  changePage(page: number): void {
    if (page < 1 || page > this.pagination.total_pages) return;
    this.pagination.page = page;
    this.loadResponses();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Change sort
   */
  changeSort(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = field;
      this.sortOrder = 'DESC';
    }
    this.loadResponses();
  }

  /**
   * Toggle response selection
   */
  toggleSelection(id: number): void {
    if (this.selectedResponses.has(id)) {
      this.selectedResponses.delete(id);
    } else {
      this.selectedResponses.add(id);
    }
  }

  /**
   * Toggle all selections
   */
  toggleAllSelections(): void {
    if (this.selectedResponses.size === this.responses.length) {
      this.selectedResponses.clear();
    } else {
      this.responses.forEach(r => {
        if (r.id) this.selectedResponses.add(r.id);
      });
    }
  }

  /**
   * Check if all are selected
   */
  areAllSelected(): boolean {
    return this.responses.length > 0 && this.selectedResponses.size === this.responses.length;
  }

  /**
   * View response details
   */
  viewResponse(response: TracerResponseWithUser): void {
    this.selectedResponse = response;
    this.showViewModal = true;
  }

  /**
   * Close view modal
   */
  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedResponse = null;
  }

  /**
   * Confirm delete response
   */
  confirmDelete(response: TracerResponseWithUser): void {
    this.selectedResponse = response;
    this.showDeleteModal = true;
  }

  /**
   * Delete response
   */
  deleteResponse(): void {
    if (!this.selectedResponse?.id) return;

    this.tracerService.deleteResponse(this.selectedResponse.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Response deleted successfully');
            this.showDeleteModal = false;
            this.selectedResponse = null;
            this.loadResponses();
            this.loadAnalytics();
          }
        },
        error: (error) => {
          console.error('Error deleting response:', error);
          this.showError('Failed to delete response');
        }
      });
  }

  /**
   * Close delete modal
   */
  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedResponse = null;
  }

  /**
   * Download response as PDF
   */
  /**
 * Download response as PDF
 */
  downloadPDF(response: TracerResponseWithUser): void {
  try {
    const doc = new jsPDF();
    
    // Setup
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = 20;

    // Helper: Add text with word wrap
    const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * fontSize * 0.5);
    };

    // Helper: Check if new page needed
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Header
    doc.setFillColor(26, 115, 232);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('ATU Alumni Tracer Study', margin, 25);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Response Details Report', margin, 33);

    yPosition = 50;
    doc.setTextColor(0, 0, 0);

    // Section 1: Personal Information
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition, pageWidth - (2 * margin), 10, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Personal Information', margin + 5, yPosition + 7);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const personalInfo = [
      { label: 'Full Name', value: response.full_name },
      { label: 'Index Number', value: response.index_number },
      { label: 'Email', value: response.email },
      { label: 'Phone Number', value: response.phone_number },
      { label: 'Programme', value: response.programme_of_study },
      { label: 'Graduation Year', value: String(response.year_of_graduation) }, // Convert to string
    ];

    personalInfo.forEach(item => {
      checkNewPage(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${item.label}:`, margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(item.value || 'N/A', margin + 60, yPosition);
      yPosition += 8;
    });

    yPosition += 5;

    // Section 2: Current Status
    checkNewPage(60);
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition, pageWidth - (2 * margin), 10, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Current Status', margin + 5, yPosition + 7);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Current Status:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(response.current_status || 'N/A', margin + 60, yPosition);
    yPosition += 8;

    if (response.time_to_first_job) {
      doc.setFont('helvetica', 'bold');
      doc.text('Time to First Job:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(response.time_to_first_job, margin + 60, yPosition);
      yPosition += 8;
    }

    if (response.main_challenge) {
      checkNewPage(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Main Challenge:', margin, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      yPosition = addText(response.main_challenge, margin, yPosition, pageWidth - (2 * margin) - 60);
      yPosition += 5;
    }

    yPosition += 5;

    // Section 3: Employment (if employed)
    if (response.current_status === 'Employed' || response.current_status === 'Self-employed') {
      checkNewPage(80);
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPosition, pageWidth - (2 * margin), 10, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Employment Details', margin + 5, yPosition + 7);
      yPosition += 15;

      doc.setFontSize(10);
      const employmentInfo = [
        { label: 'Job Title', value: response.job_title },
        { label: 'Employer', value: response.employer_name },
        { label: 'Sector', value: response.sector },
        { label: 'Job Level', value: response.job_level },
        { label: 'Related to Field', value: response.job_related_to_field },
        { label: 'Income Range', value: response.monthly_income_range },
        { label: 'How Found Job', value: response.how_found_job },
      ];

      employmentInfo.forEach(item => {
        if (item.value) {
          checkNewPage(10);
          doc.setFont('helvetica', 'bold');
          doc.text(`${item.label}:`, margin, yPosition);
          doc.setFont('helvetica', 'normal');
          const value = String(item.value); // Ensure string
          const displayValue = value.length > 40 ? value.substring(0, 40) + '...' : value;
          doc.text(displayValue, margin + 60, yPosition);
          yPosition += 8;
        }
      });

      yPosition += 5;
    }

    // Section 4: Ratings
    checkNewPage(60);
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition, pageWidth - (2 * margin), 10, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Ratings & Feedback', margin + 5, yPosition + 7);
    yPosition += 15;

    doc.setFontSize(10);
    const ratings = [
      { label: 'Skills Relevance', value: response.skills_relevance_rating ? `${response.skills_relevance_rating}/5` : 'N/A' },
      { label: 'Job Satisfaction', value: response.job_satisfaction_rating ? `${response.job_satisfaction_rating}/5` : 'N/A' },
      { label: 'Programme Quality', value: response.programme_quality_rating || 'N/A' },
      { label: 'Would Recommend ATU', value: response.would_recommend_atu || 'N/A' },
    ];

    ratings.forEach(item => {
      checkNewPage(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${item.label}:`, margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(String(item.value), margin + 80, yPosition); // Ensure string
      yPosition += 8;
    });

    if (response.skills_to_strengthen) {
      checkNewPage(20);
      yPosition += 3;
      doc.setFont('helvetica', 'bold');
      doc.text('Skills to Strengthen:', margin, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      yPosition = addText(response.skills_to_strengthen, margin, yPosition, pageWidth - (2 * margin));
      yPosition += 5;
    }

    yPosition += 5;

    // Section 5: Alumni Engagement
    checkNewPage(50);
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition, pageWidth - (2 * margin), 10, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Alumni Engagement', margin + 5, yPosition + 7);
    yPosition += 15;

    doc.setFontSize(10);
    const engagement = [
      { label: 'Alumni Member', value: response.is_alumni_member ? 'Yes' : 'No' },
      { label: 'Willing to Mentor', value: response.willing_to_mentor ? 'Yes' : 'No' },
      { label: 'Willing to Collaborate', value: response.willing_to_collaborate ? 'Yes' : 'No' },
      { label: 'Preferred Contact', value: response.preferred_contact_method || 'N/A' },
    ];

    engagement.forEach(item => {
      checkNewPage(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${item.label}:`, margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(String(item.value), margin + 70, yPosition); // Ensure string
      yPosition += 8;
    });

    // Footer
    const totalPages = (doc as any).internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Generated: ${new Date().toLocaleString()} | Page ${i} of ${totalPages}`,
        margin,
        pageHeight - 10
      );
      doc.text('ATU Alumni Relations', pageWidth - margin - 50, pageHeight - 10);
    }

    // Save
    const fileName = `tracer_study_${response.index_number}_${Date.now()}.pdf`;
    doc.save(fileName);
    this.showSuccess(`PDF downloaded: ${fileName}`);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    this.showError('Failed to generate PDF');
  }
}

  /**
   * Send follow-up email
   */
  sendFollowUp(response: TracerResponseWithUser): void {
    // TODO: Implement email sending
    this.showInfo('Follow-up email feature coming soon');
  }

  /**
   * Apply bulk action
   */
  applyBulkAction(): void {
    if (!this.bulkAction || this.selectedResponses.size === 0) {
      this.showError('Please select responses and an action');
      return;
    }

    const selectedIds = Array.from(this.selectedResponses);

    switch (this.bulkAction) {
      case 'export':
        this.exportSelected(selectedIds);
        break;
      case 'follow-up':
        this.sendBulkFollowUp(selectedIds);
        break;
      case 'mark-reviewed':
        this.markAsReviewed(selectedIds);
        break;
      case 'delete':
        this.deleteBulk(selectedIds);
        break;
      default:
        this.showError('Invalid action selected');
    }
  }

  /**
   * Export selected responses
   */
  exportSelected(ids: number[]): void {
    this.showInfo(`Exporting ${ids.length} responses...`);
    // TODO: Implement selective export
  }

  /**
   * Send bulk follow-up
   */
  sendBulkFollowUp(ids: number[]): void {
    this.showInfo(`Sending follow-up to ${ids.length} alumni...`);
    // TODO: Implement bulk email
  }

  /**
   * Mark as reviewed
   */
  markAsReviewed(ids: number[]): void {
    this.showInfo(`Marking ${ids.length} responses as reviewed...`);
    // TODO: Implement mark as reviewed
  }

  /**
   * Delete bulk
   */
  deleteBulk(ids: number[]): void {
    if (!confirm(`Are you sure you want to delete ${ids.length} responses?`)) {
      return;
    }

    this.showInfo(`Deleting ${ids.length} responses...`);
    // TODO: Implement bulk delete
  }

  /**
   * Export all data
   */
  exportAllData(): void {
    this.isExporting = true;

    this.tracerService.exportResponses(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `tracer_study_responses_${Date.now()}.csv`;
          link.click();
          window.URL.revokeObjectURL(url);
          
          this.showSuccess('Data exported successfully');
          this.isExporting = false;
        },
        error: (error) => {
          console.error('Error exporting data:', error);
          this.showError('Failed to export data');
          this.isExporting = false;
        }
      });
  }

  /**
   * Navigate to analytics page
   */
  viewAnalytics(): void {
    this.router.navigate(['/admin/tracer-analytics']);
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'Employed': 'bg-green-100 text-green-800',
      'Self-employed': 'bg-purple-100 text-purple-800',
      'Unemployed': 'bg-red-100 text-red-800',
      'Pursuing further studies': 'bg-blue-100 text-blue-800',
      'Not seeking employment': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get completion badge class
   */
  getCompletionClass(isCompleted: boolean): string {
    return isCompleted 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800';
  }

  /**
   * Get completion text
   */
  getCompletionText(isCompleted: boolean): string {
    return isCompleted ? 'Completed' : 'Partial';
  }

  /**
   * Format date
   */
  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get user initials
   */
  getUserInitials(name: string): string {
    if (!name) return 'NA';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  /**
   * Get avatar gradient class
   */
  getAvatarGradient(index: number): string {
    const gradients = [
      'from-primary to-accent',
      'from-accent to-secondary',
      'from-secondary to-primary',
      'from-blue-500 to-purple-500',
      'from-green-500 to-blue-500',
      'from-orange-500 to-red-500'
    ];
    return gradients[index % gradients.length];
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    // TODO: Implement toast notification
    alert(message);
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    // TODO: Implement toast notification
    alert(message);
  }

  /**
   * Show info message
   */
  private showInfo(message: string): void {
    // TODO: Implement toast notification
    alert(message);
  }

  // Add this method to your component
/**
 * Calculate employment rate (percentage of employed + self-employed)
 */
  /**
 * Calculate employment rate (percentage of employed + self-employed)
 */
/**
 * Calculate employment rate (employed + self-employed)
 */
/**
 * Calculate employment rate (employed + self-employed)
 */
get employmentRate(): number {
  if (!this.analytics?.overview) return 0;
  
  const overview = this.analytics.overview;
  
  // ✅ Convert strings to numbers using Number() or +
  const employed = Number(overview.employed_count) || 0;
  const selfEmployed = Number(overview.self_employed_count) || 0;
  const total = Number(overview.total_responses) || 1;
  
  const totalEmployed = employed + selfEmployed;
  
  return (totalEmployed / total) * 100;
}

}