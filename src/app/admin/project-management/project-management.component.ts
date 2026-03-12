import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { DonationTrend, Project, ProjectsService, ProjectStats, RecentActivity } from '../../../services/projects.service';


@Component({
  selector: 'app-project-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  templateUrl: './project-management.component.html',
  styleUrl: './project-management.component.scss'
})
export class ProjectManagementComponent implements OnInit, OnDestroy {

  // ── Data ──────────────────────────────────────────────────────────────────
  projects: Project[] = [];
  stats: ProjectStats | null = null;
  recentActivity: RecentActivity[] = [];
  donationTrends: DonationTrend[] = [];

  // ── UI State ──────────────────────────────────────────────────────────────
  isLoading = true;
  isActionLoading: number | null = null; // project id being acted on
  trendPeriod: 'monthly' | 'quarterly' = 'monthly';

  // ── Filters ───────────────────────────────────────────────────────────────
  searchQuery = '';
  activeFilter: 'all' | 'ongoing' | 'proposed' | 'completed' | 'draft' = 'all';

  // ── Pagination ────────────────────────────────────────────────────────────
  currentPage = 1;
  totalPages = 0;
  totalProjects = 0;
  readonly pageLimit = 20;

  // ── Modals ────────────────────────────────────────────────────────────────
  showRejectModal = false;
  rejectProjectId: number | null = null;
  rejectReason = '';
  showDeleteModal = false;
  deleteProjectId: number | null = null;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private projectsService: ProjectsService
  ) {}

  ngOnInit(): void {
    this.loadProjects();
    this.loadStats();
    this.loadRecentActivity();
    this.loadDonationTrends();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data Loading ──────────────────────────────────────────────────────────

  loadProjects(): void {
    this.isLoading = true;
    const params: any = { page: this.currentPage, limit: this.pageLimit };
    if (this.activeFilter !== 'all') params.status = this.activeFilter;
    if (this.searchQuery.trim()) params.search = this.searchQuery.trim();

    this.projectsService.adminGetAllProjects(params)
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

  loadStats(): void {
    this.projectsService.getProjectStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (res) => this.stats = res.data ?? null });
  }

  loadRecentActivity(): void {
    this.projectsService.getRecentActivity(8)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (res) => this.recentActivity = res.data ?? [] });
  }

  loadDonationTrends(): void {
    const months = this.trendPeriod === 'monthly' ? 6 : 12;
    this.projectsService.getDonationTrends(months)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (res) => this.donationTrends = res.data ?? [] });
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

  // ── Filters ───────────────────────────────────────────────────────────────

  onSearchInput(value: string): void {
    this.searchQuery = value;
    this.searchSubject.next(value);
  }

  setFilter(filter: 'all' | 'ongoing' | 'proposed' | 'completed' | 'draft'): void {
    if (this.activeFilter === filter) return;
    this.activeFilter = filter;
    this.currentPage = 1;
    this.loadProjects();
  }

  setTrendPeriod(period: 'monthly' | 'quarterly'): void {
    this.trendPeriod = period;
    this.loadDonationTrends();
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  createProject(): void {
    this.router.navigate(['/admin/create-project']);
  }

  viewProject(id: number): void {
    this.router.navigate(['/projects', id]);
  }

  editProject(id: number): void {
    this.router.navigate(['/admin/edit-project', id]);
  }

  // ── Admin Actions ─────────────────────────────────────────────────────────

  approveProject(project: Project): void {
    this.isActionLoading = project.id;
    this.projectsService.approveProject(project.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          project.status = 'ongoing';
          this.isActionLoading = null;
          this.loadStats();
        },
        error: (err) => {
          console.error('Approve failed:', err);
          this.isActionLoading = null;
        }
      });
  }

  openRejectModal(id: number): void {
    this.rejectProjectId = id;
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  confirmReject(): void {
    if (!this.rejectProjectId) return;
    this.isActionLoading = this.rejectProjectId;

    this.projectsService.rejectProject(this.rejectProjectId, this.rejectReason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const project = this.projects.find(p => p.id === this.rejectProjectId);
          if (project) project.status = 'draft';
          this.showRejectModal = false;
          this.rejectProjectId = null;
          this.isActionLoading = null;
          this.loadStats();
        },
        error: (err) => {
          console.error('Reject failed:', err);
          this.isActionLoading = null;
        }
      });
  }

  completeProject(project: Project): void {
    this.isActionLoading = project.id;
    this.projectsService.completeProject(project.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          project.status = 'completed';
          this.isActionLoading = null;
          this.loadStats();
        },
        error: (err) => {
          console.error('Complete failed:', err);
          this.isActionLoading = null;
        }
      });
  }

  openDeleteModal(id: number): void {
    this.deleteProjectId = id;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.deleteProjectId) return;
    this.isActionLoading = this.deleteProjectId;

    this.projectsService.deleteProject(this.deleteProjectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.projects = this.projects.filter(p => p.id !== this.deleteProjectId);
          this.showDeleteModal = false;
          this.deleteProjectId = null;
          this.isActionLoading = null;
          this.loadStats();
        },
        error: (err) => {
          console.error('Delete failed:', err);
          this.isActionLoading = null;
        }
      });
  }

  // ── Pagination ────────────────────────────────────────────────────────────

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadProjects();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getCategoryIcon(category: string): string {
    const map: Record<string, string> = {
      'Infrastructure': 'fas fa-building',
      'Education':      'fas fa-graduation-cap',
      'Healthcare':     'fas fa-heartbeat',
      'Technology':     'fas fa-laptop-code',
      'Agriculture':    'fas fa-seedling',
      'Community Development': 'fas fa-users',
      'Other':          'fas fa-folder',
    };
    return map[category] ?? 'fas fa-folder';
  }

  getCategoryBgClass(category: string): string {
    const map: Record<string, string> = {
      'Infrastructure': 'bg-blue-100 text-blue-600',
      'Education':      'bg-purple-100 text-purple-600',
      'Healthcare':     'bg-green-100 text-green-600',
      'Technology':     'bg-indigo-100 text-indigo-600',
      'Agriculture':    'bg-emerald-100 text-emerald-600',
      'Community Development': 'bg-orange-100 text-orange-600',
      'Other':          'bg-gray-100 text-gray-600',
    };
    return map[category] ?? 'bg-gray-100 text-gray-600';
  }

  getCategoryBadgeClass(category: string): string {
    const map: Record<string, string> = {
      'Infrastructure': 'bg-blue-50 text-blue-700 border-blue-100',
      'Education':      'bg-purple-50 text-purple-700 border-purple-100',
      'Healthcare':     'bg-green-50 text-green-700 border-green-100',
      'Technology':     'bg-indigo-50 text-indigo-700 border-indigo-100',
      'Agriculture':    'bg-emerald-50 text-emerald-700 border-emerald-100',
      'Community Development': 'bg-orange-50 text-orange-700 border-orange-100',
    };
    return (map[category] ?? 'bg-gray-50 text-gray-700 border-gray-100') + ' text-xs border px-2 py-1 rounded-full';
  }

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      'ongoing':   'bg-green-100 text-green-700',
      'proposed':  'bg-yellow-100 text-yellow-700',
      'completed': 'bg-gray-200 text-gray-700',
      'draft':     'bg-red-100 text-red-700',
    };
    return (map[status] ?? 'bg-gray-100 text-gray-600') + ' text-xs px-3 py-1 rounded-full font-medium';
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      'ongoing':   'fas fa-circle text-[6px] mr-1 animate-pulse',
      'proposed':  'fas fa-lightbulb mr-1',
      'completed': 'fas fa-check-circle mr-1',
      'draft':     'fas fa-times-circle mr-1',
    };
    return map[status] ?? '';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'ongoing': 'Ongoing', 'proposed': 'Proposed',
      'completed': 'Completed', 'draft': 'Draft'
    };
    return map[status] ?? status;
  }

  getProgressBarClass(project: Project): string {
    return project.status === 'completed' ? 'bg-green-500' : 'bg-blue-600';
  }

  getProgressWidth(project: Project): number {
    return Math.min(100, project.funding_percentage);
  }

  getAuthorName(project: Project): string {
    if (!project.created_by) return 'ATU Alumni';
    return `${project.created_by.first_name} ${project.created_by.last_name}`;
  }

  getActivityIcon(type: string): string {
    return type === 'donation' ? 'fas fa-donate' : 'fas fa-hand-holding-heart';
  }

  getActivityIconBg(type: string): string {
    return type === 'donation'
      ? 'bg-green-100 text-green-600'
      : 'bg-purple-100 text-purple-600';
  }

  getDonorInitials(activity: RecentActivity): string {
    if (activity.anonymous) return '??';
    return `${activity.first_name?.[0] ?? ''}${activity.last_name?.[0] ?? ''}`.toUpperCase();
  }

  formatCurrency(val: string | number): string {
    return `GHS ${Number(val).toLocaleString()}`;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  isActioning(id: number): boolean {
    return this.isActionLoading === id;
  }

  get pagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get totalRaised(): number {
    return parseFloat(this.stats?.total_raised ?? '0');
  }

  trackByProject(_: number, p: Project): number { return p.id; }
  trackByActivity(_: number, a: RecentActivity): string { return `${a.type}-${a.created_at}`; }
}