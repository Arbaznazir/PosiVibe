import React from 'react';
import './verificationBadge.scss';
import goldenTick from '../../assets/golden_tick.png';
import greenTick from '../../assets/green_tick.png';
import redTick from '../../assets/red_tick.png';

const VerificationBadge = ({ badge, size = 'medium', className = '' }) => {
  // Only show badge if it's a valid verification badge (not 'none' or empty)
  if (!badge || badge === 'none' || badge === '') {
    return null;
  }

  const getTickImage = () => {
    switch (badge) {
      // Golden tick - for premium/owner users
      case 'gold':
      case 'golden':
      case 'owner':
        return goldenTick;
      
      // Green tick - for verified users
      case 'green':
      case 'verified':
      case 'blue': // Keep blue for backward compatibility
        return greenTick;
      
      // Red tick - for admin users
      case 'red':
      case 'admin':
      case 'premium':
        return redTick;
      
      default:
        return null; // Don't show anything for invalid badges
    }
  };

  const getTickAlt = () => {
    switch (badge) {
      case 'gold':
      case 'golden':
      case 'owner':
        return 'Golden verification tick';
      case 'green':
      case 'verified':
      case 'blue':
        return 'Green verification tick';
      case 'red':
      case 'admin':
      case 'premium':
        return 'Red verification tick';
      default:
        return 'Verification tick';
    }
  };

  const tickImage = getTickImage();
  if (!tickImage) return null;

  return (
    <div className={`verification-badge ${badge} ${size} ${className}`}>
      <img 
        src={tickImage} 
        alt={getTickAlt()}
        className="tick-image"
      />
    </div>
  );
};

export default VerificationBadge; 