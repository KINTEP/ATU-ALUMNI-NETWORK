// src/app/models/message.ts
export interface Conversation {
  conversation_id: number;
  other_user_id: number;
  other_user_name: string;
  other_user_picture?: string;
  unread_count: number;
  is_archived: boolean;
  is_blocked: boolean;
  last_message_at: string;
  last_message_preview?: string;
  conversation_created_at: string;
  is_online?: boolean;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  sender_picture?: string;
  message_text: string;
  attachment_url?: string;
  attachment_type?: string;
  attachment_name?: string;
  attachment_size?: number;
  is_read: boolean;
  read_at?: string;
  is_edited: boolean;
  is_deleted_by_sender: boolean;
  is_deleted_by_receiver: boolean;
  created_at: string;
  updated_at: string;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: number;
  user_id: number;
  reaction_type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';
  created_at: string;
}

export interface TypingIndicator {
  conversation_id: number;
  user_id: number;
  user_name: string;
  started_at: string;
  expires_at: string;
}

export interface MessagingStats {
  total_conversations: number;
  messages_sent: number;
  messages_received: number;
  unread_messages: number;
}