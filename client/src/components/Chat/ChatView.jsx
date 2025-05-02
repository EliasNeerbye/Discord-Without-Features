import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { chatService } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import Message from './Message';
import MessageInput from './MessageInput';
import { FaUserFriends } from 'react-icons/fa';

const ChatView = () => {
  const [messages, setMessages] = useState([]);
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const { chatId } = useParams();
  const { socket } = useSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  // Fetch current chat and messages when chatId changes
  useEffect(() => {
    const fetchChatData = async () => {
      if (!chatId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // For a real implementation, we'd need to fetch the chat details as well
        // For simplicity, we're just focusing on messages here
        const response = await chatService.getMessages(chatId);
        setMessages(response.data.messages || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching chat data:', error);
        setError('Failed to load chat messages');
        setLoading(false);
      }
    };

    fetchChatData();
  }, [chatId]);

  // Set up socket listeners for real-time updates
  useEffect(() => {
    if (socket && chatId) {
      // Join chat room
      socket.emit('joinChat', chatId);

      // Listen for new messages
      socket.on('newMessage', (message) => {
        if (message.chat === chatId) {
          setMessages((prevMessages) => [message, ...prevMessages]);
        }
      });

      // Listen for typing indicators
      socket.on('userTyping', (data) => {
        if (data.chatId === chatId && data.userId !== user?._id) {
          // Handle typing indicator
        }
      });

      socket.on('userStoppedTyping', (data) => {
        if (data.chatId === chatId && data.userId !== user?._id) {
          // Handle stopped typing
        }
      });

      return () => {
        socket.emit('leaveChat', chatId);
        socket.off('newMessage');
        socket.off('userTyping');
        socket.off('userStoppedTyping');
      };
    }
  }, [socket, chatId, user]);

  const handleSendMessage = async (content) => {
    if (!chatId || !content.trim()) return;

    setSendingMessage(true);
    try {
      await chatService.sendMessage(chatId, content);
      // The new message will be added via the socket event
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // If no chat is selected, show a welcome screen
  if (!chatId) {
    return (
      <div className="chat-view empty-state">
        <div className="empty-state-content">
          <FaUserFriends size={48} />
          <h2>Welcome to Discord Without Features</h2>
          <p>Select a chat or start a new conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-view">
      <div className="chat-header">
        {chat?.name || 'Chat'}
      </div>

      <div className="chat-messages">
        {loading ? (
          <div className="loading-messages">Loading messages...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : messages.length === 0 ? (
          <div className="no-messages">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((message) => (
            <Message key={message._id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput 
        onSendMessage={handleSendMessage}
        isLoading={sendingMessage}
      />
    </div>
  );
};

export default ChatView;