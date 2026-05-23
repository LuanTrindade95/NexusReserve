import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-select',
  imports: [FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: SelectComponent,
      multi: true,
    },
  ],
  template: `
    <label class="block">
      <span class="mb-1.5 block text-sm font-semibold text-slate-700">{{ label() }}</span>
      <select
        class="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-midnight-blue shadow-sm focus:border-enterprise-cyan focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-100"
        [disabled]="disabled"
        [ngModel]="value"
        (ngModelChange)="onInput($event)"
        (blur)="onTouched()"
      >
        @for (option of options(); track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
      @if (error()) {
        <span class="mt-1.5 block text-sm text-danger">{{ error() }}</span>
      }
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectComponent implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly options = input<readonly SelectOption[]>([]);
  readonly error = input<string | null>(null);

  value = '';
  disabled = false;

  private onChange: (value: string) => void = () => undefined;
  onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(value: string): void {
    this.value = value;
    this.onChange(value);
  }
}
