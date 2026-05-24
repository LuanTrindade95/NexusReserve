export type RealtimeScheme = 'http' | 'https';

export interface RealtimeConfig {
  appKey: string;
  host: string;
  port: number;
  scheme: RealtimeScheme;
}

declare global {
  interface Window {
    nexusReserveRealtime?: Partial<RealtimeConfig>;
  }
}

const DEFAULT_REALTIME_CONFIG: RealtimeConfig = {
  appKey: 'nexus-reserve-local-key',
  host: 'localhost',
  port: 8080,
  scheme: 'http',
};

export function resolveRealtimeConfig(): RealtimeConfig {
  const runtimeConfig = globalThis.window?.nexusReserveRealtime ?? {};

  return {
    appKey: runtimeConfig.appKey ?? DEFAULT_REALTIME_CONFIG.appKey,
    host: runtimeConfig.host ?? globalThis.window?.location.hostname ?? DEFAULT_REALTIME_CONFIG.host,
    port: runtimeConfig.port ?? DEFAULT_REALTIME_CONFIG.port,
    scheme: runtimeConfig.scheme ?? DEFAULT_REALTIME_CONFIG.scheme,
  };
}
