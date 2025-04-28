const getUser = require('../../middleware/getUser');
const jwtHandler = require('../../util/jwtHandler');

jest.mock('../../util/jwtHandler');

describe('Get User Middleware', () => {
  let req;
  let res;
  let next;
  
  beforeEach(() => {
    req = {
      cookies: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    jest.clearAllMocks();
  });
  
  test('should return 401 if no token is present', () => {
    getUser(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Authentication token not found.',
      error: true
    });
    expect(next).not.toHaveBeenCalled();
  });
  
  test('should return 401 if token is invalid', () => {
    req.cookies.token = 'invalid-token';
    jwtHandler.verifyJwt.mockReturnValue(null);
    
    getUser(req, res, next);
    
    expect(jwtHandler.verifyJwt).toHaveBeenCalledWith('invalid-token');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid or expired authentication token.',
      error: true
    });
    expect(next).not.toHaveBeenCalled();
  });
  
  test('should set req.user and call next if token is valid', () => {
    const mockUser = { userId: '123', email: 'test@example.com' };
    req.cookies.token = 'valid-token';
    jwtHandler.verifyJwt.mockReturnValue(mockUser);
    
    getUser(req, res, next);
    
    expect(jwtHandler.verifyJwt).toHaveBeenCalledWith('valid-token');
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});