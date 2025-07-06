import React, { useState, useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { makeRequest } from '../../axios';
import { AuthContext } from '../../context/authContext';
import './messageButton.scss';
import { ChatBubble, Send } from '@mui/icons-material';
import toast from 'react-hot-toast';

const MessageButton = ({ userId, userName, className = '' }) => {
  const { currentUser } = useContext(AuthContext);
  const [showQuickMessage, setShowQuickMessage] = useState(false);
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  // Check if current user follows this user
  const { data: isFollowing } = useQuery({
    queryKey: ['relationship', userId],
    queryFn: () => 
      makeRequest.get(`/relationships?followedUserId=${userId}`).then(res => res.data),
    enabled: !!userId && userId !== currentUser?.id,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData) => makeRequest.post('/messages', messageData),
    onSuccess: () => {
      toast.success(`Message sent to ${userName}`);
      setMessage('');
      setShowQuickMessage(false);
      queryClient.invalidateQueries(['conversations']);
      queryClient.invalidateQueries(['messages-unread']);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.response?.data || 'Failed to send message';
      toast.error(errorMessage);
    },
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      receiverId: userId,
      content: message.trim(),
    });
  };

  // Don't show for current user
  if (!userId || userId === currentUser?.id) {
    return null;
  }

  // Don't show if not following
  if (!isFollowing || isFollowing.length === 0) {
    return (
      <button 
        className={`message-button disabled ${className}`}
        title="You must follow this user to send messages"
        disabled
      >
        <ChatBubble />
        Message
      </button>
    );
  }

  return (
    <div className={`message-button-container ${className}`}>
      <button 
        className="message-button"
        onClick={() => setShowQuickMessage(!showQuickMessage)}
        title={`Send message to ${userName}`}
      >
        <ChatBubble />
        Message
      </button>

      {showQuickMessage && (
        <div className="quick-message-popup">
          <div className="popup-header">
            <span>Message {userName}</span>
            <button 
              className="close-btn"
              onClick={() => setShowQuickMessage(false)}
            >
              ×
            </button>
          </div>
          
          <form onSubmit={handleSendMessage} className="message-form">
            <textarea
              placeholder={`Write a message to ${userName}...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              rows={3}
            />
            
            <div className="form-actions">
              <span className="char-count">{message.length}/1000</span>
              <button 
                type="submit" 
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="send-btn"
              >
                <Send />
                {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MessageButton; 