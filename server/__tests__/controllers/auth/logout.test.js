const logout = require('../../../controllers/auth/logout');
const cookieHandler = require('../../../util/cookieHandler');

jest.mock('../../../util/cookieHandler');
jest.mock('../../../util/logger');

describe('Logout Controller', () => {
  let req;
  let res;
  
  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    jest.clearAllMocks();
  });
  
  test('should clear auth cookie and return success message', () => {
    cookieHandler.clearAuthCookie.mockImplementation(() => {});
    
    logout(req, res);
    
    expect(cookieHandler.clearAuthCookie).toHaveBeenCalledWith(res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'You are now logged out!',
      error: false
    });
  });
  
  test('should return 500 if an error occurs', () => {
    cookieHandler.clearAuthCookie.mockImplementation(() => {
      throw new Error('Test error');
    });
    
    logout(req, res);
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Something went wrong on our side!',
      error: true
    });
  });
});