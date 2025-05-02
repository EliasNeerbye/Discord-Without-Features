import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaUser, FaCamera } from 'react-icons/fa';

const ProfileSettings = () => {
  const { user, updateProfile, uploadAvatar } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || null);
  const fileInputRef = useRef(null);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Validate passwords if they're being changed
    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        setError('Current password is required to change password');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        setError('New passwords do not match');
        return;
      }
      
      if (newPassword.length < 8) {
        setError('New password must be at least 8 characters long');
        return;
      }
    }

    setLoading(true);
    
    try {
      const data = { username };
      
      if (newPassword && currentPassword) {
        data.currentPassword = currentPassword;
        data.newPassword = newPassword;
      }
      
      const result = await updateProfile(data);
      
      if (result.success) {
        setMessage('Profile updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview image
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload avatar
    const formData = new FormData();
    formData.append('avatar', file);

    setLoading(true);
    try {
      const result = await uploadAvatar(formData);
      if (result.success) {
        setMessage('Avatar updated successfully');
      } else {
        setError(result.message);
        // Reset preview if upload fails
        setAvatarPreview(user?.avatarUrl || null);
      }
    } catch (error) {
      setError('Failed to upload avatar');
      setAvatarPreview(user?.avatarUrl || null);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="profile-container">
      <div className="profile-heading">
        <h2>Profile Settings</h2>
      </div>

      <div className="profile-form">
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="avatar-upload">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Avatar"
              className="avatar-preview"
              onClick={handleAvatarClick}
            />
          ) : (
            <div className="avatar-preview" onClick={handleAvatarClick}>
              {getInitials(user?.username || user?.email)}
            </div>
          )}
          <div className="avatar-upload-info">
            <button type="button" onClick={handleAvatarClick}>
              <FaCamera /> Change Avatar
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: 'none' }}
            />
            <p>JPEG, PNG, GIF or WEBP. Max 10MB.</p>
          </div>
        </div>

        <form onSubmit={handleProfileUpdate}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={user?.email || ''}
              disabled
            />
            <p className="form-help">Email cannot be changed</p>
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <h3>Change Password</h3>
          <p className="form-help">Leave blank to keep your current password</p>

          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;