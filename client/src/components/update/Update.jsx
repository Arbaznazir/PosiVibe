import { useState, useEffect, useContext } from "react";
import { makeRequest } from "../../axios";
import "./update.scss";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import Avatar from "../avatar/Avatar";
import { AuthContext } from "../../context/authContext";
import toast from 'react-hot-toast';

const Update = ({ setOpenUpdate, user }) => {
  const { updateCurrentUser } = useContext(AuthContext);
  const [cover, setCover] = useState(null);
  const [profile, setProfile] = useState(null);
  const [texts, setTexts] = useState({
    email: user.email || "",
    password: "",
    name: user.name || "",
    city: user.city || "",
    website: user.website || "",
  });
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [previewUrls, setPreviewUrls] = useState({
    cover: null,
    profile: null
  });

  const upload = async (file) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);
      
      const res = await makeRequest.post("/upload", formData);
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
      
      console.log("Upload response:", res.data);
      
      // Handle new Cloudinary response format
      if (res.data && res.data.url) {
        console.log("Using Cloudinary URL:", res.data.url);
        return res.data.url; // Return the Cloudinary URL
      } else if (typeof res.data === 'string') {
        console.log("Using fallback format:", res.data);
        return res.data; // Fallback for old format
      }
      
      return res.data;
    } catch (err) {
      console.log(err);
      setIsUploading(false);
      setUploadProgress(0);
      throw err;
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!texts.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!texts.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(texts.email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (texts.website && !texts.website.startsWith('http')) {
      newErrors.website = "Website must start with http:// or https://";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTexts((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const queryClient = useQueryClient();

  const mutation = useMutation(
    (user) => {
      return makeRequest.put("/users", user);
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(["user"]);
        setShowSuccess(true);
        toast.success("Profile updated successfully! ✨");
        console.log("Profile update response:", data);
        
        // Update the current user in context with new data
        if (data.user) {
          updateCurrentUser({
            name: data.user.name,
            email: data.user.email,
            city: data.user.city,
            website: data.user.website,
            profilePic: data.user.profilePic,
            coverPic: data.user.coverPic
          });
        }
        
        setTimeout(() => {
          setOpenUpdate(false);
        }, 1500);
      },
      onError: (error) => {
        console.error("Profile update error:", error);
        console.error("Error response:", error.response);
        
        // Handle different types of errors
        if (error.response?.status === 400 && error.response?.data) {
          const errorData = error.response.data;
          console.error("400 error data:", errorData);
          
          if (errorData.message && (errorData.message.includes("violates community guidelines") || 
              errorData.message.includes("inappropriate content") ||
              errorData.message.includes("Profile information violates"))) {
            
            toast.error(
              `🚫 Profile Update Blocked\n\nYour profile information contains inappropriate content that violates our community guidelines. Please use appropriate language and content.`,
              {
                duration: 7000,
                style: {
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  maxWidth: '400px',
                  fontSize: '14px',
                  lineHeight: '1.4'
                },
                icon: '🚫'
              }
            );
            
            setErrors({ general: "Profile contains inappropriate content. Please review and update." });
          } else {
            // Handle other 400 errors (validation, etc.)
            const message = errorData.message || errorData.error || "Invalid data provided";
            toast.error(`❌ ${message}`);
            setErrors({ general: message });
          }
        } else if (error.response?.status === 401) {
          toast.error("❌ Session expired. Please log in again.");
          setErrors({ general: "Session expired. Please log in again." });
        } else if (error.response?.status === 403) {
          toast.error("❌ Access denied. Please log in again.");
          setErrors({ general: "Access denied. Please log in again." });
        } else {
          const message = error.response?.data?.message || error.message || "Failed to update profile";
          toast.error(`❌ ${message}`);
          setErrors({ general: message });
        }
      }
    }
  );

  const handleClick = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      let coverUrl = user.coverPic;
      let profileUrl = user.profilePic;
      
      console.log("Starting profile update...");
      console.log("Current user data:", user);
      console.log("Form data:", texts);
      
      if (cover) {
        console.log("Uploading cover image...");
        coverUrl = await upload(cover);
        console.log("Cover uploaded:", coverUrl);
      }
      if (profile) {
        console.log("Uploading profile image...");
        profileUrl = await upload(profile);
        console.log("Profile uploaded:", profileUrl);
      }

      const updatePayload = { ...texts, coverPic: coverUrl, profilePic: profileUrl };
      console.log("Sending update payload:", updatePayload);
      
      mutation.mutate(updatePayload);
    } catch (error) {
      console.error("Upload error:", error);
      setErrors({ general: "Failed to upload images. Please try again." });
    }
  };

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({ ...prev, [type]: "File size must be less than 5MB" }));
        return;
      }
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, [type]: "Please select an image file" }));
        return;
      }
      
      if (type === 'cover') {
        setCover(file);
        setPreviewUrls(prev => ({ ...prev, cover: URL.createObjectURL(file) }));
        setErrors(prev => ({ ...prev, cover: "" }));
      } else {
        setProfile(file);
        setPreviewUrls(prev => ({ ...prev, profile: URL.createObjectURL(file) }));
        setErrors(prev => ({ ...prev, profile: "" }));
      }
    }
  };

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrls.cover) URL.revokeObjectURL(previewUrls.cover);
      if (previewUrls.profile) URL.revokeObjectURL(previewUrls.profile);
  };
  }, [previewUrls]);

  return (
    <div className="update">
      <div className="wrapper">
        {showSuccess && (
          <div className="success-message">
            <CheckCircleIcon />
            <span>Profile updated successfully!</span>
          </div>
        )}
        
        <h1>Update Your Profile</h1>
        
        {errors.general && (
          <div className="error-message">
            <ErrorIcon />
            <span>{errors.general}</span>
          </div>
        )}
        
        <form>
          <div className="files">
            <label htmlFor="cover">
              <span>Cover Picture</span>
              <div className="imgContainer">
                {previewUrls.cover ? (
                  <img src={previewUrls.cover} alt="" />
                ) : user.coverPic ? (
                  <img src={user.coverPic.startsWith('http') ? user.coverPic : "/upload/" + user.coverPic} alt="" />
                ) : (
                  <div className="placeholder-cover">📷</div>
                )}
                <CloudUploadIcon className="icon" />
                {isUploading && cover && (
                  <div className="upload-progress">
                    <div className="progress-bar" style={{width: `${uploadProgress}%`}}></div>
                  </div>
                )}
              </div>
              {errors.cover && <span className="field-error">{errors.cover}</span>}
            </label>
            <input
              type="file"
              id="cover"
              style={{ display: "none" }}
              accept="image/*"
              onChange={(e) => handleImageChange(e, 'cover')}
            />
            
            <label htmlFor="profile">
              <span>Profile Picture</span>
              <div className="imgContainer">
                {previewUrls.profile ? (
                  <img src={previewUrls.profile} alt="" />
                ) : (
                  <Avatar 
                    src={user.profilePic} 
                    name={user.name} 
                    size="large" 
                    className="profile-preview"
                  />
                )}
                <CloudUploadIcon className="icon" />
                {isUploading && profile && (
                  <div className="upload-progress">
                    <div className="progress-bar" style={{width: `${uploadProgress}%`}}></div>
                  </div>
                )}
              </div>
              {errors.profile && <span className="field-error">{errors.profile}</span>}
            </label>
            <input
              type="file"
              id="profile"
              style={{ display: "none" }}
              accept="image/*"
              onChange={(e) => handleImageChange(e, 'profile')}
            />
          </div>
          
          <div className="form-group">
            <label>Email *</label>
          <input
              type="email"
            value={texts.email}
            name="email"
            onChange={handleChange}
              className={errors.email ? 'error' : ''}
              placeholder="Enter your email"
          />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
          
          <div className="form-group">
          <label>Password</label>
          <input
              type="password"
            value={texts.password}
            name="password"
            onChange={handleChange}
              placeholder="Enter new password (leave blank to keep current)"
          />
          </div>
          
          <div className="form-group">
            <label>Name *</label>
          <input
            type="text"
            value={texts.name}
            name="name"
            onChange={handleChange}
              className={errors.name ? 'error' : ''}
              placeholder="Enter your full name"
          />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>
          
          <div className="form-group">
          <label>Country / City</label>
          <input
            type="text"
            name="city"
            value={texts.city}
            onChange={handleChange}
              placeholder="e.g., New York, USA"
          />
          </div>
          
          <div className="form-group">
          <label>Website</label>
          <input
              type="url"
            name="website"
            value={texts.website}
            onChange={handleChange}
              className={errors.website ? 'error' : ''}
              placeholder="https://yourwebsite.com"
            />
            {errors.website && <span className="field-error">{errors.website}</span>}
          </div>
          
          <button 
            type="submit"
            onClick={handleClick}
            disabled={mutation.isLoading || isUploading}
            className="update-btn"
          >
            {mutation.isLoading ? "Updating..." : "Update Profile"}
          </button>
        </form>
        
        <button className="close" onClick={() => setOpenUpdate(false)}>
          ✕
        </button>
      </div>
    </div>
  );
};

export default Update;
