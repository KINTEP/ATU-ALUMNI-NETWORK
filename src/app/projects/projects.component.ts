import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ProjectsService, Project, TopDonor, RecentActivity, ProjectStats } from '../../services/projects.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit, OnDestroy {

  // ── Data ──────────────────────────────────────────────────────────────────
  projects: Project[] = [];
  topDonors: TopDonor[] = [];
  recentActivity: RecentActivity[] = [];
  stats: ProjectStats | null = null;

  // ── UI State ──────────────────────────────────────────────────────────────
  isLoading = true;
  isDonating = false;
  isVolunteering: number | null = null; // project id being volunteered for

  // ── Filters ───────────────────────────────────────────────────────────────
  searchQuery = '';
  activeFilter: 'all' | 'ongoing' | 'completed' | 'proposed' = 'all';
  activeCategory: string | null = null;

  // ── Pagination ────────────────────────────────────────────────────────────
  currentPage = 1;
  totalPages = 0;
  totalProjects = 0;
  readonly pageLimit = 10;

  // ── Quick Donate ──────────────────────────────────────────────────────────
  quickDonateAmount: number | null = null;
  customDonateAmount: number | null = null;
  quickDonatePresets = [50, 100, 500];

  // ── Categories (static display counts updated from stats) ─────────────────
  categories = [
    { key: 'Infrastructure', label: 'Infrastructure', icon: 'fas fa-building', color: 'blue', count: 0 },
    { key: 'Education',      label: 'Education',      icon: 'fas fa-graduation-cap', color: 'purple', count: 0 },
    { key: 'Healthcare',     label: 'Healthcare',     icon: 'fas fa-heartbeat', color: 'green', count: 0 },
    { key: 'Technology',     label: 'Technology',     icon: 'fas fa-laptop-code', color: 'indigo', count: 0 },
    { key: 'Agriculture',    label: 'Agriculture',    icon: 'fas fa-seedling', color: 'emerald', count: 0 },
    { key: 'Community Development', label: 'Community', icon: 'fas fa-users', color: 'orange', count: 0 },
  ];

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private projectsService: ProjectsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProjects();
    this.loadSidebarData();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data Loading ──────────────────────────────────────────────────────────

  loadProjects(): void {
    this.isLoading = true;

    const params: any = {
      page: this.currentPage,
      limit: this.pageLimit,
    };

    if (this.activeFilter !== 'all') params.status = this.activeFilter;
    if (this.activeCategory) params.category = this.activeCategory;
    if (this.searchQuery.trim()) params.search = this.searchQuery.trim();

    this.projectsService.getAllProjects(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.projects = res.data ?? [];
          const pagination = (res as any).pagination;
          if (pagination) {
            this.totalPages = pagination.pages;
            this.totalProjects = pagination.total;
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load projects:', err);
          this.isLoading = false;
        }
      });
  }

  loadSidebarData(): void {
    this.projectsService.getTopDonors(5)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (res) => this.topDonors = res.data ?? [] });

    this.projectsService.getRecentActivity(6)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (res) => this.recentActivity = res.data ?? [] });

    this.projectsService.getProjectStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (res) => this.stats = res.data ?? null });
  }

  setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadProjects();
    });
  }

  // ── Filter Actions ────────────────────────────────────────────────────────

  onSearchInput(value: string): void {
    this.searchQuery = value;
    this.searchSubject.next(value);
  }

  setFilter(filter: 'all' | 'ongoing' | 'completed' | 'proposed'): void {
    if (this.activeFilter === filter) return;
    this.activeFilter = filter;
    this.currentPage = 1;
    this.loadProjects();
  }

  setCategory(category: string | null): void {
    this.activeCategory = this.activeCategory === category ? null : category;
    this.currentPage = 1;
    this.loadProjects();
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  viewProject(id: number): void {
    this.router.navigate(['/projects', id]);
  }

  // ── Donate ────────────────────────────────────────────────────────────────

  setQuickAmount(amount: number): void {
    this.quickDonateAmount = amount;
    this.customDonateAmount = null;
  }

  onCustomAmountChange(value: number): void {
    this.customDonateAmount = value;
    this.quickDonateAmount = null;
  }

  submitQuickDonate(): void {
    const amount = this.customDonateAmount || this.quickDonateAmount;
    if (!amount || amount <= 0) return;

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // Quick donate goes to most recent ongoing project
    const ongoingProject = this.projects.find(p => p.status === 'ongoing');
    if (!ongoingProject) return;

    this.isDonating = true;
    this.projectsService.donate(ongoingProject.id, { amount, payment_method: 'paystack', anonymous: false })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isDonating = false;
          this.quickDonateAmount = null;
          this.customDonateAmount = null;
          this.loadProjects();
          this.loadSidebarData();
        },
        error: (err) => {
          console.error('Donation failed:', err);
          this.isDonating = false;
        }
      });
  }

  donateToProject(event: Event, projectId: number): void {
    event.stopPropagation();
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.router.navigate(['/projects', projectId], { fragment: 'donate' });
  }

  volunteerForProject(event: Event, project: Project): void {
    event.stopPropagation();

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.isVolunteering = project.id;
    this.projectsService.volunteer(project.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          project.volunteers_count = res.data?.volunteers_count ?? project.volunteers_count + 1;
          this.isVolunteering = null;
        },
        error: (err) => {
          console.error('Volunteer failed:', err);
          this.isVolunteering = null;
        }
      });
  }

  shareProject(event: Event, project: Project): void {
    event.stopPropagation();
    const url = `${window.location.origin}/projects/${project.id}`;
    if (navigator.share) {
      navigator.share({ title: project.title, text: project.description, url });
    } else {
      navigator.clipboard.writeText(url);
    }
  }

  // ── Pagination ────────────────────────────────────────────────────────────

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadProjects();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getStatusClass(status: string): string {
    switch (status) {
      case 'ongoing':   return 'bg-green-500 text-white';
      case 'completed': return 'bg-gray-600 text-white';
      case 'proposed':  return 'bg-yellow-500 text-white';
      case 'draft':     return 'bg-gray-300 text-gray-700';
      default:          return 'bg-gray-500 text-white';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'ongoing':   return 'fas fa-circle animate-pulse text-[8px] mr-1';
      case 'completed': return 'fas fa-check-circle mr-1';
      case 'proposed':  return 'fas fa-clock mr-1';
      default:          return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'ongoing':   return 'Ongoing';
      case 'completed': return 'Completed';
      case 'proposed':  return 'Proposed';
      case 'draft':     return 'Draft';
      default:          return status;
    }
  }

  getProgressBarClass(project: Project): string {
    return project.status === 'completed'
      ? 'bg-green-500'
      : 'bg-gradient-to-r from-blue-600 to-indigo-600';
  }

  getCategoryColorClass(category: string): string {
    const map: Record<string, string> = {
      'Infrastructure': 'bg-blue-50 text-blue-700 border-blue-100',
      'Education':      'bg-purple-50 text-purple-700 border-purple-100',
      'Healthcare':     'bg-green-50 text-green-700 border-green-100',
      'Technology':     'bg-indigo-50 text-indigo-700 border-indigo-100',
      'Agriculture':    'bg-emerald-50 text-emerald-700 border-emerald-100',
      'Community Development': 'bg-orange-50 text-orange-700 border-orange-100',
    };
    return map[category] ?? 'bg-gray-50 text-gray-700 border-gray-100';
  }

  getDonorInitials(donor: TopDonor): string {
    return `${donor.first_name?.[0] ?? ''}${donor.last_name?.[0] ?? ''}`.toUpperCase();
  }

  getActivityIcon(type: string): string {
    return type === 'donation' ? 'fas fa-donate' : 'fas fa-hand-holding-heart';
  }

  getActivityIconBg(type: string): string {
    return type === 'donation' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600';
  }

  formatCurrency(amount: string | number): string {
    return `GHS ${Number(amount).toLocaleString()}`;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  }

  formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return this.formatDate(dateStr);
  }

  isVolunteeringFor(id: number): boolean {
    return this.isVolunteering === id;
  }

  get activeFilterLabel(): string {
    const map = { all: 'All Projects', ongoing: 'Ongoing', completed: 'Completed', proposed: 'Proposed' };
    return map[this.activeFilter];
  }

  trackByProject(_: number, p: Project): number { return p.id; }
  trackByDonor(_: number, d: TopDonor): number { return d.user_id; }
}