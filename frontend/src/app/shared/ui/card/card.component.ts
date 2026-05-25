import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  template: `
    <section class="rounded-lg border border-border bg-white shadow-soft">
      @if (title()) {
        <header class="border-b border-border px-5 py-4">
          <h2 class="font-display text-lg font-bold text-midnight-blue">{{ title() }}</h2>
          @if (description()) {
            <p class="mt-1 text-sm text-slate-500">{{ description() }}</p>
          }
        </header>
      }
      <div class="p-5">
        <ng-content />
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  readonly title = input<string | null>(null);
  readonly description = input<string | null>(null);
}
