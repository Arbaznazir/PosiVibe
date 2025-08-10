import "./navbar.scss";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { Link, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { DarkModeContext } from "../../context/darkModeContext";
import { AuthContext } from "../../context/authContext";
import Avatar from "../avatar/Avatar";
import Notifications from "../notifications/Notifications";
import Messages from "../messages/Messages";
import VerificationBadge from "../verificationBadge/VerificationBadge";
import { makeRequest } from "../../axios";

const Navbar = () => {
  const { toggle, darkMode } = useContext(DarkModeContext);
  const { currentUser, logout } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef(null);
  const navigate = useNavigate();

  // Fetch time limit data
  const { data: timeLimit, refetch: refetchTimeLimit } = useQuery({
    queryKey: ['timeLimit'],
    queryFn: () => makeRequest.get('/users/time-limit').then(res => res.data),
    enabled: !!currentUser,
    refetchInterval: 60000, // Refetch every minute
    retry: 1,
  });

  // Fetch unread notification count
  const { data: unreadNotifications } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => makeRequest.get('/notifications/unread-count').then(res => res.data),
    enabled: !!currentUser,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch unread message count
  const { data: unreadMessages, refetch: refetchUnreadMessages } = useQuery({
    queryKey: ['messages-unread'],
    queryFn: () => makeRequest.get('/messages/unread/count').then(res => res.data),
    enabled: !!currentUser,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Function to clear message notifications
  const clearMessageNotifications = async () => {
    try {
      await makeRequest.post('/messages/clear-notifications');
      refetchUnreadMessages(); // Refresh the unread count
    } catch (err) {
      console.error("Error clearing message notifications:", err);
    }
  };

  // Check time limit every minute
  useEffect(() => {
    if (!currentUser) return;

    const checkTimeLimit = () => {
      refetchTimeLimit();
    };

    const interval = setInterval(checkTimeLimit, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [currentUser, refetchTimeLimit]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/"); // Redirect to home page instead of login
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileClick = () => {
    const userId = currentUser?._id || currentUser?.id;
    console.log("Current user data:", currentUser);
    
    if (!userId) {
      console.error("No valid user ID found in currentUser:", currentUser);
      return;
    }

    // Always navigate to the full path
    navigate(`/app/profile/${userId}`);
    setMenuOpen(false);
  };

  const formatTimeRemaining = (milliseconds) => {
    if (!milliseconds || milliseconds <= 0) return "0:00";
    
    const totalMinutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${Math.floor((milliseconds % (1000 * 60)) / 1000).toString().padStart(2, '0')}`;
  };

  const getTimeColor = (remaining) => {
    if (!remaining) return '';
    const HOUR = 60 * 60 * 1000;
    if (remaining <= HOUR / 4) return 'critical'; // Less than 15 minutes
    if (remaining <= HOUR / 2) return 'warning'; // Less than 30 minutes
    if (remaining <= HOUR) return 'low'; // Less than 1 hour
    return '';
  };

  // Search functionality
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await makeRequest.get(`/users/search?q=${encodeURIComponent(value.trim())}`);
        setSearchResults(response.data);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);
  };

  const handleSearchFocus = () => {
    if (searchTerm.trim().length >= 2 && searchResults.length > 0) {
      setShowSearchResults(true);
    }
  };

  const handleSearchBlur = () => {
    // Delay hiding results to allow clicking on them
    setTimeout(() => {
      setShowSearchResults(false);
    }, 300); // Increased delay to 300ms
  };

  const handleSearchResultClick = (userId) => {
    console.log('🔍 Search result clicked:', userId);
    setSearchTerm('');
    setSearchResults([]);
    setShowSearchResults(false);
    navigate(`/app/profile/${userId}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      handleSearchResultClick(searchResults[0]._id);
    }
  };

  return (
    <div className="navbar">
      <div className="left">
        <Link to="/app" className="logo">
          <img src="/logo.png" alt="PosiVibe" className="logo-image" />
          <span className="logo-text">PosiVibe</span>
        </Link>
        <div className="search">
          <SearchOutlinedIcon />
          <form onSubmit={handleSearchSubmit}>
            <input 
              type="text" 
              placeholder="Search people..." 
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
            />
          </form>
          {showSearchResults && searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className="search-result-item"
                  onMouseDown={() => handleSearchResultClick(user._id)}
                >
                  <Avatar user={user} size="small" />
                  <div className="user-info">
                    <div className="user-name">
                      <span className="name">{user.name}</span>
                      {user.verificationBadge && (
                        <VerificationBadge badge={user.verificationBadge} size="small" />
                      )}
                    </div>
                    <span className="username">@{user.username}</span>
                  </div>
                  {user.isFollowing && (
                    <span className="following-indicator">Following</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="right">
        <Link to="/app" className="nav-link">
          <HomeOutlinedIcon />
          <span>Home</span>
        </Link>
        <button className="theme-toggle" onClick={toggle}>
          {darkMode ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
        </button>
        
        {/* Timer Display */}
        {timeLimit && (
          <div className={`timer-display ${getTimeColor(timeLimit.remaining)}`}>
            <AccessTimeIcon />
            <span className="time-text">{formatTimeRemaining(timeLimit.remaining)}</span>
          </div>
        )}
        
        {/* Messages */}
        <div className="nav-link messages-nav" onClick={() => setMessagesOpen(!messagesOpen)}>
          <EmailOutlinedIcon />
          <span>Messages</span>
          {unreadMessages?.count > 0 && (
            <span className="counter">{unreadMessages.count}</span>
          )}
          {unreadMessages?.count > 0 && (
            <div className="clear-badge" onClick={(e) => {
              e.stopPropagation();
              clearMessageNotifications();
            }} title="Clear notification badge">
              ×
            </div>
          )}
        </div>
        <Messages 
          isOpen={messagesOpen} 
          onClose={() => setMessagesOpen(false)} 
        />
        
        {/* Notifications */}
        <div className="nav-item notifications-nav" onClick={() => setNotificationsOpen(!notificationsOpen)}>
          <NotificationsNoneOutlinedIcon />
          <span>Notifications</span>
          {unreadNotifications?.count > 0 && (
            <span className="counter">{unreadNotifications.count}</span>
          )}
        </div>
        <Notifications 
          isOpen={notificationsOpen} 
          onClose={() => setNotificationsOpen(false)} 
        />
        
        <div className="user-menu" onClick={() => setMenuOpen(!menuOpen)}>
          <Avatar user={currentUser} size="small" />
          <span className="username">{currentUser?.name}</span>
          {menuOpen && (
            <div className="menu-dropdown">
              <button 
                onClick={handleProfileClick} 
                className="menu-item"
                type="button"
              >
                <PersonOutlineOutlinedIcon />
                <span>Profile</span>
              </button>
              <button 
                className="menu-item logout" 
                onClick={handleLogout}
                type="button"
              >
                <LogoutIcon />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
