// src/app/services/firebase-storage.service.ts
import { Injectable, inject } from '@angular/core';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FirebaseStorageService {
  private storage = inject(Storage); // Changed from constructor injection

  /**
   * Upload profile picture to Firebase Storage
   */
  uploadProfilePicture(file: File, userId: number): Observable<string> {
    return this.uploadImage(file, `profiles/${userId}_${Date.now()}`);
  }

  /**
   * Upload cover photo to Firebase Storage
   */
  uploadCoverPhoto(file: File, userId: number): Observable<string> {
    return this.uploadImage(file, `profiles/cover_${userId}_${Date.now()}`);
  }

  /**
   * Upload event image to Firebase Storage
   */
  uploadEventImage(file: File, eventId: number): Observable<string> {
    return this.uploadImage(file, `events/${eventId}_${Date.now()}`);
  }

  /**
   * Generic upload to Firebase Storage - PUBLIC METHOD
   * Used by UploadService for news images and other custom uploads
   */
  uploadToFirebase(file: File, path: string): Observable<string> {
    const fileExtension = file.name.split('.').pop();
    const fullPath = fileExtension ? `${path}.${fileExtension}` : path;
    const storageRef = ref(this.storage, fullPath);

    return from(uploadBytes(storageRef, file)).pipe(
      switchMap(() => getDownloadURL(storageRef)),
      catchError(error => {
        console.error('Firebase upload error:', error);
        return throwError(() => new Error('Failed to upload to Firebase Storage'));
      })
    );
  }

  /**
   * Generic image upload - PRIVATE METHOD
   * Used internally for profile, cover, and event images
   */
  private uploadImage(file: File, path: string): Observable<string> {
    const fileExtension = file.name.split('.').pop();
    const fullPath = `${path}.${fileExtension}`;
    const storageRef = ref(this.storage, fullPath);

    return from(uploadBytes(storageRef, file)).pipe(
      switchMap(() => getDownloadURL(storageRef)),
      catchError(error => {
        console.error('Upload error:', error);
        return throwError(() => new Error('Failed to upload image'));
      })
    );
  }

  /**
   * Delete image from Firebase Storage
   */
  deleteImage(imageUrl: string): Observable<void> {
    try {
      const path = this.extractPathFromUrl(imageUrl);
      if (!path) {
        return throwError(() => new Error('Invalid Firebase Storage URL'));
      }

      const storageRef = ref(this.storage, path);
      return from(deleteObject(storageRef)).pipe(
        catchError(error => {
          console.error('Delete error:', error);
          return throwError(() => new Error('Failed to delete image'));
        })
      );
    } catch (error) {
      return throwError(() => error);
    }
  }

  /**
   * Extract storage path from Firebase Storage URL
   */
  private extractPathFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);
      return pathMatch ? decodeURIComponent(pathMatch[1]) : null;
    } catch {
      return null;
    }
  }

  /**
   * Validate image file
   */
  validateImage(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Only JPEG, PNG, GIF, and WebP images are allowed'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size must be less than 5MB'
      };
    }

    return { valid: true };
  }
}