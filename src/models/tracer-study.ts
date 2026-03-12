// src/app/models/tracer-study.ts

export interface TracerStudyResponse {
  id?: number;
  user_id: number;
  
  // Section 1: Personal Information
  full_name: string;
  index_number: string;
  programme_of_study: string;
  year_of_graduation: number;
  email: string;
  phone_number: string;
  
  // Section 2: Current Status
  current_status: 'Employed' | 'Self-employed' | 'Unemployed' | 'Pursuing further studies';
  time_to_first_job?: string;
  main_challenge?: string;
  
  // Section 3: Employment/Self-Employment (Conditional)
  job_title?: string;
  employer_name?: string;
  sector?: 'Public' | 'Private' | 'NGO' | 'Self-employed' | 'Other';
  job_related_to_field?: 'Yes' | 'Partly' | 'No';
  monthly_income_range?: string;
  how_found_job?: string;
  job_level?: 'Entry-level' | 'Middle-level' | 'Senior-level' | 'Management / Executive';
  
  // Section 4: Skills and Training
  skills_relevance_rating?: number;
  skills_to_strengthen?: string;
  job_satisfaction_rating?: number;
  
  // Section 5: Feedback on ATU
  programme_quality_rating?: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  internship_support_satisfaction?: 'Very satisfied' | 'Satisfied' | 'Dissatisfied';
  would_recommend_atu?: 'Yes' | 'Maybe' | 'No';
  
  // Section 6: Alumni Engagement
  is_alumni_member?: boolean;
  willing_to_mentor?: boolean;
  preferred_contact_method?: string;
  willing_to_collaborate?: boolean;
  
  // Metadata
  is_completed?: boolean;
  submitted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TracerStudyOverview {
  total_responses: number;
  total_programmes: number;
  employed_count: number;
  self_employed_count: number;
  unemployed_count: number;
  further_studies_count: number;
  avg_skills_relevance: number;
  avg_job_satisfaction: number;
  would_recommend_count: number;
  willing_to_mentor_count: number;
  employment_rate?: number;
}

export interface ProgrammeEmployment {
  unemployed_count: any;
  self_employed_count: any;
  programme_of_study: string;
  total_responses: number;
  employed_count: number;
  employment_rate: number;
}

export interface SectorDistribution {
  sector: string;
  count: number;
}

export interface TimeToEmployment {
  time_to_first_job: string;
  count: number;
}

export interface JobRelevance {
  job_related_to_field: string;
  count: number;
}

export interface IncomeDistribution {
  monthly_income_range: string;
  count: number;
}

export interface ResponsesByYear {
  year_of_graduation: number;
  count: number;
}

export interface MainChallenges {
  main_challenge: string;
  count: number;
}

export interface TracerStudyAnalytics {
  overview: TracerStudyOverview;
  employment_by_programme: ProgrammeEmployment[];
  employment_by_sector: SectorDistribution[];
  time_to_employment: TimeToEmployment[];
  job_relevance: JobRelevance[];
  income_distribution: IncomeDistribution[];
  responses_by_year: ResponsesByYear[];
  main_challenges: MainChallenges[];
}

export interface Mentor {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  programme_of_study: string;
  year_of_graduation: number;
  job_title: string;
  employer_name: string;
  sector: string;
  preferred_contact_method: string;
  profile_picture?: string;
}