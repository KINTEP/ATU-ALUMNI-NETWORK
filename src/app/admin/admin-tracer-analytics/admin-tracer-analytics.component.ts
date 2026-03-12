// src/app/admin/admin-tracer-analytics/admin-tracer-analytics.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { SidebarComponent } from "../sidebar/sidebar.component";
import { TracerStudyService } from '../../../services/tracer-study.service';
import { TracerStudyAnalytics } from '../../../models/tracer-study';
import { AuthService } from '../../../services/auth.service';

// Chart.js imports
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

interface ChartData {
  labels: string[];
  datasets: {
    label?: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

@Component({
  selector: 'app-admin-tracer-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './admin-tracer-analytics.component.html',
  styleUrl: './admin-tracer-analytics.component.scss'
})
export class AdminTracerAnalyticsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private charts: { [key: string]: Chart } = {};

  // Data
  analytics: TracerStudyAnalytics | null = null;
  
  // Loading states
  isLoading = false;

  // Chart colors
  private readonly chartColors = {
    primary: '#1a73e8',
    accent: '#f59e0b',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    purple: '#8b5cf6',
    pink: '#ec4899',
    teal: '#14b8a6',
    orange: '#f97316'
  };

  private readonly multiColors = [
    '#1a73e8', '#10b981', '#f59e0b', '#8b5cf6', 
    '#ec4899', '#14b8a6', '#ef4444', '#3b82f6',
    '#f97316', '#6366f1', '#84cc16', '#06b6d4'
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

    this.loadAnalytics();
  }

  ngOnDestroy(): void {
    // Destroy all charts
    Object.values(this.charts).forEach(chart => chart.destroy());
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load analytics data
   */
  loadAnalytics(): void {
    this.isLoading = true;

    this.tracerService.getAnalytics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.analytics = response.data;
            
            // Wait for DOM to render, then create charts
            setTimeout(() => {
              this.createAllCharts();
            }, 100);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading analytics:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Create all charts
   */
  private createAllCharts(): void {
    // Section 1: Demographics
    this.createGenderChart();
    this.createAgeRangeChart();
    this.createLocationTypeChart();
    this.createProgrammeOfStudyChart();
    this.createGraduationYearChart();
    
    // Section 2: Current Status
    this.createCurrentStatusChart();
    this.createEmploymentTypeChart();
    this.createTimeToJobChart();
    this.createSectorChart();
    this.createIndustryChart();
    this.createJobRelatedChart();
    this.createIncomeRangeChart();
    this.createHowFoundJobChart();
    this.createJobLevelChart();
    
    // Section 3: Self-Employment
    this.createBusinessSectorChart();
    
    // Section 4: Unemployment
    this.createUnemploymentDurationChart();
    this.createMainChallengeChart();
    
    // Section 5: Further Studies
    this.createFurtherStudyTypeChart();
    this.createStudyFieldChart();
    
    // Section 6: Skills & Satisfaction
    this.createSkillsRelevanceChart();
    this.createJobSatisfactionChart();
    this.createProgrammeQualityChart();
    this.createRecommendationChart();
    
    // Section 7: Alumni Engagement
    this.createAlumniMemberChart();
    this.createMentoringChart();
    this.createCollaborationChart();
    this.createContactMethodChart();
    
    // Section 8: Programme Analysis
    this.createProgrammeDistributionChart();
    this.createEmploymentByProgrammeChart();
  }

  // ===========================================
  // SECTION 1: DEMOGRAPHICS CHARTS
  // ===========================================

  private createGenderChart(): void {
    const canvas = document.getElementById('genderChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    // TODO: Replace with actual data from analytics
    const data = {
      labels: ['Male', 'Female', 'Prefer not to say'],
      datasets: [{
        data: [45, 50, 5],
        backgroundColor: [this.chartColors.primary, this.chartColors.accent, this.chartColors.info],
        borderWidth: 0
      }]
    };

    this.createPieChart(canvas, data, 'Gender Distribution');
  }

  private createAgeRangeChart(): void {
    const canvas = document.getElementById('ageRangeChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    // TODO: Replace with actual data from analytics
    const data = {
      labels: ['20-25', '26-30', '31-35', '36-40', '41+'],
      datasets: [{
        label: 'Respondents',
        data: [30, 45, 15, 7, 3],
        backgroundColor: this.chartColors.primary,
        borderWidth: 0
      }]
    };

    this.createBarChart(canvas, data, 'Age Range Distribution');
  }

  private createLocationTypeChart(): void {
    const canvas = document.getElementById('locationTypeChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    // TODO: Replace with actual data from analytics
    const data = {
      labels: ['In Ghana', 'Outside Ghana'],
      datasets: [{
        data: [85, 15],
        backgroundColor: [this.chartColors.success, this.chartColors.info],
        borderWidth: 0
      }]
    };

    this.createPieChart(canvas, data, 'Location Distribution');
  }

  private createProgrammeOfStudyChart(): void {
    const canvas = document.getElementById('programmeOfStudyChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    const programmes = this.analytics.employment_by_programme || [];
    
    // Get top 10 programmes by response count
    const topProgrammes = programmes
      .sort((a, b) => b.total_responses - a.total_responses)
      .slice(0, 10);

    const data = {
      labels: topProgrammes.map(p => p.programme_of_study),
      datasets: [{
        label: 'Total Responses',
        data: topProgrammes.map(p => p.total_responses),
        backgroundColor: this.chartColors.primary,
        borderWidth: 0
      }]
    };

    this.createBarChart(canvas, data, 'Top 10 Programmes by Responses', true);
  }

  private createGraduationYearChart(): void {
    const canvas = document.getElementById('graduationYearChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    // TODO: Replace with actual data from analytics
    // This should come from backend aggregation: responses grouped by year_of_graduation
    const data = {
      labels: ['2024', '2023', '2022', '2021', '2020', '2019', '2018', 'Earlier'],
      datasets: [{
        label: 'Graduates',
        data: [45, 38, 32, 28, 22, 18, 15, 12],
        backgroundColor: this.chartColors.info,
        borderWidth: 0
      }]
    };

    this.createBarChart(canvas, data, 'Responses by Graduation Year');
  }

  // ===========================================
  // SECTION 2: CURRENT STATUS CHARTS
  // ===========================================

  private createCurrentStatusChart(): void {
    const canvas = document.getElementById('currentStatusChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    const overview = this.analytics.overview;
    const data = {
      labels: ['Employed', 'Self-employed', 'Unemployed', 'Further Studies'],
      datasets: [{
        data: [
          Number(overview.employed_count) || 0,
          Number(overview.self_employed_count) || 0,
          Number(overview.unemployed_count) || 0,
          Number(overview.further_studies_count) || 0
        ],
        backgroundColor: [
          this.chartColors.success,
          this.chartColors.purple,
          this.chartColors.danger,
          this.chartColors.info
        ],
        borderWidth: 0
      }]
    };

    this.createPieChart(canvas, data, 'Current Employment Status');
  }

  private createEmploymentTypeChart(): void {
    const canvas = document.getElementById('employmentTypeChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    // TODO: Replace with actual data from analytics
    const data = {
      labels: ['Full-time (30+ hrs/week)', 'Part-time (<30 hrs/week)', 'Contract/Project-based'],
      datasets: [{
        label: 'Employees',
        data: [70, 20, 10],
        backgroundColor: this.chartColors.primary,
        borderWidth: 0
      }]
    };

    this.createBarChart(canvas, data, 'Employment Type Distribution');
  }

  private createTimeToJobChart(): void {
    const canvas = document.getElementById('timeToJobChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    // TODO: Replace with actual data from analytics
    const data = {
      labels: ['<3 months', '3-6 months', '6-12 months', '>1 year'],
      datasets: [{
        label: 'Alumni',
        data: [40, 30, 20, 10],
        backgroundColor: this.chartColors.success,
        borderWidth: 0
      }]
    };

    this.createBarChart(canvas, data, 'Time to First Job After Graduation');
  }

  private createSectorChart(): void {
    const canvas = document.getElementById('sectorChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    // TODO: Replace with actual data from analytics
    const data = {
      labels: ['Public', 'Private', 'NGO', 'International Org', 'Other'],
      datasets: [{
        data: [25, 55, 10, 7, 3],
        backgroundColor: this.multiColors.slice(0, 5),
        borderWidth: 0
      }]
    };

    this.createPieChart(canvas, data, 'Employment Sector Distribution');
  }

  private createIndustryChart(): void {
    const canvas = document.getElementById('industryChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    // TODO: Replace with actual data from analytics
    const data = {
      labels: [
        'Finance/Banking',
        'Information Technology',
        'Education',
        'Healthcare/Medical',
        'Manufacturing',
        'Construction/Real Estate',
        'Other'
      ],
      datasets: [{
        label: 'Employees',
        data: [20, 25, 15, 12, 10, 8, 10],
        backgroundColor: this.chartColors.accent,
        borderWidth: 0
      }]
    };

    this.createBarChart(canvas, data, 'Industry Distribution', true);
  }

  private createJobRelatedChart(): void {
    const canvas = document.getElementById('jobRelatedChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    // TODO: Replace with actual data from analytics
    const data = {
      labels: ['Directly related', 'Partly related', 'Not related'],
      datasets: [{
        data: [60, 30, 10],
        backgroundColor: [this.chartColors.success, this.chartColors.warning, this.chartColors.danger],
        borderWidth: 0
      }]
    };

    this.createPieChart(canvas, data, 'Job Related to Field of Study');
  }

  private createIncomeRangeChart(): void {
    const canvas = document.getElementById('incomeRangeChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    // TODO: Replace with actual data from analytics
    const data = {
      labels: ['<GHS 2,000', 'GHS 2,000-4,999', 'GHS 5,000-9,999', 'GHS 10,000+', 'Prefer not to say'],
      datasets: [{
        label: 'Employees',
        data: [15, 35, 30, 15, 5],
        backgroundColor: this.chartColors.success,
        borderWidth: 0
      }]
    };

    this.createBarChart(canvas, data, 'Monthly Income Range Distribution');
  }

  private createHowFoundJobChart(): void {
    const canvas = document.getElementById('howFoundJobChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    // TODO: Replace with actual data from analytics
    const data = {
      labels: [
        'Personal contacts/networking',
        'Online job portal',
        'ATU career office/lecturers',
        'Social media',
        'Internship placement',
        'Direct application',
        'Other'
      ],
      datasets: [{
        label: 'Alumni',
        data: [30, 25, 15, 10, 10, 8, 2],
        backgroundColor: this.chartColors.info,
        borderWidth: 0
      }]
    };

    this.createBarChart(canvas, data, 'How Alumni Found Their First Job', true);
  }

  private createJobLevelChart(): void {
    const canvas = document.getElementById('jobLevelChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    // TODO: Replace with actual data from analytics
    const data = {
      labels: ['Entry-level', 'Mid-level', 'Senior-level', 'Management/Executive'],
      datasets: [{
        data: [45, 35, 15, 5],
        backgroundColor: this.multiColors.slice(0, 4),
        borderWidth: 0
      }]
    };

    this.createPieChart(canvas, data, 'Current Job Level Distribution');
  }

  // ===========================================
  // SECTION 3: SELF-EMPLOYMENT CHARTS
  // ===========================================

  private createBusinessSectorChart(): void {
    const canvas = document.getElementById('businessSectorChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    // TODO: Replace with actual data from analytics
    const data = {
      labels: ['Services', 'Trading/Retail', 'Technology/IT', 'Manufacturing', 'Agriculture', 'Creative Arts', 'Other'],
      datasets: [{
        label: 'Businesses',
        data: [30, 25, 20, 10, 8, 5, 2],
        backgroundColor: this.chartColors.purple,
        borderWidth: 0
      }]
    };

    this.createBarChart(canvas, data, 'Self-Employment Business Sectors', true);
  }

  // ===========================================
  // SECTION 4: UNEMPLOYMENT CHARTS
  // ===========================================

  private createUnemploymentDurationChart(): void {
    const canvas = document.getElementById('unemploymentDurationChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    // TODO: Replace with actual data from analytics
    const data = {
      labels: ['<3 months', '3-6 months', '6-12 months', '>1 year', 'Not actively seeking'],
      datasets: [{
        label: 'Alumni',
        data: [20, 30, 25, 15, 10],
        backgroundColor: this.chartColors.danger,
        borderWidth: 0
      }]
    };

    this.createBarChart(canvas, data, 'Duration of Unemployment');
  }

  private createMainChallengeChart(): void {
    const canvas = document.getElementById('mainChallengeChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    // TODO: Replace with actual data from analytics
    const data = {
      labels: [
        'Finding suitable opportunities',
        'Lack of practical experience',
        'Low salary offers',
        'Jobs not related to field',
        'Location/relocation issues',
        'Other'
      ],
      datasets: [{
        label: 'Alumni',
        data: [35, 25, 15, 12, 8, 5],
        backgroundColor: this.chartColors.warning,
        borderWidth: 0
      }]
    };

    this.createBarChart(canvas, data, 'Main Challenges After Graduation', true);
  }

  // ===========================================
  // SECTION 5: FURTHER STUDIES CHARTS
  // ===========================================

  private createFurtherStudyTypeChart(): void {
    const canvas = document.getElementById('furtherStudyTypeChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    // TODO: Replace with actual data from analytics
    const data = {
      labels: ["Master's degree", 'PhD', 'Professional certification', 'Postgraduate Diploma', 'Other'],
      datasets: [{
        data: [50, 20, 20, 8, 2],
        backgroundColor: this.multiColors.slice(0, 5),
        borderWidth: 0
      }]
    };

    this.createPieChart(canvas, data, 'Type of Further Studies Programme');
  }

  private createStudyFieldChart(): void {
    const canvas = document.getElementById('studyFieldChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    // TODO: Replace with actual data from analytics
    const data = {
      labels: ['Same as ATU programme', 'Related field', 'Different field'],
      datasets: [{
        data: [55, 35, 10],
        backgroundColor: [this.chartColors.success, this.chartColors.warning, this.chartColors.info],
        borderWidth: 0
      }]
    };

    this.createPieChart(canvas, data, 'Further Studies Field Relation');
  }

  // ===========================================
  // SECTION 6: SKILLS & SATISFACTION CHARTS
  // ===========================================

  private createSkillsRelevanceChart(): void {
    const canvas = document.getElementById('skillsRelevanceChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    const avgRating = Number(this.analytics.overview.avg_skills_relevance) || 0;
    
    const data = {
      labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
      datasets: [{
        label: 'Respondents',
        data: [5, 10, 20, 35, 30], // TODO: Replace with actual distribution
        backgroundColor: this.chartColors.primary,
        borderWidth: 0
      }]
    };

    this.createBarChart(canvas, data, `Skills Relevance Rating (Avg: ${avgRating.toFixed(1)}/5)`);
  }

  private createJobSatisfactionChart(): void {
    const canvas = document.getElementById('jobSatisfactionChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    const avgRating = Number(this.analytics.overview.avg_job_satisfaction) || 0;
    
    const data = {
      labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
      datasets: [{
        label: 'Respondents',
        data: [3, 7, 15, 40, 35], // TODO: Replace with actual distribution
        backgroundColor: this.chartColors.success,
        borderWidth: 0
      }]
    };

    this.createBarChart(canvas, data, `Job Satisfaction Rating (Avg: ${avgRating.toFixed(1)}/5)`);
  }

  private createProgrammeQualityChart(): void {
    const canvas = document.getElementById('programmeQualityChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    // TODO: Replace with actual data from analytics
    const data = {
      labels: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'],
      datasets: [{
        data: [40, 35, 20, 4, 1],
        backgroundColor: this.multiColors.slice(0, 5),
        borderWidth: 0
      }]
    };

    this.createPieChart(canvas, data, 'Programme Quality Rating');
  }

  private createRecommendationChart(): void {
    const canvas = document.getElementById('recommendationChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    // TODO: Replace with actual data from analytics
    const data = {
      labels: ['Definitely yes', 'Probably yes', 'Not sure', 'Probably not', 'Definitely not'],
      datasets: [{
        data: [50, 30, 12, 5, 3],
        backgroundColor: [
          this.chartColors.success,
          this.chartColors.info,
          this.chartColors.warning,
          this.chartColors.orange,
          this.chartColors.danger
        ],
        borderWidth: 0
      }]
    };

    this.createPieChart(canvas, data, 'Would Recommend ATU to Others');
  }

  // ===========================================
  // SECTION 7: ALUMNI ENGAGEMENT CHARTS
  // ===========================================

  private createAlumniMemberChart(): void {
    const canvas = document.getElementById('alumniMemberChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    // TODO: Replace with actual data from analytics
    const data = {
      labels: ['Yes', 'No'],
      datasets: [{
        data: [65, 35],
        backgroundColor: [this.chartColors.success, this.chartColors.danger],
        borderWidth: 0
      }]
    };

    this.createPieChart(canvas, data, 'Alumni Association Membership');
  }

  private createMentoringChart(): void {
    const canvas = document.getElementById('mentoringChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    // TODO: Replace with actual data from analytics
    const data = {
      labels: ['Yes', 'No', 'Maybe'],
      datasets: [{
        data: [55, 25, 20],
        backgroundColor: [this.chartColors.success, this.chartColors.danger, this.chartColors.warning],
        borderWidth: 0
      }]
    };

    this.createPieChart(canvas, data, 'Willing to Mentor Current Students');
  }

  private createCollaborationChart(): void {
    const canvas = document.getElementById('collaborationChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    // TODO: Replace with actual data from analytics
    const data = {
      labels: ['Yes', 'No', 'Maybe'],
      datasets: [{
        data: [60, 20, 20],
        backgroundColor: [this.chartColors.success, this.chartColors.danger, this.chartColors.warning],
        borderWidth: 0
      }]
    };

    this.createPieChart(canvas, data, 'Willing to Collaborate with ATU');
  }

  private createContactMethodChart(): void {
    const canvas = document.getElementById('contactMethodChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    // TODO: Replace with actual data from analytics
    const data = {
      labels: ['Email', 'Phone', 'WhatsApp', 'LinkedIn', 'Other'],
      datasets: [{
        label: 'Alumni',
        data: [45, 20, 25, 8, 2],
        backgroundColor: this.chartColors.info,
        borderWidth: 0
      }]
    };

    this.createBarChart(canvas, data, 'Preferred Contact Method');
  }

  // ===========================================
  // SECTION 8: PROGRAMME ANALYSIS CHARTS
  // ===========================================

  private createProgrammeDistributionChart(): void {
    const canvas = document.getElementById('programmeDistributionChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    const programmes = this.analytics.employment_by_programme || [];
    
    const data = {
      labels: programmes.slice(0, 8).map(p => p.programme_of_study),
      datasets: [{
        label: 'Total Responses',
        data: programmes.slice(0, 8).map(p => p.total_responses),
        backgroundColor: this.chartColors.primary,
        borderWidth: 0
      }]
    };

    this.createBarChart(canvas, data, 'Top 8 Programmes by Responses', true);
  }

  private createEmploymentByProgrammeChart(): void {
    const canvas = document.getElementById('employmentByProgrammeChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics) return;

    const programmes = this.analytics.employment_by_programme || [];
    
    const data = {
      labels: programmes.slice(0, 8).map(p => p.programme_of_study),
      datasets: [
        {
          label: 'Employed',
          data: programmes.slice(0, 8).map(p => {
            const prog = p as any; // Type assertion to handle dynamic properties
            return Number(prog.employed_count) || 0;
          }),
          backgroundColor: this.chartColors.success,
          borderWidth: 0
        },
        {
          label: 'Self-employed',
          data: programmes.slice(0, 8).map(p => {
            const prog = p as any; // Type assertion to handle dynamic properties
            return Number(prog.self_employed_count) || 0;
          }),
          backgroundColor: this.chartColors.purple,
          borderWidth: 0
        },
        {
          label: 'Unemployed',
          data: programmes.slice(0, 8).map(p => {
            const prog = p as any; // Type assertion to handle dynamic properties
            return Number(prog.unemployed_count) || 0;
          }),
          backgroundColor: this.chartColors.danger,
          borderWidth: 0
        }
      ]
    };

    this.createStackedBarChart(canvas, data, 'Employment Status by Programme', true);
  }

  // ===========================================
  // CHART CREATION HELPER METHODS
  // ===========================================

  private createBarChart(canvas: HTMLCanvasElement, data: ChartData, title: string, horizontal: boolean = false): void {
    const chartId = canvas.id;
    
    // Destroy existing chart if it exists
    if (this.charts[chartId]) {
      this.charts[chartId].destroy();
    }

    this.charts[chartId] = new Chart(canvas, {
      type: horizontal ? 'bar' : 'bar',
      data: data,
      options: {
        indexAxis: horizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: title,
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y || context.parsed.x;
                return `${label}: ${value}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: !horizontal
            }
          },
          y: {
            grid: {
              display: horizontal
            },
            beginAtZero: true
          }
        }
      }
    });
  }

  private createPieChart(canvas: HTMLCanvasElement, data: ChartData, title: string): void {
    const chartId = canvas.id;
    
    // Destroy existing chart if it exists
    if (this.charts[chartId]) {
      this.charts[chartId].destroy();
    }

    this.charts[chartId] = new Chart(canvas, {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true
            }
          },
          title: {
            display: true,
            text: title,
            font: {
              size: 14,
              weight: 'bold'
            },
            padding: 20
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;
                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  private createStackedBarChart(canvas: HTMLCanvasElement, data: ChartData, title: string, horizontal: boolean = false): void {
    const chartId = canvas.id;
    
    // Destroy existing chart if it exists
    if (this.charts[chartId]) {
      this.charts[chartId].destroy();
    }

    this.charts[chartId] = new Chart(canvas, {
      type: 'bar',
      data: data,
      options: {
        indexAxis: horizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true
            }
          },
          title: {
            display: true,
            text: title,
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: {
              display: !horizontal
            }
          },
          y: {
            stacked: true,
            grid: {
              display: horizontal
            },
            beginAtZero: true
          }
        }
      }
    });
  }

  /**
   * Navigate back to tracer management
   */
  goBack(): void {
    this.router.navigate(['/admin/tracer-survey']);
  }

  /**
   * Calculate employment rate
   */
  get employmentRate(): number {
    if (!this.analytics?.overview) return 0;
    
    const overview = this.analytics.overview;
    const employed = Number(overview.employed_count) || 0;
    const selfEmployed = Number(overview.self_employed_count) || 0;
    const total = Number(overview.total_responses) || 1;
    
    return ((employed + selfEmployed) / total) * 100;
  }
}