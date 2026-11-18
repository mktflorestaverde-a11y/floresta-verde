import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { register } from 'tsx/esm/api';

// Hostinger runs this entry file for the full-stack Express + Vite application.
process.env.NODE_ENV ||= 'production';

// Hostinger's Express preset starts the entry file directly. Build the Vite
// frontend on first start when the deployment did not run a separate build step.
if (!existsSync(new URL('./dist/index.html', import.meta.url))) {
  execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
}

// Load the TypeScript Express server after registering the tsx ESM loader.
register();
await import('./server.ts');
