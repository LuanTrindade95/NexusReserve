import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input',
  imports: [FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputComponent,
      multi: true,
    },
  ],
  template: `
    <label class="block">
      <span class="mb-1.5 block text-sm font-semibold text-slate-700">{{ label() }}</span>
      <input
        class="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-midnight-blue shadow-sm transition placeholder:text-slate-400 focus:border-enterprise-cyan focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-100"
        [attr.type]="type()"
        [attr.placeholder]="placeholder()"
        [disabled]="disabled"
        [ngModel]="value"
        (ngModelChange)="onInput($event)"
        (blur)="onTouched()"
      />
      @if (error()) {
        <span class="mt-1.5 block text-sm text-danger">{{ error() }}</span>
      }
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly placeholder = input('');
  readonly type = input<'email' | 'password' | 'text'>('text');
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
