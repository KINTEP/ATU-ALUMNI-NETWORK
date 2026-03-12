// src/app/models/user.ts

/**
 * Main User Interface
 */
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  other_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  student_id?: string;
  graduation_year?: number;
  program_of_study?: string;
  major?: string;
  faculty?: string;
  department?: string;
  current_company?: string;
  job_title?: string;
  industry?: string;
  years_of_experience?: number;
  current_city?: string;
  current_country?: string;
  hometown?: string;
  bio?: string;
  profile_picture?: string;
  cover_photo?: string;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  website_url?: string;
  skills?: string[];
  interests?: string[];
  role: 'alumni' | 'admin' | 'staff';
  is_verified: boolean;
  is_active: boolean;
  email_verified: boolean;
  profile_visibility?: 'public' | 'private' | 'connections_only';
  show_email?: boolean;
  show_phone?: boolean;
  last_login?: string;
  created_at: string;
  updated_at?: string;
  location?: string;
}

/**
 * Login Request Interface
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Register Request Interface
 */
export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  other_name?: string;
  phone_number?: string;
  role?: 'alumni' | 'admin' | 'staff';
}

/**
 * Auth Response Interface
 */
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

/**
 * Change Password Request Interface
 */
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

/**
 * Password Reset Request Interface
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Reset Password Request Interface
 */
export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

/**
 * Create User Request Interface (for admin)
 */
export interface CreateUserRequest {
  // Basic Info (Required)
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'alumni' | 'admin' | 'staff';
  
  // Optional Basic Info
  other_name?: string;
  phone_number?: string;
  
  // Academic Info
  faculty?: string;
  department?: string;
  program_of_study?: string;
  major?: string; // ✅ ADDED THIS
  graduation_year?: number;
  student_id?: string;
  
  // Professional Info
  current_company?: string;
  job_title?: string;
  
  // Location Info
  current_city?: string;
  current_country?: string;
  
  // Settings
  email_verified?: boolean;
  is_active?: boolean;
  send_welcome_email?: boolean;
  add_to_mailing_list?: boolean;
}

/**
 * User Query Parameters Interface
 */
export interface UserQueryParams {
  role?: string;
  graduation_year?: number;
  program_of_study?: string;
  major?: string;
  faculty?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * User Update Request Interface
 */
export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  other_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  graduation_year?: number;
  program_of_study?: string;
  major?: string;
  faculty?: string;
  department?: string;
  current_company?: string;
  job_title?: string;
  industry?: string;
  years_of_experience?: number;
  current_city?: string;
  current_country?: string;
  hometown?: string;
  bio?: string;
  profile_picture?: string;
  cover_photo?: string;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  website_url?: string;
  skills?: string[];
  interests?: string[];
  profile_visibility?: 'public' | 'private' | 'connections_only';
  show_email?: boolean;
  show_phone?: boolean;
}