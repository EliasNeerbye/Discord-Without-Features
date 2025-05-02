import { formatDistanceToNow } from 'date-fns';

const Message = ({ message }) => {
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const formatTime = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return 'unknown time';
    }
  };

  return (
    <div className="message">
      {message.sender?.avatarUrl ? (
        <img
          src={message.sender.avatarUrl}
          alt="Avatar"
          className="message-avatar"
        />
      ) : (
        <div className="message-avatar">
          {getInitials(message.sender?.username || message.sender?.email)}
        </div>
      )}

      <div className="message-content">
        <div className="message-header">
          <span className="message-sender">
            {message.sender?.username || message.sender?.email}
          </span>
          <span className="message-time">
            {formatTime(message.createdAt)}
          </span>
        </div>
        <div className="message-text">{message.content}</div>
      </div>
    </div>
  );
};

export default Message;