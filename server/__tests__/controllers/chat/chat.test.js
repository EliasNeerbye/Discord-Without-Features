const { createChat, getChats, updateChat } = require('../../../controllers/chat/chat');
const Chat = require('../../../models/Chat');
const User = require('../../../models/User');

jest.mock('../../../models/Chat');
jest.mock('../../../models/User');
jest.mock('../../../util/logger');

describe('Chat Controller', () => {
  let req;
  let res;
  
  beforeEach(() => {
    req = {
      body: {},
      user: { userId: 'user123' },
      params: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    jest.clearAllMocks();
  });
  
  describe('createChat', () => {
    test('should return 400 if participants is not provided or not an array', async () => {
      await createChat(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid participants',
        error: true
      });
    });
    
    test('should return 400 if private chat has more than one participant', async () => {
      req.body = {
        participants: ['user1', 'user2'],
        type: 'private'
      };
      
      await createChat(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Private chat must have exactly one participant',
        error: true
      });
    });
    
    test('should return 400 if any participant does not exist', async () => {
      req.body = {
        participants: ['user1']
      };
      
      User.find.mockResolvedValue([]);
      
      await createChat(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'One or more users not found',
        error: true
      });
    });
    
    test('should return existing chat if private chat already exists', async () => {
      const existingChat = { _id: 'chat123', type: 'private' };
      req.body = {
        participants: ['user1'],
        type: 'private'
      };
      
      User.find.mockResolvedValue([{ _id: 'user1' }, { _id: 'user123' }]);
      Chat.findOne.mockResolvedValue(existingChat);
      
      await createChat(req, res);
      
      expect(res.json).toHaveBeenCalledWith(existingChat);
    });
    
    test('should create new chat successfully', async () => {
      const mockChat = {
        _id: 'chat123',
        save: jest.fn().mockResolvedValue(true)
      };
      req.body = {
        participants: ['user1'],
        type: 'group',
        name: 'Test Group'
      };
      
      User.find.mockResolvedValue([{ _id: 'user1' }, { _id: 'user123' }]);
      Chat.mockImplementation(() => mockChat);
      
      await createChat(req, res);
      
      expect(mockChat.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockChat);
    });
  });
  
  describe('getChats', () => {
    test('should return all chats for user', async () => {
      const mockChats = [{ _id: 'chat1' }, { _id: 'chat2' }];
      Chat.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockChats)
        })
      });
      
      await getChats(req, res);
      
      expect(Chat.find).toHaveBeenCalledWith({ participants: 'user123' });
      expect(res.json).toHaveBeenCalledWith(mockChats);
    });
    
    test('should return 500 if error occurs', async () => {
      Chat.find.mockImplementation(() => {
        throw new Error('Test error');
      });
      
      await getChats(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: true
      });
    });
  });
  
  describe('updateChat', () => {
    test('should return 404 if chat not found', async () => {
      req.params.chatId = 'nonexistent';
      Chat.findById.mockResolvedValue(null);
      
      await updateChat(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Chat not found',
        error: true
      });
    });
    
    test('should return 400 if not a group chat', async () => {
      req.params.chatId = 'chat123';
      Chat.findById.mockResolvedValue({ type: 'private' });
      
      await updateChat(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Can only update group chats',
        error: true
      });
    });
    
    test('should return 403 if user is not admin', async () => {
      req.params.chatId = 'chat123';
      Chat.findById.mockResolvedValue({
        type: 'group',
        admins: ['otherUser']
      });
      
      await updateChat(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Only admins can update group chat',
        error: true
      });
    });
    
    test('should update chat successfully', async () => {
      const mockChat = {
        type: 'group',
        admins: ['user123'],
        participants: ['user123', 'existingUser'],
        name: 'Original Name',
        save: jest.fn().mockResolvedValue(true)
      };
      req.params.chatId = 'chat123';
      req.body = {
        name: 'Updated Name',
        participants: ['newUser']
      };
      
      Chat.findById.mockResolvedValue(mockChat);
      
      await updateChat(req, res);
      
      expect(mockChat.name).toBe('Updated Name');
      expect(mockChat.participants).toContain('newUser');
      expect(mockChat.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockChat);
    });
  });
});