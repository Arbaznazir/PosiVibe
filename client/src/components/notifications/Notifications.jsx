import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { makeRequest } from '../../axios';
import './notifications.scss';
import { Link } from 'react-router-dom';
import {
  Favorite,
  ChatBubble,
  PersonAdd,
  AlternateEmail,
  Article,
  Close,
  MarkEmailRead,
  Circle,
  CheckCircle,
  Cancel,
  // Person, // Removed unused import
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import Avatar from '../avatar/Avatar'; // Added Avatar import

const Notifications = ({ isOpen, onClose, onToggle }) => {
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [notificationLimit, setNotificationLimit] = useState(5); // Default limit
  const [localUnreadCount, setLocalUnreadCount] = useState(0); // Local unread count

  // Fetch notifications
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['notifications', notificationLimit],
    queryFn: () => makeRequest.get(`/notifications?limit=${notificationLimit}`).then(res => res.data),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => makeRequest.get('/notifications/unread-count').then(res => res.data),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Track read notifications locally to update UI immediately
  const [readNotifications, setReadNotifications] = useState([]);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => 
      makeRequest.put(`/notifications/${notificationId}/read`),
    onSuccess: (data, variables) => {
      // Update local state immediately
      setReadNotifications(prev => [...prev, variables]);
      // Then invalidate queries to refresh data
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
  
  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId) => 
      makeRequest.delete(`/notifications/${notificationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications-unread']);
      toast.success('Notification removed');
    },
    onError: () => {
      toast.error('Failed to remove notification');
    }
  });

  // Fetch relationships to check follow status
  const { data: relationships = [] } = useQuery({
    queryKey: ['relationships'],
    queryFn: () => makeRequest.get('/relationships').then(res => res.data),
  });

  // Check if current user is following a specific user
  const isFollowing = (userId) => {
    console.log('Checking if following userId:', userId);
    console.log('Current relationships:', relationships);
    const result = relationships.some(relationship => {
      console.log('Comparing:', relationship.followedUserId, 'with', userId);
      return relationship.followedUserId === userId;
    });
    console.log('isFollowing result:', result);
    return result;
  };

  // Track accepted notifications locally to update UI immediately
  const [acceptedNotifications, setAcceptedNotifications] = useState([]);
  
  // Track followed back notifications locally to update UI immediately
  const [followedBackNotifications, setFollowedBackNotifications] = useState([]);
  
  // Follow user mutation
  const followMutation = useMutation({
    mutationFn: (userId) => {
      console.log('Following user:', userId);
      return makeRequest.post("/relationships", { userId });
    },
    onSuccess: (data) => {
      console.log('Follow success:', data);
      queryClient.invalidateQueries(['relationships']);
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications-unread']);
      toast.success('Following user!');
    },
    onError: (error) => {
      console.error('Follow error:', error);
      toast.error('Failed to follow user');
    }
  });
  
  // Handle follow action
  const handleFollow = (userId) => {
    followMutation.mutate(userId);
  };
  
  // Accept follow request mutation
  const acceptFollowMutation = useMutation({
    mutationFn: (userId) => {
      console.log('Accepting follow request for userId:', userId);
      return makeRequest.post(`/relationships/accept/${userId}`);
    },
    onSuccess: (data, variables) => {
      console.log('Accept follow success:', data);
      // Update local state immediately
      setAcceptedNotifications(prev => [...prev, variables]);
      // Then invalidate queries to refresh data
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications-unread']);
      queryClient.invalidateQueries(['relationships']);
      toast.success('Follow request accepted!');
    },
    onError: (error) => {
      console.error('Accept follow error:', error);
      toast.error('Failed to accept follow request');
    }
  });

  // Ignore follow request mutation
  const ignoreFollowMutation = useMutation({
    mutationFn: (userId) => {
      console.log('Ignoring follow request for userId:', userId);
      return makeRequest.post(`/relationships/ignore/${userId}`);
    },
    onSuccess: (data) => {
      console.log('Ignore follow success:', data);
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications-unread']);
      queryClient.invalidateQueries(['relationships']);
      toast.success('Follow request ignored!');
    },
    onError: (error) => {
      console.error('Ignore follow error:', error);
      toast.error('Failed to ignore follow request');
    }
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

  // Update local unread count when unreadData changes
  useEffect(() => {
    if (unreadData && unreadData.count !== undefined) {
      setLocalUnreadCount(unreadData.count);
    }
  }, [unreadData]);
  
  // Decrement local unread count when a notification is read or accepted
  useEffect(() => {
    if (readNotifications.length > 0 || acceptedNotifications.length > 0) {
      setLocalUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [readNotifications, acceptedNotifications]);

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
  
  // These functions are now handled inline in the button onClick handlers
  // Keeping this commented code for reference in case we need to refactor later
  /*
  const handleAcceptFollow = (notification) => {
    console.log('Accept follow - notification:', notification);
    console.log('fromUserId:', notification.fromUserId);
    
    // Try to get the user ID from the notification
    // First check if it's directly in fromUserId as a string
    let userId = notification.fromUserId;
    
    // If fromUserId is an object, try to get the _id property
    if (typeof notification.fromUserId === 'object' && notification.fromUserId !== null) {
      userId = notification.fromUserId._id;
    }
    
    // If we still don't have a valid ID, try to get it from the notification directly
    if (!userId && notification.fromUser && notification.fromUser._id) {
      userId = notification.fromUser._id;
    }
    
    console.log('Final userId for accept:', userId);
    
    if (userId) {
      console.log('Accepting follow from user ID:', userId);
      acceptFollowMutation.mutate(userId);
    } else {
      console.error('Missing userId in notification:', notification);
    }
  };
  
  const handleIgnoreFollow = (notification) => {
    console.log('Ignore follow - notification:', notification);
    console.log('fromUserId:', notification.fromUserId);
    
    // Try to get the user ID from the notification
    // First check if it's directly in fromUserId as a string
    let userId = notification.fromUserId;
    
    // If fromUserId is an object, try to get the _id property
    if (typeof notification.fromUserId === 'object' && notification.fromUserId !== null) {
      userId = notification.fromUserId._id;
    }
    
    // If we still don't have a valid ID, try to get it from the notification directly
    if (!userId && notification.fromUser && notification.fromUser._id) {
      userId = notification.fromUser._id;
    }
    
    console.log('Final userId for ignore:', userId);
    
    if (userId) {
      console.log('Ignoring follow from user ID:', userId);
      ignoreFollowMutation.mutate(userId);
    } else {
      console.error('Missing userId in notification:', notification);
    }
  };
  */

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
          <h3>Notifications {localUnreadCount > 0 && <span className="unread-badge">{localUnreadCount}</span>}</h3>
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
                onClick={(e) => {
                  // Don't trigger notification click when clicking on action buttons
                  if (e.target.closest('.notification-actions') || 
                      e.target.closest('.notification-avatar') || 
                      e.target.closest('.user-name')) {
                    return;
                  }
                  handleNotificationClick(notification);
                }}
              >
                <Link 
                  to={`/profile/${notification.fromUserId?._id}`}
                  className="notification-avatar-wrapper"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Avatar 
                    user={notification.fromUserId}
                    size="small"
                    showOnline={false}
                  />
                </Link>

                <div className="notification-content">
                  <div className="notification-text">
                    <Link 
                      to={`/profile/${notification.fromUserId?._id}`}
                      className="user-name"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {notification.fromUserId?.name || 'Someone'}
                    </Link>
                    <span className="action"> {notification.message}</span>
                  </div>
                  <div className="notification-time">
                    {formatTimeAgo(notification.createdAt)}
                  </div>
                  {notification.type === 'follow' && (
                    <div className="notification-actions">
                      {(() => {
                        // Extract user ID properly
                        const userId = notification.fromUserId?._id || notification.fromUserId;
                        // Check if already following
                        const alreadyFollowing = isFollowing(userId);
                        console.log('Notification for user:', userId, 'Already following:', alreadyFollowing);
                        
                        if (alreadyFollowing || notification.followedBack || followedBackNotifications.includes(notification.id)) {
                          return (
                            <div className="friendship-status">
                              <span className="friends-icon">✓</span> You are now friends
                            </div>
                          );
                        } else if (acceptedNotifications.includes(notification.id)) {
                          return (
                            <button 
                              className="action-btn follow-back"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (userId) {
                                  handleFollow(userId);
                                  // Mark notification as read when following back
                                  if (!notification.read && notification.id) {
                                    markAsReadMutation.mutate(notification.id);
                                  }
                                  // Update local state to show friendship status
                                  setFollowedBackNotifications(prev => [...prev, notification.id]);
                                  // Decrement notification count
                                  setLocalUnreadCount(prev => Math.max(0, prev - 1));
                                }
                              }}
                            >
                              <PersonAdd className="icon" /> Follow Back
                            </button>
                          );
                        } else {
                          return (
                            <>
                              <button 
                                className="action-btn accept"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const userId = notification.fromUserId?._id || notification.fromUserId;
                                  
                                  console.log('Accept click - notification:', notification);
                                  console.log('Accept click - userId extracted:', userId);
                                  
                                  if (userId) {
                                    acceptFollowMutation.mutate(userId);
                                  } else {
                                    console.error('No valid user ID found for accept action');
                                    toast.error('Error: Could not find user ID');
                                  }
                                }}
                                title="Accept follow request"
                                disabled={acceptFollowMutation.isLoading}
                              >
                                <CheckCircle /> Accept
                              </button>
                              <button 
                                className="action-btn ignore"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Get the user ID from the notification
                                  const userId = notification.fromUserId?._id || notification.fromUserId;
                                  
                                  console.log('Ignore click - notification:', notification);
                                  console.log('Ignore click - userId extracted:', userId);
                                  
                                  if (userId) {
                                    ignoreFollowMutation.mutate(userId);
                                  } else {
                                    console.error('No valid user ID found for ignore action');
                                    toast.error('Error: Could not find user ID');
                                  }
                                }}
                                title="Ignore follow request"
                                disabled={ignoreFollowMutation.isLoading}
                              >
                                <Cancel /> Ignore
                              </button>
                            </>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>

                <div className="notification-meta">
                  {notification.type !== 'follow' && getNotificationIcon(notification.type)}
                  <button 
                    className="remove-notification-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotificationMutation.mutate(notification.id);
                    }}
                    title="Remove notification"
                  >
                    <Close fontSize="small" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="notifications-footer">
          <button 
            className="view-all-btn"
            onClick={() => {
              setNotificationLimit(showAllNotifications ? 5 : 15);
              setShowAllNotifications(!showAllNotifications);
            }}
          >
            {showAllNotifications ? "Show less" : "View all notifications"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications;