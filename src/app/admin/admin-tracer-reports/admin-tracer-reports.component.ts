// src/app/admin/admin-tracer-reports/admin-tracer-reports.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { SidebarComponent } from "../sidebar/sidebar.component";
import { TracerResponseWithUser, TracerStudyService } from '../../../services/tracer-study.service';
import { AuthService } from '../../../services/auth.service';

// Chart.js imports
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

interface ReportFilters {
  // Demographics
  programme?: string;
  graduation_year?: string;
  gender?: string;
  age_range?: string;
  location_type?: string;
  current_country?: string;
  
  // Employment Status
  current_status?: string;
  employment_type?: string;
  sector?: string;
  industry?: string;
  job_related_to_field?: string;
  monthly_income_range?: string;
  job_level?: string;
  time_to_first_job?: string;
  
  // Skills & Satisfaction
  skills_relevance_min?: number;
  skills_relevance_max?: number;
  job_satisfaction_min?: number;
  job_satisfaction_max?: number;
  programme_quality?: string;
  would_recommend?: string;
  
  // Alumni Engagement
  is_alumni_member?: string;
  willing_to_mentor?: string;
  willing_to_collaborate?: string;
}

interface ReportSummary {
  total_filtered: number;
  employment_rate: number;
  avg_time_to_job: string;
  avg_skills_rating: number;
  avg_satisfaction_rating: number;
  top_sector: string;
  top_industry: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

@Component({
  selector: 'app-admin-tracer-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './admin-tracer-reports.component.html',
  styleUrl: './admin-tracer-reports.component.scss'
})
export class AdminTracerReportsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private charts: { [key: string]: Chart } = {};

  // Math helper for template
  Math = Math;

  // Data
  responses: TracerResponseWithUser[] = [];
  reportSummary: ReportSummary | null = null;

  // Loading states
  isLoading = false;
  isExporting = false;
  showFilters = true;

  // Filters
  filters: ReportFilters = {};
  activeFilterCount = 0;

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

  // Filter Options
  programmeOptions: string[] = [];
  yearOptions: string[] = [];
  genderOptions = ['Male', 'Female', 'Prefer not to say', 'Other'];
  ageRangeOptions = ['18-25', '26-30', '31-35', '36-40', '41-50', '51+'];
  locationTypeOptions = ['In Ghana', 'Outside Ghana'];
  
  statusOptions = [
    'Employed',
    'Self-employed',
    'Unemployed',
    'Pursuing further studies'
  ];
  
  employmentTypeOptions = [
    'Full-time (30+ hours per week)',
    'Part-time (less than 30 hours per week)',
    'Contract/Project-based'
  ];
  
  sectorOptions = [
    'Public',
    'Private',
    'NGO',
    'International Organization',
    'Other'
  ];
  
  industryOptions = [
    'Finance/Banking',
    'Manufacturing',
    'Information Technology',
    'Healthcare/Medical',
    'Education',
    'Construction/Real Estate',
    'Telecommunications',
    'Energy/Utilities',
    'Agriculture/Agribusiness',
    'Retail/Wholesale Trade',
    'Hospitality/Tourism',
    'Media/Entertainment',
    'Transportation/Logistics',
    'Legal Services',
    'Consulting/Professional Services',
    'Insurance',
    'Government/Public Administration',
    'Mining/Extractive Industries',
    'Creative/Arts/Design',
    'Non-Profit/NGO',
    'Other'
  ];
  
  jobRelatedOptions = [
    'Yes, directly related',
    'Partly related',
    'Not related'
  ];
  
  incomeRangeOptions = [
    'Below GHS 2,000',
    'GHS 2,000–4,999',
    'GHS 5,000–9,999',
    'GHS 10,000 or above',
    'Prefer not to say'
  ];
  
  jobLevelOptions = [
    'Entry-level',
    'Mid-level',
    'Senior-level',
    'Management/Executive'
  ];
  
  timeToJobOptions = [
    'Less than 3 months',
    '3-6 months',
    '6-12 months',
    'More than a year'
  ];
  
  qualityOptions = [
    'Excellent',
    'Very Good',
    'Good',
    'Fair',
    'Poor'
  ];
  
  recommendOptions = [
    'Definitely yes',
    'Probably yes',
    'Not sure',
    'Probably not',
    'Definitely not'
  ];

  yesNoOptions = ['Yes', 'No'];
  yesNoMaybeOptions = ['Yes', 'No', 'Maybe'];

  // Chart colors
  private readonly chartColors = {
    primary: '#1a73e8',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    purple: '#8b5cf6'
  };

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

    this.generateFilterOptions();
    this.loadReportData();
  }

  ngOnDestroy(): void {
    // Destroy all charts
    Object.values(this.charts).forEach(chart => chart.destroy());
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Generate filter options
   */
  generateFilterOptions(): void {
    // Generate year options (last 15 years)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 15; i++) {
      this.yearOptions.push((currentYear - i).toString());
    }

    // Programme options will be populated from data
    // TODO: Get from analytics or separate endpoint
    this.programmeOptions = [
      'Computer Science',
      'Business Administration',
      'Civil Engineering',
      'Electrical Engineering',
      'Mechanical Engineering',
      'Accounting',
      'Marketing',
      'Human Resource Management'
    ];
  }

  /**
   * Load report data with filters
   */
  loadReportData(): void {
    this.isLoading = true;

    const params: any = {
      page: this.pagination.page,
      limit: this.pagination.limit,
      sort_by: this.sortBy,
      sort_order: this.sortOrder
    };

    // Add all active filters
    Object.keys(this.filters).forEach(key => {
      const value = (this.filters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value;
      }
    });

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

            // Calculate report summary
            this.calculateReportSummary();

            // Create charts
            setTimeout(() => {
              this.createReportCharts();
            }, 100);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading report data:', error);
          this.isLoading = false;
          this.showError('Failed to load report data');
        }
      });
  }

  /**
   * Calculate report summary from filtered data
   */
  calculateReportSummary(): void {
    if (this.responses.length === 0) {
      this.reportSummary = null;
      return;
    }

    const employed = this.responses.filter(r => 
      r.current_status === 'Employed' || r.current_status === 'Self-employed'
    ).length;

    const employmentRate = (employed / this.responses.length) * 100;

    // Calculate average skills rating
    const skillsRatings = this.responses
      .filter(r => r.skills_relevance_rating)
      .map(r => Number(r.skills_relevance_rating));
    const avgSkills = skillsRatings.length > 0
      ? skillsRatings.reduce((a, b) => a + b, 0) / skillsRatings.length
      : 0;

    // Calculate average satisfaction rating
    const satisfactionRatings = this.responses
      .filter(r => r.job_satisfaction_rating)
      .map(r => Number(r.job_satisfaction_rating));
    const avgSatisfaction = satisfactionRatings.length > 0
      ? satisfactionRatings.reduce((a, b) => a + b, 0) / satisfactionRatings.length
      : 0;

    // Find top sector
    const sectorCounts: { [key: string]: number } = {};
    this.responses.forEach(r => {
      if (r.sector) {
        sectorCounts[r.sector] = (sectorCounts[r.sector] || 0) + 1;
      }
    });
    const topSector = Object.keys(sectorCounts).reduce((a, b) => 
      sectorCounts[a] > sectorCounts[b] ? a : b, 'N/A'
    );

    // Find top industry
    const industryCounts: { [key: string]: number } = {};
    this.responses.forEach(r => {
      if ((r as any).industry) {
        industryCounts[(r as any).industry] = (industryCounts[(r as any).industry] || 0) + 1;
      }
    });
    const topIndustry = Object.keys(industryCounts).length > 0
      ? Object.keys(industryCounts).reduce((a, b) => 
          industryCounts[a] > industryCounts[b] ? a : b
        )
      : 'N/A';

    this.reportSummary = {
      total_filtered: this.responses.length,
      employment_rate: employmentRate,
      avg_time_to_job: 'N/A', // TODO: Calculate from time_to_first_job
      avg_skills_rating: avgSkills,
      avg_satisfaction_rating: avgSatisfaction,
      top_sector: topSector,
      top_industry: topIndustry
    };
  }

  /**
   * Create report-specific charts
   */
  createReportCharts(): void {
    // Destroy existing charts
    Object.values(this.charts).forEach(chart => chart.destroy());
    this.charts = {};

    if (this.responses.length === 0) return;

    // Always show these core charts
    this.createStatusDistributionChart();
    this.createSectorBreakdownChart();
    
    // Conditionally show charts based on data availability and filters
    if (this.hasEmployedResponses()) {
      this.createIndustryDistributionChart();
      this.createJobLevelDistributionChart();
      this.createTimeToJobChart();
      this.createIncomeRangeChart();
      this.createJobRelatedChart();
    }

    if (this.hasRatingsData()) {
      this.createSkillsSatisfactionChart();
      this.createProgrammeQualityChart();
      this.createRecommendationChart();
    }

    if (this.hasProgrammeFilter()) {
      this.createYearTrendChart();
    }

    if (this.hasYearFilter()) {
      this.createProgrammeComparisonChart();
    }

    if (this.hasEngagementData()) {
      this.createEngagementChart();
    }
  }

  /**
   * Check if we have employed responses
   */
  hasEmployedResponses(): boolean {
    return this.responses.some(r => 
      r.current_status === 'Employed' || r.current_status === 'Self-employed'
    );
  }

  /**
   * Check if we have ratings data
   */
  hasRatingsData(): boolean {
    return this.responses.some(r => 
      r.skills_relevance_rating || r.job_satisfaction_rating
    );
  }

  /**
   * Check if programme filter is active
   */
  hasProgrammeFilter(): boolean {
    return !!this.filters.programme;
  }

  /**
   * Check if year filter is active
   */
  hasYearFilter(): boolean {
    return !!this.filters.graduation_year;
  }

  /**
   * Check if we have engagement data
   */
  hasEngagementData(): boolean {
    return this.responses.some(r => 
      r.is_alumni_member !== undefined || 
      r.willing_to_mentor !== undefined ||
      r.willing_to_collaborate !== undefined
    );
  }

  /**
   * Create status distribution chart
   */
  private createStatusDistributionChart(): void {
    const canvas = document.getElementById('statusDistributionChart') as HTMLCanvasElement;
    if (!canvas || this.responses.length === 0) return;

    const statusCounts: { [key: string]: number } = {};
    this.responses.forEach(r => {
      statusCounts[r.current_status] = (statusCounts[r.current_status] || 0) + 1;
    });

    const data = {
      labels: Object.keys(statusCounts),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: [
          this.chartColors.success,
          this.chartColors.purple,
          this.chartColors.danger,
          this.chartColors.info
        ],
        borderWidth: 0
      }]
    };

    this.charts['status'] = new Chart(canvas, {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Employment Status Distribution',
            font: { size: 14, weight: 'bold' }
          }
        }
      }
    });
  }

  /**
   * Create sector breakdown chart
   */
  private createSectorBreakdownChart(): void {
    const canvas = document.getElementById('sectorBreakdownChart') as HTMLCanvasElement;
    if (!canvas || this.responses.length === 0) return;

    const sectorCounts: { [key: string]: number } = {};
    this.responses.forEach(r => {
      if (r.sector) {
        sectorCounts[r.sector] = (sectorCounts[r.sector] || 0) + 1;
      }
    });

    if (Object.keys(sectorCounts).length === 0) return;

    const data = {
      labels: Object.keys(sectorCounts),
      datasets: [{
        label: 'Alumni',
        data: Object.values(sectorCounts),
        backgroundColor: this.chartColors.primary,
        borderWidth: 0
      }]
    };

    this.charts['sector'] = new Chart(canvas, {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Sector Distribution',
            font: { size: 14, weight: 'bold' }
          }
        },
        scales: {
          x: { beginAtZero: true }
        }
      }
    });
  }

  /**
   * Create skills vs satisfaction scatter chart
   */
  private createSkillsSatisfactionChart(): void {
    const canvas = document.getElementById('skillsSatisfactionChart') as HTMLCanvasElement;
    if (!canvas || this.responses.length === 0) return;

    const dataPoints = this.responses
      .filter(r => r.skills_relevance_rating && r.job_satisfaction_rating)
      .map(r => ({
        x: Number(r.skills_relevance_rating),
        y: Number(r.job_satisfaction_rating)
      }));

    if (dataPoints.length === 0) return;

    const data = {
      datasets: [{
        label: 'Alumni Responses',
        data: dataPoints,
        backgroundColor: this.chartColors.info,
        borderColor: this.chartColors.primary,
        borderWidth: 1
      }]
    };

    this.charts['skills'] = new Chart(canvas, {
      type: 'scatter',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Skills Relevance vs Job Satisfaction',
            font: { size: 14, weight: 'bold' }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Skills Relevance Rating' },
            min: 0,
            max: 5
          },
          y: {
            title: { display: true, text: 'Job Satisfaction Rating' },
            min: 0,
            max: 5
          }
        }
      }
    });
  }

  /**
   * Create industry distribution chart
   */
  private createIndustryDistributionChart(): void {
    const canvas = document.getElementById('industryDistributionChart') as HTMLCanvasElement;
    if (!canvas) return;

    const industryCounts: { [key: string]: number } = {};
    this.responses.forEach(r => {
      const industry = (r as any).industry;
      if (industry) {
        industryCounts[industry] = (industryCounts[industry] || 0) + 1;
      }
    });

    if (Object.keys(industryCounts).length === 0) return;

    // Get top 10 industries
    const sortedIndustries = Object.entries(industryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const data = {
      labels: sortedIndustries.map(([industry]) => industry),
      datasets: [{
        label: 'Alumni',
        data: sortedIndustries.map(([, count]) => count),
        backgroundColor: this.chartColors.warning,
        borderWidth: 0
      }]
    };

    this.charts['industry'] = new Chart(canvas, {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Top 10 Industries',
            font: { size: 14, weight: 'bold' }
          }
        },
        scales: {
          x: { beginAtZero: true }
        }
      }
    });
  }

  /**
   * Create job level distribution chart
   */
  private createJobLevelDistributionChart(): void {
    const canvas = document.getElementById('jobLevelChart') as HTMLCanvasElement;
    if (!canvas) return;

    const levelCounts: { [key: string]: number } = {};
    this.responses.forEach(r => {
      if (r.job_level) {
        levelCounts[r.job_level] = (levelCounts[r.job_level] || 0) + 1;
      }
    });

    if (Object.keys(levelCounts).length === 0) return;

    const data = {
      labels: Object.keys(levelCounts),
      datasets: [{
        data: Object.values(levelCounts),
        backgroundColor: [
          this.chartColors.info,
          this.chartColors.primary,
          this.chartColors.warning,
          this.chartColors.success
        ],
        borderWidth: 0
      }]
    };

    this.charts['jobLevel'] = new Chart(canvas, {
      type: 'pie',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          title: {
            display: true,
            text: 'Job Level Distribution',
            font: { size: 14, weight: 'bold' }
          }
        }
      }
    });
  }

  /**
   * Create time to job chart
   */
  private createTimeToJobChart(): void {
    const canvas = document.getElementById('timeToJobChart') as HTMLCanvasElement;
    if (!canvas) return;

    const timeCounts: { [key: string]: number } = {};
    this.responses.forEach(r => {
      if (r.time_to_first_job) {
        timeCounts[r.time_to_first_job] = (timeCounts[r.time_to_first_job] || 0) + 1;
      }
    });

    if (Object.keys(timeCounts).length === 0) return;

    const data = {
      labels: Object.keys(timeCounts),
      datasets: [{
        label: 'Alumni',
        data: Object.values(timeCounts),
        backgroundColor: this.chartColors.success,
        borderWidth: 0
      }]
    };

    this.charts['timeToJob'] = new Chart(canvas, {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Time to First Job After Graduation',
            font: { size: 14, weight: 'bold' }
          }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  /**
   * Create income range chart
   */
  private createIncomeRangeChart(): void {
    const canvas = document.getElementById('incomeRangeChart') as HTMLCanvasElement;
    if (!canvas) return;

    const incomeCounts: { [key: string]: number } = {};
    this.responses.forEach(r => {
      if (r.monthly_income_range && r.monthly_income_range !== 'Prefer not to say') {
        incomeCounts[r.monthly_income_range] = (incomeCounts[r.monthly_income_range] || 0) + 1;
      }
    });

    if (Object.keys(incomeCounts).length === 0) return;

    const data = {
      labels: Object.keys(incomeCounts),
      datasets: [{
        label: 'Alumni',
        data: Object.values(incomeCounts),
        backgroundColor: this.chartColors.success,
        borderWidth: 0
      }]
    };

    this.charts['income'] = new Chart(canvas, {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Monthly Income Distribution',
            font: { size: 14, weight: 'bold' }
          }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  /**
   * Create job related to field chart
   */
  private createJobRelatedChart(): void {
    const canvas = document.getElementById('jobRelatedChart') as HTMLCanvasElement;
    if (!canvas) return;

    const relatedCounts: { [key: string]: number } = {};
    this.responses.forEach(r => {
      if (r.job_related_to_field) {
        relatedCounts[r.job_related_to_field] = (relatedCounts[r.job_related_to_field] || 0) + 1;
      }
    });

    if (Object.keys(relatedCounts).length === 0) return;

    const data = {
      labels: Object.keys(relatedCounts),
      datasets: [{
        data: Object.values(relatedCounts),
        backgroundColor: [
          this.chartColors.success,
          this.chartColors.warning,
          this.chartColors.danger
        ],
        borderWidth: 0
      }]
    };

    this.charts['jobRelated'] = new Chart(canvas, {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          title: {
            display: true,
            text: 'Job Relevance to Field of Study',
            font: { size: 14, weight: 'bold' }
          }
        }
      }
    });
  }

  /**
   * Create programme quality chart
   */
  private createProgrammeQualityChart(): void {
    const canvas = document.getElementById('programmeQualityChart') as HTMLCanvasElement;
    if (!canvas) return;

    const qualityCounts: { [key: string]: number } = {};
    this.responses.forEach(r => {
      if (r.programme_quality_rating) {
        qualityCounts[r.programme_quality_rating] = (qualityCounts[r.programme_quality_rating] || 0) + 1;
      }
    });

    if (Object.keys(qualityCounts).length === 0) return;

    const data = {
      labels: Object.keys(qualityCounts),
      datasets: [{
        data: Object.values(qualityCounts),
        backgroundColor: [
          this.chartColors.success,
          this.chartColors.info,
          this.chartColors.primary,
          this.chartColors.warning,
          this.chartColors.danger
        ],
        borderWidth: 0
      }]
    };

    this.charts['quality'] = new Chart(canvas, {
      type: 'pie',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          title: {
            display: true,
            text: 'Programme Quality Rating',
            font: { size: 14, weight: 'bold' }
          }
        }
      }
    });
  }

  /**
   * Create recommendation chart
   */
  private createRecommendationChart(): void {
    const canvas = document.getElementById('recommendationChart') as HTMLCanvasElement;
    if (!canvas) return;

    const recCounts: { [key: string]: number } = {};
    this.responses.forEach(r => {
      if (r.would_recommend_atu) {
        recCounts[r.would_recommend_atu] = (recCounts[r.would_recommend_atu] || 0) + 1;
      }
    });

    if (Object.keys(recCounts).length === 0) return;

    const data = {
      labels: Object.keys(recCounts),
      datasets: [{
        data: Object.values(recCounts),
        backgroundColor: [
          this.chartColors.success,
          this.chartColors.info,
          this.chartColors.warning,
          this.chartColors.danger,
          this.chartColors.danger
        ],
        borderWidth: 0
      }]
    };

    this.charts['recommend'] = new Chart(canvas, {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          title: {
            display: true,
            text: 'Would Recommend ATU',
            font: { size: 14, weight: 'bold' }
          }
        }
      }
    });
  }

  /**
   * Create year trend chart (when programme is filtered)
   */
  private createYearTrendChart(): void {
    const canvas = document.getElementById('yearTrendChart') as HTMLCanvasElement;
    if (!canvas) return;

    const yearCounts: { [key: string]: number } = {};
    this.responses.forEach(r => {
      const year = r.year_of_graduation?.toString();
      if (year) {
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      }
    });

    if (Object.keys(yearCounts).length === 0) return;

    // Sort years
    const sortedYears = Object.keys(yearCounts).sort();

    const data = {
      labels: sortedYears,
      datasets: [{
        label: 'Graduates',
        data: sortedYears.map(year => yearCounts[year]),
        borderColor: this.chartColors.primary,
        backgroundColor: this.chartColors.info,
        tension: 0.4,
        fill: true
      }]
    };

    this.charts['yearTrend'] = new Chart(canvas, {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: `${this.filters.programme} - Graduates Over Time`,
            font: { size: 14, weight: 'bold' }
          }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  /**
   * Create programme comparison chart (when year is filtered)
   */
  private createProgrammeComparisonChart(): void {
    const canvas = document.getElementById('programmeComparisonChart') as HTMLCanvasElement;
    if (!canvas) return;

    const programmeCounts: { [key: string]: number } = {};
    this.responses.forEach(r => {
      if (r.programme_of_study) {
        programmeCounts[r.programme_of_study] = (programmeCounts[r.programme_of_study] || 0) + 1;
      }
    });

    if (Object.keys(programmeCounts).length === 0) return;

    // Get top 10 programmes
    const sortedProgrammes = Object.entries(programmeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const data = {
      labels: sortedProgrammes.map(([prog]) => prog),
      datasets: [{
        label: 'Graduates',
        data: sortedProgrammes.map(([, count]) => count),
        backgroundColor: this.chartColors.primary,
        borderWidth: 0
      }]
    };

    this.charts['programmeComp'] = new Chart(canvas, {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: `Class of ${this.filters.graduation_year} - Top Programmes`,
            font: { size: 14, weight: 'bold' }
          }
        },
        scales: {
          x: { beginAtZero: true }
        }
      }
    });
  }

  /**
   * Create engagement chart
   */
  private createEngagementChart(): void {
    const canvas = document.getElementById('engagementChart') as HTMLCanvasElement;
    if (!canvas) return;

    const memberYes = this.responses.filter(r => r.is_alumni_member === true).length;
    const mentorYes = this.responses.filter(r => r.willing_to_mentor === true).length;
    const collaborateYes = this.responses.filter(r => r.willing_to_collaborate === true).length;

    if (memberYes === 0 && mentorYes === 0 && collaborateYes === 0) return;

    const data = {
      labels: ['Alumni Member', 'Willing to Mentor', 'Willing to Collaborate'],
      datasets: [{
        label: 'Yes Responses',
        data: [memberYes, mentorYes, collaborateYes],
        backgroundColor: [
          this.chartColors.success,
          this.chartColors.info,
          this.chartColors.purple
        ],
        borderWidth: 0
      }]
    };

    this.charts['engagement'] = new Chart(canvas, {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Alumni Engagement Levels',
            font: { size: 14, weight: 'bold' }
          }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  /**
   * Apply filters
   */
  applyFilters(): void {
    this.pagination.page = 1; // Reset to first page
    this.countActiveFilters();
    this.loadReportData();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filters = {};
    this.activeFilterCount = 0;
    this.pagination.page = 1;
    this.loadReportData();
  }

  /**
   * Count active filters
   */
  countActiveFilters(): void {
    this.activeFilterCount = Object.keys(this.filters).filter(key => {
      const value = (this.filters as any)[key];
      return value !== undefined && value !== null && value !== '';
    }).length;
  }

  /**
   * Toggle filters panel
   */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  /**
   * Change page
   */
  changePage(page: number): void {
    if (page < 1 || page > this.pagination.total_pages) return;
    this.pagination.page = page;
    this.loadReportData();
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
    this.loadReportData();
  }

  /**
   * Export filtered data
   */
  exportFilteredData(): void {
    this.isExporting = true;

    this.tracerService.exportResponses(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `tracer_report_${Date.now()}.csv`;
          link.click();
          window.URL.revokeObjectURL(url);
          
          this.showSuccess('Report exported successfully');
          this.isExporting = false;
        },
        error: (error) => {
          console.error('Error exporting report:', error);
          this.showError('Failed to export report');
          this.isExporting = false;
        }
      });
  }

  /**
   * Navigate back
   */
  goBack(): void {
    this.router.navigate(['/admin/tracer-survey']);
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'Employed': 'bg-green-100 text-green-800',
      'Self-employed': 'bg-purple-100 text-purple-800',
      'Unemployed': 'bg-red-100 text-red-800',
      'Pursuing further studies': 'bg-blue-100 text-blue-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
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
   * Show success message
   */
  private showSuccess(message: string): void {
    alert(message);
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    alert(message);
  }
}