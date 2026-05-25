import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { ResourcesApiService } from '@app/features/resource-management/resources-api.service';
import { ToastService } from '@app/core/toast/toast.service';
import { Resource, ResourceBlackout } from '@app/features/resource-management/resources.models';
import { ReservationsApiService } from '@app/features/reservations/reservations-api.service';
import { Reservation } from '@app/features/reservations/reservations.models';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { CardComponent } from '@app/shared/ui/card/card.component';
import { SelectComponent, SelectOption } from '@app/shared/ui/select/select.component';
import { StatusPillComponent } from '@app/shared/ui/status-pill/status-pill.component';
import { ArrowLeft, CheckCircle2, TriangleAlert } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';

interface ReservationForm {
  resource_id: FormControl<string>;
  starts_at: FormControl<string>;
  ends_at: FormControl<string>;
  purpose: FormControl<string>;
}

@Component({
  selector: 'app-reservation-create',
  imports: [ButtonComponent, CardComponent, DatePipe, LucideAngularModule, ReactiveFormsModule, RouterLink, SelectComponent, StatusPillComponent],
  template: `
    <div class="grid gap-5">
      <a class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-enterprise-cyan" routerLink="/reservations">
        <lucide-angular [img]="backIcon" [size]="16" />
        Reservations
      </a>

      <section>
        <h1 class="font-display text-2xl font-extrabold text-midnight-blue">New reservation</h1>
        <p class="mt-1 text-sm text-slate-500">The interface checks availability for early feedback; the API remains the source of truth.</p>
      </section>

      <div class="grid gap-5 lg:grid-cols-[1fr_24rem]">
        <app-card title="Request details">
          <form class="grid gap-4" [formGroup]="form" (ngSubmit)="submit()">
            <app-select label="Resource" [options]="resourceOptions()" formControlName="resource_id" />
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="mb-1.5 block text-sm font-semibold text-slate-700">Starts</span>
                <input class="form-field" type="datetime-local" formControlName="starts_at" />
              </label>
              <label class="block">
                <span class="mb-1.5 block text-sm font-semibold text-slate-700">Ends</span>
                <input class="form-field" type="datetime-local" formControlName="ends_at" />
              </label>
            </div>
            <label class="block">
              <span class="mb-1.5 block text-sm font-semibold text-slate-700">Purpose</span>
              <textarea class="form-field min-h-28 py-3" formControlName="purpose"></textarea>
            </label>

            @if (conflictMessage()) {
              <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-danger" data-testid="reservation-conflict">
                {{ conflictMessage() }}
              </div>
            }
            @if (successMessage()) {
              <div class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {{ successMessage() }}
              </div>
            }

            <div class="flex justify-end gap-2">
              <app-button variant="secondary" type="button" routerLink="/reservations">Cancel</app-button>
              <app-button type="submit" [loading]="saving()" [disabled]="form.invalid">Submit reservation</app-button>
            </div>
          </form>
        </app-card>

        <app-card title="Availability">
          @if (availabilityStatus() === 'checking') {
            <p class="text-sm font-semibold text-slate-500">Checking selected window...</p>
          } @else if (availabilityStatus() === 'available') {
            <div class="flex items-start gap-3 rounded-lg bg-emerald-50 p-4 text-emerald-700">
              <lucide-angular [img]="availableIcon" [size]="20" />
              <div>
                <p class="font-semibold">No visible conflict</p>
                <p class="mt-1 text-sm">The backend will still validate with transaction locks when submitted.</p>
              </div>
            </div>
          } @else if (availabilityStatus() === 'conflict') {
            <div class="flex items-start gap-3 rounded-lg bg-red-50 p-4 text-danger">
              <lucide-angular [img]="warningIcon" [size]="20" />
              <div>
                <p class="font-semibold">Conflict likely</p>
                <p class="mt-1 text-sm">{{ conflictMessage() }}</p>
              </div>
            </div>
          } @else {
            <p class="text-sm text-slate-500">Choose a resource and a time window to preview availability.</p>
          }

          @if (selectedResource(); as resource) {
            <div class="mt-5 rounded-lg border border-border p-4">
              <p class="font-semibold text-midnight-blue">{{ resource.name }}</p>
              <p class="mt-1 text-sm text-slate-500">{{ resource.resource_type?.name }} / {{ resource.location }}</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <app-status-pill [label]="resource.status" [tone]="resource.status === 'active' ? 'success' : 'warning'" />
                @if (resource.resource_type) {
                  <app-status-pill [label]="resource.resource_type.max_duration_minutes + ' min max'" tone="info" />
                }
              </div>
            </div>
          }

          @if (nearbyReservations().length > 0) {
            <div class="mt-5">
              <h2 class="text-sm font-bold text-midnight-blue">Visible reservations</h2>
              <div class="mt-2 divide-y divide-border">
                @for (reservation of nearbyReservations(); track reservation.id) {
                  <p class="py-2 text-xs text-slate-600">
                    {{ reservation.starts_at | date: 'MMM d, HH:mm' }} - {{ reservation.ends_at | date: 'HH:mm' }} / {{ reservation.status }}
                  </p>
                }
              </div>
            </div>
          }
        </app-card>
      </div>
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationCreateComponent {
  private readonly resourcesApi = inject(ResourcesApiService);
  private readonly reservationsApi = inject(ReservationsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  readonly availableIcon = CheckCircle2;
  readonly backIcon = ArrowLeft;
  readonly warningIcon = TriangleAlert;
  readonly resources = signal<readonly Resource[]>([]);
  readonly nearbyReservations = signal<readonly Reservation[]>([]);
  readonly blackouts = signal<readonly ResourceBlackout[]>([]);
  readonly availabilityStatus = signal<'idle' | 'checking' | 'available' | 'conflict'>('idle');
  readonly conflictMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly saving = signal(false);
  readonly form = new FormGroup<ReservationForm>({
    resource_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    starts_at: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    ends_at: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    purpose: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(255)] }),
  });
  readonly resourceOptions = signal<readonly SelectOption[]>([{ label: 'Choose resource', value: '' }]);
  readonly selectedResource = signal<Resource | null>(null);

  constructor() {
    this.resourcesApi.listResources({ per_page: 100, status: 'active', sort: 'name' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((page) => {
        this.resources.set(page.data);
        this.resourceOptions.set([
          { label: 'Choose resource', value: '' },
          ...page.data.map((resource) => ({ label: `${resource.name} / ${resource.code}`, value: String(resource.id) })),
        ]);
        const resourceId = this.route.snapshot.queryParamMap.get('resource_id');
        if (resourceId) {
          this.form.controls.resource_id.setValue(resourceId);
        }
      });

    this.form.valueChanges
      .pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.checkAvailability());
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);
    this.conflictMessage.set(null);
    this.successMessage.set(null);

    this.reservationsApi.createReservation({
      resource_id: Number(value.resource_id),
      starts_at: new Date(value.starts_at).toISOString(),
      ends_at: new Date(value.ends_at).toISOString(),
      purpose: value.purpose,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          this.successMessage.set('Reservation submitted.');
          this.toast.success('Reservation submitted', 'The backend accepted the selected time window.');
          void this.router.navigate(['/reservations', response.data.id]);
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          if (error.status === 409) {
            this.conflictMessage.set(this.payloadMessage(error) ?? 'This resource is not available for the selected time window.');
            this.availabilityStatus.set('conflict');
            this.toast.error('Reservation conflict', 'The backend rejected the selected time window.');

            return;
          }
          this.conflictMessage.set(this.payloadMessage(error) ?? 'The reservation could not be created.');
        },
      });
  }

  private checkAvailability(): void {
    const value = this.form.getRawValue();
    const resourceId = Number(value.resource_id);
    this.selectedResource.set(this.resources().find((resource) => resource.id === resourceId) ?? null);
    this.conflictMessage.set(null);

    if (!resourceId || !value.starts_at || !value.ends_at || new Date(value.starts_at) >= new Date(value.ends_at)) {
      this.availabilityStatus.set('idle');

      return;
    }

    this.availabilityStatus.set('checking');
    this.reservationsApi.listReservations({ resource_id: resourceId, per_page: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((page) => {
        this.nearbyReservations.set(page.data);
        this.resourcesApi.listBlackouts(resourceId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((blackoutPage) => {
            this.blackouts.set(blackoutPage.data);
            this.evaluateClientHint(value.starts_at, value.ends_at);
          });
      });
  }

  private evaluateClientHint(startsAt: string, endsAt: string): void {
    const blockingStatuses = ['pending', 'approved', 'checked_out'];
    const reservationConflict = this.nearbyReservations().some((reservation) => {
      return blockingStatuses.includes(reservation.status) && this.overlaps(startsAt, endsAt, reservation.starts_at, reservation.ends_at);
    });
    const blackoutConflict = this.blackouts().some((blackout) => this.overlaps(startsAt, endsAt, blackout.starts_at, blackout.ends_at));
    const resource = this.selectedResource();
    const maxDuration = resource?.resource_type?.max_duration_minutes;
    const minutes = (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000;

    if (maxDuration !== undefined && minutes > maxDuration) {
      this.conflictMessage.set(`This resource type allows a maximum duration of ${maxDuration} minutes.`);
      this.availabilityStatus.set('conflict');

      return;
    }

    if (reservationConflict) {
      this.conflictMessage.set('A blocking reservation overlaps this time window.');
      this.availabilityStatus.set('conflict');

      return;
    }

    if (blackoutConflict) {
      this.conflictMessage.set('A blackout window overlaps this time window.');
      this.availabilityStatus.set('conflict');

      return;
    }

    this.availabilityStatus.set('available');
  }

  private overlaps(leftStart: string, leftEnd: string, rightStart: string, rightEnd: string): boolean {
    return new Date(leftStart) < new Date(rightEnd) && new Date(leftEnd) > new Date(rightStart);
  }

  private payloadMessage(error: HttpErrorResponse): string | null {
    if (typeof error.error === 'object' && error.error !== null && 'message' in error.error) {
      return String(error.error.message);
    }

    return null;
  }
}
