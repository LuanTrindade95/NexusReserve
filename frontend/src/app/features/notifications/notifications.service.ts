import { DestroyRef, effect, inject, Injectable, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RealtimeService } from '@app/core/realtime/realtime.service';
import { AppNotification } from '@app/features/notifications/notifications.models';
import { NotificationsApiService } from '@app/features/notifications/notifications-api.service';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly api = inject(NotificationsApiService);
  private readonly realtime = inject(RealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly notifications = signal<readonly AppNotification[]>([]);
  readonly unreadCount = computed(() => this.notifications().filter((notification) => notification.read_at === null).length);
  private readonly reconcileTimer = window.setInterval(() => this.load(), 10000);

  constructor() {
    this.destroyRef.onDestroy(() => window.clearInterval(this.reconcileTimer));

    effect(() => {
      const pushed = this.realtime.notificationReceived();

      if (pushed !== null) {
        this.load();
      }
    });
  }

  load(): void {
    this.api.listNotifications()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((page) => this.notifications.set(page.data));
  }

  markAsRead(notification: AppNotification): void {
    this.api.markAsRead(notification.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.notifications.update((items) => items.map((item) => {
          return item.id === response.data.id ? response.data : item;
        }));
      });
  }

  markAllAsRead(): void {
    this.api.markAllAsRead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
  }
}
