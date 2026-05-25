import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  template: `
    <div
      class="animate-pulse rounded-lg bg-slate-200"
      [style.width]="width()"
      [style.height]="height()"
    ></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  readonly width = input('100%');
  readonly height = input('1rem');
}
