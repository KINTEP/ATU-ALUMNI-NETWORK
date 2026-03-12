export interface NewsArticle {
  keywords: any;
  meta_description: any;
  id: number;
  author_id: number;
  author_name?: string;
  author_picture?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  category: 'Academic' | 'Career' | 'Social' | 'Alumni' | 'University' | 'General';
  tags?: string[];
  is_featured: boolean;
  is_published: boolean;
  views_count: number;
  likes_count: number;
  comments_count: number;
  user_has_liked?: boolean;
  published_at: string;
  created_at: string;
  updated_at?: string;
}

export interface NewsComment {
  id: number;
  news_id: number;
  user_id: number;
  author_name?: string;
  author_picture?: string;
  comment: string;
  likes_count: number;
  user_has_liked?: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at?: string;
}