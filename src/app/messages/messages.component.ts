// src/app/components/messages/messages.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, timer } from 'rxjs';
import { User } from '../../models/user';
import { Conversation, Message } from '../../models/message';
import { MessagingService } from '../../services/messaging.service';
import { AuthService } from '../../services/auth.service';
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss'
})
export class MessagesComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  private destroy$ = new Subject<void>();
  private typingTimeout: any;
  private lastMessageCount = 0;

  // User data
  currentUser: User | null = null;
  
  // Conversations
  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  
  // Messages
  messages: Message[] = [];
  newMessage: string = '';
  
  // Search
  searchQuery: string = '';
  
  // Loading states
  isLoadingConversations: boolean = false;
  isLoadingMessages: boolean = false;
  isSendingMessage: boolean = false;
  isInitialLoad: boolean = true;
  
  // Typing indicator
  isOtherUserTyping: boolean = false;
  otherUserTypingName: string = '';

  constructor(
    private messageService: MessagingService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private imageService: ImageService,
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadConversations();
      }
    });

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['user'] && this.currentUser) {
        const otherUserId = parseInt(params['user']);
        setTimeout(() => {
          this.createOrOpenConversation(otherUserId);
        }, 500);
      }
    });

    timer(10000, 10000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.selectedConversation && this.currentUser && !this.isInitialLoad) {
          this.refreshMessagesQuietly();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  createOrOpenConversation(otherUserId: number): void {
    if (!this.currentUser) return;

    const existingConv = this.conversations.find(c => c.other_user_id === otherUserId);
    
    if (existingConv) {
      this.selectConversation(existingConv);
    } else {
      this.messageService.getOrCreateConversationWithUser(this.currentUser.id, otherUserId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              const rawConv = response.data;
              const isUser1 = rawConv.user1_id === this.currentUser?.id;
              const otherUserId = isUser1 ? rawConv.user2_id : rawConv.user1_id;
              const otherUserName = isUser1 ? rawConv.user2_name : rawConv.user1_name;
              const otherUserPicture = isUser1 ? rawConv.user2_picture : rawConv.user1_picture;
              
              const conversation: Conversation = {
                conversation_id: rawConv.id,
                other_user_id: otherUserId,
                other_user_name: otherUserName || 'User',
                other_user_picture: otherUserPicture,
                unread_count: 0,
                is_archived: rawConv.is_archived_by_user1 || rawConv.is_archived_by_user2 || false,
                is_blocked: rawConv.is_blocked_by_user1 || rawConv.is_blocked_by_user2 || false,
                last_message_at: rawConv.last_message_at || rawConv.created_at || new Date().toISOString(),
                last_message_preview: rawConv.last_message_preview || '',
                conversation_created_at: rawConv.created_at || new Date().toISOString()
              };
              
              if (!this.conversations.find(c => c.conversation_id === conversation.conversation_id)) {
                this.conversations.unshift(conversation);
              }
              
              this.selectConversation(conversation);
            }
          },
          error: (error) => {
            console.error('Error creating conversation:', error);
            alert('Failed to start conversation. Please try again.');
          }
        });
    }
  }

  loadConversations(): void {
    if (!this.currentUser) return;

    this.isLoadingConversations = true;
    this.messageService.getUserConversations(this.currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.conversations = response.data;
          }
          this.isLoadingConversations = false;
        },
        error: (error) => {
          console.error('Error loading conversations:', error);
          this.isLoadingConversations = false;
        }
      });
  }

  selectConversation(conversation: Conversation): void {
    this.isInitialLoad = true;
    this.selectedConversation = conversation;
    this.loadMessages(conversation.conversation_id);
    this.markAsRead(conversation.conversation_id);
  }

  loadMessages(conversationId: number): void {
    if (!this.currentUser) return;

    this.isLoadingMessages = true;
    this.messageService.getConversationMessages(conversationId, this.currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.messages = response.data;
            this.lastMessageCount = this.messages.length;
            setTimeout(() => {
              this.scrollToBottom();
              this.isInitialLoad = false;
            }, 100);
          }
          this.isLoadingMessages = false;
        },
        error: (error) => {
          console.error('Error loading messages:', error);
          this.isLoadingMessages = false;
          this.isInitialLoad = false;
        }
      });
  }

  refreshMessagesQuietly(): void {
    if (!this.currentUser || !this.selectedConversation) return;

    this.messageService.getConversationMessages(
      this.selectedConversation.conversation_id,
      this.currentUser.id
    ).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const newMessages = response.data;
          if (newMessages.length > this.lastMessageCount) {
            this.messages = newMessages;
            this.lastMessageCount = newMessages.length;
            setTimeout(() => this.scrollToBottom(), 100);
          }
        }
      },
      error: (error) => console.error('Error refreshing messages:', error)
    });
  }

  sendMessage(): void {
    if (!this.currentUser || !this.selectedConversation || !this.newMessage.trim()) {
      return;
    }

    this.isSendingMessage = true;

    const messageData = {
      conversation_id: this.selectedConversation.conversation_id,
      sender_id: this.currentUser.id,
      message_text: this.newMessage.trim()
    };

    this.messageService.sendMessage(messageData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.messages.push(response.data);
            this.lastMessageCount = this.messages.length;
            this.newMessage = '';
            setTimeout(() => this.scrollToBottom(), 100);
            this.loadConversationsQuietly();
          }
          this.isSendingMessage = false;
        },
        error: (error) => {
          console.error('Error sending message:', error);
          alert('Failed to send message');
          this.isSendingMessage = false;
        }
      });
  }

  loadConversationsQuietly(): void {
    if (!this.currentUser) return;

    this.messageService.getUserConversations(this.currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.conversations = response.data;
          }
        },
        error: (error) => console.error('Error loading conversations:', error)
      });
  }

  markAsRead(conversationId: number): void {
    if (!this.currentUser) return;

    this.messageService.markMessagesAsRead(conversationId, this.currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const conv = this.conversations.find(c => c.conversation_id === conversationId);
          if (conv) {
            conv.unread_count = 0;
          }
        },
        error: (error) => console.error('Error marking as read:', error)
      });
  }

  onTyping(): void {
    if (!this.currentUser || !this.selectedConversation) return;

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.messageService.setTypingIndicator(
      this.selectedConversation.conversation_id,
      this.currentUser.id
    ).subscribe();

    this.typingTimeout = setTimeout(() => {
      // Typing stopped
    }, 3000);
  }

  checkTypingStatus(): void {
    if (!this.currentUser || !this.selectedConversation) return;

    this.messageService.getTypingStatus(
      this.selectedConversation.conversation_id,
      this.currentUser.id
    ).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        if (response.success) {
          this.isOtherUserTyping = response.data?.user_name ? true : false;
          this.otherUserTypingName = response.data?.user_name || '';
        }
      },
      error: (error) => console.error('Error checking typing:', error)
    });
  }

  scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = 
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  getFilteredConversations(): Conversation[] {
    if (!this.searchQuery.trim()) {
      return this.conversations;
    }
    return this.conversations.filter(conv => 
      conv.other_user_name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  formatTime(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week ago`;
    
    return date.toLocaleDateString();
  }

  formatMessageTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  getUserInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  isMyMessage(message: Message): boolean {
    return message.sender_id === this.currentUser?.id;
  }

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