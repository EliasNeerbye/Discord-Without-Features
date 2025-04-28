const register = require('../../../controllers/auth/register');
const User = require('../../../models/User');
const argon2 = require('argon2');
const jwt = require('../../../util/jwtHandler');
const cookieHandler = require('../../../util/cookieHandler');

jest.mock('../../../models/User');
jest.mock('argon2');
jest.mock('../../../util/jwtHandler');
jest.mock('../../../util/cookieHandler');
jest.mock('../../../util/logger');

describe('Register Controller', () => {
  let req;
  let res;
  let mockUser;
  
  beforeEach(() => {
    req = {
      body: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    mockUser = {
      _id: '123',
      email: 'test@example.com',
      save: jest.fn().mockResolvedValue(true)
    };
    
    jest.clearAllMocks();
    User.mockImplementation(() => mockUser);
    User.findOne.mockResolvedValue(null);
    argon2.hash.mockResolvedValue('hashedPassword');
    jwt.signJwt.mockReturnValue('mocked-token');
  });
  
  test('should return 400 if email is not provided', async () => {
    req.body.email = '';
    
    await register(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: true,
        message: expect.stringContaining('email')
      })
    );
  });
  
  test('should return 400 if invalid email is provided', async () => {
    req.body.email = 'invalid-email';
    
    await register(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: true,
        message: expect.stringContaining('valid email')
      })
    );
  });
  
  test('should return 400 if password is too short', async () => {
    req.body.password = '123';
    
    await register(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: true,
        message: expect.stringContaining('at least 8 characters')
      })
    );
  });
  
  test('should return 409 if user with email already exists', async () => {
    User.findOne.mockResolvedValue({
      email: 'test@example.com'
    });
    
    await register(req, res);
    
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: true,
        message: expect.stringContaining('already exists')
      })
    );
  });
  
  test('should return 201 and set cookie when registration is successful', async () => {
    await register(req, res);
    
    expect(argon2.hash).toHaveBeenCalledWith(req.body.password);
    expect(mockUser.save).toHaveBeenCalled();
    expect(jwt.signJwt).toHaveBeenCalledWith({
      userId: mockUser._id,
      email: mockUser.email
    });
    expect(cookieHandler.setAuthCookie).toHaveBeenCalledWith(res, 'mocked-token');
    
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: false,
        message: expect.stringContaining('Successfully')
      })
    );
  });
});