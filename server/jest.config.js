export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: ['**/test/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(mongodb-memory-server)/)'
  ],
  testTimeout: 30000, // Increased timeout for in-memory DB setup
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!**/node_modules/**',
    '!**/test/**',
    '!**/coverage/**'
  ]
};
