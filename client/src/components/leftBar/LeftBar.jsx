import "./leftBar.scss";
import Friends from "../../assets/1.png";
import Groups from "../../assets/2.png";
import Market from "../../assets/3.png";
import Watch from "../../assets/4.png";
import Memories from "../../assets/5.png";
import Events from "../../assets/6.png";
import Gaming from "../../assets/7.png";
import Gallery from "../../assets/8.png";
import Messages from "../../assets/10.png";
import { AuthContext } from "../../context/authContext";
import { useContext, useEffect } from "react";
import { Link } from "react-router-dom";

const LeftBar = ({ isOpen, onClose }) => {
  const { currentUser } = useContext(AuthContext);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.leftBar') && !event.target.closest('.mobile-menu-btn')) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="mobile-overlay" onClick={onClose} />}
      
      <div className={`leftBar ${isOpen ? 'open' : ''}`}>
      <div className="container">
          {/* User Section */}
          <Link 
            to={`/profile/${currentUser?._id || currentUser?.id}`} 
            className="user-section"
            onClick={() => onClose && onClose()}
          >
            <div className="user-avatar">
              {currentUser?.profilePic ? (
                <img src={`/upload/${currentUser.profilePic}`} alt="Profile" />
              ) : (
                <div className="avatar-placeholder">
                  {currentUser?.name?.charAt(0)?.toUpperCase() || '👤'}
                </div>
              )}
              <div className="online-status"></div>
            </div>
            <div className="user-info">
              <h3 className="user-name">{currentUser?.name || 'User'}</h3>
              <p className="user-handle">@{currentUser?.username || 'username'}</p>
            </div>
          </Link>

          {/* Navigation */}
          <div className="navigation">
            <div className="nav-item" onClick={() => onClose && onClose()}>
              <img src={Friends} alt="" className="nav-icon" />
              <span className="nav-text">Friends</span>
            </div>
            <div className="nav-item" onClick={() => onClose && onClose()}>
              <img src={Groups} alt="" className="nav-icon" />
              <span className="nav-text">Groups</span>
          </div>
            <div className="nav-item" onClick={() => onClose && onClose()}>
              <img src={Market} alt="" className="nav-icon" />
              <span className="nav-text">Marketplace</span>
          </div>
            <div className="nav-item" onClick={() => onClose && onClose()}>
              <img src={Watch} alt="" className="nav-icon" />
              <span className="nav-text">Watch</span>
              <span className="nav-count">9</span>
          </div>
            <div className="nav-item" onClick={() => onClose && onClose()}>
              <img src={Memories} alt="" className="nav-icon" />
              <span className="nav-text">Memories</span>
          </div>
            <div className="nav-item" onClick={() => onClose && onClose()}>
              <img src={Events} alt="" className="nav-icon" />
              <span className="nav-text">Events</span>
          </div>
            <div className="nav-item" onClick={() => onClose && onClose()}>
              <img src={Gaming} alt="" className="nav-icon" />
              <span className="nav-text">Gaming</span>
          </div>
            <div className="nav-item" onClick={() => onClose && onClose()}>
              <img src={Messages} alt="" className="nav-icon" />
              <span className="nav-text">Messages</span>
              <span className="nav-count">3</span>
        </div>
          </div>

          {/* Your Activity Stats */}
          <div className="stats-section">
            <h4 className="stats-title">Your Activity</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">8</span>
                <span className="stat-label">Posts</span>
          </div>
              <div className="stat-item">
                <span className="stat-number">2</span>
                <span className="stat-label">Following</span>
          </div>
              <div className="stat-item">
                <span className="stat-number">1</span>
                <span className="stat-label">Followers</span>
          </div>
              <div className="stat-item">
                <span className="stat-number">24</span>
                <span className="stat-label">Likes</span>
          </div>
        </div>
          </div>

          {/* Settings */}
          <div className="settings-section">
            <div className="settings-item" onClick={() => onClose && onClose()}>
              <img src={Gallery} alt="" className="settings-icon" />
              <span className="settings-text">Settings</span>
          </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeftBar;
