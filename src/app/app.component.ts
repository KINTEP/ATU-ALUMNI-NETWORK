import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'atu-alumni-project';

  constructor(private router: Router) {}

  ngOnInit(): void {
    if (!environment.production) {
      console.log('🌍 Environment Configuration:');
      console.log('API URL:', environment.apiUrl);
      console.log('Production Mode:', environment.production);
      console.log('App Name:', environment.appName);
      console.log('App Version:', environment.appVersion);
    }
  }

  // ✅ Renamed from isAdminRoute — hides header on auth pages AND admin pages
   get hideHeader(): boolean {
      return this.router.url.startsWith('/admin/') ||
            this.router.url.startsWith('/login') ||
            this.router.url.startsWith('/forgot-password') ||
            this.router.url.startsWith('/reset-password') ||
            this.router.url.startsWith('/self-register');
    }
}