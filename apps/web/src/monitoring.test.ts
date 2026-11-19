import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  start: vi.fn(),
  getPlugin: vi.fn(),
  createErrorBoundary: vi.fn(),
}));

vi.mock('@bugsnag/js', () => ({
  default: {
    start: mocks.start,
    getPlugin: mocks.getPlugin,
  },
}));

vi.mock('@bugsnag/plugin-react', () => ({
  default: class BugsnagPluginReact {},
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();

  mocks.createErrorBoundary.mockReturnValue(React.Fragment);
  mocks.getPlugin.mockReturnValue({
    createErrorBoundary: mocks.createErrorBoundary,
  });
});

describe('monitoring', () => {
  it('initializes BugSnag and creates the React error boundary', async () => {
    const { MonitoringErrorBoundary } = await import('./monitoring');

    expect(mocks.start).toHaveBeenCalledTimes(1);
    expect(mocks.start).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'fba331e3121c193555a7ab6e0d87ba50',
        releaseStage: 'test',
        enabledReleaseStages: ['development', 'production'],
        autoDetectErrors: true,
        collectUserIp: false,
        generateAnonymousId: false,
        plugins: expect.any(Array),
      }),
    );

    expect(mocks.getPlugin).toHaveBeenCalledWith('react');
    expect(mocks.createErrorBoundary).toHaveBeenCalledWith(React);
    expect(MonitoringErrorBoundary).toBe(React.Fragment);
  });
});
