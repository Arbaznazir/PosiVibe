import { useState } from "react";
import "./avatar.scss";
import ImageCropper from "../imageCropper/ImageCropper";
import { makeRequest } from "../../axios";
import { IMAGE_TYPES, PROFILE_RATIO, validateImage } from "../../utils/imageProcessing";
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';

const Avatar = ({ user = null, size = "medium", editable = false }) => {
  const [showCropper, setShowCropper] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      validateImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setShowCropper(true);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCropComplete = async (croppedImage) => {
    try {
      setLoading(true);
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
      reader.readAsDataURL(croppedImage);
      const base64Data = await base64Promise;

      // Upload to server
      const formData = {
        file: base64Data,
        transform_width: IMAGE_TYPES.PROFILE.width,
        transform_height: IMAGE_TYPES.PROFILE.height,
        transform_crop: IMAGE_TYPES.PROFILE.crop,
        transform_gravity: IMAGE_TYPES.PROFILE.gravity
      };

      const res = await makeRequest.post("/upload", formData);
      
      // Update user profile with new image URL
      await makeRequest.put("/users", {
        profilePic: res.data
      });

      // Reload page to show new profile picture
      window.location.reload();
    } catch (err) {
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
    <div className={`avatar ${size}`}>
      {user?.profilePic && !imageError ? (
        <img 
          src={user.profilePic} 
          alt={user.name || 'Profile'} 
          onError={handleImageError}
        />
      ) : (
        getDefaultAvatar()
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
        <div className="cropper-modal">
          <ImageCropper
            imageUrl={previewUrl}
            aspectRatio={PROFILE_RATIO}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
          />
        </div>
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