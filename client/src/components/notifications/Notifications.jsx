import React, { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { makeRequest } from '../../axios';
import './notifications.scss';
import {
  Favorite,
  ChatBubble,
  PersonAdd,
  AlternateEmail,
  Article,
  Close,
  MarkEmailRead,
  Circle,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const Notifications = ({ isOpen, onClose, onToggle }) => {
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => makeRequest.get('/notifications').then(res => res.data),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => makeRequest.get('/notifications/unread-count').then(res => res.data),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => 
      makeRequest.put(`/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications-unread']);
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => makeRequest.put('/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications-unread']);
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Check for new notifications
  useEffect(() => {
    // This effect can be used for additional logic when unread count changes
  }, [unreadData]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Favorite className="notification-icon like" />;
      case 'comment':
        return <ChatBubble className="notification-icon comment" />;
      case 'follow':
        return <PersonAdd className="notification-icon follow" />;
      case 'mention':
        return <AlternateEmail className="notification-icon mention" />;
      case 'post':
        return <Article className="notification-icon post" />;
      default:
        return <Circle className="notification-icon default" />;
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Navigate to the relevant content
    if (notification.postId) {
      // You can implement navigation to the specific post here
      console.log('Navigate to post:', notification.postId);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const formatTimeAgo = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notifications-dropdown" ref={dropdownRef}>
      <div className="notifications-header">
        <div className="header-left">
          <h3>Notifications</h3>
          {unreadData?.count > 0 && (
            <span className="unread-badge">{unreadData.count}</span>
          )}
        </div>
        <div className="header-actions">
          {notifications.some(n => !n.read) && (
            <button
              className="mark-all-read-btn"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isLoading}
              title="Mark all as read"
            >
              <MarkEmailRead />
            </button>
          )}
          <button className="close-btn" onClick={onClose} title="Close">
            <Close />
          </button>
        </div>
      </div>

      <div className="notifications-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="skeleton-notifications">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton-notification">
                  <div className="skeleton-avatar"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line short"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>Failed to load notifications</p>
            <button onClick={() => queryClient.invalidateQueries(['notifications'])}>
              Try again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <Circle className="empty-icon" />
            <p>No notifications yet</p>
            <span>You'll see notifications here when someone interacts with your content</span>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-avatar">
                  {notification.fromUser?.profilePic ? (
                    <img 
                      src={`/upload/${notification.fromUser.profilePic}`} 
                      alt={notification.fromUser.name}
                    />
                  ) : (
                    <div className="avatar-fallback">
                      {notification.fromUser?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>

                <div className="notification-content">
                  <div className="notification-text">
                    <span className="user-name">
                      {notification.fromUser?.name || 'Someone'}
                    </span>
                    <span className="action"> {notification.message}</span>
                  </div>
                  <div className="notification-time">
                    {formatTimeAgo(notification.createdAt)}
                  </div>
                </div>

                <div className="notification-meta">
                  {getNotificationIcon(notification.type)}
                  {!notification.read && (
                    <div className="unread-indicator">
                      <Circle className="unread-dot" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="notifications-footer">
          <button className="view-all-btn">
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications; 