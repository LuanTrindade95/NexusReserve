import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
  },
};

export default config;
