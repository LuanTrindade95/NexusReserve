import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { LoadingService } from '@app/core/loading/loading.service';
import { ToastService } from '@app/core/toast/toast.service';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { CalendarDays, Gauge, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Settings, ShieldCheck } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';

interface NavigationItem {
  label: string;
  path: string;
  icon: typeof Gauge;
  permission?: string;
}

@Component({
  selector: 'app-shell',
  imports: [ButtonComponent, LucideAngularModule, NgClass, RouterLink, RouterOutlet],
  template: `
    <div class="min-h-screen bg-surface">
      <aside
        class="fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-midnight-blue text-white transition-all duration-200 md:translate-x-0"
        [class.w-72]="!collapsed()"
        [class.w-20]="collapsed()"
        [class.-translate-x-full]="!mobileOpen()"
        [class.translate-x-0]="mobileOpen()"
      >
        <div class="flex h-16 items-center gap-3 border-b border-white/10 px-4">
          <div class="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-enterprise-cyan font-display text-lg font-extrabold">
            N
          </div>
          @if (!collapsed()) {
            <div class="min-w-0">
              <p class="font-display text-base font-extrabold">NexusReserve</p>
              <p class="text-xs text-slate-300">Resource operations</p>
            </div>
          }
        </div>

        <nav class="flex-1 space-y-1 px-3 py-4">
          @for (item of visibleNavigation(); track item.path) {
            <a
              class="flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
              [routerLink]="item.path"
              (click)="mobileOpen.set(false)"
            >
              <lucide-angular [img]="item.icon" [size]="19" />
              @if (!collapsed()) {
                <span>{{ item.label }}</span>
              }
            </a>
          }
        </nav>

        <div class="border-t border-white/10 p-3">
          <button
            type="button"
            class="hidden h-10 w-full items-center justify-center gap-2 rounded-lg text-slate-300 hover:bg-white/10 md:flex"
            (click)="toggleCollapsed()"
          >
            <lucide-angular [img]="collapsed() ? expandIcon : collapseIcon" [size]="18" />
            @if (!collapsed()) {
              <span class="text-sm font-semibold">Collapse</span>
            }
          </button>
        </div>
      </aside>

      @if (mobileOpen()) {
        <button
          type="button"
          class="fixed inset-0 z-20 bg-slate-950/35 md:hidden"
          aria-label="Close navigation"
          (click)="mobileOpen.set(false)"
        ></button>
      }

      <div class="min-h-screen transition-all duration-200" [ngClass]="collapsed() ? 'md:pl-20' : 'md:pl-72'">
        <header class="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-white/95 px-4 backdrop-blur">
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="grid h-10 w-10 place-items-center rounded-lg border border-border bg-white md:hidden"
              aria-label="Open navigation"
              (click)="mobileOpen.set(true)"
            >
              <lucide-angular [img]="menuIcon" [size]="20" />
            </button>
            <div>
              <p class="font-display text-lg font-bold text-midnight-blue">Operations Console</p>
              <p class="hidden text-sm text-slate-500 sm:block">Availability, approvals and accountable resource flow</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            @if (loading.isLoading()) {
              <span class="hidden text-sm font-semibold text-enterprise-cyan sm:inline">Syncing</span>
            }
            <div class="hidden text-right sm:block">
              <p class="text-sm font-bold text-midnight-blue">{{ auth.currentUser()?.name }}</p>
              <p class="text-xs text-slate-500">{{ auth.currentUser()?.email }}</p>
            </div>
            <app-button variant="secondary" size="sm" (click)="logout()">
              <lucide-angular [img]="logoutIcon" [size]="16" />
              Logout
            </app-button>
          </div>
        </header>

        <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  readonly auth = inject(AuthService);
  readonly loading = inject(LoadingService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);
  readonly menuIcon = Menu;
  readonly collapseIcon = PanelLeftClose;
  readonly expandIcon = PanelLeftOpen;
  readonly logoutIcon = LogOut;

  readonly navigation: readonly NavigationItem[] = [
    { label: 'Dashboard', path: '/', icon: Gauge },
    { label: 'Calendar', path: '/', icon: CalendarDays },
    { label: 'Administration', path: '/', icon: Settings, permission: 'resources.manage' },
    { label: 'Audit', path: '/', icon: ShieldCheck, permission: 'audit.view' },
  ];

  readonly visibleNavigation = computed(() => this.navigation.filter((item) => {
    return item.permission ? this.auth.hasPermission(item.permission) : true;
  }));

  toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.toast.info('Signed out');
        void this.router.navigate(['/login']);
      },
      error: () => {
        this.auth.clearSession();
        void this.router.navigate(['/login']);
      },
    });
  }
}
