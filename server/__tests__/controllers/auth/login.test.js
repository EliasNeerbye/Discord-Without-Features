const login = require('../../../controllers/auth/login');
const User = require('../../../models/User');
const argon2 = require('argon2');
const jwt = require('../../../util/jwtHandler');
const cookieHandler = require('../../../util/cookieHandler');

jest.mock('../../../models/User');
jest.mock('argon2');
jest.mock('../../../util/jwtHandler');
jest.mock('../../../util/cookieHandler');
jest.mock('../../../util/logger');

describe('Login Controller', () => {
  let req;
  let res;
  
  beforeEach(() => {
    req = {
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    jest.clearAllMocks();
  });
  
  test('should return 400 if email/username and password are not provided', async () => {
    req.body = {};
    
    await login(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: true,
        message: expect.stringContaining('Please provide')
      })
    );
  });
  
  test('should return 400 if invalid email is provided', async () => {
    req.body.email = 'invalid-email';
    
    await login(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: true,
        message: expect.stringContaining('valid email')
      })
    );
  });
  
  test('should return 401 if user is not found', async () => {
    User.findOne.mockResolvedValue(null);
    
    await login(req, res);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: true,
        message: expect.stringContaining('incorrect')
      })
    );
  });
  
  test('should return 401 if password is incorrect', async () => {
    User.findOne.mockResolvedValue({
      _id: '123',
      email: 'test@example.com',
      passwordHash: 'hashedPassword'
    });
    
    argon2.verify.mockResolvedValue(false);
    
    await login(req, res);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: true,
        message: expect.stringContaining('incorrect')
      })
    );
  });
  
  test('should return 200 and set cookie if login is successful', async () => {
    const mockUser = {
      _id: '123',
      email: 'test@example.com',
      passwordHash: 'hashedPassword'
    };
    
    User.findOne.mockResolvedValue(mockUser);
    argon2.verify.mockResolvedValue(true);
    jwt.signJwt.mockReturnValue('mocked-token');
    
    await login(req, res);
    
    expect(jwt.signJwt).toHaveBeenCalledWith({
      userId: mockUser._id,
      email: mockUser.email
    });
    
    expect(cookieHandler.setAuthCookie).toHaveBeenCalledWith(res, 'mocked-token');
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: false,
        message: expect.stringContaining('Successfully')
      })
    );
  });
});