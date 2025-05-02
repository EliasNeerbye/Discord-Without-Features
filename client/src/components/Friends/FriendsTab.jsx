import { useState } from 'react';
import { FaUserPlus, FaUserFriends, FaUserClock } from 'react-icons/fa';
import AddFriend from './AddFriend';
import FriendsList from './FriendsList';
import FriendRequests from './FriendRequests';

const FriendsTab = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  
  return (
    <div className="friends-tab">
      <div className="friends-header">
        <h2>Friends</h2>
        <button 
          className="add-friend-button"
          onClick={() => setShowAddFriendModal(true)}
        >
          <FaUserPlus /> Add Friend
        </button>
      </div>
      
      <div className="friends-navbar">
        <button 
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <FaUserFriends /> All Friends
        </button>
        <button 
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <FaUserClock /> Pending
        </button>
      </div>
      
      <div className="friends-content">
        {activeTab === 'all' && <FriendsList />}
        {activeTab === 'pending' && <FriendRequests />}
      </div>
      
      {showAddFriendModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <AddFriend onClose={() => setShowAddFriendModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendsTab;