import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Task from '../../src/models/Task.js';
import Project from '../../src/models/Project.js';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';

let mongoServer;
const request = supertest(app);

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'Test@1234',
  firstName: 'Test',
  lastName: 'User'
};

// Generate JWT token for testing
export const generateAuthToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-test-secret',
    { expiresIn: '1h' }
  );
};

// Setup test database before all tests
export const setupTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

// Clear all test data after each test
export const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

// Close the in-memory database after all tests
export const closeTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

// Create a test user and get auth token
export const createTestUser = async () => {
  const user = new User({
    ...testUser,
    password: await bcrypt.hash(testUser.password, 10)
  });
  await user.save();
  
  const token = generateAuthToken(user._id);
  return { user, token };
};

export { request };

// This file provides helper functions for testing, including:
// - Setting up an in-memory MongoDB instance
// - Generating JWT tokens for authentication
// - Creating test users
// - Cleaning up test data
// - A pre-configured supertest request instance
