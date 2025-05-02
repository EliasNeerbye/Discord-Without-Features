import { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const FriendContext = createContext();

export const useFriends = () => useContext(FriendContext);

export const FriendProvider = ({ children }) => {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const { socket } = useSocket();

  // Fetch friends and friend requests when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchFriends();
      fetchFriendRequests();
    }
  }, [isAuthenticated]);

  // Listen for socket events related to friend requests
  useEffect(() => {
    if (socket) {
      // You'd need to implement these events on the server first
      socket.on('friendRequest', handleNewFriendRequest);
      socket.on('friendRequestUpdated', handleFriendRequestUpdate);

      return () => {
        socket.off('friendRequest');
        socket.off('friendRequestUpdated');
      };
    }
  }, [socket]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const response = await userService.getFriends();
      setFriends(response.data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await userService.getFriendRequests();
      setFriendRequests(response.data);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const searchUsers = async (query) => {
    if (!query || query.length < 3) return [];
    
    try {
      const response = await userService.searchUsers(query);
      return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  const sendFriendRequest = async (usernameOrEmail) => {
    try {
      const response = await userService.sendFriendRequest(usernameOrEmail);
      // Update the friend requests state
      setFriendRequests(prev => ({
        ...prev,
        sent: [...prev.sent, response.data.request]
      }));
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send friend request'
      };
    }
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      const response = await userService.updateFriendRequest(requestId, 'accepted');
      
      // Update states
      const updatedRequest = response.data.request;
      
      // Remove from received requests
      setFriendRequests(prev => ({
        ...prev,
        received: prev.received.filter(req => req._id !== requestId)
      }));
      
      // Add to friends list
      const newFriend = updatedRequest.requester;
      setFriends(prev => [...prev, newFriend]);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to accept friend request'
      };
    }
  };

  const rejectFriendRequest = async (requestId) => {
    try {
      await userService.updateFriendRequest(requestId, 'rejected');
      
      // Remove from received requests
      setFriendRequests(prev => ({
        ...prev,
        received: prev.received.filter(req => req._id !== requestId)
      }));
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reject friend request'
      };
    }
  };

  // Socket event handlers
  const handleNewFriendRequest = (request) => {
    setFriendRequests(prev => ({
      ...prev,
      received: [...prev.received, request]
    }));
  };

  const handleFriendRequestUpdate = (updatedRequest) => {
    if (updatedRequest.status === 'accepted') {
      // Remove from sent requests
      setFriendRequests(prev => ({
        ...prev,
        sent: prev.sent.filter(req => req._id !== updatedRequest._id)
      }));
      
      // Add to friends list
      const newFriend = updatedRequest.recipient;
      setFriends(prev => [...prev, newFriend]);
    } else if (updatedRequest.status === 'rejected') {
      // Remove from sent requests
      setFriendRequests(prev => ({
        ...prev,
        sent: prev.sent.filter(req => req._id !== updatedRequest._id)
      }));
    }
  };

  const value = {
    friends,
    friendRequests,
    loading,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    refreshFriends: fetchFriends,
    refreshFriendRequests: fetchFriendRequests
  };

  return (
    <FriendContext.Provider value={value}>
      {children}
    </FriendContext.Provider>
  );
};