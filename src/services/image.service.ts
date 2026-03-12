// src/app/services/image.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private readonly baseUrl = environment.apiUrl.replace('/api', '');
  private readonly defaultEventImage = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800';
  private readonly defaultAvatarImage = 'https://ui-avatars.com/api/?background=3B82F6&color=fff&size=200&name=';

  constructor() {}

  /**
   * Get full image URL from relative path
   * Handles both Firebase Storage URLs and legacy backend URLs
   */
  getImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath || imagePath.trim() === '') {
      return '';
    }

    const cleanPath = imagePath.trim();

    // Already a full URL (Firebase Storage or external)
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
      return cleanPath;
    }

    // Legacy backend paths - convert to full backend URL
    // Has /api prefix
    if (cleanPath.startsWith('/api')) {
      return `${this.baseUrl}${cleanPath}`;
    }

    // Has /uploads prefix
    if (cleanPath.startsWith('/uploads')) {
      return `${this.baseUrl}/api${cleanPath}`;
    }

    // Assume it's a relative path starting from uploads
    if (!cleanPath.startsWith('/')) {
      return `${this.baseUrl}/api/uploads/${cleanPath}`;
    }

    // Default: prepend base URL and /api
    return `${this.baseUrl}/api${cleanPath}`;
  }

  /**
   * Get profile picture URL with fallback
   */
  getProfilePictureUrl(picturePath: string | null | undefined, userName?: string): string {
    if (!picturePath || picturePath.trim() === '') {
      // Return placeholder with user initials if name provided
      if (userName) {
        return `${this.defaultAvatarImage}${encodeURIComponent(userName)}`;
      }
      return '';
    }

    return this.getImageUrl(picturePath);
  }

  /**
   * Get event image URL with fallback
   */
  getEventImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath || imagePath.trim() === '') {
      return this.defaultEventImage;
    }

    return this.getImageUrl(imagePath);
  }

  /**
   * Check if image path exists and is valid
   */
  hasImage(imagePath: string | null | undefined): boolean {
    return !!(imagePath && imagePath.trim() !== '');
  }

  /**
   * Get default avatar image with initials
   */
  getDefaultAvatar(userName?: string): string {
    if (userName) {
      return `${this.defaultAvatarImage}${encodeURIComponent(userName)}`;
    }
    return `${this.defaultAvatarImage}User`;
  }

  /**
   * Get default event image
   */
  getDefaultEventImage(): string {
    return this.defaultEventImage;
  }

  /**
   * Handle image error - returns a default avatar URL
   */
  handleImageError(event: Event, userName?: string): void {
    const img = event.target as HTMLImageElement;
    if (userName) {
      img.src = this.getDefaultAvatar(userName);
    } else {
      img.src = `${this.defaultAvatarImage}User`;
    }
  }

  /**
   * Check if URL is from Firebase Storage
   */
  isFirebaseStorageUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    return url.includes('firebasestorage.googleapis.com');
  }

  /**
   * Check if URL is from backend server
   */
  isBackendUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    return url.includes(this.baseUrl) || url.startsWith('/uploads') || url.startsWith('/api');
  }
}