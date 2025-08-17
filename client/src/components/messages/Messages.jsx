import React, { useState, useEffect, useRef, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import EmojiPicker from 'emoji-picker-react';
import { makeRequest } from '../../axios';
import { AuthContext } from '../../context/authContext';
import socketService from '../../services/socket';
import './_messagesSidebar.scss';
import './_chatArea.scss';
import './messages.scss';
import './fix-text.css';
import {
  Close as CloseIcon,
  Send as SendIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  VideoCall as VideoCallIcon,
  Info as InfoIcon,
  EmojiEmotions as EmojiIcon,
  AttachFile as AttachFileIcon,
  ArrowBack,
  ChatBubbleOutline,
  Check,
  DoneAll,
  PersonAdd,
  Refresh,
  PushPin,
  MoreVert,
  Add,
  // ThumbUp removed,
  Poll,
  Image,
  Mic,
  MoreHoriz,
} from '@mui/icons-material';
import Avatar from '../avatar/Avatar';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const Messages = ({ isOpen, onClose }) => {
  const { currentUser } = useContext(AuthContext);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [pinnedMessages, setPinnedMessages] = useState([]);
  // Reactions feature removed
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const queryClient = useQueryClient();
  const sidebarRef = useRef(null);

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading, refetch: refetchConversations, error: conversationsError } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => makeRequest.get('/messages').then(res => res.data),
    enabled: isOpen && !!currentUser,
    refetchInterval: 30000,
    retry: 1,
    onError: (error) => {
      console.error('Failed to fetch conversations:', error);
      if (error.response?.status === 401) {
        toast.error('Please login again to view messages');
      }
    }
  });

  // Debug log conversations
  useEffect(() => {
    if (conversations.length > 0) {
      console.log('Conversations loaded:', conversations);
    }
  }, [conversations]);

  // Fetch users that the current user follows (for starting new conversations)
  const { data: suggestedUsers = [], isLoading: suggestedLoading } = useQuery({
    queryKey: ['followingUsers'],
    queryFn: async () => {
      try {
        const followingRes = await makeRequest.get('/relationships?followerUserId=' + currentUser.id);
        const followingIds = followingRes.data;
        
        if (followingIds.length === 0) return [];
        
        // Get user details for each followed user
        const usersPromises = followingIds.map(userId => 
          makeRequest.get(`/users/find/${userId}`).then(res => res.data).catch(() => null)
        );
        
        const users = await Promise.all(usersPromises);
        return users.filter(user => user);
      } catch (error) {
        console.error('Error fetching following users:', error);
        return [];
      }
    },
    enabled: isOpen && !!currentUser,
    retry: 1,
  });

  // Fetch messages for selected user
  const { data: fetchedMessages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedUserId],
    queryFn: () => 
      makeRequest.get(`/messages/${selectedUserId}`).then(res => res.data),
    enabled: !!selectedUserId,
    refetchInterval: 5000,
  });

  // Update messages when fetched messages change
  useEffect(() => {
    if (fetchedMessages.length > 0) {
      setMessages(fetchedMessages);
      
      // Mark messages as read when conversation is opened
      if (selectedUserId) {
        socketService.markMessagesAsRead(selectedUserId);
        // Invalidate unread count query to update badge
        queryClient.invalidateQueries(['messages-unread']);
      }
    } else {
      setMessages([]);
    }
  }, [fetchedMessages, selectedUserId, queryClient]);

  // Socket.IO setup
  useEffect(() => {
    if (isOpen && currentUser) {
      // Connect to socket service
      const socket = socketService.connect();
      
      if (!socket) {
        console.error("Failed to connect to socket service");
        toast.error("Failed to connect to messaging service");
        return;
      }

        // Listen for new messages
        socketService.onNewMessage((message) => {
          if (selectedUserId && (message.senderId._id === selectedUserId || message.receiverId === selectedUserId)) {
            setMessages(prev => [...prev, message]);
          }
          queryClient.invalidateQueries(['conversations']);
          
          // Show notification if not in current conversation
          if (!selectedUserId || message.senderId._id !== selectedUserId) {
            toast.success(`New message from ${message.senderId.name}`);
          }
        });

        // Listen for message sent confirmation
        socketService.onMessageSent((message) => {
        console.log('✅ Message sent confirmation received:', message);
          setMessages(prev => [...prev, message]);
        // Don't clear newMessage here since we already cleared it optimistically
          queryClient.invalidateQueries(['conversations']);
        });

        // Listen for message errors
        socketService.onMessageError((error) => {
        console.log('❌ Message error received:', error);
          toast.error(error.error);
        // Note: We could restore the message here if needed
        });

        // Listen for typing indicators
        socketService.onUserTyping((data) => {
          if (selectedUserId && data.userId === selectedUserId) {
            setTypingUser(data.userId);
          }
        });

        socketService.onUserStopTyping((data) => {
          setTypingUser(null);
        });

      // Listen for online status changes
      socketService.onUserOnline((data) => {
        setOnlineUsers(prev => new Set([...prev, data.userId]));
      });

      socketService.onUserOffline((data) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      });

      socketService.onOnlineUsersUpdate((userIds) => {
        setOnlineUsers(new Set(userIds));
      });
    }

    return () => {
      if (socketService.isConnected()) {
        socketService.removeAllListeners();
        socketService.disconnect();
      }
    };
  }, [isOpen, currentUser, selectedUserId, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    console.log('🔄 handleSendMessage called:', { 
      newMessage: `"${newMessage}"`, 
      trimmed: `"${newMessage.trim()}"`,
      selectedUserId
    });
    
    if (!newMessage || !newMessage.trim() || !selectedUserId) {
      console.log('❌ Message validation failed:', {
        hasMessage: !!newMessage,
        trimmedLength: newMessage ? newMessage.trim().length : 0,
        hasSelectedUser: !!selectedUserId
      });
      
      if (!newMessage || !newMessage.trim()) {
        toast.error('Please enter a message');
      }
      return;
    }

    console.log('🔄 Sending message:', { 
      selectedUserId, 
      message: newMessage.trim()
    });
    console.log('🔗 Socket connected:', socketService.isConnected());
    
    const messageToSend = newMessage.trim();
    
    // Clear message input immediately (optimistic update)
    setNewMessage('');
    
    // Send message
    const success = socketService.sendMessage(selectedUserId, messageToSend);
    
    if (!success) {
      console.log('❌ Failed to send message - restoring input');
      setNewMessage(messageToSend);
      toast.error('Failed to send message - please try again');
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!selectedUserId) return;

    // Send typing indicator
    if (!isTyping) {
      setIsTyping(true);
      socketService.sendTyping(selectedUserId);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketService.sendStopTyping(selectedUserId);
    }, 1000);
  };
  
  const handleEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };



  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getMessageStatus = (message) => {
    if (message.senderId._id !== currentUser.id) return null;
    
    if (message.read) {
      return <DoneAll className="message-status read" />;
    } else {
      return <Check className="message-status sent" />;
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUserId(userId);
    setShowSidebar(false); // Hide sidebar on mobile when chat is selected
  };

  const handleBackToSidebar = () => {
    setSelectedUserId(null);
    setShowSidebar(true);
  };

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId) || socketService.isUserOnline(userId);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter suggested users to exclude those with existing conversations
  const filteredSuggestedUsers = suggestedUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !conversations.some(conv => conv.user._id === user._id)
  );

  const selectedUser = conversations.find(c => c.user._id === selectedUserId)?.user ||
                      suggestedUsers.find(u => u._id === selectedUserId);

  if (!isOpen) return null;

  return (
    <div className="messages-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="messages-container">
        {/* Sidebar */}
        <div className={`messages-sidebar ${showSidebar ? 'show' : ''}`} ref={sidebarRef}>
          <div className="sidebar-header">
            <h2>Messages</h2>
            <div className="header-actions">
              <button 
                className="icon-btn" 
                onClick={() => {
                  refetchConversations();
                  toast.success('Refreshed conversations');
                }}
                title="Refresh"
              >
                <Refresh />
              </button>
              <button className="icon-btn" onClick={onClose} title="Close">
                <CloseIcon />
              </button>
            </div>
          </div>
          
          <div className="search-container">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          {/* Online Users Row */}
          <div className="online-users">
            <div className="avatar-row">
              {Array.from(onlineUsers)
                .filter(userId => userId !== currentUser.id)
                .slice(0, 10)
                .map(userId => {
                  const user = [...conversations.map(c => c.user), ...suggestedUsers]
                    .find(u => u._id === userId);
                  
                  if (!user) return null;
                  
                  return (
                    <div 
                      key={userId} 
                      className="user-avatar"
                      onClick={() => handleSelectUser(userId)}
                      title={user.name}
                    >
                      <Avatar
                        user={user}
                        size="medium"
                      />
                      <div className="online-indicator"></div>
                    </div>
                  );
                })}
            </div>
          </div>
          
          {/* Pinned Messages Section */}
          <div className="pinned-messages">
            <h3>
              <PushPin style={{ fontSize: 16 }} />
              Pinned Messages
            </h3>
            {pinnedMessages.length > 0 ? (
              pinnedMessages.map(message => (
                <div key={message._id} className="pinned-message-item">
                  <div className="pinned-message-content">
                    <p>{message.content.substring(0, 50)}{message.content.length > 50 ? '...' : ''}</p>
                    <span className="pinned-from">{message.senderId.name}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-pinned-messages">
                <p>No pinned messages yet</p>
              </div>
            )}
          </div>
          
          <div className="conversations-list">
            {conversationsLoading ? (
              <div className="loading-conversations">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="conversation-skeleton">
                    <div className="skeleton-avatar"></div>
                    <div className="skeleton-content">
                      <div className="skeleton-name"></div>
                      <div className="skeleton-message"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Existing Conversations */}
                {filteredConversations.length > 0 && (
                  <div className="conversations-section">
                    <div className="section-header">
                      <h3>Recent Conversations</h3>
                    </div>
                    {filteredConversations.map((conversation) => {
                      const isOnline = isUserOnline(conversation.user._id);
                      const isTypingInConversation = typingUser === conversation.user._id;
                      
                      return (
                        <div
                          key={conversation.user._id}
                          className={`conversation-item ${
                            selectedUserId === conversation.user._id ? 'active' : ''
                          }`}
                          onClick={() => handleSelectUser(conversation.user._id)}
                        >
                          <div className="conversation-avatar">
                            <Avatar
                              user={conversation.user}
                              size="medium"
                            />
                            {conversation.count > 0 && (
                              <div className="unread-indicator">{conversation.count}</div>
                            )}
                          </div>
                          
                          <div className="conversation-info">
                            <div className="conversation-header">
                              <h4 className="user-name">{conversation.user.name}</h4>
                              {conversation.lastMessage && (
                                <span className="message-time">
                                  {formatMessageTime(conversation.lastMessage.createdAt)}
                                </span>
                              )}
                            </div>
                            
                            <div className="last-message">
                              {isTypingInConversation ? (
                                <span className="typing-text">typing...</span>
                              ) : conversation.lastMessage ? (
                                <>
                                  {conversation.lastMessage.senderId._id === currentUser.id && (
                                    <span className="you-prefix">You: </span>
                                  )}
                                  <span className="message-preview">
                                    {conversation.lastMessage.content.length > 35
                                      ? `${conversation.lastMessage.content.substring(0, 35)}...`
                                      : conversation.lastMessage.content
                                    }
                                  </span>
                                </>
                              ) : (
                                <span className="no-messages">No messages yet</span>
                              )}
                            </div>
                          </div>
                          
                          {conversation.lastMessage && conversation.lastMessage.senderId._id === currentUser.id && (
                            <div className="message-status">
                              {conversation.lastMessage.read ? (
                                <DoneAll style={{ fontSize: 16, color: '#4caf50' }} />
                              ) : (
                                <Check style={{ fontSize: 16 }} />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Suggested Users */}
                {filteredSuggestedUsers.length > 0 && (
                  <div className="conversations-section">
                    <div className="section-header">
                      <h3>Start New Conversation</h3>
                      <PersonAdd className="section-icon" />
                    </div>
                    {filteredSuggestedUsers.map((user) => (
                      <div
                        key={user._id}
                        className={`conversation-item suggested ${
                          selectedUserId === user._id ? 'active' : ''
                        }`}
                        onClick={() => handleSelectUser(user._id)}
                      >
                        <div className="conversation-avatar">
                          <Avatar
                            user={user}
                            size="medium"
                            showOnline={isUserOnline(user._id)}
                          />
                        </div>
                        
                        <div className="conversation-info">
                          <div className="conversation-header">
                            <h4 className="user-name">{user.name}</h4>
                          </div>
                          <div className="last-message">
                            <span className="suggestion-text">Start a conversation</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {filteredConversations.length === 0 && filteredSuggestedUsers.length === 0 && !conversationsLoading && !suggestedLoading && (
                  <div className="empty-state">
                    <ChatBubbleOutline className="empty-icon" />
                    {conversationsError ? (
                      <>
                        <h3>Unable to load conversations</h3>
                        <p>Please check your connection and try refreshing</p>
                        <button 
                          className="retry-btn"
                          onClick={() => {
                            refetchConversations();
                            toast.info('Refreshing conversations...');
                          }}
                        >
                          Try Again
                        </button>
                      </>
                    ) : (
                      <>
                        <h3>No conversations yet</h3>
                        <p>Follow users to start messaging them</p>
                        <button 
                          className="refresh-btn"
                          onClick={() => {
                            refetchConversations();
                            toast.info('Checking for conversations...');
                          }}
                        >
                          Refresh
                        </button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="chat-area">
          {selectedUserId && selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="header-left">
                  <button 
                    className="back-btn"
                    onClick={handleBackToSidebar}
                  >
                    <ArrowBack />
                  </button>
                  
                  <Avatar
                    user={selectedUser}
                    size="medium"
                  />
                  
                  <div className="user-info">
                    <h3 className="user-name">{selectedUser.name}</h3>
                    <div className="user-status">
                      {typingUser ? (
                        <span className="typing-indicator">
                          <span className="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                          </span>
                          Typing...
                        </span>
                      ) : (
                        <span className={`online-status ${isUserOnline(selectedUserId) ? 'online' : 'offline'}`}>
                          {isUserOnline(selectedUserId) ? 'Online' : 'Offline'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="header-actions">
                  <button 
                    className="icon-btn" 
                    title="Create poll"
                    onClick={() => setShowPollCreator(!showPollCreator)}
                  >
                    <Poll />
                  </button>
                  <button className="icon-btn" title="Voice call">
                    <PhoneIcon />
                  </button>
                  <button className="icon-btn" title="Video call">
                    <VideoCallIcon />
                  </button>
                  <button className="icon-btn" title="Info">
                    <MoreVert />
                  </button>
                </div>
              </div>

              {/* Messages List */}
              <div className="messages-list">
                {messagesLoading ? (
                  <div className="loading-messages">
                    <div className="loading-spinner"></div>
                    <span>Loading messages...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="no-messages">
                    <ChatBubbleOutline className="no-messages-icon" />
                    <h3>No messages yet</h3>
                    <p>Send a message to start the conversation</p>
                  </div>
                ) : (
                  <>
                    {/* Date divider example */}
                    <div className="date-divider">
                      <span>Today</span>
                    </div>
                    
                    {/* Poll message example */}
                    <div className="poll-message">
                      <div className="poll-question">What should we do this weekend?</div>
                      <div className="poll-options">
                        <div className="poll-option">
                          <div className="option-fill" style={{ width: '70%' }}></div>
                          <span className="option-text">Go to the beach</span>
                          <span className="option-percent">70%</span>
                        </div>
                        <div className="poll-option">
                          <div className="option-fill" style={{ width: '20%' }}></div>
                          <span className="option-text">Watch a movie</span>
                          <span className="option-percent">20%</span>
                        </div>
                        <div className="poll-option">
                          <div className="option-fill" style={{ width: '10%' }}></div>
                          <span className="option-text">Stay home</span>
                          <span className="option-percent">10%</span>
                        </div>
                      </div>
                    </div>
                    
                    {messages.map((message, index) => {
                      if (!message || !message.senderId) {
                        return (
                          <div key={index} className="message system">
                            <div className="message-content">
                              <div className="message-bubble">
                                <p>⚠️ Unable to load message</p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      const isOwn = message.senderId._id === currentUser.id;
                      const isSystemMessage = message.isSystemMessage;
                      const showAvatar = !isOwn && !isSystemMessage && (
                        index === 0 || 
                        messages[index - 1]?.senderId?._id !== message.senderId._id
                      );
                      
                      // Check if this is a new day compared to previous message
                      const showDateDivider = index > 0 && new Date(message.createdAt).toDateString() !== 
                        new Date(messages[index - 1].createdAt).toDateString();
                      
                      return (
                        <React.Fragment key={message._id}>
                          {showDateDivider && (
                            <div className="date-divider">
                              <span>{new Date(message.createdAt).toLocaleDateString()}</span>
                            </div>
                          )}
                          
                          <div className={`message ${isSystemMessage ? 'system' : isOwn ? 'own' : 'other'}`}>
                            {showAvatar && !isOwn && !isSystemMessage && (
                              <div className="message-avatar">
                                <Avatar
                                  user={message.senderId}
                                  size="small"
                                />
                              </div>
                            )}
                            
                            <div className="message-content">
                              <div className="message-bubble">
                                {/* Only show text content if it's not an image-only message */}
                                {(typeof message.content === 'string' && message.content) && <p>{message.content}</p>}
                                
                                {/* Handle image attachments */}
                                {(() => {
                                  // Extract the image URL from various possible locations
                                  const imageUrl = message.fileUrl || 
                                                  message.file || 
                                                  (typeof message.content === 'object' && message.content.fileUrl) ||
                                                  (typeof message.content === 'object' && message.content.file);
                                  
                                  // If we have an image URL
                                  if (imageUrl && imageUrl.match(/\.(jpeg|jpg|gif|png)$/i)) {
                                    return (
                                      <div className="message-attachment">
                                        <img 
                                          src={imageUrl} 
                                          alt="Shared content" 
                                          className="message-image"
                                          onClick={() => window.open(imageUrl, '_blank')}
                                        />
                                      </div>
                                    );
                                  }
                                  // If we have a non-image file URL
                                  else if (imageUrl) {
                                    return (
                                      <div className="message-attachment">
                                        <div className="message-file">
                                          <AttachFileIcon />
                                          <a 
                                            href={imageUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="file-link"
                                          >
                                            Download File
                                          </a>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                                
                                <div className="message-meta">
                                  <span className="message-time">
                                    {formatMessageTime(message.createdAt)}
                                  </span>
                                  {isOwn && (
                                    message.read ? (
                                      <DoneAll style={{ fontSize: 14, color: '#4caf50' }} />
                                    ) : (
                                      <Check style={{ fontSize: 14 }} />
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Poll Creator */}
              {showPollCreator && (
                <div className="poll-creator">
                  <div className="poll-creator-header">
                    <h3>Create a Poll</h3>
                    <button className="close-btn" onClick={() => setShowPollCreator(false)}>
                      <CloseIcon />
                    </button>
                  </div>
                  <div className="poll-creator-content">
                    <div className="form-group">
                      <label>Question</label>
                      <input 
                        type="text" 
                        placeholder="Ask a question..." 
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Options</label>
                      {pollOptions.map((option, index) => (
                        <div key={index} className="option-input">
                          <input 
                            type="text" 
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...pollOptions];
                              newOptions[index] = e.target.value;
                              setPollOptions(newOptions);
                            }}
                          />
                          {index > 1 && (
                            <button 
                              className="remove-option" 
                              onClick={() => {
                                const newOptions = [...pollOptions];
                                newOptions.splice(index, 1);
                                setPollOptions(newOptions);
                              }}
                            >
                              <CloseIcon style={{ fontSize: 16 }} />
                            </button>
                          )}
                        </div>
                      ))}
                      {pollOptions.length < 6 && (
                        <button 
                          className="add-option"
                          onClick={() => setPollOptions([...pollOptions, ''])}
                        >
                          <Add /> Add Option
                        </button>
                      )}
                    </div>
                    <div className="poll-actions">
                      <button 
                        className="cancel-btn" 
                        onClick={() => setShowPollCreator(false)}
                      >
                        Cancel
                      </button>
                      <button 
                        className="create-btn"
                        disabled={!pollQuestion.trim() || pollOptions.filter(opt => opt.trim()).length < 2}
                        onClick={() => {
                          // TODO: Implement poll creation
                          toast.success('Poll creation coming soon!');
                          setShowPollCreator(false);
                        }}
                      >
                        Create Poll
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Message Input */}
              <div className="message-input-container">
                
                <form onSubmit={handleSendMessage} className="message-input-form">
                  
                  <div className="input-wrapper">
                    <input
                      type="text"
                      placeholder={`Message ${selectedUser.name}...`}
                      value={newMessage}
                      onChange={handleTyping}
                      maxLength={1000}
                      className="message-input"
                      autoComplete="off"
                      disabled={false}
                    />
                    
                    <button 
                      type="button"
                      className="icon-btn emoji-btn"
                      title="Add emoji"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      disabled={false}
                    >
                      <EmojiIcon />
                    </button>
                    
                    {showEmojiPicker && (
                      <div className="emoji-picker-container">
                        <EmojiPicker 
                          onEmojiClick={handleEmojiClick} 
                          width={300} 
                          height={400}
                          previewConfig={{ showPreview: false }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className={`send-btn ${newMessage.trim() ? 'active' : ''}`}
                    title="Send message"
                  >
                    <SendIcon />
                  </button>
                </form>
                
                <div className="input-footer">
                  <span className="char-count">
                    {newMessage.length}/1000
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="no-conversation">
              <div className="no-conversation-content">
                <ChatBubbleOutline className="no-conversation-icon" />
                <h2>Select a conversation</h2>
                <p>Choose from your existing conversations or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages; 