import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // ✅ Disable prerendering for routes that make API calls
  {
    path: 'messages',
    renderMode: RenderMode.Client
  },
  {
    path: 'networks',
    renderMode: RenderMode.Client
  },
  {
    path: 'forum',
    renderMode: RenderMode.Client
  },
  {
    path: 'events',
    renderMode: RenderMode.Client
  },
  {
    path: 'jobs',
    renderMode: RenderMode.Client
  },
  {
    path: 'news',
    renderMode: RenderMode.Client
  },
  {
    path: 'profile',
    renderMode: RenderMode.Client
  },
  {
    path: 'notifications',
    renderMode: RenderMode.Client
  },
  // ✅ Dynamic routes
  {
    path: 'events/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'news/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'forum/posts/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'jobs/:id',
    renderMode: RenderMode.Client
  },
  // ✅ Only prerender static routes (login, home)
  {
    path: '**',
    renderMode: RenderMode.Client // Change to Client for now
  }
];