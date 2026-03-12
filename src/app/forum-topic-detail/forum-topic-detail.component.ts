// src/app/components/forum-topic-detail/forum-topic-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ForumService } from '../../services/forum.service';
import { AuthService } from '../../services/auth.service';
import { ImageService } from '../../services/image.service'; // ✅ Add this
import { ForumPost, ForumReply } from '../../models/forum';
import { User } from '../../models/user';
import { ApiResponse } from '../../models/api-response';

@Component({
  selector: 'app-forum-topic-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forum-topic-detail.component.html',
  styleUrl: './forum-topic-detail.component.scss'
})
export class ForumTopicDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  post: ForumPost | null = null;
  replies: ForumReply[] = [];
  currentUser: User | null = null;
  
  // Form data
  replyContent: string = '';
  replyToId: number | null = null;
  replyToName: string = '';
  
  // Loading states
  isLoading: boolean = false;
  isLoadingReplies: boolean = false;
  isSubmitting: boolean = false;
  
  // Error handling
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forumService: ForumService,
    private authService: AuthService,
    private imageService: ImageService // ✅ Inject ImageService
  ) {}

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
    });

    // Get post ID from route
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const postId = +params['id'];
      if (postId) {
        this.loadPost(postId);
        this.loadReplies(postId);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load post details
   */
  loadPost(postId: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    const currentUserId = this.currentUser?.id;

    this.forumService.getPostById(postId, currentUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.post = response.data;
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading post:', error);
          this.errorMessage = 'Failed to load post details';
          this.isLoading = false;
        }
      });
  }

  /**
   * Load replies for the post
   */
  loadReplies(postId: number): void {
    this.isLoadingReplies = true;
    const currentUserId = this.currentUser?.id;

    this.forumService.getPostReplies(postId, 1, 50, currentUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.replies = this.organizeReplies(response.data);
          }
          this.isLoadingReplies = false;
        },
        error: (error) => {
          console.error('Error loading replies:', error);
          this.isLoadingReplies = false;
        }
      });
  }

  /**
   * Organize replies into nested structure
   */
  organizeReplies(replies: ForumReply[]): ForumReply[] {
    const repliesMap = new Map<number, ForumReply & { nested_replies: ForumReply[] }>();
    const topLevelReplies: ForumReply[] = [];

    // First pass: create map of all replies
    replies.forEach(reply => {
      repliesMap.set(reply.id, { ...reply, nested_replies: [] });
    });

    // Second pass: organize into tree structure
    replies.forEach(reply => {
      const replyWithNested = repliesMap.get(reply.id);
      if (replyWithNested) {
        if (reply.parent_reply_id) {
          const parent = repliesMap.get(reply.parent_reply_id);
          if (parent && parent.nested_replies) {
            parent.nested_replies.push(replyWithNested);
          }
        } else {
          topLevelReplies.push(replyWithNested);
        }
      }
    });

    return topLevelReplies;
  }

  /**
   * Toggle like on post
   */
  togglePostLike(): void {
    if (!this.post || !this.currentUser) {
      alert('Please login to like posts');
      this.router.navigate(['/login']);
      return;
    }

    if (this.post.user_has_liked) {
      this.forumService.unlikePost(this.post.id, this.currentUser.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success && this.post) {
              this.post.user_has_liked = false;
              this.post.likes_count--;
            }
          },
          error: (error) => console.error('Error unliking post:', error)
        });
    } else {
      this.forumService.likePost(this.post.id, this.currentUser.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success && this.post) {
              this.post.user_has_liked = true;
              this.post.likes_count++;
            }
          },
          error: (error) => console.error('Error liking post:', error)
        });
    }
  }

  /**
   * Toggle like on reply
   */
  toggleReplyLike(reply: ForumReply): void {
    if (!this.currentUser || !this.post) {
      alert('Please login to like replies');
      this.router.navigate(['/login']);
      return;
    }

    if (reply.user_has_liked) {
      this.forumService.unlikeReply(this.post.id, reply.id, this.currentUser.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              reply.user_has_liked = false;
              reply.likes_count--;
            }
          },
          error: (error) => console.error('Error unliking reply:', error)
        });
    } else {
      this.forumService.likeReply(this.post.id, reply.id, this.currentUser.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              reply.user_has_liked = true;
              reply.likes_count++;
            }
          },
          error: (error) => console.error('Error liking reply:', error)
        });
    }
  }

  /**
   * Submit reply
   */
  submitReply(): void {
    if (!this.post || !this.currentUser) {
      alert('Please login to reply');
      this.router.navigate(['/login']);
      return;
    }

    if (!this.replyContent.trim()) {
      alert('Please enter a reply');
      return;
    }

    this.isSubmitting = true;

    const replyData = {
      post_id: this.post.id,
      content: this.replyContent.trim(),
      parent_reply_id: this.replyToId || undefined
    };

    this.forumService.createReply(replyData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ApiResponse<ForumReply>) => {
          if (response.success) {
            // Clear form
            this.replyContent = '';
            this.replyToId = null;
            this.replyToName = '';

            // Reload replies
            this.loadReplies(this.post!.id);

            // Update reply count
            if (this.post) {
              this.post.replies_count++;
            }

            alert('Reply posted successfully!');
          }
          this.isSubmitting = false;
        },
        error: (error: any) => {
          console.error('Error posting reply:', error);
          alert('Failed to post reply');
          this.isSubmitting = false;
        }
      });
  }

  /**
   * Set reply target (for nested replies)
   */
  replyTo(reply: ForumReply): void {
    this.replyToId = reply.id;
    this.replyToName = reply.author_name || 'User';
    // Scroll to reply form
    document.getElementById('reply-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Cancel reply to
   */
  cancelReplyTo(): void {
    this.replyToId = null;
    this.replyToName = '';
  }

  /**
   * Go back to forum
   */
  goBack(): void {
    this.router.navigate(['/forum']);
  }

  /**
   * Get time ago string
   */
  getTimeAgo(date: string): string {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return postDate.toLocaleDateString();
  }

  /**
   * Get author initials
   */
  getAuthorInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  /**
   * Get category color
   */
  getCategoryColor(): string {
    return this.post?.category_color || '#3B82F6';
  }

  /**
   * Get avatar color for replies
   */
  getAvatarColor(index: number): string {
    const colors = [
      'from-blue-600 to-indigo-600',
      'from-indigo-600 to-purple-600',
      'from-purple-600 to-pink-600',
      'from-pink-600 to-red-600',
      'from-red-600 to-orange-600',
      'from-orange-600 to-yellow-600'
    ];
    return colors[index % colors.length];
  }


  /**
   * Get profile picture URL
   */
  getProfilePictureUrl(picturePath: string | null | undefined): string {
    return this.imageService.getProfilePictureUrl(picturePath);
  }

  /**
   * Check if user has profile picture
   */
  hasProfilePicture(picturePath: string | null | undefined): boolean {
    return this.imageService.hasImage(picturePath);
  }
}