// Global setup for tests
import { setupTestDB, closeTestDB } from './testHelpers.js';

// Set timeout to 30s for all tests
jest.setTimeout(30000);

// Setup test database before all tests
beforeAll(async () => {
  await setupTestDB();
});

// Close database connection after all tests
afterAll(async () => {
  await closeTestDB();
});
