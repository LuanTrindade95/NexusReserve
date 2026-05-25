import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { X } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-modal',
  imports: [LucideAngularModule],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-40 grid place-items-center bg-slate-950/45 p-4">
        <section class="w-full max-w-lg rounded-lg border border-border bg-white shadow-soft">
          <header class="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 class="font-display text-lg font-bold text-midnight-blue">{{ title() }}</h2>
            <button
              type="button"
              class="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Close modal"
              (click)="closed.emit()"
            >
              <lucide-angular [img]="closeIcon" [size]="18" />
            </button>
          </header>
          <div class="p-5">
            <ng-content />
          </div>
        </section>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly closed = output<void>();
  readonly closeIcon = X;
}
