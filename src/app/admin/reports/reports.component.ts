import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { TracerStudyAnalytics } from '../../../models/tracer-study';
import { TracerStudyService } from '../../../services/tracer-study.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  analytics: TracerStudyAnalytics | null = null;
  loading = true;
  error: string | null = null;

  // Computed statistics
  employmentRate = 0;
  avgSkillsRelevance = 0;
  programmeQualityRate = 0;
  responseRate = 0;
  totalGraduates = 0;

  // Data for charts/displays
  graduationYearData: Array<{ year: number; count: number; percentage: number }> = [];
  programmeData: Array<{ programme: string; count: number; percentage: number }> = [];
  employmentStatusData: Array<{ status: string; count: number; percentage: number }> = [];
  timeToJobData: Array<{ time: string; count: number; percentage: number }> = [];
  jobFindingData: Array<{ method: string; count: number; percentage: number }> = [];
  jobRelevanceData: Array<{ relevance: string; count: number; percentage: number }> = [];
  skillsRatingData: Array<{ rating: number; count: number; percentage: number }> = [];
  sectorData: Array<{ sector: string; count: number; percentage: number }> = [];

  

  constructor(private tracerStudyService: TracerStudyService) {}

  ngOnInit() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.loading = true;
    this.error = null;

    this.tracerStudyService.getAnalytics().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.analytics = response.data;
          this.processAnalyticsData();
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        this.error = 'Failed to load analytics data. Please try again later.';
        this.loading = false;
      }
    });
  }

  processAnalyticsData() {
    if (!this.analytics) return;

    const overview = this.analytics.overview;
    
    // Calculate employment rate
    const totalEmployed = (overview.employed_count || 0) + (overview.self_employed_count || 0);
    this.employmentRate = overview.total_responses > 0 
      ? Math.round((totalEmployed / overview.total_responses) * 100) 
      : 0;

    // Skills relevance (already in format 0-5)
    this.avgSkillsRelevance = overview.avg_skills_relevance || 0;

    // Programme quality rate (percentage who would recommend)
    this.programmeQualityRate = overview.total_responses > 0
      ? Math.round((overview.would_recommend_count / overview.total_responses) * 100)
      : 0;

    // Response rate (mock calculation - you'd need to track total eligible alumni)
    this.totalGraduates = overview.total_responses;
    this.responseRate = 68.5; // You can calculate this based on your total alumni count

    // Process graduation year data
    this.graduationYearData = this.analytics.responses_by_year.map(item => ({
      year: item.year_of_graduation,
      count: item.count,
      percentage: Math.round((item.count / overview.total_responses) * 100)
    }));

    // Process programme data
    const totalProgrammeResponses = this.analytics.employment_by_programme.reduce(
      (sum, item) => sum + item.total_responses, 0
    );
    this.programmeData = this.analytics.employment_by_programme.map(item => ({
      programme: item.programme_of_study,
      count: item.total_responses,
      percentage: Math.round((item.total_responses / totalProgrammeResponses) * 100)
    }));

    // Process employment status data
    this.employmentStatusData = [
      {
        status: 'Employed',
        count: overview.employed_count,
        percentage: Math.round((overview.employed_count / overview.total_responses) * 100)
      },
      {
        status: 'Self-employed',
        count: overview.self_employed_count,
        percentage: Math.round((overview.self_employed_count / overview.total_responses) * 100)
      },
      {
        status: 'Further Studies',
        count: overview.further_studies_count,
        percentage: Math.round((overview.further_studies_count / overview.total_responses) * 100)
      },
      {
        status: 'Unemployed',
        count: overview.unemployed_count,
        percentage: Math.round((overview.unemployed_count / overview.total_responses) * 100)
      }
    ];

    // Process time to job data
    const totalTimeToJob = this.analytics.time_to_employment.reduce(
      (sum, item) => sum + item.count, 0
    );
    this.timeToJobData = this.analytics.time_to_employment.map(item => ({
      time: item.time_to_first_job,
      count: item.count,
      percentage: Math.round((item.count / totalTimeToJob) * 100)
    }));

    // Process job relevance data
    const totalJobRelevance = this.analytics.job_relevance.reduce(
      (sum, item) => sum + item.count, 0
    );
    this.jobRelevanceData = this.analytics.job_relevance.map(item => ({
      relevance: item.job_related_to_field,
      count: item.count,
      percentage: Math.round((item.count / totalJobRelevance) * 100)
    }));

    // Process sector data
    const totalSector = this.analytics.employment_by_sector.reduce(
      (sum, item) => sum + item.count, 0
    );
    this.sectorData = this.analytics.employment_by_sector.map(item => ({
      sector: item.sector,
      count: item.count,
      percentage: Math.round((item.count / totalSector) * 100)
    }));
  }

  // Helper method to get status color
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Employed': 'bg-green-500',
      'Self-employed': 'bg-blue-500',
      'Further Studies': 'bg-yellow-500',
      'Unemployed': 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  }

  // Helper method to format numbers
  formatNumber(num: number): string {
    return new Intl.NumberFormat().format(num);
  }

  get currentDate(): string {
  return new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long'
  });
}
}