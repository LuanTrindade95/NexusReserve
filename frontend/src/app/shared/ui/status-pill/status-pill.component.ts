import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  selector: 'app-status-pill',
  imports: [NgClass],
  template: `
    <span
      class="inline-flex h-7 items-center rounded-full px-2.5 text-xs font-bold"
      [ngClass]="classes[tone()]"
    >
      {{ label() }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPillComponent {
  readonly label = input.required<string>();
  readonly tone = input<StatusTone>('neutral');

  readonly classes: Record<StatusTone, string> = {
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-blue-50 text-blue-700',
    neutral: 'bg-slate-100 text-slate-700',
  };
}
