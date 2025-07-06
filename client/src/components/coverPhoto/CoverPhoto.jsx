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
        transform_width: IMAGE_TYPES.COVER.width,
        transform_height: IMAGE_TYPES.COVER.height,
        transform_crop: IMAGE_TYPES.COVER.crop,
        transform_gravity: IMAGE_TYPES.COVER.gravity
      };

      const res = await makeRequest.post("/upload", formData);
      
      // Update user profile with new cover URL
      await makeRequest.put("/users", {
        coverPic: res.data
      });

      // Reload page to show new cover picture
      window.location.reload();
    } catch (err) {
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

  return (
    <div className="cover-photo">
      <img src={user.coverPic} alt="Cover" />
      
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
        <div className="cropper-modal">
          <ImageCropper
            imageUrl={previewUrl}
            aspectRatio={COVER_RATIO}
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

export default CoverPhoto; 