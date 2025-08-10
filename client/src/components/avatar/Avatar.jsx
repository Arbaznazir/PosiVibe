import { useState } from "react";
import "./avatar.scss";
import ImageCropper from "../imageCropper/ImageCropper";
import VerificationBadge from "../verificationBadge/VerificationBadge";
import { makeRequest } from "../../axios";
import { IMAGE_TYPES, PROFILE_RATIO, validateImage } from "../../utils/imageProcessing";
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';

const Avatar = ({ 
  user = null, 
  size = "medium", 
  editable = false, 
  showOnline = false,
  showVerification = false // Changed default to false
}) => {
  const [showCropper, setShowCropper] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageSelect = async (e) => {
    console.log('Image selection started');
    const file = e.target.files[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    try {
      console.log('Validating image:', file.name, file.type, file.size);
      validateImage(file);
      console.log('Image validation passed');
      const url = URL.createObjectURL(file);
      console.log('Created object URL:', url);
      
      // Reset any previous errors
      setError(null);
      
      // Set the preview URL first
      setPreviewUrl(url);
      
      // Force a small delay before showing the cropper to ensure state is updated
      setTimeout(() => {
        console.log('Setting showCropper to true');
        setShowCropper(true);
      }, 50);
    } catch (err) {
      console.error('Image validation error:', err);
      setError(err.message);
    }
  };

  const handleCropComplete = async (croppedImage) => {
    try {
      setLoading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", croppedImage);
      
      // Add transformation parameters
      Object.entries(IMAGE_TYPES.PROFILE).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Upload to server
      const res = await makeRequest.post("/upload", formData);
      
      // Update user profile with new image URL
      await makeRequest.put("/users", {
        profilePic: res.data.url
      });

      // Reload page to show new profile picture
      window.location.reload();
    } catch (err) {
      console.error("Profile photo upload error:", err);
      setError(err.response?.data?.message || err.message || "Error updating profile picture");
    } finally {
      setLoading(false);
      setShowCropper(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setPreviewUrl(null);
  };

  const handleImageError = () => {
    console.log('Profile image failed to load:', user?.profilePic);
    setImageError(true);
  };

  // Default avatar content when no user or profile pic
  const getDefaultAvatar = () => {
    if (!user) {
      return (
        <div className="default-avatar">
          <PersonIcon />
        </div>
      );
    }
    
    const initials = user.name?.charAt(0)?.toUpperCase() || '?';
    return (
      <div 
        className="default-avatar" 
        style={{ backgroundColor: getColorFromName(user.name) }}
      >
        {initials}
      </div>
    );
  };

  // Generate consistent color from name
  const getColorFromName = (name) => {
    if (!name) return '#6366f1'; // Default color
    
    const colors = [
      '#6366f1', // Indigo
      '#8b5cf6', // Purple
      '#ec4899', // Pink
      '#f43f5e', // Rose
      '#f97316', // Orange
      '#84cc16', // Lime
      '#22c55e', // Green
      '#06b6d4', // Cyan
      '#3b82f6', // Blue
      '#a855f7'  // Purple
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={`avatar ${size} ${showOnline ? 'online' : ''}`}>
      <div className="avatar-image">
        {user?.profilePic && !imageError ? (
          <img 
            src={user.profilePic} 
            alt={user.name || 'Profile'} 
            onError={handleImageError}
          />
        ) : (
          getDefaultAvatar()
        )}
        
        {showOnline && (
          <div className="online-indicator"></div>
        )}
      </div>
      
      {showVerification && user?.verificationBadge && (
        <VerificationBadge 
          badge={user.verificationBadge} 
          size={size === 'large' ? 'medium' : 'small'}
          className="avatar-verification"
        />
      )}
      
      {editable && (
        <label className="edit-button" title="Change profile picture">
          <input
            type="file"
            style={{ display: "none" }}
            onChange={handleImageSelect}
            accept="image/*"
          />
          <EditIcon />
        </label>
      )}

      {showCropper && previewUrl && (
        <ImageCropper
          imageUrl={previewUrl}
          aspectRatio={PROFILE_RATIO}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          Updating...
        </div>
      )}
    </div>
  );
};

export default Avatar; 