import { useState, useRef } from "react";
import "./share.scss";
import Image from "../../assets/img.png";
import { useContext } from "react";
import { AuthContext } from "../../context/authContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../axios";
import ImageCropper from "../imageCropper/ImageCropper";
import ContentModerationPopup from "../contentModerationPopup/ContentModerationPopup";
import { IMAGE_TYPES } from "../../utils/imageProcessing";
import CloseIcon from '@mui/icons-material/Close';
import toast from 'react-hot-toast';

const Share = () => {
  const { currentUser } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [desc, setDesc] = useState("");
  const [showCropper, setShowCropper] = useState(false);
  const [moderationPopup, setModerationPopup] = useState({
    isOpen: false,
    title: "",
    message: "",
    details: "",
    suggestions: [],
    severity: "medium"
  });
  const fileRef = useRef();

  const queryClient = useQueryClient();

  const postMutation = useMutation(
    (newPost) => {
      const formData = new FormData();
      
      if (file) {
        formData.append("image", file);
        const transform = IMAGE_TYPES["POST_SQUARE"];
        if (transform) {
          Object.entries(transform).forEach(([key, value]) => {
            formData.append(key, value);
          });
        }
      }
      formData.append("desc", desc);
      
      return makeRequest.post("/posts", formData);
    },
    {
      onSuccess: (response) => {
        // Always show simple success message, no trust score
          toast.success("Post created successfully!");
        
        setDesc("");
        setFile(null);
        queryClient.invalidateQueries(["posts"]);
      },
      onError: (error) => {
        const responseData = error?.response?.data;
        
        // Check if this is a content moderation popup
        if (responseData?.showPopup && responseData?.popupType === "content_moderation") {
          setModerationPopup({
            isOpen: true,
            title: responseData.title || "Content Guidelines Notice",
            message: responseData.message || "Your content doesn't meet our community guidelines.",
            details: responseData.details,
            suggestions: responseData.suggestions || [],
            severity: responseData.severity || "medium"
          });
          return;
        }
        
        // Handle other errors normally
        const message = responseData?.message || "Error creating post";
        toast.error(message);
        // Remove trust score display from error messages
      },
    }
  );

  const handlePost = async (e) => {
    e.preventDefault();
    if (!desc && !file) {
      toast.error("Please add some content to your post");
      return;
    }
    try {
      await postMutation.mutateAsync();
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setShowCropper(true);
    }
  };

  const onCropComplete = (croppedImg) => {
    setFile(croppedImg);
    setShowCropper(false);
  };

  const handleCloseCropper = () => {
    setShowCropper(false);
    setFile(null);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const handleCloseModerationPopup = () => {
    setModerationPopup(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="share">
      <div className="container">
        <div className="top">
          <div className="left">
            <img src={currentUser.profilePic} alt="" />
            <input
              type="text"
              placeholder={`What's on your mind ${currentUser.name}?`}
              onChange={(e) => setDesc(e.target.value)}
              value={desc}
            />
          </div>
          <div className="right">
            {file && (
              <div className="file">
                <img className="file" alt="" src={URL.createObjectURL(file)} />
                <CloseIcon className="close" onClick={() => setFile(null)} />
              </div>
            )}
          </div>
        </div>
        <hr />
        <div className="bottom">
          <div className="left">
            <input
              type="file"
              id="file"
              style={{ display: "none" }}
              ref={fileRef}
              onChange={handleFileChange}
              accept="image/*"
            />
            <label htmlFor="file">
              <div className="item">
                <img src={Image} alt="" />
                <span>Add Image</span>
              </div>
            </label>
          </div>
          <div className="right">
            <button onClick={handlePost}>Share</button>
          </div>
        </div>
      </div>
      
      {showCropper && file && (
        <ImageCropper
          imageUrl={URL.createObjectURL(file)}
          aspectRatio={1}
          onCropComplete={onCropComplete}
          onCancel={handleCloseCropper}
        />
      )}

      <ContentModerationPopup
        isOpen={moderationPopup.isOpen}
        onClose={handleCloseModerationPopup}
        title={moderationPopup.title}
        message={moderationPopup.message}
        details={moderationPopup.details}
        suggestions={moderationPopup.suggestions}
        severity={moderationPopup.severity}
        canRetry={true}
      />
    </div>
  );
};

export default Share;
