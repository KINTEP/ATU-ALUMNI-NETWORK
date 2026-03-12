export interface ConnectionRequest {
  id: number;
  sender_id: number;
  receiver_id: number;
  sender_name?: string;
  sender_email?: string;
  sender_picture?: string;
  sender_company?: string;
  sender_title?: string;
  sender_graduation_year?: number;
  sender_program?: string;
  receiver_name?: string;
  receiver_email?: string;
  receiver_picture?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  message?: string;
  requested_at: string;
  responded_at?: string;
}

export interface Connection {
  connection_id: number;
  connected_at: string;
  user: {
    id: number;
    name: string;
    email: string;
    profile_picture?: string;
    company?: string;
    title?: string;
    graduation_year?: number;
    program_of_study?: string;
    skills?: string[];
  };
}

export interface ConnectionStats {
  total_connections: number;
  pending_requests: number;
  sent_requests: number;
}