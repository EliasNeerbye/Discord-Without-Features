const { setAuthCookie, clearAuthCookie } = require('../../util/cookieHandler');

describe('Cookie Handler', () => {
  let mockRes;
  
  beforeEach(() => {
    mockRes = {
      cookie: jest.fn(),
      clearCookie: jest.fn()
    };
  });
  
  describe('setAuthCookie', () => {
    test('should set auth cookie with the correct parameters', () => {
      const token = 'test-token';
      const defaultExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      setAuthCookie(mockRes, token);
      
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'token',
        token,
        expect.objectContaining({
          httpOnly: true,
          path: '/',
          maxAge: defaultExpiry
        })
      );
    });
    
    test('should use custom expiry when provided', () => {
      const token = 'test-token';
      const customExpiry = 3600000; // 1 hour
      
      setAuthCookie(mockRes, token, customExpiry);
      
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'token',
        token,
        expect.objectContaining({
          maxAge: customExpiry
        })
      );
    });
  });
  
  describe('clearAuthCookie', () => {
    test('should clear auth cookie with the correct parameters', () => {
      clearAuthCookie(mockRes);
      
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        'token',
        expect.objectContaining({
          httpOnly: true,
          path: '/'
        })
      );
    });
  });
});