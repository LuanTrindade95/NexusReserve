import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService, ToastTone } from '@app/core/toast/toast.service';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-toast-container',
  imports: [LucideAngularModule, NgClass],
  template: `
    <div class="fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
      @for (toast of toastService.messages(); track toast.id) {
        <article class="rounded-lg border bg-white p-4 shadow-soft" [ngClass]="borderClasses[toast.tone]">
          <div class="flex gap-3">
            <lucide-angular class="mt-0.5 shrink-0" [img]="icons[toast.tone]" [size]="18" />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold text-midnight-blue">{{ toast.title }}</p>
              @if (toast.message) {
                <p class="mt-1 text-sm text-slate-600">{{ toast.message }}</p>
              }
            </div>
            <button
              type="button"
              class="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Dismiss notification"
              (click)="toastService.dismiss(toast.id)"
            >
              <lucide-angular [img]="closeIcon" [size]="16" />
            </button>
          </div>
        </article>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
  readonly closeIcon = X;
  readonly icons: Record<ToastTone, typeof CircleCheck> = {
    success: CircleCheck,
    error: CircleAlert,
    info: Info,
  };
  readonly borderClasses: Record<ToastTone, string> = {
    success: 'border-success text-success',
    error: 'border-danger text-danger',
    info: 'border-info text-info',
  };
}
