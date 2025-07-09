import React from 'react';
import { 
  Close as CloseIcon, 
  Info as InfoIcon,
  Lightbulb as LightbulbIcon,
  Favorite as FavoriteIcon 
} from '@mui/icons-material';
import './contentModerationPopup.scss';

const ContentModerationPopup = ({ 
  isOpen, 
  onClose, 
  title = "Content Guidelines Notice",
  message,
  details,
  suggestions = [],
  canRetry = true,
  severity = "medium"
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (severity) {
      case 'critical':
        return <InfoIcon className="popup-icon critical" />;
      case 'high':
        return <InfoIcon className="popup-icon high" />;
      default:
        return <FavoriteIcon className="popup-icon medium" />;
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className="content-moderation-overlay" onClick={handleOverlayClick}>
      <div className="content-moderation-popup">
        <div className="popup-header">
          <div className="header-content">
            {getIcon()}
            <h2>{title}</h2>
          </div>
          <button className="close-btn" onClick={handleClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="popup-body">
          <div className="main-message">
            <p>{message}</p>
          </div>

          {details && (
            <div className="details-section">
              <p className="details">{details}</p>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="suggestions-section">
              <div className="suggestions-header">
                <LightbulbIcon className="suggestions-icon" />
                <h3>Helpful Tips</h3>
              </div>
              <ul className="suggestions-list">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="popup-footer">
          <div className="footer-message">
            <p>💙 Thank you for helping us maintain a positive community!</p>
          </div>
          <div className="footer-actions">
            {canRetry && (
              <button className="retry-btn" onClick={handleClose}>
                Try Again
              </button>
            )}
            <button className="understand-btn" onClick={handleClose}>
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentModerationPopup; 