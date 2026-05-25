import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { ResourcesApiService } from '@app/features/resource-management/resources-api.service';
import { Resource } from '@app/features/resource-management/resources.models';
import { ReservationsApiService } from '@app/features/reservations/reservations-api.service';
import { Reservation } from '@app/features/reservations/reservations.models';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { CardComponent } from '@app/shared/ui/card/card.component';
import { EmptyStateComponent } from '@app/shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '@app/shared/ui/skeleton/skeleton.component';
import { StatusPillComponent, StatusTone } from '@app/shared/ui/status-pill/status-pill.component';

@Component({
  selector: 'app-dashboard',
  imports: [ButtonComponent, CardComponent, DatePipe, DecimalPipe, EmptyStateComponent, RouterLink, SkeletonComponent, StatusPillComponent],
  template: `
    <div class="grid gap-5">
      <section class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="font-display text-2xl font-extrabold text-midnight-blue">Dashboard</h1>
          <p class="mt-1 text-sm text-slate-500">Operational overview for availability, approvals and upcoming handoffs.</p>
        </div>
        <app-button routerLink="/reservations/new">New reservation</app-button>
      </section>

      <div class="grid gap-4 md:grid-cols-3">
        @if (loading()) {
          <app-skeleton class="block h-32" />
          <app-skeleton class="block h-32" />
          <app-skeleton class="block h-32" />
        } @else {
          <app-card title="Active resources">
            <p class="text-3xl font-extrabold text-midnight-blue">{{ activeResources() }}</p>
            <p class="mt-1 text-sm text-slate-500">Available assets in the catalog.</p>
          </app-card>
          <app-card title="Pending approvals">
            <p class="text-3xl font-extrabold text-midnight-blue">{{ pendingReservations() }}</p>
            <p class="mt-1 text-sm text-slate-500">Reservations waiting for a manager.</p>
          </app-card>
          <app-card title="Occupancy rate">
            <p class="text-3xl font-extrabold text-midnight-blue">{{ occupancyRate() | number: '1.0-0' }}%</p>
            <p class="mt-1 text-sm text-slate-500">Active resources with blocking reservations.</p>
          </app-card>
        }
      </div>

      <app-card title="Upcoming reservations" description="Next pending, approved and checked-out bookings.">
        @if (upcomingReservations().length > 0) {
          <div class="divide-y divide-border">
            @for (reservation of upcomingReservations(); track reservation.id) {
              <a
                class="grid gap-2 py-4 hover:bg-slate-50 sm:grid-cols-[1fr_auto] sm:items-center"
                [routerLink]="['/reservations', reservation.id]"
              >
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-semibold text-midnight-blue">{{ reservation.resource?.name ?? 'Resource #' + reservation.resource_id }}</p>
                    <app-status-pill [label]="reservation.status" [tone]="statusTone(reservation.status)" />
                  </div>
                  <p class="mt-1 text-sm text-slate-500">{{ reservation.purpose }}</p>
                </div>
                <p class="text-sm font-semibold text-slate-700">
                  {{ reservation.starts_at | date: 'MMM d, HH:mm' }} - {{ reservation.ends_at | date: 'HH:mm' }}
                </p>
              </a>
            }
          </div>
        } @else {
          <app-empty-state title="No upcoming reservations" description="The current filters do not contain active bookings." />
        }
      </app-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly resourcesApi = inject(ResourcesApiService);
  private readonly reservationsApi = inject(ReservationsApiService);

  readonly loading = signal(true);
  readonly resources = signal<readonly Resource[]>([]);
  readonly reservations = signal<readonly Reservation[]>([]);

  readonly activeResources = computed(() => this.resources().filter((resource) => resource.status === 'active').length);
  readonly pendingReservations = computed(() => this.reservations().filter((reservation) => reservation.status === 'pending').length);
  readonly blockingReservations = computed(() => this.reservations().filter((reservation) => {
    return ['pending', 'approved', 'checked_out'].includes(reservation.status);
  }).length);
  readonly occupancyRate = computed(() => {
    const active = this.activeResources();

    return active === 0 ? 0 : Math.min(100, (this.blockingReservations() / active) * 100);
  });
  readonly upcomingReservations = computed(() => this.reservations().slice(0, 8));

  constructor() {
    this.load();
  }

  statusTone(status: string): StatusTone {
    const tones: Record<string, StatusTone> = {
      pending: 'warning',
      approved: 'success',
      checked_out: 'info',
      rejected: 'danger',
      cancelled: 'neutral',
      returned: 'neutral',
      draft: 'neutral',
    };

    return tones[status] ?? 'neutral';
  }

  private load(): void {
    this.loading.set(true);
    this.resourcesApi.listResources({ per_page: 100, sort: 'name' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((page) => this.resources.set(page.data));

    this.reservationsApi.listReservations({
      per_page: 100,
      sort: 'starts_at',
      direction: 'asc',
      starts_from: new Date().toISOString(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.reservations.set(page.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
