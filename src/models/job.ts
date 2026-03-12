// src/app/models/job.ts
export interface Job {
  id: number;
  posted_by: number;
  posted_by_name?: string;
  posted_by_email?: string;
  
  // Company Information
  company_name: string;
  company_logo?: string;
  company_website?: string;
  industry?: string;
  
  // Job Details
  job_title: string;
  job_description: string;
  job_type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Temporary';
  location: string;
  location_type?: string;
  
  // Salary Information
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_period?: string;
  
  // Requirements
  experience_level?: string;
  education_required?: string;
  skills_required?: string[];
  
  // Job Details Arrays
  responsibilities?: string[];
  qualifications?: string[];
  benefits?: string[];
  
  // Application Information
  application_deadline?: string;
  application_url?: string;
  application_email?: string;
  positions_available?: number;
  
  // Metrics
  views_count: number;
  applications_count: number;
  
  // Status Flags
  is_featured: boolean;
  is_active: boolean;
  is_saved?: boolean;
  
  // Timestamps
  created_at: string;
  updated_at?: string;
}