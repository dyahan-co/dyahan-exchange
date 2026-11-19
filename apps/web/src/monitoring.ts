import React from 'react';
import Bugsnag from '@bugsnag/js';
import BugsnagPluginReact from '@bugsnag/plugin-react';

Bugsnag.start({
  apiKey: 'fba331e3121c193555a7ab6e0d87ba50',
  plugins: [new BugsnagPluginReact()],
  appType: 'browser',
  releaseStage: import.meta.env.MODE,
  enabledReleaseStages: ['development', 'production'],
  autoDetectErrors: true,
  collectUserIp: false,
  generateAnonymousId: false,
  redactedKeys: [/password/i, /authorization/i, /token/i, /cookie/i, /secret/i],
});

export const MonitoringErrorBoundary = Bugsnag.getPlugin('react')!.createErrorBoundary(React);
