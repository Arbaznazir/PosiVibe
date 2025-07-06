import { useState } from "react";
import { makeRequest } from "../../axios";
import "./update.scss";
import {
  IMAGE_TYPES,
  PROFILE_RATIO,
  COVER_RATIO,
  validateImage,
  buildCloudinaryTransform
} from "../../utils/imageProcessing";
import ImageCropper from "../imageCropper/ImageCropper";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import ImageIcon from '@mui/icons-material/Image';
import LanguageIcon from '@mui/icons-material/Language';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const Update = ({ setOpenUpdate, user }) => {
  const [cover, setCover] = useState(null);
  const [profile, setProfile] = useState(null);
  const [texts, setTexts] = useState({
    name: user.name || "",
    city: user.city || "",
    website: user.website || "",
  });
  const [coverUrl, setCoverUrl] = useState(null);
  const [profileUrl, setProfileUrl] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropType, setCropType] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const upload = async (file, type) => {
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      // Get transformations based on type
      const transform = buildCloudinaryTransform(IMAGE_TYPES[type]);
      
      // Create form data with base64 and transformations
      const formData = {
        file: base64Data,
        ...Object.entries(transform).reduce((acc, [key, value]) => {
          acc[`transform_${key}`] = value;
          return acc;
        }, {})
      };

      const res = await makeRequest.post("/upload", formData);
      return res.data;
    } catch (err) {
      console.error("Upload error:", err);
      throw new Error(err.response?.data?.message || "Error uploading image");
    }
  };

  const handleChange = (e) => {
    setTexts((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null); // Clear any previous errors when user makes changes
  };

  const handleImageSelect = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      validateImage(file);
      const url = URL.createObjectURL(file);
      
      if (type === "PROFILE") {
        setProfile(file);
        setProfileUrl(url);
      } else {
        setCover(file);
        setCoverUrl(url);
      }
      
      setCropType(type);
      setShowCropper(true);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCropComplete = async (croppedImage) => {
    try {
      if (cropType === "PROFILE") {
        setProfile(croppedImage);
        setProfileUrl(URL.createObjectURL(croppedImage));
      } else {
        setCover(croppedImage);
        setCoverUrl(URL.createObjectURL(croppedImage));
      }
      setShowCropper(false);
    } catch (err) {
      setError("Error processing image");
      console.error(err);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    if (cropType === "PROFILE") {
      setProfile(null);
      setProfileUrl(null);
    } else {
      setCover(null);
      setCoverUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      setError(null);
      
      let coverPicUrl = user.coverPic;
      let profilePicUrl = user.profilePic;

      // Only upload new images if they've been changed
      if (cover) {
        coverPicUrl = await upload(cover, "COVER");
      }
      
      if (profile) {
        profilePicUrl = await upload(profile, "PROFILE");
      }

      // Update user profile
      const updateData = {
        ...texts,
        coverPic: coverPicUrl,
        profilePic: profilePicUrl,
      };

      const { data } = await makeRequest.put("/users", updateData);
      
      if (data.message === "Updated!") {
        setOpenUpdate(false);
        window.location.reload();
      }
    } catch (err) {
      console.error("Update error:", err);
      setError(err.response?.data?.message || err.message || "Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="update">
      <div className="wrapper">
        <div className="header">
          <h1>Edit Profile</h1>
          <button className="close" onClick={() => setOpenUpdate(false)}>
            <CloseIcon />
          </button>
        </div>

        {error && (
          <div className="error-message">
            <ErrorOutlineIcon />
            <span>{error}</span>
          </div>
        )}
        
        {showCropper && (cropType === "PROFILE" ? profileUrl : coverUrl) ? (
          <ImageCropper
            imageUrl={cropType === "PROFILE" ? profileUrl : coverUrl}
            aspectRatio={cropType === "PROFILE" ? PROFILE_RATIO : COVER_RATIO}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
          />
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="section-title">Profile Images</div>
            <div className="files">
              <label className="file-input">
                <div className="imgContainer">
                  {coverUrl ? (
                    <img src={coverUrl} alt="cover" className="cover-img" />
                  ) : (
                    <div className="placeholder-cover">
                      <ImageIcon />
                      <span>Cover Photo</span>
                    </div>
                  )}
                  <div className="overlay">
                    <CloudUploadIcon />
                    <span>Upload Cover</span>
                  </div>
                </div>
                <input
                  type="file"
                  style={{ display: "none" }}
                  onChange={(e) => handleImageSelect(e, "COVER")}
                  accept="image/*"
                />
              </label>

              <label className="file-input">
                <div className="imgContainer">
                  {profileUrl ? (
                    <img src={profileUrl} alt="profile" className="profile-img" />
                  ) : (
                    <div className="placeholder-profile">
                      <PersonIcon />
                      <span>Profile Photo</span>
                    </div>
                  )}
                  <div className="overlay">
                    <CloudUploadIcon />
                    <span>Upload Profile</span>
                  </div>
                </div>
                <input
                  type="file"
                  style={{ display: "none" }}
                  onChange={(e) => handleImageSelect(e, "PROFILE")}
                  accept="image/*"
                />
              </label>
            </div>

            <div className="section-title">Personal Information</div>
            <div className="form-fields">
              <div className="form-group">
                <label>
                  <PersonIcon />
                  <span>Name</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={texts.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <LocationOnIcon />
                  <span>City</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={texts.city}
                  onChange={handleChange}
                  placeholder="Enter your city"
                />
              </div>

              <div className="form-group">
                <label>
                  <LanguageIcon />
                  <span>Website</span>
                </label>
                <input
                  type="text"
                  name="website"
                  value={texts.website}
                  onChange={handleChange}
                  placeholder="Enter your website"
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={() => setOpenUpdate(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="update-btn"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Update;
