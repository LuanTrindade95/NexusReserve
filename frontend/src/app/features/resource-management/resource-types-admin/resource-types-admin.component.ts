import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ResourcesApiService } from '@app/features/resource-management/resources-api.service';
import { ToastService } from '@app/core/toast/toast.service';
import { ResourceType, ResourceTypePayload } from '@app/features/resource-management/resources.models';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { CardComponent } from '@app/shared/ui/card/card.component';
import { EmptyStateComponent } from '@app/shared/ui/empty-state/empty-state.component';
import { ModalComponent } from '@app/shared/ui/modal/modal.component';
import { StatusPillComponent } from '@app/shared/ui/status-pill/status-pill.component';
import { Plus, Trash2 } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';

interface ResourceTypeForm {
  name: FormControl<string>;
  slug: FormControl<string>;
  icon: FormControl<string>;
  requires_approval: FormControl<boolean>;
  max_duration_minutes: FormControl<string>;
  color: FormControl<string>;
}

@Component({
  selector: 'app-resource-types-admin',
  imports: [ButtonComponent, CardComponent, DatePipe, EmptyStateComponent, LucideAngularModule, ModalComponent, ReactiveFormsModule, StatusPillComponent],
  template: `
    <div class="grid gap-5">
      <section class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="font-display text-2xl font-extrabold text-midnight-blue">Resource types</h1>
          <p class="mt-1 text-sm text-slate-500">Approval policy, maximum duration and visual identity for resources.</p>
        </div>
        <app-button (click)="openCreate()">
          <lucide-angular [img]="plusIcon" [size]="16" />
          Add type
        </app-button>
      </section>

      <app-card>
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="text-xs uppercase text-slate-500">
              <tr>
                <th class="border-b border-border px-4 py-3">Type</th>
                <th class="border-b border-border px-4 py-3">Approval</th>
                <th class="border-b border-border px-4 py-3">Max duration</th>
                <th class="border-b border-border px-4 py-3">Updated</th>
                <th class="border-b border-border px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              @for (type of resourceTypes(); track type.id) {
                <tr class="hover:bg-slate-50">
                  <td class="border-b border-border px-4 py-3">
                    <div class="flex items-center gap-3">
                      <span class="h-4 w-4 rounded-full" [style.background]="type.color"></span>
                      <div>
                        <p class="font-semibold text-midnight-blue">{{ type.name }}</p>
                        <p class="text-xs text-slate-500">{{ type.slug }} / {{ type.icon }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="border-b border-border px-4 py-3">
                    <app-status-pill [label]="type.requires_approval ? 'required' : 'auto'" [tone]="type.requires_approval ? 'warning' : 'success'" />
                  </td>
                  <td class="border-b border-border px-4 py-3 text-slate-700">{{ type.max_duration_minutes }} minutes</td>
                  <td class="border-b border-border px-4 py-3 text-slate-500">{{ type.updated_at | date: 'MMM d, HH:mm' }}</td>
                  <td class="border-b border-border px-4 py-3">
                    <div class="flex justify-end gap-2">
                      <app-button variant="secondary" size="sm" (click)="openEdit(type)">Edit</app-button>
                      <app-button variant="danger" size="sm" (click)="remove(type)">
                        <lucide-angular [img]="trashIcon" [size]="14" />
                      </app-button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td class="px-4 py-8" colspan="5">
                    <app-empty-state title="No resource types" description="Create the first resource type to classify resources." />
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-card>
    </div>

    <app-modal [open]="modalOpen()" [title]="editingType() ? 'Edit resource type' : 'Add resource type'" (closed)="closeModal()">
      <form class="grid gap-4" [formGroup]="form" (ngSubmit)="save()">
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Name</span>
            <input class="form-field" formControlName="name" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Slug</span>
            <input class="form-field" formControlName="slug" />
          </label>
        </div>
        <div class="grid gap-4 sm:grid-cols-3">
          <label class="block">
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Icon</span>
            <input class="form-field" formControlName="icon" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Max duration</span>
            <input class="form-field" type="number" min="1" formControlName="max_duration_minutes" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Color</span>
            <input class="form-field" type="color" formControlName="color" />
          </label>
        </div>
        <label class="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input class="h-4 w-4 rounded border-border text-enterprise-cyan" type="checkbox" formControlName="requires_approval" />
          Requires manager approval
        </label>
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
      outline: none;
    }
    .form-field:focus {
      border-color: #06b6d4;
      box-shadow: 0 0 0 4px rgb(207 250 254);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceTypesAdminComponent {
  private readonly api = inject(ResourcesApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  readonly plusIcon = Plus;
  readonly trashIcon = Trash2;
  readonly resourceTypes = signal<readonly ResourceType[]>([]);
  readonly modalOpen = signal(false);
  readonly editingType = signal<ResourceType | null>(null);
  readonly form = new FormGroup<ResourceTypeForm>({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    slug: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    icon: new FormControl('box', { nonNullable: true, validators: [Validators.required] }),
    requires_approval: new FormControl(true, { nonNullable: true }),
    max_duration_minutes: new FormControl('480', { nonNullable: true, validators: [Validators.required] }),
    color: new FormControl('#06B6D4', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    this.load();
  }

  openCreate(): void {
    this.editingType.set(null);
    this.form.reset({
      name: '',
      slug: '',
      icon: 'box',
      requires_approval: true,
      max_duration_minutes: '480',
      color: '#06B6D4',
    });
    this.modalOpen.set(true);
  }

  openEdit(type: ResourceType): void {
    this.editingType.set(type);
    this.form.reset({
      name: type.name,
      slug: type.slug,
      icon: type.icon,
      requires_approval: type.requires_approval,
      max_duration_minutes: String(type.max_duration_minutes),
      color: type.color,
    });
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    const payload = this.toPayload();
    const editing = this.editingType();
    const request = editing ? this.api.updateResourceType(editing.id, payload) : this.api.createResourceType(payload);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.closeModal();
      this.toast.success('Resource type saved');
      this.load();
    });
  }

  remove(type: ResourceType): void {
    this.api.deleteResourceType(type.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.toast.success('Resource type removed');
        this.load();
      });
  }

  private load(): void {
    this.api.listResourceTypes({ per_page: 100, sort: 'name' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((page) => this.resourceTypes.set(page.data));
  }

  private toPayload(): ResourceTypePayload {
    const value = this.form.getRawValue();

    return {
      name: value.name,
      slug: value.slug,
      icon: value.icon,
      requires_approval: value.requires_approval,
      max_duration_minutes: Number(value.max_duration_minutes),
      color: value.color,
    };
  }
}
