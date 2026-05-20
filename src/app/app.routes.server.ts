import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Auth routes
  { path: 'login',            renderMode: RenderMode.Client },
  { path: 'forgot-password',  renderMode: RenderMode.Client },
  { path: 'reset-password',   renderMode: RenderMode.Client },
  { path: 'self-register',    renderMode: RenderMode.Client },

  // Main routes
  { path: 'home',               renderMode: RenderMode.Client },
  { path: 'networks',           renderMode: RenderMode.Client },
  { path: 'suggested-networks', renderMode: RenderMode.Client },
  { path: 'events',             renderMode: RenderMode.Client },
  { path: 'events/:id',         renderMode: RenderMode.Client },
  { path: 'news',               renderMode: RenderMode.Client },
  { path: 'news/:id',           renderMode: RenderMode.Client },
  { path: 'forum',              renderMode: RenderMode.Client },
  { path: 'forum/posts/:id',    renderMode: RenderMode.Client },
  { path: 'create-forum',       renderMode: RenderMode.Client },
  { path: 'jobs',               renderMode: RenderMode.Client },
  { path: 'jobs/:id',           renderMode: RenderMode.Client },
  { path: 'projects',           renderMode: RenderMode.Client },
  { path: 'projects/:id',       renderMode: RenderMode.Client },
  { path: 'messages',           renderMode: RenderMode.Client },
  { path: 'profile',            renderMode: RenderMode.Client },
  { path: 'profile/:id',        renderMode: RenderMode.Client },
  { path: 'tracer',             renderMode: RenderMode.Client },
  { path: 'notifications',      renderMode: RenderMode.Client },

  // Wildcard fallback
  { path: '**', renderMode: RenderMode.Client }
];