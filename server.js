import { register } from 'tsx/esm/api';

// Hostinger starts this JavaScript entry file. Register tsx so the existing
// Express server can run from its TypeScript source without duplicating code.
register();
await import('./server.ts');
