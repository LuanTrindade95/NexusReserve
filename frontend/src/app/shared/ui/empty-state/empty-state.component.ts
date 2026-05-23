import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="rounded-lg border border-dashed border-border bg-white px-6 py-10 text-center">
      <p class="font-display text-lg font-bold text-midnight-blue">{{ title() }}</p>
      <p class="mx-auto mt-2 max-w-md text-sm text-slate-500">{{ description() }}</p>
      <div class="mt-5">
        <ng-content />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
}
