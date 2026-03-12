// src/app/pipes/image-url.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { ImageService } from '../../services/image.service';

@Pipe({
  name: 'imageUrl',
  standalone: true
})
export class ImageUrlPipe implements PipeTransform {
  constructor(private imageService: ImageService) {}

  transform(imagePath: string | null | undefined, type: 'profile' | 'event' = 'profile', userName?: string): string {
    if (type === 'event') {
      return this.imageService.getEventImageUrl(imagePath);
    }
    
    const url = this.imageService.getProfilePictureUrl(imagePath, userName);
    return url || this.imageService.getDefaultAvatar(userName);
  }
}