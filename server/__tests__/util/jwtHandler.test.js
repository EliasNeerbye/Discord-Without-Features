const jwt = require('jsonwebtoken');
const { signJwt, verifyJwt } = require('../../util/jwtHandler');

jest.mock('jsonwebtoken');
jest.mock('../../util/logger');

describe('JWT Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signJwt', () => {
    test('should sign JWT with the correct parameters', () => {
      const mockData = { userId: '123', email: 'test@example.com' };
      const mockToken = 'mocked-jwt-token';
      
      jwt.sign.mockReturnValue(mockToken);
      
      const result = signJwt(mockData);
      
      expect(jwt.sign).toHaveBeenCalledWith(
        mockData,
        expect.any(String),
        { expiresIn: 7 * 24 * 60 * 60 }
      );
      expect(result).toBe(mockToken);
    });
    
    test('should use custom expiry when provided', () => {
      const mockData = { userId: '123' };
      const customExpiry = 3600;
      
      signJwt(mockData, customExpiry);
      
      expect(jwt.sign).toHaveBeenCalledWith(
        mockData,
        expect.any(String),
        { expiresIn: customExpiry }
      );
    });
  });

  describe('verifyJwt', () => {
    test('should return decoded token when valid', () => {
      const mockToken = 'valid-token';
      const decodedToken = { userId: '123', email: 'user@example.com' };
      
      jwt.verify.mockReturnValue(decodedToken);
      
      const result = verifyJwt(mockToken);
      
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, expect.any(String));
      expect(result).toEqual(decodedToken);
    });
    
    test('should return null when token verification fails', () => {
      const mockToken = 'invalid-token';
      
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      const result = verifyJwt(mockToken);
      
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, expect.any(String));
      expect(result).toBeNull();
    });
  });
});