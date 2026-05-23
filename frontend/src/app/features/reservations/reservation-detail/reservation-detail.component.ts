import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { ToastService } from '@app/core/toast/toast.service';
import { ReservationsApiService } from '@app/features/reservations/reservations-api.service';
import { Reservation } from '@app/features/reservations/reservations.models';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { CardComponent } from '@app/shared/ui/card/card.component';
import { StatusPillComponent, StatusTone } from '@app/shared/ui/status-pill/status-pill.component';
import { ArrowLeft, Check, RotateCcw, X } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-reservation-detail',
  imports: [ButtonComponent, CardComponent, DatePipe, LucideAngularModule, ReactiveFormsModule, RouterLink, StatusPillComponent],
  template: `
    <div class="grid gap-5">
      <a class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-enterprise-cyan" routerLink="/reservations">
        <lucide-angular [img]="backIcon" [size]="16" />
        Reservations
      </a>

      @if (reservation(); as item) {
        <section class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="font-display text-2xl font-extrabold text-midnight-blue">{{ item.purpose }}</h1>
              <app-status-pill [label]="item.status" [tone]="statusTone(item.status)" />
            </div>
            <p class="mt-1 text-sm text-slate-500">
              {{ item.resource?.name ?? 'Resource #' + item.resource_id }} / {{ item.starts_at | date: 'MMM d, y HH:mm' }} - {{ item.ends_at | date: 'HH:mm' }}
            </p>
          </div>
        </section>

        @if (actionError()) {
          <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-danger">{{ actionError() }}</p>
        }

        <div class="grid gap-5 lg:grid-cols-[1fr_24rem]">
          <div class="grid gap-5">
            <app-card title="Reservation details">
              <dl class="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt class="text-xs font-bold uppercase text-slate-400">Requester</dt>
                  <dd class="mt-1 text-sm font-semibold text-midnight-blue">{{ item.user?.name ?? 'User #' + item.user_id }}</dd>
                </div>
                <div>
                  <dt class="text-xs font-bold uppercase text-slate-400">Approver</dt>
                  <dd class="mt-1 text-sm font-semibold text-midnight-blue">{{ item.approver?.name ?? '-' }}</dd>
                </div>
                <div>
                  <dt class="text-xs font-bold uppercase text-slate-400">Resource type</dt>
                  <dd class="mt-1 text-sm font-semibold text-midnight-blue">{{ item.resource?.resource_type?.name ?? '-' }}</dd>
                </div>
                <div>
                  <dt class="text-xs font-bold uppercase text-slate-400">Created</dt>
                  <dd class="mt-1 text-sm font-semibold text-midnight-blue">{{ item.created_at | date: 'MMM d, y HH:mm' }}</dd>
                </div>
              </dl>
            </app-card>

            <app-card title="Timeline" description="State transitions recorded by the backend state machine.">
              <div class="space-y-4">
                @for (log of item.status_logs; track log.id) {
                  <article class="rounded-lg border border-border p-4">
                    <div class="flex flex-wrap items-center gap-2">
                      <app-status-pill [label]="log.from_status" tone="neutral" />
                      <span class="text-slate-400">to</span>
                      <app-status-pill [label]="log.to_status" [tone]="statusTone(log.to_status)" />
                    </div>
                    <p class="mt-2 text-sm text-slate-600">{{ log.note ?? 'No note provided.' }}</p>
                    <p class="mt-1 text-xs text-slate-500">{{ log.created_at | date: 'MMM d, y HH:mm' }} / user #{{ log.changed_by }}</p>
                  </article>
                }
              </div>
            </app-card>
          </div>

          <app-card title="Actions">
            <div class="grid gap-3">
              <label class="block">
                <span class="mb-1.5 block text-sm font-semibold text-slate-700">Action note</span>
                <textarea class="form-field min-h-24 py-3" [formControl]="noteControl"></textarea>
              </label>

              @if (canApprove()) {
                <app-button data-testid="approve-action" (click)="approve()">
                  <lucide-angular [img]="checkIcon" [size]="16" />
                  Approve
                </app-button>
              }
              @if (canReject()) {
                <label class="block">
                  <span class="mb-1.5 block text-sm font-semibold text-slate-700">Rejection reason</span>
                  <textarea class="form-field min-h-24 py-3" [formControl]="rejectReasonControl"></textarea>
                </label>
                <app-button data-testid="reject-action" variant="danger" [disabled]="rejectReasonControl.invalid" (click)="reject()">
                  <lucide-angular [img]="xIcon" [size]="16" />
                  Reject
                </app-button>
              }
              @if (canCheckOut()) {
                <app-button data-testid="checkout-action" (click)="checkOut()">Check out</app-button>
              }
              @if (canReturn()) {
                <app-button data-testid="return-action" (click)="returnReservation()">
                  <lucide-angular [img]="returnIcon" [size]="16" />
                  Return
                </app-button>
              }
              @if (canCancel()) {
                <app-button data-testid="cancel-action" variant="secondary" (click)="cancel()">Cancel reservation</app-button>
              }
              @if (!hasVisibleActions()) {
                <p class="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">No transitions are available for your permissions and this state.</p>
              }
            </div>
          </app-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .form-field {
      width: 100%;
      border-radius: 0.5rem;
      border: 1px solid #e2e8f0;
      background: white;
      padding: 0.75rem;
      font-size: 0.875rem;
      color: #0f172a;
      outline: none;
    }
    .form-field:focus {
      border-color: #06b6d4;
      box-shadow: 0 0 0 4px rgb(207 250 254);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationDetailComponent {
  private readonly api = inject(ReservationsApiService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  readonly backIcon = ArrowLeft;
  readonly checkIcon = Check;
  readonly returnIcon = RotateCcw;
  readonly xIcon = X;
  readonly reservation = signal<Reservation | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly noteControl = new FormControl('', { nonNullable: true });
  readonly rejectReasonControl = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  readonly canApprove = computed(() => this.auth.hasPermission('reservations.approve') && this.reservation()?.status === 'pending');
  readonly canReject = computed(() => this.canApprove());
  readonly canCheckOut = computed(() => this.auth.hasPermission('reservations.approve') && this.reservation()?.status === 'approved');
  readonly canReturn = computed(() => this.auth.hasPermission('reservations.approve') && this.reservation()?.status === 'checked_out');
  readonly canCancel = computed(() => {
    const reservation = this.reservation();
    const user = this.auth.currentUser();

    return reservation !== null && user !== null && reservation.user_id === user.id && ['pending', 'approved'].includes(reservation.status);
  });
  readonly hasVisibleActions = computed(() => {
    return this.canApprove() || this.canReject() || this.canCheckOut() || this.canReturn() || this.canCancel();
  });

  constructor() {
    this.load();
  }

  approve(): void {
    this.transition((id) => this.api.approve(id, { note: this.noteControl.value || null }));
  }

  reject(): void {
    if (this.rejectReasonControl.invalid) {
      return;
    }

    this.transition((id) => this.api.reject(id, { reason: this.rejectReasonControl.value }));
  }

  checkOut(): void {
    this.transition((id) => this.api.checkOut(id, { note: this.noteControl.value || null }));
  }

  returnReservation(): void {
    this.transition((id) => this.api.returnReservation(id, { note: this.noteControl.value || null }));
  }

  cancel(): void {
    this.transition((id) => this.api.cancel(id, { note: this.noteControl.value || null }));
  }

  statusTone(status: string): StatusTone {
    const tones: Record<string, StatusTone> = {
      draft: 'neutral',
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
      checked_out: 'info',
      returned: 'neutral',
      cancelled: 'neutral',
    };

    return tones[status] ?? 'neutral';
  }

  private transition(request: (id: number) => ReturnType<ReservationsApiService['approve']>): void {
    const reservation = this.reservation();

    if (!reservation) {
      return;
    }

    this.actionError.set(null);
    request(reservation.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.reservation.set(response.data);
          this.toast.success('Reservation updated', 'The state transition was recorded.');
        },
        error: (error: HttpErrorResponse) => this.actionError.set(this.payloadMessage(error) ?? 'Transition could not be completed.'),
      });
  }

  private load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.api.getReservation(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => this.reservation.set(response.data));
  }

  private payloadMessage(error: HttpErrorResponse): string | null {
    if (typeof error.error === 'object' && error.error !== null && 'message' in error.error) {
      return String(error.error.message);
    }

    return null;
  }
}
