import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule, Search } from 'lucide-angular';

@Component({
  selector: 'app-search-field',
  imports: [LucideAngularModule],
  template: `
    <label class="block">
      <span class="mb-1.5 block text-sm font-semibold text-slate-700">{{ label() }}</span>
      <span class="relative block">
        <span class="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 text-slate-400">
          <lucide-angular [img]="searchIcon" [size]="16" />
        </span>
        <input
          #searchInput
          class="h-11 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm text-midnight-blue shadow-sm focus:border-enterprise-cyan focus:ring-4 focus:ring-cyan-100"
          [value]="value()"
          [placeholder]="placeholder()"
          (input)="valueChange.emit(searchInput.value)"
        />
      </span>
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchFieldComponent {
  readonly label = input('Search');
  readonly placeholder = input('');
  readonly value = input('');
  readonly valueChange = output<string>();

  readonly searchIcon = Search;
}
