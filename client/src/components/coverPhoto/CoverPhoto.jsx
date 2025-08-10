import { useState } from "react";
import "./coverPhoto.scss";
import ImageCropper from "../imageCropper/ImageCropper";
import { makeRequest } from "../../axios";
import { IMAGE_TYPES, COVER_RATIO, validateImage } from "../../utils/imageProcessing";
import EditIcon from '@mui/icons-material/Edit';

const CoverPhoto = ({ user, editable = false }) => {
  const [showCropper, setShowCropper] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageSelect = async (e) => {
    console.log('CoverPhoto: Image selection started');
    const file = e.target.files[0];
    if (!file) {
      console.log('CoverPhoto: No file selected');
      return;
    }

    try {
      console.log('CoverPhoto: Validating image:', file.name, file.type, file.size);
      validateImage(file);
      console.log('CoverPhoto: Image validation passed');
      const url = URL.createObjectURL(file);
      console.log('CoverPhoto: Created object URL:', url);
      setPreviewUrl(url);
      console.log('CoverPhoto: Setting showCropper to true');
      setShowCropper(true);
      setError(null);
    } catch (err) {
      console.error('CoverPhoto: Image validation error:', err);
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
      Object.entries(IMAGE_TYPES.COVER).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Upload to server
      const res = await makeRequest.post("/upload", formData);
      
      // Update user profile with new cover URL
      await makeRequest.put("/users", {
        coverPic: res.data.url
      });

      // Reload page to show new cover picture
      window.location.reload();
    } catch (err) {
      console.error("Cover photo upload error:", err);
      setError(err.response?.data?.message || err.message || "Error updating cover photo");
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
    console.log('Cover image failed to load:', user?.coverPic);
    setImageError(true);
  };

  return (
    <div className="cover-photo">
      {user.coverPic && !imageError ? (
        <img src={user.coverPic} alt="Cover" onError={handleImageError} />
      ) : (
        <div className="default-cover">
          <div className="default-cover-content">
            <span>No cover photo</span>
          </div>
        </div>
      )}
      
      {editable && (
        <label className="edit-button" title="Change cover photo">
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
          aspectRatio={COVER_RATIO}
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

export default CoverPhoto; 