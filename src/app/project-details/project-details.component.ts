import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  ProjectsService,
  Project,
  ProjectDonation,
  ProjectUpdate,
  ProjectVolunteer
} from '../../services/projects.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.scss'
})
export class ProjectDetailsComponent implements OnInit, OnDestroy {

  // ── Data ──────────────────────────────────────────────────────────────────
  project: Project | null = null;
  recentDonors: ProjectDonation[] = [];

  // ── UI State ──────────────────────────────────────────────────────────────
  isLoading = true;
  isDonating = false;
  isVolunteering = false;
  hasVolunteered = false;
  hasVoted = false;
  linkCopied = false;

  // ── Donate ────────────────────────────────────────────────────────────────
  selectedAmount = 100;
  customAmount: number | null = null;
  donationAmounts = [50, 100, 200, 500, 1000, 2000];

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private projectsService: ProjectsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = +params['id'];
      if (id) this.loadProject(id);
    });

    // Scroll to donate section if navigated with fragment
    this.route.fragment.pipe(takeUntil(this.destroy$)).subscribe(fragment => {
      if (fragment === 'donate') {
        setTimeout(() => {
          document.getElementById('donate-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data Loading ──────────────────────────────────────────────────────────

  loadProject(id: number): void {
    this.isLoading = true;
    this.projectsService.getProjectById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.project = res.data ?? null;
          this.isLoading = false;
          this.loadDonors(id);
        },
        error: (err) => {
          console.error('Failed to load project:', err);
          this.isLoading = false;
        }
      });
  }

  loadDonors(id: number): void {
    this.projectsService.getProjectDonors(id, 1, 5)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => this.recentDonors = res.data ?? [],
        error: (err) => console.error('Failed to load donors:', err)
      });
  }

  // ── User Actions ──────────────────────────────────────────────────────────

  donate(): void {
    const amount = this.customAmount || this.selectedAmount;
    if (!amount || amount <= 0) return;

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    if (!this.project) return;
    this.isDonating = true;

    this.projectsService.donate(this.project.id, {
      amount,
      payment_method: 'paystack',
      anonymous: false
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (this.project && res.data) {
          this.project.current_amount = parseFloat(res.data.current_amount as any);
          this.project.funding_percentage = res.data.funding_percentage;
          this.project.donors_count++;
        }
        this.isDonating = false;
        this.loadDonors(this.project!.id);
      },
      error: (err) => {
        console.error('Donation failed:', err);
        this.isDonating = false;
      }
    });
  }

  volunteer(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    if (!this.project || this.hasVolunteered) return;
    this.isVolunteering = true;

    this.projectsService.volunteer(this.project.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.hasVolunteered = true;
          if (this.project && res.data) {
            this.project.volunteers_count = res.data.volunteers_count;
          }
          this.isVolunteering = false;
        },
        error: (err) => {
          console.error('Volunteer failed:', err);
          this.isVolunteering = false;
        }
      });
  }

  vote(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    if (!this.project || this.hasVoted) return;

    this.projectsService.vote(this.project.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.hasVoted = true;
          if (this.project && res.data) {
            this.project.votes_count = res.data.votes_count;
          }
        },
        error: (err) => console.error('Vote failed:', err)
      });
  }

  // ── Share ─────────────────────────────────────────────────────────────────

  shareOn(platform: string): void {
    if (!this.project) return;
    const url = window.location.href;
    const text = `Support "${this.project.title}" — ${this.project.description.substring(0, 100)}...`;

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url).then(() => {
          this.linkCopied = true;
          setTimeout(() => this.linkCopied = false, 2500);
        });
        break;
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  goBack(): void {
    this.router.navigate(['/projects']);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  selectDonationAmount(amount: number): void {
    this.selectedAmount = amount;
    this.customAmount = null;
  }

  getDonationDisplay(): string {
    const amount = this.customAmount || this.selectedAmount;
    return amount ? `GHS ${Number(amount).toLocaleString()}` : '';
  }

  formatNumber(num: number | string): string {
    return Number(num).toLocaleString();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  }

  formatFullDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
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

  getAuthorInitials(): string {
    if (!this.project?.created_by) return 'A';
    return `${this.project.created_by.first_name[0]}${this.project.created_by.last_name[0]}`.toUpperCase();
  }

  getAuthorName(): string {
    if (!this.project?.created_by) return 'ATU Alumni Association';
    return `${this.project.created_by.first_name} ${this.project.created_by.last_name}`;
  }

  getDonorInitials(donor: ProjectDonation): string {
    if (donor.anonymous || !donor.first_name) return '??';
    return `${donor.first_name[0]}${donor.last_name?.[0] ?? ''}`.toUpperCase();
  }

  getDonorName(donor: ProjectDonation): string {
    if (donor.anonymous || !donor.first_name) return 'Anonymous Donor';
    return `${donor.first_name} ${donor.last_name}`;
  }

  getVolunteerSpotsPercent(): number {
    if (!this.project?.max_volunteers || !this.project?.volunteers_count) return 0;
    return Math.min(100, (this.project.volunteers_count / this.project.max_volunteers) * 100);
  }

  getProgressBarClass(): string {
    return this.project?.status === 'completed'
      ? 'bg-green-500'
      : 'bg-gradient-to-r from-blue-600 to-indigo-600';
  }

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      'ongoing':   'bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full',
      'proposed':  'bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full',
      'completed': 'bg-gray-600 text-white text-xs font-bold px-3 py-1 rounded-full',
      'draft':     'bg-gray-200 text-gray-600 text-xs font-bold px-3 py-1 rounded-full',
    };
    return map[status] ?? 'bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1 rounded-full';
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      'ongoing':   'fas fa-circle text-[8px] mr-1 animate-pulse',
      'proposed':  'fas fa-lightbulb mr-1',
      'completed': 'fas fa-check-circle mr-1',
      'draft':     'fas fa-edit mr-1',
    };
    return map[status] ?? 'fas fa-circle text-[8px] mr-1';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'ongoing': 'Ongoing', 'proposed': 'Proposed',
      'completed': 'Completed', 'draft': 'Draft'
    };
    return map[status] ?? status;
  }

  getCategoryClass(category: string): string {
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

  isMilestone(update: ProjectUpdate): boolean {
    return update.type === 'milestone';
  }
}