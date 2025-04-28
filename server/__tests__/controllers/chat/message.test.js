const { sendMessage, getMessages } = require('../../../controllers/chat/message');
const Message = require('../../../models/Message');
const Chat = require('../../../models/Chat');

jest.mock('../../../models/Message');
jest.mock('../../../models/Chat');
jest.mock('../../../util/logger');

describe('Message Controller', () => {
  let req;
  let res;
  
  beforeEach(() => {
    req = {
      body: {},
      user: { userId: 'user123' },
      params: {},
      query: {},
      app: {
        get: jest.fn().mockReturnValue({
          to: jest.fn().mockReturnValue({
            emit: jest.fn()
          })
        })
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    jest.clearAllMocks();
  });
  
  describe('sendMessage', () => {
    test('should return 400 if content is empty', async () => {
      req.body = { content: '' };
      
      await sendMessage(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Message content is required',
        error: true
      });
    });
    
    test('should return 404 if chat not found', async () => {
      req.body = { chatId: 'nonexistent', content: 'test message' };
      Chat.findById.mockResolvedValue(null);
      
      await sendMessage(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Chat not found',
        error: true
      });
    });
    
    test('should return 403 if user is not a chat participant', async () => {
      req.body = { chatId: 'chat123', content: 'test message' };
      Chat.findById.mockResolvedValue({
        participants: ['otherUser']
      });
      
      await sendMessage(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Not a participant in this chat',
        error: true
      });
    });
    
    test('should send message successfully', async () => {
      const mockMessage = {
        _id: 'msg123',
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({ _id: 'msg123' })
      };
      req.body = { chatId: 'chat123', content: 'test message' };
      
      Chat.findById.mockResolvedValue({
        participants: ['user123']
      });
      Message.mockImplementation(() => mockMessage);
      
      await sendMessage(req, res);
      
      expect(mockMessage.save).toHaveBeenCalled();
      expect(req.app.get).toHaveBeenCalledWith('io');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockMessage);
    });
  });
  
  describe('getMessages', () => {
    test('should return 404 if chat not found', async () => {
      req.params.chatId = 'nonexistent';
      Chat.findById.mockResolvedValue(null);
      
      await getMessages(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Chat not found',
        error: true
      });
    });
    
    test('should return 403 if user is not a chat participant', async () => {
      req.params.chatId = 'chat123';
      Chat.findById.mockResolvedValue({
        participants: ['otherUser']
      });
      
      await getMessages(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Not a participant in this chat',
        error: true
      });
    });
    
    test('should return messages successfully', async () => {
      const mockMessages = [{ _id: 'msg1' }, { _id: 'msg2' }];
      req.params.chatId = 'chat123';
      
      Chat.findById.mockResolvedValue({
        participants: ['user123']
      });
      Message.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockMessages)
          })
        })
      });
      
      await getMessages(req, res);
      
      expect(res.json).toHaveBeenCalledWith(mockMessages);
    });
    
    test('should include before parameter in query when provided', async () => {
      req.params.chatId = 'chat123';
      req.query.before = '2025-01-01T00:00:00Z';
      
      Chat.findById.mockResolvedValue({
        participants: ['user123']
      });
      Message.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue([])
          })
        })
      });
      
      await getMessages(req, res);
      
      expect(Message.find).toHaveBeenCalledWith({
        chat: 'chat123',
        createdAt: { $lt: '2025-01-01T00:00:00Z' }
      });
    });
  });
});