import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { ApiPageMeta } from '@app/core/api/pagination.models';
import { ToastService } from '@app/core/toast/toast.service';
import { ResourcesApiService } from '@app/features/resource-management/resources-api.service';
import { Resource, ResourcePayload, ResourceStatus, ResourceType } from '@app/features/resource-management/resources.models';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { CardComponent } from '@app/shared/ui/card/card.component';
import { EmptyStateComponent } from '@app/shared/ui/empty-state/empty-state.component';
import { ModalComponent } from '@app/shared/ui/modal/modal.component';
import { SelectComponent, SelectOption } from '@app/shared/ui/select/select.component';
import { StatusPillComponent, StatusTone } from '@app/shared/ui/status-pill/status-pill.component';
import { Plus, RotateCcw, Search, Trash2 } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';

interface ResourceForm {
  resource_type_id: FormControl<string>;
  name: FormControl<string>;
  code: FormControl<string>;
  description: FormControl<string>;
  location: FormControl<string>;
  capacity: FormControl<string>;
  status: FormControl<ResourceStatus>;
}

@Component({
  selector: 'app-resources-list',
  imports: [
    ButtonComponent,
    CardComponent,
    DatePipe,
    EmptyStateComponent,
    LucideAngularModule,
    ModalComponent,
    ReactiveFormsModule,
    RouterLink,
    SelectComponent,
    StatusPillComponent,
  ],
  template: `
    <div class="grid gap-5">
      <section class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="font-display text-2xl font-extrabold text-midnight-blue">Resources</h1>
          <p class="mt-1 text-sm text-slate-500">Operational catalog for rooms, vehicles and equipment.</p>
        </div>
        @if (canManage()) {
          <app-button (click)="openCreate()">
            <lucide-angular [img]="plusIcon" [size]="16" />
            Add resource
          </app-button>
        }
      </section>

      <app-card>
        <form class="grid gap-3 lg:grid-cols-[1fr_14rem_12rem_auto]" (submit)="applyFilters($event)">
          <label class="block">
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Search</span>
            <span class="relative block">
              <lucide-angular class="absolute left-3 top-3 text-slate-400" [img]="searchIcon" [size]="16" />
              <input
                #searchInput
                class="h-11 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm text-midnight-blue shadow-sm focus:border-enterprise-cyan focus:ring-4 focus:ring-cyan-100"
                [value]="search()"
                placeholder="Name or code"
                (input)="search.set(searchInput.value)"
              />
            </span>
          </label>
          <app-select label="Type" [options]="typeOptions()" [formControl]="typeControl" />
          <app-select label="Status" [options]="statusOptions" [formControl]="statusControl" />
          <div class="flex items-end gap-2">
            <app-button type="submit">Apply</app-button>
            <app-button variant="secondary" type="button" (click)="clearFilters()">Clear</app-button>
          </div>
        </form>
      </app-card>

      <div class="overflow-hidden rounded-lg border border-border bg-white shadow-soft">
        <div class="max-h-[38rem] overflow-auto">
          <table class="min-w-full border-separate border-spacing-0 text-left text-sm">
            <thead class="sticky top-0 z-10 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th class="border-b border-border px-4 py-3 font-bold">Resource</th>
                <th class="border-b border-border px-4 py-3 font-bold">Type</th>
                <th class="border-b border-border px-4 py-3 font-bold">Location</th>
                <th class="border-b border-border px-4 py-3 font-bold">Status</th>
                <th class="border-b border-border px-4 py-3 font-bold">Updated</th>
                <th class="border-b border-border px-4 py-3 font-bold"></th>
              </tr>
            </thead>
            <tbody>
              @for (resource of resources(); track resource.id) {
                <tr class="hover:bg-slate-50">
                  <td class="border-b border-border px-4 py-3">
                    <a class="font-semibold text-midnight-blue hover:text-enterprise-cyan" [routerLink]="['/resources', resource.id]">
                      {{ resource.name }}
                    </a>
                    <p class="text-xs text-slate-500">{{ resource.code }}</p>
                  </td>
                  <td class="border-b border-border px-4 py-3 text-slate-700">{{ resource.resource_type?.name ?? '-' }}</td>
                  <td class="border-b border-border px-4 py-3 text-slate-700">{{ resource.location }}</td>
                  <td class="border-b border-border px-4 py-3">
                    <app-status-pill [label]="resource.status" [tone]="resourceTone(resource.status)" />
                  </td>
                  <td class="border-b border-border px-4 py-3 text-slate-500">{{ resource.updated_at | date: 'MMM d, HH:mm' }}</td>
                  <td class="border-b border-border px-4 py-3">
                    @if (canManage()) {
                      <div class="flex justify-end gap-2">
                        <app-button variant="secondary" size="sm" (click)="openEdit(resource)">Edit</app-button>
                        @if (resource.deleted_at) {
                          <app-button variant="secondary" size="sm" (click)="restore(resource)">
                            <lucide-angular [img]="restoreIcon" [size]="14" />
                          </app-button>
                        } @else {
                          <app-button variant="danger" size="sm" (click)="remove(resource)">
                            <lucide-angular [img]="trashIcon" [size]="14" />
                          </app-button>
                        }
                      </div>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td class="px-4 py-8" colspan="6">
                    <app-empty-state title="No resources found" description="Adjust filters or add a managed resource." />
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
    </div>

    <app-modal [open]="modalOpen()" [title]="editingResource() ? 'Edit resource' : 'Add resource'" (closed)="closeModal()">
      <form class="grid gap-4" [formGroup]="form" (ngSubmit)="save()">
        <app-select label="Resource type" [options]="typeOptions()" formControlName="resource_type_id" />
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Name</span>
            <input class="form-field" formControlName="name" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Code</span>
            <input class="form-field" formControlName="code" />
          </label>
        </div>
        <label class="block">
          <span class="mb-1.5 block text-sm font-semibold text-slate-700">Description</span>
          <textarea class="form-field min-h-24 py-3" formControlName="description"></textarea>
        </label>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Location</span>
            <input class="form-field" formControlName="location" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Capacity</span>
            <input class="form-field" formControlName="capacity" type="number" min="0" />
          </label>
        </div>
        <app-select label="Status" [options]="statusOptionsWithoutAll" formControlName="status" />
        <div class="flex justify-end gap-2">
          <app-button variant="secondary" type="button" (click)="closeModal()">Cancel</app-button>
          <app-button type="submit" [disabled]="form.invalid">Save</app-button>
        </div>
      </form>
    </app-modal>
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
      box-shadow: 0 1px 2px rgb(15 23 42 / 0.05);
      outline: none;
    }
    .form-field:focus {
      border-color: #06b6d4;
      box-shadow: 0 0 0 4px rgb(207 250 254);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourcesListComponent {
  private readonly api = inject(ResourcesApiService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  readonly plusIcon = Plus;
  readonly restoreIcon = RotateCcw;
  readonly searchIcon = Search;
  readonly trashIcon = Trash2;
  readonly resources = signal<readonly Resource[]>([]);
  readonly resourceTypes = signal<readonly ResourceType[]>([]);
  readonly meta = signal<ApiPageMeta | null>(null);
  readonly page = signal(1);
  readonly search = signal('');
  readonly modalOpen = signal(false);
  readonly editingResource = signal<Resource | null>(null);
  readonly canManage = computed(() => this.auth.hasPermission('resources.manage'));
  readonly lastPage = computed(() => this.meta()?.last_page ?? 1);
  readonly typeOptions = computed<readonly SelectOption[]>(() => [
    { label: 'All types', value: '' },
    ...this.resourceTypes().map((type) => ({ label: type.name, value: String(type.id) })),
  ]);
  readonly statusOptions: readonly SelectOption[] = [
    { label: 'All statuses', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Retired', value: 'retired' },
  ];
  readonly statusOptionsWithoutAll = this.statusOptions.slice(1);

  readonly typeControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl('', { nonNullable: true });
  readonly form = new FormGroup<ResourceForm>({
    resource_type_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
    code: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(80)] }),
    description: new FormControl('', { nonNullable: true }),
    location: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
    capacity: new FormControl('', { nonNullable: true }),
    status: new FormControl<ResourceStatus>('active', { nonNullable: true }),
  });

  constructor() {
    this.api.listResourceTypes({ per_page: 100, sort: 'name' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((page) => this.resourceTypes.set(page.data));

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.search.set(params.get('search') ?? '');
        this.typeControl.setValue(params.get('type') ?? '', { emitEvent: false });
        this.statusControl.setValue(params.get('status') ?? '', { emitEvent: false });
        this.page.set(Number(params.get('page') ?? 1));
        this.load();
      });
  }

  applyFilters(event?: Event): void {
    event?.preventDefault();

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: this.search() || null,
        type: this.typeControl.value || null,
        status: this.statusControl.value || null,
        page: 1,
      },
      queryParamsHandling: 'merge',
    });
  }

  clearFilters(): void {
    this.search.set('');
    this.typeControl.setValue('');
    this.statusControl.setValue('');
    this.applyFilters();
  }

  goToPage(page: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }

  openCreate(): void {
    this.editingResource.set(null);
    this.form.reset({
      resource_type_id: this.resourceTypes()[0] ? String(this.resourceTypes()[0].id) : '',
      name: '',
      code: '',
      description: '',
      location: '',
      capacity: '',
      status: 'active',
    });
    this.modalOpen.set(true);
  }

  openEdit(resource: Resource): void {
    this.editingResource.set(resource);
    this.form.reset({
      resource_type_id: String(resource.resource_type_id),
      name: resource.name,
      code: resource.code,
      description: resource.description ?? '',
      location: resource.location,
      capacity: resource.capacity === null ? '' : String(resource.capacity),
      status: resource.status,
    });
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const payload = this.toPayload();
    const editing = this.editingResource();
    const request = editing ? this.api.updateResource(editing.id, payload) : this.api.createResource(payload);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.closeModal();
      this.toast.success('Resource saved', 'The catalog entry was updated.');
      this.load();
    });
  }

  remove(resource: Resource): void {
    this.api.deleteResource(resource.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.toast.success('Resource archived', 'The resource can be restored later.');
        this.load();
      });
  }

  restore(resource: Resource): void {
    this.api.restoreResource(resource.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.toast.success('Resource restored');
        this.load();
      });
  }

  resourceTone(status: ResourceStatus): StatusTone {
    return status === 'active' ? 'success' : status === 'maintenance' ? 'warning' : 'neutral';
  }

  metaSummary(): string {
    const meta = this.meta();

    return meta ? `${meta.from ?? 0}-${meta.to ?? 0} of ${meta.total}` : '0 resources';
  }

  private load(): void {
    this.api.listResources({
      search: this.search() || undefined,
      type: this.typeControl.value || undefined,
      status: this.toResourceStatus(this.statusControl.value),
      page: this.page(),
      per_page: 15,
      sort: 'name',
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((page) => {
        this.resources.set(page.data);
        this.meta.set(page.meta ?? null);
      });
  }

  private toPayload(): ResourcePayload {
    const value = this.form.getRawValue();
    const capacityValue = String(value.capacity).trim();
    const capacity = capacityValue === '' ? null : Number(capacityValue);

    return {
      resource_type_id: Number(value.resource_type_id),
      name: value.name,
      code: value.code,
      description: value.description.trim() === '' ? null : value.description,
      location: value.location,
      capacity,
      status: value.status,
      metadata: null,
    };
  }

  private toResourceStatus(value: string): ResourceStatus | undefined {
    return value === 'active' || value === 'maintenance' || value === 'retired' ? value : undefined;
  }
}
