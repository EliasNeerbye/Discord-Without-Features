import { useFriends } from '../../contexts/FriendContext';
import { FaCheck, FaTimes, FaUser } from 'react-icons/fa';

const FriendRequests = () => {
  const { friendRequests, acceptFriendRequest, rejectFriendRequest } = useFriends();
  
  if (friendRequests.received.length === 0 && friendRequests.sent.length === 0) {
    return (
      <div className="friend-requests-empty">
        <p>No pending friend requests</p>
      </div>
    );
  }
  
  return (
    <div className="friend-requests">
      {friendRequests.received.length > 0 && (
        <div className="request-section">
          <h3>Incoming Friend Requests</h3>
          {friendRequests.received.map((request) => (
            <div key={request._id} className="request-item">
              <div className="user-info">
                {request.requester.avatarUrl ? (
                  <img 
                    src={request.requester.avatarUrl} 
                    alt="User avatar" 
                    className="user-avatar" 
                  />
                ) : (
                  <div className="user-avatar">
                    <FaUser />
                  </div>
                )}
                <div>
                  <div className="user-name">
                    {request.requester.username || 'No username'}
                  </div>
                  <div className="user-email">{request.requester.email}</div>
                </div>
              </div>
              <div className="request-actions">
                <button 
                  className="accept-btn"
                  onClick={() => acceptFriendRequest(request._id)}
                >
                  <FaCheck /> Accept
                </button>
                <button 
                  className="reject-btn"
                  onClick={() => rejectFriendRequest(request._id)}
                >
                  <FaTimes /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {friendRequests.sent.length > 0 && (
        <div className="request-section">
          <h3>Sent Friend Requests</h3>
          {friendRequests.sent.map((request) => (
            <div key={request._id} className="request-item">
              <div className="user-info">
                {request.recipient.avatarUrl ? (
                  <img 
                    src={request.recipient.avatarUrl} 
                    alt="User avatar" 
                    className="user-avatar" 
                  />
                ) : (
                  <div className="user-avatar">
                    <FaUser />
                  </div>
                )}
                <div>
                  <div className="user-name">
                    {request.recipient.username || 'No username'}
                  </div>
                  <div className="user-email">{request.recipient.email}</div>
                </div>
              </div>
              <div className="request-status">Pending</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendRequests;