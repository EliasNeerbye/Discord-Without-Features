/**
 * Jest setup file - NOT A TEST FILE
 * This file contains setup code that runs before all tests
 */

// Set environment variables for testing
process.env.JWT_KEY = 'test_jwt_key';
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_db';
process.env.PORT = '5000';

// Global mocks
jest.mock('../util/logger', () => jest.fn());