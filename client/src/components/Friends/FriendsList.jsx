import { useFriends } from '../../contexts/FriendContext';
import { chatService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaComment } from 'react-icons/fa';

const FriendsList = () => {
  const { friends, loading } = useFriends();
  const navigate = useNavigate();
  
  const startChat = async (friendId) => {
    try {
      // Create or find a private chat with this friend
      const response = await chatService.createChat({
        participants: [friendId],
        type: 'private'
      });
      
      // Navigate to the chat
      navigate(`/chat/${response.data._id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };
  
  if (loading) {
    return <div className="friends-loading">Loading friends...</div>;
  }
  
  if (friends.length === 0) {
    return (
      <div className="friends-empty">
        <p>No friends yet. Add friends to start chatting!</p>
      </div>
    );
  }
  
  return (
    <div className="friends-list">
      {friends.map((friend) => (
        <div key={friend._id} className="friend-item">
          <div className="user-info">
            {friend.avatarUrl ? (
              <img 
                src={friend.avatarUrl} 
                alt="Friend avatar" 
                className="user-avatar" 
              />
            ) : (
              <div className="user-avatar">
                <FaUser />
              </div>
            )}
            <div>
              <div className="user-name">
                {friend.username || 'No username'}
              </div>
              <div className="user-email">{friend.email}</div>
            </div>
          </div>
          <button 
            className="chat-btn"
            onClick={() => startChat(friend._id)}
          >
            <FaComment /> Message
          </button>
        </div>
      ))}
    </div>
  );
};

export default FriendsList;