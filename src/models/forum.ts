// src/app/models/forum.ts
export interface ForumCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  color?: string;
  order_position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  posts_count?: number;
}

export interface ForumPost {
  id: number;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  category_color?: string; // ✅ Added
  user_id: number;
  author_name?: string;
  author_email?: string;
  author_picture?: string;
  author_graduation_year?: number; // ✅ Added
  author_program?: string; // ✅ Added
  title: string;
  content: string;
  slug: string;
  tags?: string[];
  views_count: number;
  replies_count: number;
  likes_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  is_published: boolean;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
  user_has_liked?: boolean;
  user_is_subscribed?: boolean;
}

export interface ForumReply {
  id: number;
  post_id: number;
  user_id: number;
  parent_reply_id?: number;
  author_name?: string;
  author_picture?: string;
  author_graduation_year?: number;
  author_job_title?: string; // ✅ Added
  author_company?: string; // ✅ Added
  content: string;
  likes_count: number;
  is_solution: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  replies_count?: number;
  user_has_liked?: boolean;
  nested_replies?: ForumReply[]; // ✅ Added for nested structure
}

export interface ForumStats {
  total_posts: number;
  total_replies: number;
  total_categories: number;
  new_posts_last_week: number;
  posts_by_category: Array<{
    category_name: string;
    post_count: number;
  }>;
  most_active_users: Array<{
    user_name: string;
    post_count: number;
  }>;
  most_popular_posts: Array<{
    id: number;
    title: string;
    views_count: number;
    replies_count: number;
    likes_count: number;
  }>;
}