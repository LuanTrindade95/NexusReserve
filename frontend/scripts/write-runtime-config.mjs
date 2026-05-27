import { writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const outputPath = resolve('public/runtime-config.js');

const config = {
  apiBaseUrl: process.env.NEXUS_API_BASE_URL ?? 'http://localhost:8000/api/v1',
  realtime: {
    appKey: process.env.NEXUS_REVERB_APP_KEY ?? 'nexus-reserve-local-key',
    host: process.env.NEXUS_REVERB_HOST ?? 'localhost',
    port: Number(process.env.NEXUS_REVERB_PORT ?? 8080),
    scheme: process.env.NEXUS_REVERB_SCHEME ?? 'http',
  },
};

await mkdir(dirname(outputPath), { recursive: true });

writeFileSync(
  outputPath,
  `window.nexusReserveApiBaseUrl = ${JSON.stringify(config.apiBaseUrl)};\n`
    + `window.nexusReserveRealtime = ${JSON.stringify(config.realtime, null, 2)};\n`,
);
