/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts', '!src/**/*.spec.ts'],
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: { global: { lines: 80, functions: 80, branches: 80, statements: 80 } },
};
