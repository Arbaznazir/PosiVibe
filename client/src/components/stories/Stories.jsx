import { useContext, useState, useEffect, useCallback, useRef } from "react";
import "./stories.scss";
import { AuthContext } from "../../context/authContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../axios";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckIcon from "@mui/icons-material/Check";
import CropIcon from "@mui/icons-material/Crop";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import toast from "react-hot-toast";
import Avatar from "../avatar/Avatar";
import Cropper from "react-easy-crop";

const Stories = () => {
  const { currentUser } = useContext(AuthContext);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [storyType, setStoryType] = useState("text");
  const [storyText, setStoryText] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#6366f1");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [currentStoryUser, setCurrentStoryUser] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [moderationError, setModerationError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [storyReaction, setStoryReaction] = useState(null);
  const fileInputRef = useRef(null);
  
  // Image cropping states
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  const queryClient = useQueryClient();

  const { isLoading, error, data } = useQuery(["stories"], () =>
    makeRequest.get("/stories").then((res) => {
      return res.data;
    })
  );

  const createStoryMutation = useMutation(
    (newStory) => {
      return makeRequest.post("/stories", newStory);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["stories"]);
        setShowCreateModal(false);
        setStoryText("");
        setSelectedFile(null);
        setStoryType("text");
        setModerationError(null);
        toast.success("Story created successfully!");
      },
      onError: (error) => {
        console.error("Create story error:", error);
        const errorResponse = error.response?.data;
        
        // Check if this is a moderation error
        if (errorResponse?.error === "Content not allowed") {
          setModerationError({
            message: errorResponse.message || "Your story contains inappropriate content. Please modify your message.",
            reason: errorResponse.reason
          });
        } else {
          toast.error(errorResponse?.message || "Failed to create story");
        }
        setUploading(false);
      },
    }
  );

  const deleteStoryMutation = useMutation(
    (storyId) => {
      return makeRequest.delete(`/stories/${storyId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["stories"]);
        setShowStoryViewer(false);
        setShowDeleteConfirm(false);
        toast.success("Story deleted successfully!");
      },
      onError: (error) => {
        console.error("Delete story error:", error);
        toast.error(error.response?.data || "Failed to delete story");
      },
    }
  );

  const viewStoryMutation = useMutation(
    (storyId) => {
      return makeRequest.put(`/stories/${storyId}/view`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["stories"]);
      },
    }
  );

  const backgroundColors = [
    "#6366f1", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6",
    "#f97316", "#06b6d4", "#84cc16", "#ec4899", "#6b7280"
  ];

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const storyDate = new Date(dateString);
    const diffInHours = Math.floor((now - storyDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Only allow images - no videos
      if (!file.type.startsWith('image/')) {
        toast.error("Only image files are allowed for stories");
        // Reset file input so user can try again
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setSelectedFile({ file });
      setShowCropper(true); // Show cropper when file is selected
      setModerationError(null); // Clear moderation errors when file changes
    }
  };
  
  // Reset file input to allow selecting the same file again
  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  // Handle crop complete event
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);
  
  // Create a blob from the cropped image
  const createCroppedImage = async () => {
    try {
      if (!selectedFile || !croppedAreaPixels) return null;
      
      const image = await createImage(URL.createObjectURL(selectedFile.file));
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions to the cropped size
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      
      // Draw the cropped image onto the canvas
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );
      
      // Convert canvas to blob
      return new Promise((resolve) => {
        canvas.toBlob(blob => {
          resolve(blob);
        }, selectedFile.file.type);
      });
    } catch (e) {
      console.error('Error creating cropped image:', e);
      return null;
    }
  };
  
  // Helper function to create an image element from a URL
  const createImage = (url) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });
  };
  
  // Apply crop and continue with story creation
  const applyCrop = async () => {
    try {
      const croppedBlob = await createCroppedImage();
      if (croppedBlob) {
        // Create a new file from the blob
        const croppedFile = new File([croppedBlob], selectedFile.file.name, {
          type: selectedFile.file.type,
          lastModified: new Date().getTime()
        });
        
        setSelectedFile({ file: croppedFile, preview: URL.createObjectURL(croppedBlob) });
      }
      setShowCropper(false);
    } catch (error) {
      console.error('Error applying crop:', error);
      toast.error('Failed to crop image');
    }
  };
  
  // Clear moderation error when text changes
  useEffect(() => {
    if (moderationError) {
      setModerationError(null);
    }
  }, [storyText]);

  const handleCreateStory = async () => {
    if (storyType === "text" && !storyText.trim()) {
      toast.error("Please enter some text for your story");
      return;
    }

    if (storyType === "image" && !selectedFile) {
      toast.error("Please select an image file");
      return;
    }
    
    // If cropper is showing, apply crop first
    if (showCropper) {
      await applyCrop();
      return;
    }
    
    // Clear any previous moderation errors
    setModerationError(null);
    setUploading(true);

    try {
      let mediaFilename = null;

      // Upload file if it's an image
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile.file);

        const uploadRes = await makeRequest.post("/upload", formData);
        mediaFilename = uploadRes.data;
      }

      // Create story
      const storyData = {
        type: storyType,
      };

      if (storyType === "text") {
        storyData.text = storyText.trim();
        storyData.backgroundColor = backgroundColor;
      } else {
        storyData.media = mediaFilename;
      }

      createStoryMutation.mutate(storyData);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const openStoryViewer = (userStories, startIndex = 0) => {
    setCurrentStoryUser(userStories);
    setCurrentStoryIndex(startIndex);
    setShowStoryViewer(true);
    setIsPaused(false);
    setStoryReaction(null);
    
    // Mark first story as viewed
    if (userStories.stories[startIndex]) {
      const storyId = userStories.stories[startIndex]._id || userStories.stories[startIndex].id;
      viewStoryMutation.mutate(storyId);
    }
  };

  const nextStory = () => {
    if (currentStoryIndex < currentStoryUser.stories.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(nextIndex);
      setStoryReaction(null);
      const storyId = currentStoryUser.stories[nextIndex]._id || currentStoryUser.stories[nextIndex].id;
      viewStoryMutation.mutate(storyId);
    } else {
      // Try to find next user with stories
      const currentUserIndex = data.findIndex(user => 
        user.userId === currentStoryUser.userId);
      
      if (currentUserIndex < data.length - 1) {
        // Move to next user's stories
        openStoryViewer(data[currentUserIndex + 1], 0);
      } else {
        // No more stories, close viewer
        setShowStoryViewer(false);
      }
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setStoryReaction(null);
    } else {
      // Try to find previous user with stories
      const currentUserIndex = data.findIndex(user => 
        user.userId === currentStoryUser.userId);
      
      if (currentUserIndex > 0) {
        // Move to previous user's last story
        const prevUser = data[currentUserIndex - 1];
        openStoryViewer(prevUser, prevUser.stories.length - 1);
      }
    }
  };

  const handleDeleteStory = () => {
    const currentStory = currentStoryUser.stories[currentStoryIndex];
    const storyId = currentStory._id || currentStory.id; // Support both _id and id
    console.log("Deleting story:", storyId, currentStory);
    
    // Show loading toast
    const loadingToast = toast.loading("Deleting story...");
    
    // Call the delete mutation
    deleteStoryMutation.mutate(storyId, {
      onSuccess: () => {
        toast.dismiss(loadingToast);
        toast.success("Story deleted successfully!");
        setShowStoryViewer(false);
      },
      onError: (error) => {
        toast.dismiss(loadingToast);
        console.error("Delete story error:", error);
        toast.error(error.response?.data?.message || "Failed to delete story");
      }
    });
  };

  const isCurrentUserStory = () => {
    // Support both _id and id for user comparison
    const currentUserId = currentUser._id || currentUser.id;
    const storyUserId = currentStoryUser?.userId;
    console.log("Checking story ownership:", { currentUserId, storyUserId, isOwner: storyUserId === currentUserId });
    return currentStoryUser && storyUserId === currentUserId;
  };

  const renderStoryContent = (story) => {
    if (story.type === "text") {
      return (
        <div 
          className="story-text" 
          style={{ backgroundColor: story.backgroundColor }}
        >
          <p>{story.text}</p>
        </div>
      );
    } else if (story.type === "image") {
      // Handle both Cloudinary URLs and local paths
      const imageSrc = story.media.startsWith('http') ? story.media : "/upload/" + story.media;
      return (
        <img 
          src={imageSrc} 
          alt="Story"
          className="story-media"
        />
      );
    }
    // Return null for unsupported story types
    return null;
  };

  // Auto-progress through stories
  useEffect(() => {
    let storyTimer;
    
    if (showStoryViewer && !isPaused && currentStoryUser) {
      // Set timer for auto-progression (5 seconds)
      storyTimer = setTimeout(() => {
        nextStory();
      }, 5000);
    }
    
    return () => {
      if (storyTimer) clearTimeout(storyTimer);
    };
  }, [showStoryViewer, currentStoryIndex, isPaused, currentStoryUser]);

  // Handle story reactions
  const handleReaction = (reaction) => {
    setStoryReaction(reaction);
    setShowReactions(false);
    // Here you could add API call to save reaction to backend
    toast.success(`You reacted with ${reaction}`);
  };

  // Toggle pause state when clicking on story content
  const togglePause = (e) => {
    e.stopPropagation();
    setIsPaused(!isPaused);
  };

  const renderStoryViewer = () => {
    if (!showStoryViewer || !currentStoryUser) return null;

    const currentStory = currentStoryUser.stories[currentStoryIndex];
    const isOwner = isCurrentUserStory();

    return (
      <div className="story-viewer-overlay" onClick={() => setShowStoryViewer(false)}>
        <div className="story-viewer" onClick={(e) => e.stopPropagation()}>
          <div className="story-viewer-header">
            <div className="user-info">
              <div className="avatar-container">
                {currentStoryUser.profilePic ? (
                  <img 
                    src={currentStoryUser.profilePic} 
                    alt={currentStoryUser.name} 
                    className="user-avatar"
                  />
                ) : (
                  <div className="default-avatar">
                    {currentStoryUser.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className="user-details">
                <span className="username">{currentStoryUser.name}</span>
                <span className="timestamp">{formatTimeAgo(currentStory.createdAt)}</span>
              </div>
            </div>
            <div className="story-actions">
              {!isOwner && (
                <button 
                  className="reaction-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReactions(!showReactions);
                    setIsPaused(true);
                  }}
                >
                  {storyReaction || '❤️'}
                </button>
              )}
              {isOwner && (
                <button 
                  className="delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                    setIsPaused(true);
                  }}
                >
                  <DeleteIcon />
                </button>
              )}
              <button 
                className="close-button" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStoryViewer(false);
                }}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          <div className="story-content">
            <div className="story-progress">
              {currentStoryUser.stories.map((_, index) => (
                <div 
                  key={index} 
                  className={`progress-bar ${index === currentStoryIndex ? 'active' : ''} ${index < currentStoryIndex ? 'completed' : ''}`}
                />
              ))}
            </div>

            <div className="story-content-wrapper" onClick={togglePause}>
              {renderStoryContent(currentStory)}
              
              {isPaused && (
                <div className="pause-indicator">
                  <span>▶️</span>
                </div>
              )}
              
              {storyReaction && (
                <div className="reaction-display">
                  <span className="reaction-emoji">{storyReaction}</span>
                </div>
              )}
            </div>

            {/* Touch areas for navigation */}
            <div 
              className="touch-area left" 
              onClick={(e) => {
                e.stopPropagation();
                prevStory();
              }}
            />
            <div 
              className="touch-area right" 
              onClick={(e) => {
                e.stopPropagation();
                nextStory();
              }}
            />

            {/* Visible buttons for navigation */}
            <button 
              className="nav-button prev" 
              onClick={(e) => {
                e.stopPropagation();
                prevStory();
              }}
            >
              &lt;
            </button>
            <button 
              className="nav-button next" 
              onClick={(e) => {
                e.stopPropagation();
                nextStory();
              }}
            >
              &gt;
            </button>
            
            {/* Reactions panel */}
            {showReactions && (
              <div className="reactions-panel" onClick={(e) => e.stopPropagation()}>
                {['❤️', '👍', '😂', '😮', '😢', '🔥'].map(emoji => (
                  <button 
                    key={emoji} 
                    className="reaction-emoji-btn" 
                    onClick={() => handleReaction(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="delete-confirm-modal-overlay" onClick={() => {
            setShowDeleteConfirm(false);
            setIsPaused(false);
          }}>
            <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Delete Story?</h3>
              <p>This action cannot be undone.</p>
              <div className="modal-actions">
                <button 
                  className="cancel-btn" 
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setIsPaused(false);
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="delete-btn" 
                  onClick={() => {
                    handleDeleteStory();
                    setShowDeleteConfirm(false);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render the create story modal
  const renderCreateStoryModal = () => {
    return (
      <div className="story-modal-overlay" onClick={() => setShowCreateModal(false)}>
        <div className="story-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Create Story</h2>
            <div className="close-icon" onClick={() => setShowCreateModal(false)}>
              <CloseIcon />
            </div>
          </div>
          
          {moderationError && (
            <div className="moderation-error">
              <ErrorOutlineIcon />
              {moderationError.message}
            </div>
          )}
          
          <div className="story-type-selector">
            <button 
              className={storyType === "text" ? "active" : ""}
              onClick={() => setStoryType("text")}
            >
              <TextFieldsIcon />
              Text
            </button>
            <button 
              className={storyType === "image" ? "active" : ""}
              onClick={() => setStoryType("image")}
            >
              <PhotoCameraIcon />
              Image
            </button>
          </div>

          {storyType === "text" && (
            <div className="text-story-creator">
              <div className="color-selector">
                {backgroundColors.map((color) => (
                  <div 
                    key={color}
                    className={`color-option ${backgroundColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setBackgroundColor(color)}
                  />
                ))}
              </div>
              <div 
                className="text-preview"
                style={{ backgroundColor }}
              >
                <textarea
                  placeholder="Share your thoughts..."
                  value={storyText}
                  onChange={(e) => setStoryText(e.target.value)}
                  maxLength={500}
                />
              </div>
              <div className="char-count">
                {storyText.length}/500
              </div>
            </div>
          )}

          {storyType === "image" && (
            <div className="media-story-creator">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
                id="story-file-input"
                ref={fileInputRef}
              />
              
              {showCropper && selectedFile ? (
                <div className="cropper-container">
                  <div className="cropper-wrapper">
                    <Cropper
                      image={URL.createObjectURL(selectedFile.file)}
                      crop={crop}
                      zoom={zoom}
                      aspect={9 / 16} /* Keep 9/16 aspect ratio for final output */
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                    />
                  </div>
                  
                  <div className="cropper-controls">
                    <div className="zoom-controls">
                      <button 
                        className="zoom-btn"
                        onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                        disabled={zoom <= 1}
                      >
                        <ZoomOutIcon />
                      </button>
                      <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="zoom-slider"
                      />
                      <button 
                        className="zoom-btn"
                        onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                        disabled={zoom >= 3}
                      >
                        <ZoomInIcon />
                      </button>
                    </div>
                    
                    <div className="crop-actions">
                      <button 
                        className="cancel-crop-btn"
                        onClick={() => {
                          setShowCropper(false);
                          setZoom(1);
                          setCrop({ x: 0, y: 0 });
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        className="apply-crop-btn"
                        onClick={applyCrop}
                      >
                        <CheckIcon />
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label htmlFor="story-file-input" className="file-upload-area">
                  {selectedFile ? (
                    <div className="file-preview">
                      <img 
                        src={selectedFile.preview || URL.createObjectURL(selectedFile.file)} 
                        alt="Preview"
                      />
                      <button 
                        className="edit-crop-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowCropper(true);
                        }}
                      >
                        <CropIcon />
                        Edit
                      </button>
                      <button 
                        className="change-image-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedFile(null);
                          resetFileInput();
                          // Trigger file input click after a short delay
                          setTimeout(() => {
                            fileInputRef.current?.click();
                          }, 100);
                        }}
                      >
                        <PhotoCameraIcon />
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <PhotoCameraIcon />
                      <p>Click to select image</p>
                    </div>
                  )}
                </label>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button 
              className="cancel-btn"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </button>
            <button 
              className="create-btn"
              onClick={handleCreateStory}
              disabled={uploading}
            >
              {uploading ? "Creating..." : "Create Story"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="stories">
      {/* Add Story Card */}
      <div className="story add-story" onClick={() => setShowCreateModal(true)}>
        <div className="add-icon">
          <AddIcon />
        </div>
        <div className="add-text">
          Create Story
        </div>
      </div>

      {/* Story Cards */}
      {error ? (
        <div className="story error-story">
          Something went wrong
        </div>
      ) : isLoading ? (
        Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="story loading-story">
            <div className="story-overlay">
              <div className="story-header">
                <div className="user-avatar loading"></div>
                <div className="user-name loading"></div>
              </div>
            </div>
          </div>
        ))
      ) : (
        data?.map((userStories) => (
          <div
            className={`story ${userStories.stories.some(s => !s.views?.includes(currentUser.id)) ? 'unseen' : 'seen'}`}
            key={userStories.userId}
            onClick={() => openStoryViewer(userStories)}
          >
            {renderStoryContent(userStories.stories[0])}
            <div className="story-overlay">
              <div className="story-header">
                <Avatar 
                  user={{
                    name: userStories.name,
                    profilePic: userStories.profilePic
                  }}
                  size="small"
                />
                <div className="story-status"></div>
              </div>
              <div className="story-footer">
                <div className="user-name">{userStories.name}</div>
                <div className="story-time">
                  {formatTimeAgo(userStories.stories[0].createdAt)}
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Story Creation Modal */}
      {showCreateModal && renderCreateStoryModal()}


      {/* Story Viewer */}
      {renderStoryViewer()}
    </div>
  );
};

export default Stories;
