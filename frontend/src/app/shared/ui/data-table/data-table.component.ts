import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';

export type SortDirection = 'asc' | 'desc';

export interface DataTableColumn<TItem> {
  key: Extract<keyof TItem, string>;
  label: string;
  sortable?: boolean;
}

export interface DataTableSort<TItem> {
  key: Extract<keyof TItem, string>;
  direction: SortDirection;
}

@Component({
  selector: 'app-data-table',
  imports: [LucideAngularModule],
  template: `
    <div class="overflow-hidden rounded-lg border border-border bg-white shadow-soft">
      <div class="max-h-[34rem] overflow-auto">
        <table class="min-w-full border-separate border-spacing-0 text-left text-sm">
          <thead class="sticky top-0 z-10 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              @for (column of columns(); track column.key) {
                <th class="border-b border-border px-4 py-3 font-bold">
                  @if (column.sortable) {
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 text-left"
                      (click)="toggleSort(column.key)"
                    >
                      {{ column.label }}
                      <lucide-angular [img]="sortIcon(column.key)" [size]="14" />
                    </button>
                  } @else {
                    {{ column.label }}
                  }
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of pagedRows(); track trackRow(row, $index)) {
              <tr class="border-b border-border last:border-b-0 hover:bg-slate-50">
                @for (column of columns(); track column.key) {
                  <td class="border-b border-border px-4 py-3 text-slate-700">
                    {{ displayCell(row, column.key) }}
                  </td>
                }
              </tr>
            } @empty {
              <tr>
                <td class="px-4 py-10 text-center text-slate-500" [attr.colspan]="columns().length">
                  No records found.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <footer class="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span>Page {{ page() }} of {{ totalPages() }}</span>
        <div class="flex gap-2">
          <button class="rounded-lg border border-border px-3 py-1.5 disabled:opacity-50" type="button" [disabled]="page() === 1" (click)="previousPage()">
            Previous
          </button>
          <button class="rounded-lg border border-border px-3 py-1.5 disabled:opacity-50" type="button" [disabled]="page() === totalPages()" (click)="nextPage()">
            Next
          </button>
        </div>
      </footer>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent<TItem extends Record<string, unknown>> {
  readonly rows = input<readonly TItem[]>([]);
  readonly columns = input<readonly DataTableColumn<TItem>[]>([]);
  readonly pageSize = input(10);
  readonly sorted = output<DataTableSort<TItem>>();

  readonly page = signal(1);
  readonly sort = signal<DataTableSort<TItem> | null>(null);
  readonly sortNoneIcon = ChevronsUpDown;
  readonly sortAscIcon = ArrowUp;
  readonly sortDescIcon = ArrowDown;

  readonly sortedRows = computed(() => {
    const sort = this.sort();
    const rows = [...this.rows()];

    if (!sort) {
      return rows;
    }

    return rows.sort((left, right) => {
      const leftValue = String(left[sort.key] ?? '');
      const rightValue = String(right[sort.key] ?? '');
      const result = leftValue.localeCompare(rightValue);

      return sort.direction === 'asc' ? result : -result;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.sortedRows().length / this.pageSize())));
  readonly pagedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();

    return this.sortedRows().slice(start, start + this.pageSize());
  });

  toggleSort(key: Extract<keyof TItem, string>): void {
    const current = this.sort();
    const next: DataTableSort<TItem> = {
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    };

    this.sort.set(next);
    this.sorted.emit(next);
  }

  sortIcon(key: Extract<keyof TItem, string>): typeof ChevronsUpDown {
    const current = this.sort();

    if (current?.key !== key) {
      return this.sortNoneIcon;
    }

    return current.direction === 'asc' ? this.sortAscIcon : this.sortDescIcon;
  }

  nextPage(): void {
    this.page.update((page) => Math.min(this.totalPages(), page + 1));
  }

  previousPage(): void {
    this.page.update((page) => Math.max(1, page - 1));
  }

  displayCell(row: TItem, key: Extract<keyof TItem, string>): string {
    const value = row[key];

    return value === null || value === undefined ? '' : String(value);
  }

  trackRow(_row: TItem, index: number): number {
    return index;
  }
}
