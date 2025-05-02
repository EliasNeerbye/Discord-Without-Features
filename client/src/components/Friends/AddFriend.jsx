import { useState } from 'react';
import { useFriends } from '../../contexts/FriendContext';
import { FaUserPlus, FaSearch, FaTimes } from 'react-icons/fa';

const AddFriend = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [directAdd, setDirectAdd] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { sendFriendRequest, searchUsers } = useFriends();

  const handleSearch = async () => {
    if (searchTerm.length < 3) {
      setError('Search term must be at least 3 characters long');
      return;
    }

    setError('');
    setIsSearching(true);
    
    try {
      const results = await searchUsers(searchTerm);
      setSearchResults(results);
      if (results.length === 0) {
        setMessage('No users found');
      }
    } catch (err) {
      setError('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (usernameOrEmail) => {
    setMessage('');
    setError('');
    
    try {
      const result = await sendFriendRequest(usernameOrEmail);
      
      if (result.success) {
        setMessage(`Friend request sent to ${usernameOrEmail}`);
        setSearchResults([]);
        setSearchTerm('');
        setDirectAdd('');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to send friend request');
    }
  };

  const handleDirectAdd = async (e) => {
    e.preventDefault();
    if (!directAdd) {
      setError('Please enter a username or email');
      return;
    }
    
    await handleSendRequest(directAdd);
  };

  return (
    <div className="add-friend-modal">
      <div className="modal-header">
        <h2>Add Friend</h2>
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>
      </div>
      
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <div className="direct-add-section">
        <h3>Add by Username or Email</h3>
        <form onSubmit={handleDirectAdd} className="direct-add-form">
          <input
            type="text"
            value={directAdd}
            onChange={(e) => setDirectAdd(e.target.value)}
            placeholder="Enter username or email"
          />
          <button type="submit" className="add-friend-btn">
            <FaUserPlus /> Add Friend
          </button>
        </form>
      </div>
      
      <div className="search-section">
        <h3>Search for Users</h3>
        <div className="search-form">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by username or email"
          />
          <button 
            onClick={handleSearch}
            disabled={isSearching || searchTerm.length < 3}
          >
            <FaSearch /> {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((user) => (
              <div key={user._id} className="user-item">
                <div className="user-info">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="User avatar" className="user-avatar" />
                  ) : (
                    <div className="user-avatar">
                      {user.username ? user.username[0].toUpperCase() : user.email[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="user-name">{user.username || 'No username'}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </div>
                <button 
                  onClick={() => handleSendRequest(user.username || user.email)}
                  className="add-friend-btn"
                >
                  <FaUserPlus /> Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddFriend;