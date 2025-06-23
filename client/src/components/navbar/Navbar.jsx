import "./navbar.scss";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
import VerifiedIcon from "@mui/icons-material/Verified";
import Avatar from "../avatar/Avatar";

import { Link } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { DarkModeContext } from "../../context/darkModeContext";
import { AuthContext } from "../../context/authContext";
import { makeRequest } from "../../axios";
import Notifications from "../notifications/Notifications";
import { useQuery } from "@tanstack/react-query";

const TimeLimit = ({ currentUser }) => {
  const [timeInfo, setTimeInfo] = useState({
    remaining: 2.5 * 60 * 60 * 1000, // 2.5 hours in milliseconds
    formattedTimeRemaining: "2h 30m",
    totalUsed: 0,
    isTimeUp: false
  });
  const [status, setStatus] = useState("normal");

  // Format time in a cleaner way
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${totalSeconds}s`;
    }
  };

  useEffect(() => {
    console.log("TimeLimit component mounted, currentUser:", currentUser);
    
    const fetchTimeInfo = async () => {
      try {
        console.log("Fetching time limit info...");
        const res = await makeRequest.get(`/users/time-limit`);
        console.log("Time limit response:", res.data);
        
        const remaining = res.data.remaining || 0;
        const formatted = formatTime(remaining);
        const isTimeUp = res.data.isTimeUp || remaining <= 0;
        
        setTimeInfo({
          ...res.data,
          remaining,
          formattedTimeRemaining: formatted,
          isTimeUp
        });
        
        // Redirect to time limit page if time is up
        if (isTimeUp) {
          window.location.href = '/time-limit';
          return;
        }
        
        // Calculate warning states
        const HOUR = 60 * 60 * 1000; // 1 hour in milliseconds
        
        if (remaining <= HOUR / 2) { // Less than 30 minutes
          setStatus("danger");
        } else if (remaining <= HOUR) { // Less than 1 hour
          setStatus("warning");
        } else {
          setStatus("normal");
        }
      } catch (err) {
        console.error("Failed to fetch time limit info:", err);
        // Keep the default timer for testing
        const defaultRemaining = 2.5 * 60 * 60 * 1000;
        setTimeInfo({
          remaining: defaultRemaining,
          formattedTimeRemaining: formatTime(defaultRemaining),
          totalUsed: 0,
          isTimeUp: false
        });
        console.log("Using fallback timer");
      }
    };

    // Only fetch if user is logged in
    if (currentUser) {
      fetchTimeInfo();
      // Check more frequently (every 10 seconds) to track usage accurately
      const interval = setInterval(fetchTimeInfo, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  console.log("TimeLimit render - timeInfo:", timeInfo, "status:", status, "currentUser:", !!currentUser);

  // Don't render if time is up (will redirect)
  if (timeInfo.isTimeUp) {
    return null;
  }

  // Always show timer for testing
  const getTimerEmoji = () => {
    switch (status) {
      case "danger":
        return "⏰";
      case "warning":
        return "⌛";
      default:
        return "🕒";
    }
  };

  return (
    <div className={`timeLimit ${status}`} style={{ display: 'flex !important' }}>
      <span>{getTimerEmoji()}</span>
      <span className="timeRemaining">
        {timeInfo.formattedTimeRemaining}
      </span>
    </div>
  );
};

const Navbar = ({ onMobileMenuToggle }) => {
  const { toggle, darkMode } = useContext(DarkModeContext);
  const { currentUser } = useContext(AuthContext);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef(null);
  const notificationsRef = useRef(null);

  // Fetch unread notification count
  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => makeRequest.get('/notifications/unread-count').then(res => res.data),
    refetchInterval: 10000, // Refetch every 10 seconds
    enabled: !!currentUser,
  });

  // Smart search function with API integration
  const performSmartSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const res = await makeRequest.get(`/users/search?q=${encodeURIComponent(query)}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debouncing
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      setShowResults(true);
      setIsSearching(true);
      
      // Clear previous timeout
      if (window.searchTimeout) {
        clearTimeout(window.searchTimeout);
      }
      
      // Debounce search
      window.searchTimeout = setTimeout(() => {
        performSmartSearch(query);
      }, 300);
    } else {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      if (window.searchTimeout) {
        clearTimeout(window.searchTimeout);
      }
    }
  };

  // Handle search form submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && searchResults.length > 0) {
      // Navigate to first result
      handleResultClick(searchResults[0]._id);
    }
  };

  // Close search results and notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle result click
  const handleResultClick = (userId) => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    window.location.href = `/profile/${userId}`;
  };

  return (
    <div className={`navbar ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      <div className="left">
        <button 
          className="mobile-menu-btn"
          onClick={onMobileMenuToggle}
          title="Toggle Menu"
        >
          <MenuIcon />
        </button>
        
        <Link to="/" className="logo">
          PosiVibe
        </Link>
        
        <TimeLimit currentUser={currentUser} />
        
        <div className="search-container" ref={searchRef}>
          <form className="search" onSubmit={handleSearch}>
            <SearchOutlinedIcon className="search-icon" />
            <input 
              type="text" 
              placeholder="Search for friends, posts, and more..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.trim() && setShowResults(true)}
            />
          </form>
          
          {/* Search Results Dropdown */}
          {showResults && (
            <div className="search-results">
              {isSearching ? (
                <div className="search-loading">
                  <div className="loading-spinner"></div>
                  <span>Searching...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="results-header">
                    <span>People</span>
                  </div>
                  {searchResults.map((user) => (
                    <div 
                      key={user._id} 
                      className="search-result-item"
                      onClick={() => handleResultClick(user._id)}
                    >
                      <Avatar 
                        src={user.profilePic} 
                        name={user.name} 
                        size="medium" 
                        className="user-avatar"
                      />
                      {user.isFollowing && <div className="following-badge"></div>}
                      <div className="user-info">
                        <div className="user-name">
                          {user.name}
                          {user.isFollowing && <VerifiedIcon className="following-icon" />}
                        </div>
                        <div className="user-username">@{user.username}</div>
                        {user.isFollowing && <div className="following-label">Following</div>}
                      </div>
                    </div>
                  ))}
                  {searchResults.length === 8 && (
                    <div className="show-more">
                      <span>See all results for "{searchQuery}"</span>
                    </div>
                  )}
                </>
              ) : searchQuery.trim() ? (
                <div className="no-results">
                  <PersonIcon />
                  <span>No people found for "{searchQuery}"</span>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
      
      <div className="right">
        <div className="nav-icons">
          <Link to="/" className="icon-btn" title="Home">
            <HomeOutlinedIcon />
          </Link>
          
          <button className="icon-btn" title="Messages">
        <EmailOutlinedIcon />
            <span className="badge">3</span>
          </button>
          
          <div className="notification-wrapper" ref={notificationsRef}>
            <button 
              className="icon-btn" 
              title="Notifications"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <NotificationsOutlinedIcon />
              {unreadData?.count > 0 && (
                <span className="badge">{unreadData.count > 99 ? '99+' : unreadData.count}</span>
              )}
            </button>
            <Notifications 
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
              onToggle={() => setShowNotifications(!showNotifications)}
            />
          </div>
        </div>

        <button 
          className="theme-toggle" 
          onClick={toggle}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <WbSunnyOutlinedIcon /> : <DarkModeOutlinedIcon />}
        </button>

        <div className="user-menu">
          <Link 
            to={`/profile/${currentUser?._id || currentUser?.id}`} 
            className="user"
            title="View Profile"
          >
            <Avatar 
              src={currentUser?.profilePic} 
              name={currentUser?.name} 
              size="medium" 
              className="user-avatar"
              showOnline={true}
            />
            <div className="user-info">
              <span className="username">{currentUser?.name}</span>
              <span className="status">Online</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
