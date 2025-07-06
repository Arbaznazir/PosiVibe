import React, { useState, useEffect, useRef, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { makeRequest } from '../../axios';
import { AuthContext } from '../../context/authContext';
import socketService from '../../services/socket';
import './messages.scss';
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
} from '@mui/icons-material';
import Avatar from '../avatar/Avatar';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const Messages = ({ isOpen, onClose }) => {
  const { currentUser } = useContext(AuthContext);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const queryClient = useQueryClient();

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
    console.log('📋 Conversations state updated:', conversations);
    console.log('📋 Conversations loading:', conversationsLoading);
    console.log('📋 Current user:', currentUser);
  }, [conversations, conversationsLoading, currentUser]);

  // Fetch suggested users (people you follow but haven't messaged)
  const { data: suggestedUsers = [], isLoading: suggestedLoading } = useQuery({
    queryKey: ['suggestedUsers'],
    queryFn: async () => {
      try {
        const followingRes = await makeRequest.get('/relationships?followerUserId=' + currentUser.id);
        const following = followingRes.data;
        
        // Get users you follow but haven't messaged
        const conversationUserIds = conversations.map(conv => conv.user._id);
        const suggestedUserIds = following.filter(userId => !conversationUserIds.includes(userId));
        
        if (suggestedUserIds.length === 0) return [];
        
        const usersPromises = suggestedUserIds.slice(0, 5).map(userId => 
          makeRequest.get(`/users/find/${userId}`).then(res => res.data)
        );
        
        const users = await Promise.all(usersPromises);
        return users.filter(user => user);
      } catch (error) {
        console.error('Error fetching suggested users:', error);
        return [];
      }
    },
    enabled: isOpen && !!currentUser && conversations.length >= 0,
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
    } else if (selectedUserId) {
      setMessages([]);
    }
  }, [fetchedMessages, selectedUserId]);

  // Socket.IO setup
  useEffect(() => {
    if (isOpen && currentUser) {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1];

      if (token) {
        socketService.connect(token);

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
          setMessages(prev => [...prev, message]);
          setNewMessage('');
          queryClient.invalidateQueries(['conversations']);
        });

        // Listen for message errors
        socketService.onMessageError((error) => {
          toast.error(error.error);
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
      }
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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId) return;

    socketService.sendMessage(selectedUserId, newMessage.trim());
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

  const filteredConversations = conversations.filter(conv =>
    conv.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUser = conversations.find(c => c.user._id === selectedUserId)?.user ||
                      suggestedUsers.find(u => u._id === selectedUserId);

  if (!isOpen) return null;

  return (
    <div className="messages-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="messages-container">
        {/* Sidebar */}
        <div className={`messages-sidebar ${!showSidebar ? 'hidden-mobile' : ''}`}>
          <div className="sidebar-header">
            <div className="header-content">
              <h2>Messages</h2>
              <div className="header-actions">
                <button 
                  className="icon-btn refresh-btn" 
                  onClick={() => {
                    refetchConversations();
                    toast.success('Refreshed conversations');
                  }}
                  title="Refresh"
                >
                  <Refresh />
                </button>
                <button className="icon-btn close-btn" onClick={onClose} title="Close">
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
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.user._id}
                        className={`conversation-item ${
                          selectedUserId === conversation.user._id ? 'active' : ''
                        }`}
                        onClick={() => handleSelectUser(conversation.user._id)}
                      >
                        <div className="conversation-avatar">
                          <Avatar
                            src={conversation.user.profilePic}
                            name={conversation.user.name}
                            size="medium"
                            showOnline={true}
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
                                {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                                  addSuffix: false,
                                })}
                              </span>
                            )}
                          </div>
                          
                          {conversation.lastMessage && (
                            <div className="last-message">
                              {conversation.lastMessage.senderId._id === currentUser.id && (
                                <span className="you-prefix">You: </span>
                              )}
                              <span className="message-preview">
                                {conversation.lastMessage.content.length > 35
                                  ? `${conversation.lastMessage.content.substring(0, 35)}...`
                                  : conversation.lastMessage.content
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Users */}
                {suggestedUsers.length > 0 && (
                  <div className="conversations-section">
                    <div className="section-header">
                      <h3>Start New Conversation</h3>
                      <PersonAdd className="section-icon" />
                    </div>
                    {suggestedUsers.map((user) => (
                      <div
                        key={user._id}
                        className={`conversation-item suggested ${
                          selectedUserId === user._id ? 'active' : ''
                        }`}
                        onClick={() => handleSelectUser(user._id)}
                      >
                        <div className="conversation-avatar">
                          <Avatar
                            src={user.profilePic}
                            name={user.name}
                            size="medium"
                            showOnline={true}
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
                {filteredConversations.length === 0 && suggestedUsers.length === 0 && !conversationsLoading && !suggestedLoading && (
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
        <div className={`messages-main ${showSidebar ? 'hidden-mobile' : ''}`}>
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
                    src={selectedUser.profilePic}
                    name={selectedUser.name}
                    size="medium"
                    showOnline={true}
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
                        <span className="online-status">Online</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="header-actions">
                  <button className="icon-btn" title="Voice call">
                    <PhoneIcon />
                  </button>
                  <button className="icon-btn" title="Video call">
                    <VideoCallIcon />
                  </button>
                  <button className="icon-btn" title="Info">
                    <InfoIcon />
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
                    {messages.map((message, index) => {
                      if (!message || !message.senderId) {
                        return (
                          <div key={index} className="message error">
                            <p>⚠️ Unable to load message</p>
                          </div>
                        );
                      }
                      
                      const isOwn = message.senderId._id === currentUser.id;
                      const showAvatar = !isOwn && (
                        index === 0 || 
                        messages[index - 1]?.senderId?._id !== message.senderId._id
                      );
                      
                      return (
                        <div
                          key={message._id}
                          className={`message ${isOwn ? 'own' : 'other'}`}
                        >
                          {showAvatar && (
                            <Avatar
                              src={message.senderId.profilePic}
                              name={message.senderId.name}
                              size="small"
                              className="message-avatar"
                            />
                          )}
                          
                          <div className="message-content">
                            <div className="message-bubble">
                              <p>{message.content}</p>
                              <div className="message-meta">
                                <span className="message-time">
                                  {formatMessageTime(message.createdAt)}
                                </span>
                                {getMessageStatus(message)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className="message-input-container">
                <form onSubmit={handleSendMessage} className="message-input-form">
                  <button 
                    type="button" 
                    className="icon-btn attach-btn"
                    title="Attach file"
                  >
                    <AttachFileIcon />
                  </button>
                  
                  <div className="input-wrapper">
                    <input
                      type="text"
                      placeholder={`Message ${selectedUser.name}...`}
                      value={newMessage}
                      onChange={handleTyping}
                      maxLength={1000}
                      className="message-input"
                    />
                    
                    <button 
                      type="button"
                      className="icon-btn emoji-btn"
                      title="Add emoji"
                    >
                      <EmojiIcon />
                    </button>
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