import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  tone: ToastTone;
  title: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly messages = signal<readonly ToastMessage[]>([]);

  success(title: string, message?: string): void {
    this.push('success', title, message);
  }

  error(title: string, message?: string): void {
    this.push('error', title, message);
  }

  info(title: string, message?: string): void {
    this.push('info', title, message);
  }

  dismiss(id: number): void {
    this.messages.update((messages) => messages.filter((message) => message.id !== id));
  }

  private push(tone: ToastTone, title: string, message?: string): void {
    const toast: ToastMessage = {
      id: this.nextId,
      tone,
      title,
      message,
    };

    this.nextId += 1;
    this.messages.update((messages) => [...messages, toast]);

    window.setTimeout(() => this.dismiss(toast.id), 5000);
  }
}
