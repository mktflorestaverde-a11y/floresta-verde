import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { register } from 'tsx/esm/api';

const appDir = dirname(fileURLToPath(import.meta.url));

// Hostinger starts this entry file directly. Build the frontend with the
// current Node executable; the npm CLI is not necessarily on the runtime PATH.
process.env.NODE_ENV ||= 'production';

const distIndex = join(appDir, 'dist', 'index.html');
if (!existsSync(distIndex)) {
  const viteCli = join(appDir, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!existsSync(viteCli)) {
    throw new Error('Vite CLI não encontrado em node_modules/vite/bin/vite.js');
  }
  console.log('[Floresta Verde] Gerando o frontend com Vite...');
  execFileSync(process.execPath, [viteCli, 'build'], {
    cwd: appDir,
    stdio: 'inherit',
    env: process.env,
  });
}

// Load the existing TypeScript Express server without top-level await.
register();
import('./server.ts').catch((error) => {
  console.error('[Floresta Verde] Falha ao iniciar o servidor:', error);
  process.exitCode = 1;
});
