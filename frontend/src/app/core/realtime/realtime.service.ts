import { NgZone, computed, inject, Injectable, signal } from '@angular/core';
import { API_BASE_URL } from '@app/core/api/api.config';
import { AuthService } from '@app/core/auth/auth.service';
import { ToastService } from '@app/core/toast/toast.service';
import { createEchoClient } from '@app/core/realtime/echo.client';
import {
  BroadcastNotificationPayload,
  ReservationStatusChangedPayload,
  ResourceAvailabilityChangedPayload,
} from '@app/core/realtime/realtime.models';
import { Channel, PresenceChannel } from 'laravel-echo';
import Echo from 'laravel-echo';

type RealtimeStatus = 'disconnected' | 'connecting' | 'connected' | 'failed';
type GlobalEventChannel = (Channel | PresenceChannel) & {
  listenToAll(callback: (event: string, payload: unknown) => void): Channel | PresenceChannel;
};

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly auth = inject(AuthService);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly zone = inject(NgZone);
  private readonly toast = inject(ToastService);
  private echo: Echo<'reverb'> | null = null;
  private subscribedResourceIds = new Set<number>();
  private statusTimer: number | null = null;

  readonly status = signal<RealtimeStatus>('disconnected');
  readonly isConnected = computed(() => this.status() === 'connected');
  readonly reservationStatusChanged = signal<ReservationStatusChangedPayload | null>(null);
  readonly resourceAvailabilityChanged = signal<ResourceAvailabilityChangedPayload | null>(null);
  readonly notificationReceived = signal<BroadcastNotificationPayload | null>(null);

  connect(): void {
    const token = this.auth.token();
    const user = this.auth.currentUser();

    if (this.echo !== null || token === null || user === null) {
      return;
    }

    this.status.set('connecting');
    const echo = createEchoClient(token, this.broadcastAuthEndpoint());

    if (echo === null) {
      this.status.set('failed');

      return;
    }

    this.echo = echo;
    this.startStatusPolling(echo);

    this.listenReservationStatus(echo.private(`users.${user.id}`));

    const notificationChannel = echo.private(`App.Models.User.${user.id}`)
      .notification((payload: BroadcastNotificationPayload) => {
        this.handleNotification(payload);
      });

    this.listenToAll(notificationChannel, (event, payload) => {
      if (event.includes('BroadcastNotificationCreated') && this.isNotificationPayload(payload)) {
        this.handleNotification(payload);
      }
    });

    if (this.auth.hasPermission('reservations.approve')) {
      this.listenAvailability(this.listenReservationStatus(echo.join('managers.reservations')));
    }
  }

  subscribeResource(resourceId: number): void {
    if (this.echo === null || this.subscribedResourceIds.has(resourceId)) {
      return;
    }

    if (!this.auth.hasPermission('reservations.view-all') && !this.auth.hasPermission('resources.manage')) {
      return;
    }

    this.subscribedResourceIds.add(resourceId);
    this.listenAvailability(this.listenReservationStatus(this.echo.private(`resources.${resourceId}`)));
  }

  disconnect(): void {
    this.echo?.disconnect();
    if (this.statusTimer !== null) {
      window.clearInterval(this.statusTimer);
      this.statusTimer = null;
    }
    this.echo = null;
    this.subscribedResourceIds = new Set<number>();
    this.status.set('disconnected');
    this.reservationStatusChanged.set(null);
    this.resourceAvailabilityChanged.set(null);
    this.notificationReceived.set(null);
  }

  private broadcastAuthEndpoint(): string {
    return this.apiBaseUrl.replace(/\/api\/v1$/, '/broadcasting/auth');
  }

  private normalizeStatus(status: string): RealtimeStatus {
    if (status === 'connected' || status === 'connecting' || status === 'failed') {
      return status;
    }

    return 'disconnected';
  }

  private startStatusPolling(echo: Echo<'reverb'>): void {
    this.statusTimer = window.setInterval(() => {
      this.zone.run(() => this.status.set(this.normalizeStatus(echo.connectionStatus())));
    }, 2000);
  }

  private listenReservationStatus(
    channel: Channel | PresenceChannel,
  ): Channel | PresenceChannel {
    channel
      .listen('.reservation.status.changed', (payload: ReservationStatusChangedPayload) => {
        this.handleReservationStatus(payload);
      })
      .listen('.App\\Events\\ReservationStatusChanged', (payload: ReservationStatusChangedPayload) => {
        this.handleReservationStatus(payload);
      });

    this.listenToAll(channel, (event, payload) => {
      if (event.includes('reservation.status.changed') && this.isReservationStatusPayload(payload)) {
        this.handleReservationStatus(payload);
      }
    });

    return channel;
  }

  private listenAvailability(
    channel: Channel | PresenceChannel,
  ): Channel | PresenceChannel {
    channel
      .listen('.resource.availability.changed', (payload: ResourceAvailabilityChangedPayload) => {
        this.zone.run(() => this.resourceAvailabilityChanged.set(payload));
      })
      .listen('.App\\Events\\ResourceAvailabilityChanged', (payload: ResourceAvailabilityChangedPayload) => {
        this.zone.run(() => this.resourceAvailabilityChanged.set(payload));
      });

    return channel;
  }

  private handleReservationStatus(payload: ReservationStatusChangedPayload): void {
    this.zone.run(() => this.reservationStatusChanged.set(payload));
  }

  private handleNotification(payload: BroadcastNotificationPayload): void {
    this.zone.run(() => {
      this.notificationReceived.set(payload);
      this.toast.info(payload.title, payload.message);
    });
  }

  private isReservationStatusPayload(payload: unknown): payload is ReservationStatusChangedPayload {
    if (!this.isRecord(payload) || !this.isRecord(payload['reservation'])) {
      return false;
    }

    return typeof payload['reservation']['id'] === 'number'
      && typeof payload['reservation']['status'] === 'string';
  }

  private isNotificationPayload(payload: unknown): payload is BroadcastNotificationPayload {
    return this.isRecord(payload)
      && typeof payload['title'] === 'string'
      && typeof payload['message'] === 'string';
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private listenToAll(
    channel: Channel | PresenceChannel,
    callback: (event: string, payload: unknown) => void,
  ): void {
    (channel as GlobalEventChannel).listenToAll(callback);
  }
}
