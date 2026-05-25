import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { CardComponent } from '@app/shared/ui/card/card.component';
import { InputComponent } from '@app/shared/ui/input/input.component';
import { LockKeyhole, ShieldCheck } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs/operators';

interface LoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'app-login',
  imports: [ButtonComponent, CardComponent, InputComponent, LucideAngularModule, ReactiveFormsModule],
  template: `
    <div class="grid min-h-screen bg-surface lg:grid-cols-[1.05fr_0.95fr]">
      <section class="flex items-center px-6 py-10 sm:px-10 lg:px-16">
        <div class="w-full max-w-md">
          <div class="mb-8 flex items-center gap-3">
            <div class="grid h-12 w-12 place-items-center rounded-lg bg-midnight-blue text-white shadow-soft">
              <lucide-angular [img]="shieldIcon" [size]="24" />
            </div>
            <div>
              <p class="font-display text-xl font-extrabold text-midnight-blue">NexusReserve</p>
              <p class="text-sm text-slate-500">Enterprise resource operations</p>
            </div>
          </div>

          <app-card title="Sign in" description="Use your corporate account to access the operations console.">
            <form class="grid gap-4" [formGroup]="form" (ngSubmit)="submit()">
              <app-input
                label="Email"
                type="email"
                placeholder="admin@demo"
                formControlName="email"
                [error]="fieldError('email')"
              />
              <app-input
                label="Password"
                type="password"
                placeholder="password"
                formControlName="password"
                [error]="fieldError('password')"
              />

              @if (errorMessage()) {
                <div class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-danger">
                  {{ errorMessage() }}
                </div>
              }

              <app-button type="submit" size="lg" [loading]="loading()" [disabled]="form.invalid">
                <lucide-angular [img]="lockIcon" [size]="18" />
                Sign in
              </app-button>
            </form>
          </app-card>
        </div>
      </section>

      <section class="hidden bg-midnight-blue px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div class="flex justify-end">
          <span class="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-cyan-100">Secure API session</span>
        </div>
        <div class="max-w-xl">
          <p class="font-display text-5xl font-extrabold leading-tight">Control shared resources without calendar chaos.</p>
          <p class="mt-5 text-lg leading-8 text-slate-300">
            Availability, approvals, audit trails and operational accountability sit behind one focused workspace.
          </p>
        </div>
        <div class="grid grid-cols-3 gap-3 text-sm text-slate-300">
          <span class="rounded-lg bg-white/10 p-4">RBAC</span>
          <span class="rounded-lg bg-white/10 p-4">Audit</span>
          <span class="rounded-lg bg-white/10 p-4">Realtime-ready</span>
        </div>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly lockIcon = LockKeyhole;
  readonly shieldIcon = ShieldCheck;
  readonly submitted = signal(false);

  readonly form = new FormGroup<LoginForm>({
    email: new FormControl('admin@demo', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('password', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  readonly invalid = computed(() => this.form.invalid && this.submitted());

  submit(): void {
    this.submitted.set(true);
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    this.loading.set(true);

    this.auth.login(this.form.getRawValue()).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: () => void this.router.navigate(['/']),
      error: () => this.errorMessage.set('Invalid email or password.'),
    });
  }

  fieldError(field: keyof LoginForm): string | null {
    const control = this.form.controls[field];

    if (!control.invalid || (!control.touched && !this.submitted())) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Required field.';
    }

    if (control.hasError('email')) {
      return 'Enter a valid email.';
    }

    if (control.hasError('minlength')) {
      return 'Use at least 6 characters.';
    }

    return 'Invalid value.';
  }
}
