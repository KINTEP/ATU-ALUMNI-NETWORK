export interface Notification {
  id: number;
  user_id: number;
  type: 'connection_request' | 'connection_accepted' | 'event_rsvp' | 'event_reminder' | 'job_application' | 'message' | 'forum_reply' | 'system';
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  metadata?: {
    sender_id?: number;
    sender_name?: string;
    event_id?: number;
    job_id?: number;
    [key: string]: any;
  };
}

export interface NotificationStats {
  total_unread: number;
  unread_by_type: {
    connection_request: number;
    connection_accepted: number;
    event_rsvp: number;
    event_reminder: number;
    job_application: number;
    message: number;
    forum_reply: number;
    system: number;
  };
}