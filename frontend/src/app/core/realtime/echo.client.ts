import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

import { resolveRealtimeConfig } from './realtime.config';

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

export function createEchoClient(): Echo<'reverb'> | null {
  const config = resolveRealtimeConfig();

  if (!config.appKey) {
    return null;
  }

  window.Pusher = Pusher;

  return new Echo<'reverb'>({
    broadcaster: 'reverb',
    key: config.appKey,
    wsHost: config.host,
    wsPort: config.port,
    wssPort: config.port,
    forceTLS: config.scheme === 'https',
    enabledTransports: ['ws', 'wss'],
  });
}
