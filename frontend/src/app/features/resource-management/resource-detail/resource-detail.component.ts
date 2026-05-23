import { DatePipe, JsonPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { ToastService } from '@app/core/toast/toast.service';
import { ResourcesApiService } from '@app/features/resource-management/resources-api.service';
import { AuditEntry, Resource, ResourceBlackout } from '@app/features/resource-management/resources.models';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { CardComponent } from '@app/shared/ui/card/card.component';
import { EmptyStateComponent } from '@app/shared/ui/empty-state/empty-state.component';
import { StatusPillComponent, StatusTone } from '@app/shared/ui/status-pill/status-pill.component';
import { ArrowLeft, CalendarX, Trash2 } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';

interface BlackoutForm {
  starts_at: FormControl<string>;
  ends_at: FormControl<string>;
  reason: FormControl<string>;
}

@Component({
  selector: 'app-resource-detail',
  imports: [ButtonComponent, CardComponent, DatePipe, EmptyStateComponent, JsonPipe, LucideAngularModule, ReactiveFormsModule, RouterLink, StatusPillComponent],
  template: `
    <div class="grid gap-5">
      <a class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-enterprise-cyan" routerLink="/resources">
        <lucide-angular [img]="backIcon" [size]="16" />
        Resources
      </a>

      @if (resource(); as item) {
        <section class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="font-display text-2xl font-extrabold text-midnight-blue">{{ item.name }}</h1>
              <app-status-pill [label]="item.status" [tone]="resourceTone(item.status)" />
            </div>
            <p class="mt-1 text-sm text-slate-500">{{ item.code }} / {{ item.location }}</p>
          </div>
          <app-button routerLink="/reservations/new" variant="secondary">Reserve this resource</app-button>
        </section>

        <div class="grid gap-5 lg:grid-cols-[1fr_22rem]">
          <div class="grid gap-5">
            <app-card title="Details">
              <dl class="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt class="text-xs font-bold uppercase text-slate-400">Type</dt>
                  <dd class="mt-1 text-sm font-semibold text-midnight-blue">{{ item.resource_type?.name ?? '-' }}</dd>
                </div>
                <div>
                  <dt class="text-xs font-bold uppercase text-slate-400">Capacity</dt>
                  <dd class="mt-1 text-sm font-semibold text-midnight-blue">{{ item.capacity ?? '-' }}</dd>
                </div>
                <div class="sm:col-span-2">
                  <dt class="text-xs font-bold uppercase text-slate-400">Description</dt>
                  <dd class="mt-1 text-sm text-slate-600">{{ item.description ?? 'No description provided.' }}</dd>
                </div>
              </dl>
            </app-card>

            <app-card title="Audit history" description="Changes captured by the backend audit trail.">
              @if (audits().length > 0) {
                <div class="divide-y divide-border">
                  @for (audit of audits(); track audit.id) {
                    <article class="py-4">
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <p class="font-semibold text-midnight-blue">{{ audit.event }}</p>
                        <p class="text-xs text-slate-500">{{ audit.created_at | date: 'MMM d, y HH:mm' }}</p>
                      </div>
                      <pre class="mt-2 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{{ audit.new_values | json }}</pre>
                    </article>
                  }
                </div>
              } @else {
                <app-empty-state title="No audit entries" description="Audits appear after updates to this resource." />
              }
            </app-card>
          </div>

          <app-card title="Blackout windows" description="Maintenance or blocked periods where reservations are not allowed.">
            @if (canManage()) {
              <form class="mb-5 grid gap-3" [formGroup]="blackoutForm" (ngSubmit)="addBlackout()">
                <label class="block">
                  <span class="mb-1.5 block text-sm font-semibold text-slate-700">Starts</span>
                  <input class="form-field" type="datetime-local" formControlName="starts_at" />
                </label>
                <label class="block">
                  <span class="mb-1.5 block text-sm font-semibold text-slate-700">Ends</span>
                  <input class="form-field" type="datetime-local" formControlName="ends_at" />
                </label>
                <label class="block">
                  <span class="mb-1.5 block text-sm font-semibold text-slate-700">Reason</span>
                  <input class="form-field" formControlName="reason" />
                </label>
                @if (blackoutError()) {
                  <p class="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-danger">{{ blackoutError() }}</p>
                }
                <app-button type="submit" [disabled]="blackoutForm.invalid">
                  <lucide-angular [img]="blackoutIcon" [size]="16" />
                  Add blackout
                </app-button>
              </form>
            }

            <div class="divide-y divide-border">
              @for (blackout of blackouts(); track blackout.id) {
                <article class="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p class="text-sm font-semibold text-midnight-blue">{{ blackout.reason }}</p>
                    <p class="mt-1 text-xs text-slate-500">
                      {{ blackout.starts_at | date: 'MMM d, HH:mm' }} - {{ blackout.ends_at | date: 'MMM d, HH:mm' }}
                    </p>
                  </div>
                  @if (canManage()) {
                    <button class="grid h-8 w-8 place-items-center rounded-lg text-danger hover:bg-red-50" type="button" (click)="deleteBlackout(blackout)">
                      <lucide-angular [img]="trashIcon" [size]="15" />
                    </button>
                  }
                </article>
              } @empty {
                <app-empty-state title="No blackouts" description="This resource has no maintenance windows." />
              }
            </div>
          </app-card>
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceDetailComponent {
  private readonly api = inject(ResourcesApiService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  readonly backIcon = ArrowLeft;
  readonly blackoutIcon = CalendarX;
  readonly trashIcon = Trash2;
  readonly resource = signal<Resource | null>(null);
  readonly audits = signal<readonly AuditEntry[]>([]);
  readonly blackouts = signal<readonly ResourceBlackout[]>([]);
  readonly blackoutError = signal<string | null>(null);
  readonly canManage = computed(() => this.auth.hasPermission('resources.manage'));
  readonly blackoutForm = new FormGroup<BlackoutForm>({
    starts_at: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    ends_at: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    reason: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(255)] }),
  });

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
  }

  addBlackout(): void {
    const resource = this.resource();

    if (!resource || this.blackoutForm.invalid) {
      return;
    }

    const value = this.blackoutForm.getRawValue();
    this.blackoutError.set(null);
    this.api.createBlackout(resource.id, {
      starts_at: new Date(value.starts_at).toISOString(),
      ends_at: new Date(value.ends_at).toISOString(),
      reason: value.reason,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.blackoutForm.reset({ starts_at: '', ends_at: '', reason: '' });
          this.toast.success('Blackout added', 'Availability will reflect this maintenance window.');
          this.loadBlackouts(resource.id);
        },
        error: (error: HttpErrorResponse) => this.blackoutError.set(error.error?.message ?? 'Blackout could not be created.'),
      });
  }

  deleteBlackout(blackout: ResourceBlackout): void {
    const resource = this.resource();

    if (!resource) {
      return;
    }

    this.api.deleteBlackout(resource.id, blackout.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.toast.success('Blackout removed');
        this.loadBlackouts(resource.id);
      });
  }

  resourceTone(status: string): StatusTone {
    return status === 'active' ? 'success' : status === 'maintenance' ? 'warning' : 'neutral';
  }

  private load(id: number): void {
    this.api.getResource(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => this.resource.set(response.data));

    this.api.listAudits(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((page) => this.audits.set(page.data));

    this.loadBlackouts(id);
  }

  private loadBlackouts(id: number): void {
    this.api.listBlackouts(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((page) => this.blackouts.set(page.data));
  }
}
