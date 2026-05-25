import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationsService } from '@app/features/notifications/notifications.service';
import { Bell } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-notification-bell',
  imports: [DatePipe, LucideAngularModule, RouterLink],
  template: `
    <div class="relative">
      <button
        type="button"
        class="relative grid h-10 w-10 place-items-center rounded-lg border border-border bg-white text-slate-700 hover:bg-slate-50"
        aria-label="Notifications"
        (click)="toggleOpen()"
      >
        <lucide-angular [img]="bellIcon" [size]="18" />
        @if (notifications.unreadCount() > 0) {
          <span class="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[0.65rem] font-extrabold text-white">
            {{ notifications.unreadCount() }}
          </span>
        }
      </button>

      @if (open()) {
        <section class="absolute right-0 z-20 mt-2 w-[22rem] overflow-hidden rounded-lg border border-border bg-white shadow-soft">
          <header class="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p class="font-display text-sm font-bold text-midnight-blue">Notifications</p>
              <p class="text-xs text-slate-500">{{ notifications.unreadCount() }} unread</p>
            </div>
            <button class="text-xs font-bold text-enterprise-cyan hover:text-cyan-700" type="button" (click)="notifications.markAllAsRead()">
              Mark all read
            </button>
          </header>
          <div class="max-h-96 overflow-auto">
            @for (notification of notifications.notifications(); track notification.id) {
              <article class="border-b border-border px-4 py-3 last:border-b-0" [class.bg-cyan-50]="notification.read_at === null">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-bold text-midnight-blue">{{ notification.data.title ?? 'Notification' }}</p>
                    <p class="mt-1 text-sm text-slate-600">{{ notification.data.message ?? '' }}</p>
                    <p class="mt-1 text-xs text-slate-500">{{ notification.created_at | date: 'MMM d, HH:mm' }}</p>
                  </div>
                  @if (notification.read_at === null) {
                    <button class="text-xs font-bold text-enterprise-cyan" type="button" (click)="notifications.markAsRead(notification)">Read</button>
                  }
                </div>
                @if (notification.data.reservation_id) {
                  <a
                    class="mt-2 inline-flex text-xs font-bold text-slate-600 hover:text-enterprise-cyan"
                    [routerLink]="['/reservations', notification.data.reservation_id]"
                    (click)="open.set(false)"
                  >
                    Open reservation
                  </a>
                }
              </article>
            } @empty {
              <p class="px-4 py-6 text-center text-sm text-slate-500">No notifications yet.</p>
            }
          </div>
        </section>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent {
  readonly notifications = inject(NotificationsService);
  readonly bellIcon = Bell;
  readonly open = signal(false);

  toggleOpen(): void {
    this.open.update((value) => !value);
  }
}
