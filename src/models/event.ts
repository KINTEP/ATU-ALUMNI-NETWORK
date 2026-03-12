export interface AlumniEvent {
  user_rsvp_status: import("./user").User | null;
  id: number;
  created_by: number;
  created_by_name?: string;
  title: string;
  description: string;
  event_type: 'Networking' | 'Workshop' | 'Conference' | 'Social' | 'Fundraiser' | 'Webinar' | 'Career Fair' | 'Reunion' | 'Sports' | 'Other';
  category?: string;
  start_date: string;
  end_date: string;
  location: string;
  location_type: 'In-person' | 'Virtual' | 'Hybrid';
  venue_name?: string;
  meeting_link?: string;
  event_image?: string;
  capacity?: number;
  registration_deadline?: string;
  is_free: boolean;
  ticket_price?: number;
  currency?: string;
  organizer_name?: string;
  organizer_email?: string;
  rsvp_count: number;
  views_count: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
}


export interface EventComment {
  id: number;
  event_id: number;
  user_id: number;
  parent_comment_id?: number;
  comment: string;
  likes_count: number;
  is_deleted: boolean;
  created_at: string;
  
  // User info
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  
  // Additional info
  reply_count?: number;
  user_has_liked?: boolean;
}