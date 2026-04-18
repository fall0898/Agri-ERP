/**
 * Sentry — monitoring erreurs frontend
 *
 * Activation :
 *   1. npm install (installe @sentry/angular depuis package.json)
 *   2. Décommenter l'import dans main.ts : import './sentry';
 *   3. Renseigner sentryDsn dans environment.prod.ts
 */

import * as Sentry from '@sentry/angular';
import { environment } from './environments/environment';

if (environment.production && environment.sentryDsn) {
  Sentry.init({
    dsn: environment.sentryDsn,
    environment: 'production',
    tracesSampleRate: 0.1,
    integrations: [Sentry.browserTracingIntegration()],
  });
}
