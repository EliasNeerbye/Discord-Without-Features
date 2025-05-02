import { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

const MessageInput = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    onSendMessage(message);
    setMessage('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="message-input-container">
      <form className="message-input" onSubmit={handleSubmit}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={isLoading}
          rows={1}
        />
        <button type="submit" disabled={isLoading || !message.trim()}>
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;