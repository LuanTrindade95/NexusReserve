import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '@app/core/auth/auth.service';
import { CardComponent } from '@app/shared/ui/card/card.component';
import { StatusPillComponent } from '@app/shared/ui/status-pill/status-pill.component';

@Component({
  selector: 'app-dashboard',
  imports: [CardComponent, StatusPillComponent],
  template: `
    <div class="grid gap-5">
      <section>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 class="font-display text-2xl font-extrabold text-midnight-blue">Dashboard</h1>
            <p class="mt-1 text-sm text-slate-500">Authenticated workspace shell for NexusReserve operations.</p>
          </div>
          <app-status-pill label="API connected" tone="success" />
        </div>
      </section>

      <div class="grid gap-4 md:grid-cols-3">
        <app-card title="Session">
          <p class="text-sm font-semibold text-slate-500">Signed in as</p>
          <p class="mt-2 text-lg font-bold text-midnight-blue">{{ auth.currentUser()?.name }}</p>
        </app-card>
        <app-card title="Roles">
          <div class="flex flex-wrap gap-2">
            @for (role of auth.currentUser()?.roles ?? []; track role) {
              <app-status-pill [label]="role" tone="info" />
            }
          </div>
        </app-card>
        <app-card title="Permissions">
          <p class="text-3xl font-extrabold text-midnight-blue">{{ auth.currentUser()?.permissions?.length ?? 0 }}</p>
          <p class="mt-1 text-sm text-slate-500">Effective permissions loaded from the API.</p>
        </app-card>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  readonly auth = inject(AuthService);
}
