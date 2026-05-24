import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiPageMeta } from '@app/core/api/pagination.models';
import { RealtimeService } from '@app/core/realtime/realtime.service';
import { ResourcesApiService } from '@app/features/resource-management/resources-api.service';
import { Resource, ResourceBlackout } from '@app/features/resource-management/resources.models';
import { ReservationsApiService } from '@app/features/reservations/reservations-api.service';
import { Reservation, ReservationStatus } from '@app/features/reservations/reservations.models';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { CardComponent } from '@app/shared/ui/card/card.component';
import { EmptyStateComponent } from '@app/shared/ui/empty-state/empty-state.component';
import { SelectComponent, SelectOption } from '@app/shared/ui/select/select.component';
import { StatusPillComponent, StatusTone } from '@app/shared/ui/status-pill/status-pill.component';
import { CalendarDays, List, Plus, Search } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';

type ViewMode = 'list' | 'calendar';
type CalendarScope = 'week' | 'day';

@Component({
  selector: 'app-reservations-list',
  imports: [ButtonComponent, CardComponent, DatePipe, EmptyStateComponent, LucideAngularModule, ReactiveFormsModule, RouterLink, SelectComponent, StatusPillComponent],
  template: `
    <div class="grid gap-5">
      <section class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="font-display text-2xl font-extrabold text-midnight-blue">Reservations</h1>
          <p class="mt-1 text-sm text-slate-500">Bookings, approvals and resource availability windows.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <div class="inline-flex rounded-lg border border-border bg-white p-1 shadow-sm">
            <button class="mode-button" [class.active]="viewMode() === 'list'" type="button" (click)="viewMode.set('list')">
              <lucide-angular [img]="listIcon" [size]="16" />
              List
            </button>
            <button class="mode-button" [class.active]="viewMode() === 'calendar'" type="button" (click)="viewMode.set('calendar')">
              <lucide-angular [img]="calendarIcon" [size]="16" />
              Calendar
            </button>
          </div>
          @if (viewMode() === 'calendar') {
            <div class="inline-flex rounded-lg border border-border bg-white p-1 shadow-sm">
              <button class="mode-button" [class.active]="calendarScope() === 'week'" type="button" (click)="calendarScope.set('week')">Week</button>
              <button class="mode-button" [class.active]="calendarScope() === 'day'" type="button" (click)="calendarScope.set('day')">Day</button>
            </div>
          }
          <app-button routerLink="/reservations/new">
            <lucide-angular [img]="plusIcon" [size]="16" />
            New reservation
          </app-button>
        </div>
      </section>

      <app-card>
        <form class="grid gap-3 lg:grid-cols-[1fr_13rem_13rem_11rem_11rem_8rem_auto]" (ngSubmit)="applyFilters()">
          <label class="block">
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Search</span>
            <span class="relative block">
              <lucide-angular class="absolute left-3 top-3 text-slate-400" [img]="searchIcon" [size]="16" />
              <input
                #searchInput
                class="h-11 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm text-midnight-blue shadow-sm focus:border-enterprise-cyan focus:ring-4 focus:ring-cyan-100"
                [value]="search()"
                placeholder="Purpose"
                (input)="search.set(searchInput.value)"
              />
            </span>
          </label>
          <app-select label="Resource" [options]="resourceOptions()" [formControl]="resourceControl" />
          <app-select label="Status" [options]="statusOptions" [formControl]="statusControl" />
          <label class="block">
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">From</span>
            <input class="form-field" type="date" [formControl]="fromControl" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Until</span>
            <input class="form-field" type="date" [formControl]="untilControl" />
          </label>
          <label class="flex items-end gap-2 pb-2 text-sm font-semibold text-slate-700">
            <input class="mb-1 h-4 w-4 rounded border-border text-enterprise-cyan" type="checkbox" [formControl]="mineControl" />
            Mine
          </label>
          <div class="flex items-end gap-2">
            <app-button type="submit">Apply</app-button>
            <app-button variant="secondary" type="button" (click)="clearFilters()">Clear</app-button>
          </div>
        </form>
      </app-card>

      @if (viewMode() === 'list') {
        <div class="overflow-hidden rounded-lg border border-border bg-white shadow-soft">
          <div class="max-h-[38rem] overflow-auto">
            <table class="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead class="sticky top-0 z-10 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th class="border-b border-border px-4 py-3">Reservation</th>
                  <th class="border-b border-border px-4 py-3">Resource</th>
                  <th class="border-b border-border px-4 py-3">Window</th>
                  <th class="border-b border-border px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                @for (reservation of reservations(); track reservation.id) {
                  <tr class="hover:bg-slate-50" [class.bg-red-50]="isConflict(reservation)">
                    <td class="border-b border-border px-4 py-3">
                      <a class="font-semibold text-midnight-blue hover:text-enterprise-cyan" [routerLink]="['/reservations', reservation.id]">
                        {{ reservation.purpose }}
                      </a>
                      <p class="text-xs text-slate-500">{{ reservation.user?.name ?? 'Requester #' + reservation.user_id }}</p>
                    </td>
                    <td class="border-b border-border px-4 py-3 text-slate-700">{{ reservation.resource?.name ?? 'Resource #' + reservation.resource_id }}</td>
                    <td class="border-b border-border px-4 py-3 text-slate-700">
                      {{ reservation.starts_at | date: 'MMM d, HH:mm' }} - {{ reservation.ends_at | date: 'MMM d, HH:mm' }}
                    </td>
                    <td class="border-b border-border px-4 py-3">
                      <div class="flex flex-wrap items-center gap-2">
                        <app-status-pill [label]="reservation.status" [tone]="statusTone(reservation.status)" />
                        @if (isBlackoutHit(reservation)) {
                          <app-status-pill label="blackout" tone="danger" />
                        }
                        @if (isConflict(reservation)) {
                          <app-status-pill label="conflict" tone="danger" />
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td class="px-4 py-8" colspan="4">
                      <app-empty-state title="No reservations found" description="Adjust filters or create a new reservation." />
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <footer class="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <span>{{ metaSummary() }}</span>
            <div class="flex gap-2">
              <app-button variant="secondary" size="sm" [disabled]="page() <= 1" (click)="goToPage(page() - 1)">Previous</app-button>
              <app-button variant="secondary" size="sm" [disabled]="page() >= lastPage()" (click)="goToPage(page() + 1)">Next</app-button>
            </div>
          </footer>
        </div>
      } @else {
        <div class="grid gap-4 lg:grid-cols-2">
          @for (day of calendarDays(); track day.label) {
            <app-card [title]="day.label">
              @for (reservation of day.reservations; track reservation.id) {
                <a
                  class="mb-3 block rounded-lg border border-border p-3 hover:border-enterprise-cyan"
                  [class.border-red-300]="isConflict(reservation) || isBlackoutHit(reservation)"
                  [routerLink]="['/reservations', reservation.id]"
                >
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <p class="font-semibold text-midnight-blue">{{ reservation.resource?.name ?? 'Resource #' + reservation.resource_id }}</p>
                    <app-status-pill [label]="reservation.status" [tone]="statusTone(reservation.status)" />
                  </div>
                  <p class="mt-1 text-sm text-slate-500">{{ reservation.starts_at | date: 'HH:mm' }} - {{ reservation.ends_at | date: 'HH:mm' }} / {{ reservation.purpose }}</p>
                </a>
              } @empty {
                <app-empty-state title="No bookings" description="This day has no visible reservations." />
              }
            </app-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .form-field {
      height: 2.75rem;
      width: 100%;
      border-radius: 0.5rem;
      border: 1px solid #e2e8f0;
      background: white;
      padding: 0 0.75rem;
      font-size: 0.875rem;
      color: #0f172a;
      outline: none;
    }
    .form-field:focus {
      border-color: #06b6d4;
      box-shadow: 0 0 0 4px rgb(207 250 254);
    }
    .mode-button {
      display: inline-flex;
      height: 2.25rem;
      align-items: center;
      gap: 0.375rem;
      border-radius: 0.5rem;
      padding: 0 0.75rem;
      font-size: 0.875rem;
      font-weight: 700;
      color: #475569;
    }
    .mode-button.active {
      background: #06b6d4;
      color: white;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationsListComponent {
  private readonly reservationsApi = inject(ReservationsApiService);
  private readonly resourcesApi = inject(ResourcesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly realtime = inject(RealtimeService);

  readonly calendarIcon = CalendarDays;
  readonly listIcon = List;
  readonly plusIcon = Plus;
  readonly searchIcon = Search;
  readonly reservations = signal<readonly Reservation[]>([]);
  readonly resources = signal<readonly Resource[]>([]);
  readonly blackouts = signal<readonly ResourceBlackout[]>([]);
  readonly meta = signal<ApiPageMeta | null>(null);
  readonly page = signal(1);
  readonly search = signal('');
  readonly viewMode = signal<ViewMode>('list');
  readonly calendarScope = signal<CalendarScope>('week');
  readonly resourceControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl('', { nonNullable: true });
  readonly fromControl = new FormControl('', { nonNullable: true });
  readonly untilControl = new FormControl('', { nonNullable: true });
  readonly mineControl = new FormControl(false, { nonNullable: true });
  readonly lastPage = computed(() => this.meta()?.last_page ?? 1);
  readonly resourceOptions = computed<readonly SelectOption[]>(() => [
    { label: 'All resources', value: '' },
    ...this.resources().map((resource) => ({ label: resource.name, value: String(resource.id) })),
  ]);
  readonly statusOptions: readonly SelectOption[] = [
    { label: 'All statuses', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Checked out', value: 'checked_out' },
    { label: 'Returned', value: 'returned' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Cancelled', value: 'cancelled' },
  ];
  readonly conflictingIds = computed(() => {
    const ids = new Set<number>();
    const blocking = this.reservations().filter((reservation) => ['pending', 'approved', 'checked_out'].includes(reservation.status));

    blocking.forEach((left) => {
      blocking.forEach((right) => {
        if (left.id !== right.id && left.resource_id === right.resource_id && this.overlaps(left.starts_at, left.ends_at, right.starts_at, right.ends_at)) {
          ids.add(left.id);
          ids.add(right.id);
        }
      });
    });

    return ids;
  });
  readonly calendarDays = computed(() => {
    const groups = new Map<string, Reservation[]>();

    const visibleReservations = this.calendarScope() === 'day'
      ? this.reservations().filter((reservation) => this.isSameDay(reservation.starts_at, this.fromControl.value))
      : this.reservations();

    visibleReservations.forEach((reservation) => {
      const label = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', weekday: 'short' }).format(new Date(reservation.starts_at));
      const entries = groups.get(label) ?? [];
      entries.push(reservation);
      groups.set(label, entries);
    });

    return [...groups.entries()].map(([label, reservations]) => ({ label, reservations }));
  });

  constructor() {
    this.resourcesApi.listResources({ per_page: 100, sort: 'name' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((page) => {
        this.resources.set(page.data);
        page.data.forEach((resource) => this.realtime.subscribeResource(resource.id));
      });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.search.set(params.get('search') ?? '');
        this.resourceControl.setValue(params.get('resource_id') ?? '', { emitEvent: false });
        this.statusControl.setValue(params.get('status') ?? '', { emitEvent: false });
        this.fromControl.setValue(params.get('starts_from')?.slice(0, 10) ?? '', { emitEvent: false });
        this.untilControl.setValue(params.get('ends_until')?.slice(0, 10) ?? '', { emitEvent: false });
        this.mineControl.setValue(params.get('mine') === 'true', { emitEvent: false });
        this.page.set(Number(params.get('page') ?? 1));
        this.load();
      });

    effect(() => {
      const statusChanged = this.realtime.reservationStatusChanged();

      if (statusChanged !== null) {
        this.upsertReservation(statusChanged.reservation);
      }
    });

    effect(() => {
      const availabilityChanged = this.realtime.resourceAvailabilityChanged();

      if (availabilityChanged !== null) {
        this.realtime.subscribeResource(availabilityChanged.resource_id);
      }
    });
  }

  applyFilters(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: this.search() || null,
        resource_id: this.resourceControl.value || null,
        status: this.statusControl.value || null,
        starts_from: this.fromControl.value ? new Date(`${this.fromControl.value}T00:00:00`).toISOString() : null,
        ends_until: this.untilControl.value ? new Date(`${this.untilControl.value}T23:59:59`).toISOString() : null,
        mine: this.mineControl.value ? true : null,
        page: 1,
      },
      queryParamsHandling: 'merge',
    });
  }

  clearFilters(): void {
    this.search.set('');
    this.resourceControl.setValue('');
    this.statusControl.setValue('');
    this.fromControl.setValue('');
    this.untilControl.setValue('');
    this.mineControl.setValue(false);
    this.applyFilters();
  }

  goToPage(page: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }

  isConflict(reservation: Reservation): boolean {
    return this.conflictingIds().has(reservation.id);
  }

  isBlackoutHit(reservation: Reservation): boolean {
    return this.blackouts().some((blackout) => {
      return blackout.resource_id === reservation.resource_id && this.overlaps(reservation.starts_at, reservation.ends_at, blackout.starts_at, blackout.ends_at);
    });
  }

  statusTone(status: ReservationStatus): StatusTone {
    const tones: Record<ReservationStatus, StatusTone> = {
      draft: 'neutral',
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
      checked_out: 'info',
      returned: 'neutral',
      cancelled: 'neutral',
    };

    return tones[status];
  }

  metaSummary(): string {
    const meta = this.meta();

    return meta ? `${meta.from ?? 0}-${meta.to ?? 0} of ${meta.total}` : '0 reservations';
  }

  private load(): void {
    const resourceId = this.toNumber(this.resourceControl.value);

    this.reservationsApi.listReservations({
      search: this.search() || undefined,
      resource_id: resourceId,
      status: this.toReservationStatus(this.statusControl.value),
      starts_from: this.fromControl.value ? new Date(`${this.fromControl.value}T00:00:00`).toISOString() : undefined,
      ends_until: this.untilControl.value ? new Date(`${this.untilControl.value}T23:59:59`).toISOString() : undefined,
      mine: this.mineControl.value || undefined,
      page: this.page(),
      per_page: 50,
      sort: 'starts_at',
      direction: 'asc',
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((page) => {
        this.reservations.set(page.data);
        this.meta.set(page.meta ?? null);
      });

    if (resourceId) {
      this.resourcesApi.listBlackouts(resourceId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((page) => this.blackouts.set(page.data));
    } else {
      this.blackouts.set([]);
    }
  }

  private overlaps(leftStart: string, leftEnd: string, rightStart: string, rightEnd: string): boolean {
    return new Date(leftStart) < new Date(rightEnd) && new Date(leftEnd) > new Date(rightStart);
  }

  private isSameDay(value: string, selectedDate: string): boolean {
    const target = selectedDate === '' ? new Date() : new Date(`${selectedDate}T00:00:00`);
    const date = new Date(value);

    return date.getFullYear() === target.getFullYear()
      && date.getMonth() === target.getMonth()
      && date.getDate() === target.getDate();
  }

  private toNumber(value: string): number | undefined {
    return value === '' ? undefined : Number(value);
  }

  private toReservationStatus(value: string): ReservationStatus | undefined {
    const statuses: readonly ReservationStatus[] = ['draft', 'pending', 'approved', 'rejected', 'checked_out', 'returned', 'cancelled'];

    return statuses.includes(value as ReservationStatus) ? value as ReservationStatus : undefined;
  }

  private upsertReservation(reservation: Reservation): void {
    this.reservations.update((items) => {
      const exists = items.some((item) => item.id === reservation.id);
      const next = exists
        ? items.map((item) => item.id === reservation.id ? reservation : item)
        : [reservation, ...items];

      return [...next].sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime());
    });
  }
}
