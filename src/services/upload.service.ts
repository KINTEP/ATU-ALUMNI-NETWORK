// src/app/services/upload.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { FirebaseStorageService } from './firebase-storage.service';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private firebaseStorage: FirebaseStorageService
  ) {}

  /**
   * Complete flow: Upload to Firebase + Update Backend Database
   */
  uploadAndSaveProfilePicture(userId: number, file: File, oldImageUrl?: string): Observable<any> {
    const validation = this.firebaseStorage.validateImage(file);
    if (!validation.valid) {
      return throwError(() => new Error(validation.error || 'Invalid file'));
    }

    return this.firebaseStorage.uploadProfilePicture(file, userId).pipe(
      switchMap(firebaseUrl => 
        this.updateUserProfilePicture(userId, firebaseUrl).pipe(
          tap(() => {
            if (oldImageUrl && oldImageUrl.includes('firebasestorage.googleapis.com')) {
              this.firebaseStorage.deleteImage(oldImageUrl).subscribe({
                error: (err) => console.error('Failed to delete old image:', err)
              });
            }
          })
        )
      ),
      catchError(error => {
        console.error('Upload and save error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Upload cover photo: Firebase + Backend
   */
  uploadAndSaveCoverPhoto(userId: number, file: File, oldImageUrl?: string): Observable<any> {
    const validation = this.firebaseStorage.validateImage(file);
    if (!validation.valid) {
      return throwError(() => new Error(validation.error || 'Invalid file'));
    }

    return this.firebaseStorage.uploadCoverPhoto(file, userId).pipe(
      switchMap(firebaseUrl => 
        this.updateUserCoverPhoto(userId, firebaseUrl).pipe(
          tap(() => {
            if (oldImageUrl && oldImageUrl.includes('firebasestorage.googleapis.com')) {
              this.firebaseStorage.deleteImage(oldImageUrl).subscribe({
                error: (err) => console.error('Failed to delete old image:', err)
              });
            }
          })
        )
      ),
      catchError(error => {
        console.error('Upload and save error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Upload event image: Firebase + Backend
   */
  uploadAndSaveEventImage(eventId: number, file: File, oldImageUrl?: string): Observable<any> {
    const validation = this.firebaseStorage.validateImage(file);
    if (!validation.valid) {
      return throwError(() => new Error(validation.error || 'Invalid file'));
    }

    return this.firebaseStorage.uploadEventImage(file, eventId).pipe(
      switchMap(firebaseUrl => 
        this.updateEventImage(eventId, firebaseUrl).pipe(
          tap(() => {
            if (oldImageUrl && oldImageUrl.includes('firebasestorage.googleapis.com')) {
              this.firebaseStorage.deleteImage(oldImageUrl).subscribe({
                error: (err) => console.error('Failed to delete old image:', err)
              });
            }
          })
        )
      ),
      catchError(error => {
        console.error('Upload and save error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Upload news image to Firebase Storage (NO BACKEND UPDATE)
   * News images are saved to backend as part of the article creation/update
   */
  uploadNewsImage(file: File, oldImageUrl?: string): Observable<{ url: string }> {
    const validation = this.firebaseStorage.validateImage(file);
    if (!validation.valid) {
      return throwError(() => new Error(validation.error || 'Invalid file'));
    }

    const path = `news/${Date.now()}_${file.name}`;

    return this.firebaseStorage.uploadToFirebase(file, path).pipe(
      tap(url => {
        if (oldImageUrl && oldImageUrl.includes('firebasestorage.googleapis.com')) {
          this.firebaseStorage.deleteImage(oldImageUrl).subscribe({
            error: (err) => console.error('Failed to delete old news image:', err)
          });
        }
      }),
      switchMap(url => of({ url })),
      catchError(error => {
        console.error('News image upload error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Upload project cover image to Firebase Storage (NO BACKEND UPDATE)
   * Project images are saved to backend as part of project creation/update
   */
  uploadProjectImage(file: File, oldImageUrl?: string): Observable<{ url: string }> {
    const validation = this.firebaseStorage.validateImage(file);
    if (!validation.valid) {
      return throwError(() => new Error(validation.error || 'Invalid file'));
    }

    const path = `projects/${Date.now()}_${file.name}`;

    return this.firebaseStorage.uploadToFirebase(file, path).pipe(
      tap(url => {
        if (oldImageUrl && oldImageUrl.includes('firebasestorage.googleapis.com')) {
          this.firebaseStorage.deleteImage(oldImageUrl).subscribe({
            error: (err) => console.error('Failed to delete old project image:', err)
          });
        }
      }),
      switchMap(url => of({ url })),
      catchError(error => {
        console.error('Project image upload error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Upload event image to Firebase Storage
   */
  uploadEventImage(file: File, oldImageUrl?: string): Observable<{ url: string }> {
    const validation = this.firebaseStorage.validateImage(file);
    if (!validation.valid) {
      return throwError(() => new Error(validation.error || 'Invalid file'));
    }

    const path = `events/${Date.now()}_${file.name}`;

    return this.firebaseStorage.uploadToFirebase(file, path).pipe(
      tap(url => {
        if (oldImageUrl && oldImageUrl.includes('firebasestorage.googleapis.com')) {
          this.firebaseStorage.deleteImage(oldImageUrl).subscribe({
            error: (err) => console.error('Failed to delete old event image:', err)
          });
        }
      }),
      switchMap(url => of({ url })),
      catchError(error => {
        console.error('Event image upload error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update profile picture URL in backend database
   */
  private updateUserProfilePicture(userId: number, imageUrl: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}`, {
      profile_picture: imageUrl
    });
  }

  /**
   * Update cover photo URL in backend database
   */
  private updateUserCoverPhoto(userId: number, imageUrl: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}`, {
      cover_photo: imageUrl
    });
  }

  /**
   * Update event image URL in backend database
   */
  private updateEventImage(eventId: number, imageUrl: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/events/${eventId}`, {
      event_image: imageUrl
    });
  }
}