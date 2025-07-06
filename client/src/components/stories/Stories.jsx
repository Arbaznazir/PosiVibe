import { useContext, useState } from "react";
import "./stories.scss";
import { AuthContext } from "../../context/authContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../axios";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";
import toast from "react-hot-toast";
import Avatar from "../avatar/Avatar";

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
        toast.success("Story created successfully!");
      },
      onError: (error) => {
        console.error("Create story error:", error);
        toast.error(error.response?.data?.message || "Failed to create story");
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
        return;
      }

      setSelectedFile({ file });
    }
  };

  const handleCreateStory = async () => {
    if (storyType === "text" && !storyText.trim()) {
      toast.error("Please enter some text for your story");
      return;
    }

    if (storyType === "image" && !selectedFile) {
      toast.error("Please select an image file");
      return;
    }

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
      const storyId = currentStoryUser.stories[nextIndex]._id || currentStoryUser.stories[nextIndex].id;
      viewStoryMutation.mutate(storyId);
    } else {
      setShowStoryViewer(false);
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const handleDeleteStory = () => {
    const currentStory = currentStoryUser.stories[currentStoryIndex];
    const storyId = currentStory._id || currentStory.id; // Support both _id and id
    console.log("Deleting story:", storyId, currentStory);
    deleteStoryMutation.mutate(storyId);
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

  const renderStoryViewer = () => {
    if (!showStoryViewer || !currentStoryUser) return null;

    const currentStory = currentStoryUser.stories[currentStoryIndex];
    const isOwner = isCurrentUserStory();

    return (
      <div className="story-viewer-overlay" onClick={() => setShowStoryViewer(false)}>
        <div className="story-viewer" onClick={(e) => e.stopPropagation()}>
          <div className="story-viewer-header">
            <div className="user-info">
              <Avatar user={currentStoryUser} size={40} />
              <div className="user-details">
                <span className="username">{currentStoryUser.name}</span>
                <span className="timestamp">{formatTimeAgo(currentStory.createdAt)}</span>
              </div>
            </div>
            <div className="story-actions">
              {isOwner && (
                <button 
                  className="delete-button"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <DeleteIcon />
                </button>
              )}
              <button className="close-button" onClick={() => setShowStoryViewer(false)}>
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

            {renderStoryContent(currentStory)}

            {currentStoryIndex > 0 && (
              <button className="nav-button prev" onClick={(e) => {
                e.stopPropagation();
                prevStory();
              }}>
                ‹
              </button>
            )}
            {currentStoryIndex < currentStoryUser.stories.length - 1 && (
              <button className="nav-button next" onClick={(e) => {
                e.stopPropagation();
                nextStory();
              }}>
                ›
              </button>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Story?</h3>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="delete-btn" onClick={handleDeleteStory}>
                Delete
              </button>
            </div>
          </div>
        )}
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
      {showCreateModal && (
        <div className="story-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="story-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Story</h2>
              <CloseIcon 
                className="close-icon" 
                onClick={() => setShowCreateModal(false)}
              />
            </div>

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
                  {backgroundColors.map(color => (
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
                />
                <label htmlFor="story-file-input" className="file-upload-area">
                  {selectedFile ? (
                    <div className="file-preview">
                      <img 
                        src={URL.createObjectURL(selectedFile.file)} 
                        alt="Preview"
                      />
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <PhotoCameraIcon />
                      <p>Click to select image</p>
                    </div>
                  )}
                </label>
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
      )}

      {/* Story Viewer */}
      {renderStoryViewer()}
    </div>
  );
};

export default Stories;
