import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaUserCog, FaSignOutAlt, FaUser } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate('/login');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="navbar">
      <Link to="/" className="navbar-logo">
        Discord Without Features
      </Link>
      
      <div className="navbar-actions">
        <div className="user-menu" onClick={() => setShowUserMenu(!showUserMenu)}>
          {user?.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt="Avatar" 
              className="avatar" 
            />
          ) : (
            <div className="avatar">
              {user?.username ? getInitials(user.username) : getInitials(user?.email)}
            </div>
          )}
          <span>{user?.username || user?.email}</span>
          
          {showUserMenu && (
            <div className="dropdown-menu">
              <Link to="/settings" className="dropdown-item">
                <FaUserCog /> Settings
              </Link>
              <button className="dropdown-item" onClick={handleLogout}>
                <FaSignOutAlt /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;