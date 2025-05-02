import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaUserFriends, FaUserPlus, FaPlus, FaUsers } from 'react-icons/fa';
import { chatService } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import { useFriends } from '../../contexts/FriendContext';

const Sidebar = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { friendRequests } = useFriends();

  // Get friend request count from context
  const pendingRequestsCount = friendRequests?.received?.length || 0;

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await chatService.getChats();
        setChats(response.data);
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  useEffect(() => {
    if (socket) {
      // Listen for new message to update chat preview
      socket.on('newMessage', (message) => {
        setChats(prevChats => {
          return prevChats.map(chat => {
            if (chat._id === message.chat) {
              return {
                ...chat,
                lastMessage: message.content,
                updatedAt: message.createdAt
              };
            }
            return chat;
          });
        });
      });
      
      // Listen for new chat creation
      socket.on('newChat', (chat) => {
        setChats(prevChats => [...prevChats, chat]);
      });

      return () => {
        socket.off('newMessage');
        socket.off('newChat');
      };
    }
  }, [socket]);

  const handleChatClick = (id) => {
    navigate(`/chat/${id}`);
  };

  const handleNewChat = () => {
    setShowNewChatModal(true);
  };

  // Function to get chat name or recipient name for display
  const getChatName = (chat) => {
    if (chat.type === 'group' && chat.name) {
      return chat.name;
    }
    
    // For private chats, show the other user's name
    if (chat.participants && chat.participants.length > 0) {
      const otherUser = chat.participants[0];
      return otherUser.username || otherUser.email;
    }
    
    return 'Unknown Chat';
  };

  // Function to get chat icon/avatar
  const getChatIcon = (chat) => {
    if (chat.type === 'group') {
      return <FaUserFriends />;
    }
    return <FaUserPlus />;
  };

  if (loading) {
    return <div className="sidebar">Loading chats...</div>;
  }

  return (
    <div className="sidebar">
      <div className="sidebar-nav">
        <Link to="/friends" className="sidebar-nav-item">
          <FaUsers /> Friends
          {pendingRequestsCount > 0 && (
            <span className="notification-badge">{pendingRequestsCount}</span>
          )}
        </Link>
      </div>
      
      <div className="chat-list">
        <div className="chat-list-header">
          <h3>Conversations</h3>
          <button className="icon-button" onClick={handleNewChat}>
            <FaPlus />
          </button>
        </div>

        {chats.length === 0 ? (
          <div className="no-chats">
            <p>No conversations yet.</p>
            <button onClick={handleNewChat}>Start a conversation</button>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat._id}
              className={`chat-item ${chat._id === chatId ? 'active' : ''}`}
              onClick={() => handleChatClick(chat._id)}
            >
              <div className="chat-icon">
                {getChatIcon(chat)}
              </div>
              <div className="chat-info">
                <div className="chat-name">{getChatName(chat)}</div>
                <div className="chat-preview">
                  {chat.lastMessage || 'No messages yet'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;