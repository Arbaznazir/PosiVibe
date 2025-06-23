import React from 'react';
import './avatar.scss';

const Avatar = ({ 
  src, 
  name, 
  size = 'medium', 
  className = '', 
  showOnline = false,
  onClick = null 
}) => {
  // Generate a consistent color based on the name
  const getAvatarColor = (name) => {
    if (!name) return '#6366f1'; // Default purple
    
    const colors = [
      '#ef4444', // red
      '#f97316', // orange
      '#eab308', // yellow
      '#22c55e', // green
      '#06b6d4', // cyan
      '#3b82f6', // blue
      '#6366f1', // indigo
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#f59e0b', // amber
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    
    const nameParts = name.trim().split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const avatarColor = getAvatarColor(name);
  const initials = getInitials(name);

  return (
    <div 
      className={`avatar avatar-${size} ${className} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {src ? (
        <img 
          src={src.startsWith('http') ? src : `/upload/${src}`} 
          alt={name || 'Profile'} 
          onError={(e) => {
            // If image fails to load, hide it and show initials
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      
      <div 
        className="avatar-fallback" 
        style={{ 
          backgroundColor: avatarColor,
          display: src ? 'none' : 'flex'
        }}
      >
        {initials}
      </div>
      
      {showOnline && <div className="online-indicator"></div>}
    </div>
  );
};

export default Avatar; 