import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  imports: [NgClass],
  template: `
    <button
      [attr.type]="type()"
      [disabled]="disabled() || loading()"
      [ngClass]="classes()"
    >
      @if (loading()) {
        <span class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
      }
      <ng-content />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);

  classes(): string {
    const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-60';
    const sizes: Record<ButtonSize, string> = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-5 text-base',
    };
    const variants: Record<ButtonVariant, string> = {
      primary: 'bg-enterprise-cyan text-white shadow-soft hover:bg-cyan-600',
      secondary: 'border border-border bg-white text-midnight-blue hover:bg-slate-50',
      ghost: 'text-slate-700 hover:bg-slate-100',
      danger: 'bg-danger text-white hover:bg-red-600',
    };

    return `${base} ${sizes[this.size()]} ${variants[this.variant()]}`;
  }
}
