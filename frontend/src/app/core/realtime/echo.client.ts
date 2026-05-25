import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

import { resolveRealtimeConfig } from './realtime.config';

export function createEchoClient(token: string, authEndpoint: string): Echo<'reverb'> | null {
  const config = resolveRealtimeConfig();

  if (!config.appKey) {
    return null;
  }

  return new Echo<'reverb'>({
    broadcaster: 'reverb',
    key: config.appKey,
    Pusher,
    namespace: '',
    wsHost: config.host,
    wsPort: config.port,
    wssPort: config.port,
    forceTLS: config.scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint,
    bearerToken: token,
    auth: {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  });
}
