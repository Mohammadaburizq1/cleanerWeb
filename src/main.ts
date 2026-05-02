import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Redirect any Azure Static Apps hostname to the canonical domain.
// Keep path/query/hash so deep links continue to work.
const currentHost = window.location.hostname;
if (currentHost.includes('azurestaticapps.net')) {
  const targetOrigin = 'https://www.supermagicmop.com';
  const { pathname, search, hash } = window.location;
  window.location.replace(`${targetOrigin}${pathname}${search}${hash}`);
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));