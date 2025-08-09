import React, { useState, useEffect, useRef, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { makeRequest } from '../../axios';
import { AuthContext } from '../../context/authContext';
import socketService from '../../services/socket';
import './messages.scss';
import {
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
  Close as CloseIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import Avatar from '../../components/avatar/Avatar';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';

// Suggested Users Component
const SuggestedUsers = () => {
  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      try {
        const res = await makeRequest.get('/users');
        return res.data.slice(0, 5); // Get first 5 users
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
    retry: 1,
  });

  const handleFollowUser = async (userId) => {
    try {
      await makeRequest.post('/relationships', { userId });
      toast.success('User followed! You can now message them.');
      // Refresh the page to update the following list
      window.location.reload();
    } catch (error) {
      toast.error('Failed to follow user');
    }
  };

  if (isLoading) return <div className="loading">Loading suggestions...</div>;

  return (
    <div className="suggested-users">
      <h4>Suggested People</h4>
      <div className="users-list">
        {allUsers.map((user) => (
          <div key={user._id} className="suggested-user">
            <Avatar 
              src={user.profilePic} 
              name={user.name} 
              size="small"
            />
            <div className="user-info">
              <span className="name">{user.name}</span>
              <span className="username">@{user.username}</span>
            </div>
            <button 
              className="follow-btn"
              onClick={() => handleFollowUser(user._id)}
            >
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const MessagesPage = () => {
  const { currentUser } = useContext(AuthContext);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading, refetch: refetchConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => makeRequest.get('/messages').then(res => res.data),
    enabled: !!currentUser,
    refetchInterval: 30000,
    retry: 1,
    onError: (error) => {
      console.error('Failed to fetch conversations:', error);
      if (error.response?.status === 401) {
        toast.error('Please login again to view messages');
      }
    }
  });

  // Fetch users that the current user follows (for starting new conversations)
  const { data: followingUsers = [] } = useQuery({
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
    enabled: !!currentUser,
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
    if (currentUser) {
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
  }, [currentUser, selectedUserId, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile)) return;

    try {
      // Clear typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socketService.socket.emit('stop_typing', { receiverId: selectedUserId });

      let messageData = {
        receiverId: selectedUserId,
        content: newMessage,
      };
      
      // Handle file upload if present
      if (selectedFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        try {
          // Upload file to server
          const uploadRes = await makeRequest.post('/upload', formData);
          const fileUrl = uploadRes.data.url || uploadRes.data.secure_url || uploadRes.data;
          
          // Add file URL to message data
          messageData.fileUrl = fileUrl;
          messageData.fileName = selectedFile.name;
          messageData.fileType = selectedFile.type;
          
          // Clear selected file
          setSelectedFile(null);
          setFilePreview(null);
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          toast.error('Failed to upload file');
          setIsUploading(false);
          return;
        }
      }

      // Send message to server
      const res = await makeRequest.post('/messages', messageData);

      // Emit socket event
      socketService.socket.emit('send_message', {
        ...res.data,
        receiverId: selectedUserId,
      });

      // Update local messages
      setMessages((prev) => [...prev, res.data]);
      setNewMessage('');
      setIsUploading(false);
      scrollToBottom();

      // Invalidate conversations query to update the sidebar
      queryClient.invalidateQueries(['conversations']);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setIsUploading(false);
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

  const formatMessageTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Just now';
    }
  };

  const getMessageStatus = (message) => {
    if (message.senderId._id === currentUser.id) {
      return message.read ? <DoneAll className="read" /> : <Check className="sent" />;
    }
    return null;
  };

  const handleSelectUser = (userId) => {
    setSelectedUserId(userId);
    setShowSidebar(false); // Hide sidebar on mobile when selecting a chat
  };

  const handleBackToSidebar = () => {
    setShowSidebar(true);
    setSelectedUserId(null);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFollowingUsers = followingUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(user => 
    // Filter out users who already have conversations
    !conversations.some(conv => conv.user._id === user._id)
  );

  const selectedUser = selectedUserId ? 
    conversations.find(conv => conv.user._id === selectedUserId)?.user ||
    followingUsers.find(user => user._id === selectedUserId) : null;

  return (
    <div className="messages-page">
      <div className="messages-container">
        {/* Sidebar */}
        <div className={`messages-sidebar ${showSidebar ? 'show' : 'hide'}`}>
          <div className="sidebar-header">
            <h2>Messages</h2>
            <button 
              className="refresh-btn"
              onClick={() => refetchConversations()}
              title="Refresh conversations"
            >
              <Refresh />
            </button>
          </div>

          <div className="search-box">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="conversations-list">
            {conversationsLoading ? (
              <div className="loading">Loading conversations...</div>
            ) : (
              <>
                {/* Existing conversations */}
                {filteredConversations.length > 0 && (
                  <div className="conversations-section">
                    <h3>Recent Chats</h3>
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.user._id}
                        className={`conversation-item ${selectedUserId === conversation.user._id ? 'active' : ''}`}
                        onClick={() => handleSelectUser(conversation.user._id)}
                      >
                        <Avatar 
                          src={conversation.user.profilePic} 
                          name={conversation.user.name} 
                          size="medium"
                          showOnline={true}
                        />
                        <div className="conversation-info">
                          <div className="user-name">{conversation.user.name}</div>
                          <div className="last-message">
                            {conversation.lastMessage?.content || 'Start a conversation'}
                          </div>
                        </div>
                        <div className="conversation-meta">
                          {conversation.lastMessage && (
                            <span className="time">
                              {formatMessageTime(conversation.lastMessage.createdAt)}
                            </span>
                          )}
                          {conversation.unreadCount > 0 && (
                            <span className="unread-badge">{conversation.unreadCount}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* People you follow (for new conversations) */}
                {filteredFollowingUsers.length > 0 && (
                  <div className="conversations-section">
                    <h3>People You Follow</h3>
                    {filteredFollowingUsers.map((user) => (
                      <div
                        key={user._id}
                        className={`conversation-item ${selectedUserId === user._id ? 'active' : ''}`}
                        onClick={() => handleSelectUser(user._id)}
                      >
                        <Avatar 
                          src={user.profilePic} 
                          name={user.name} 
                          size="medium"
                          showOnline={true}
                        />
                        <div className="conversation-info">
                          <div className="user-name">{user.name}</div>
                          <div className="last-message">Start a conversation</div>
                        </div>
                        <div className="conversation-meta">
                          <PersonAdd className="new-chat-icon" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {filteredConversations.length === 0 && filteredFollowingUsers.length === 0 && (
                  <div className="empty-state">
                    <ChatBubbleOutline />
                    <h3>No conversations found</h3>
                    <p>Follow some users to start messaging them!</p>
                    <SuggestedUsers />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`chat-area ${!showSidebar ? 'full-width' : ''}`}>
          {selectedUserId ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <button 
                  className="back-btn mobile-only"
                  onClick={handleBackToSidebar}
                >
                  <ArrowBack />
                </button>
                <Avatar 
                  src={selectedUser?.profilePic} 
                  name={selectedUser?.name} 
                  size="medium"
                  showOnline={true}
                />
                <div className="user-info">
                  <h3>{selectedUser?.name}</h3>
                  <span className="status">
                    {typingUser === selectedUserId ? 'Typing...' : 'Active now'}
                  </span>
                </div>
                <div className="chat-actions">
                  <button className="action-btn" title="Voice call">
                    <PhoneIcon />
                  </button>
                  <button className="action-btn" title="Video call">
                    <VideoCallIcon />
                  </button>
                  <button className="action-btn" title="Info">
                    <InfoIcon />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="messages-area">
                {messagesLoading ? (
                  <div className="loading">Loading messages...</div>
                ) : messages.length > 0 ? (
                  messages.map((message) => (
                    <div
                      key={message._id}
                      className={`message ${message.senderId._id === currentUser.id ? 'own' : 'other'}`}
                    >
                      {message.senderId._id !== currentUser.id && (
                        <Avatar 
                          src={message.senderId.profilePic} 
                          name={message.senderId.name} 
                          size="small"
                        />
                      )}
                      <div className="message-content">
                        <div className="message-bubble">
                          {message.content && <p>{message.content}</p>}
                          {message.fileUrl && (
                            <div className="message-attachment">
                              {message.fileType?.startsWith('image/') ? (
                                <img 
                                  src={message.fileUrl} 
                                  alt="" 
                                  onClick={() => window.open(message.fileUrl, '_blank')}
                                />
                              ) : (
                                <div className="file-attachment" onClick={() => window.open(message.fileUrl, '_blank')}>
                                  <ImageIcon />
                                  <span>{message.fileName || 'Attachment'}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="message-info">
                          <span className="time">{formatMessageTime(message.createdAt)}</span>
                          {getMessageStatus(message)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-messages">
                    <ChatBubbleOutline />
                    <h3>No messages yet</h3>
                    <p>Start the conversation with {selectedUser?.name}!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* File Preview */}
              {filePreview && (
                <div className="file-preview">
                  <div className="file-preview-header">
                    <h4>File to send</h4>
                    <button 
                      type="button" 
                      className="close-btn"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                      }}
                    >
                      <CloseIcon />
                    </button>
                  </div>
                  <div className="file-preview-content">
                    {selectedFile?.type.startsWith('image/') ? (
                      <img src={filePreview} alt="Preview" />
                    ) : (
                      <div className="file-icon">
                        <ImageIcon />
                        <span>{selectedFile?.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Message Input */}
              <form className="message-input" onSubmit={handleSendMessage}>
                <input 
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setSelectedFile(file);
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setFilePreview(e.target.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <button 
                  type="button" 
                  className="attachment-btn" 
                  title="Attach file"
                  onClick={() => fileInputRef.current.click()}
                >
                  <AttachFileIcon />
                </button>
                <input
                  type="text"
                  placeholder={`Message ${selectedUser?.name}...`}
                  value={newMessage}
                  onChange={handleTyping}
                />
                <button 
                  type="button" 
                  className="emoji-btn" 
                  title="Add emoji"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <EmojiIcon />
                </button>
                <button 
                  type="submit" 
                  className="send-btn"
                  disabled={(!newMessage.trim() && !selectedFile) || isUploading}
                  title="Send message"
                >
                  <SendIcon />
                </button>
                
                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div className="emoji-picker-container">
                    <EmojiPicker 
                      onEmojiClick={(emojiData) => {
                        setNewMessage((prev) => prev + emojiData.emoji);
                        setShowEmojiPicker(false);
                      }}
                      width={300}
                      height={400}
                    />
                  </div>
                )}
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <ChatBubbleOutline />
              <h2>Select a conversation</h2>
              <p>Choose from your existing conversations or start a new one with someone you follow.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage; 