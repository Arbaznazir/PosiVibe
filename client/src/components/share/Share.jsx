import { useState, useRef } from "react";
import "./share.scss";
import Image from "../../assets/img.png";
import { useContext } from "react";
import { AuthContext } from "../../context/authContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../axios";
import ImageCropper from "../imageCropper/ImageCropper";
import { IMAGE_TYPES } from "../../utils/imageProcessing";
import CloseIcon from '@mui/icons-material/Close';

const Share = () => {
  const { currentUser } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [desc, setDesc] = useState("");
  const [showCropper, setShowCropper] = useState(false);
  const [imageType, setImageType] = useState("POST_SQUARE"); // Default to square post
  const fileInputRef = useRef(null);

  const queryClient = useQueryClient();

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setShowCropper(true); // Show cropper when file is selected
      setImageType("POST_SQUARE");
    }
    // Reset file input
    e.target.value = '';
  };

  const handleCropComplete = (croppedImage) => {
    setFile(croppedImage);
    setShowCropper(false);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setFile(null);
  };

  const handleRemoveImage = () => {
    setFile(null);
    setShowCropper(false);
  };

  // Upload mutation for regular posts
  const postMutation = useMutation(
    (newPost) => {
      const formData = new FormData();
      
      if (file) {
        formData.append("image", file);
        const transform = IMAGE_TYPES[imageType].cloudinaryTransform || IMAGE_TYPES[imageType];
        Object.entries(transform).forEach(([key, value]) => {
          formData.append(`transform_${key}`, value);
        });
      }
      
      if (desc) {
        formData.append("desc", desc);
      }

      return makeRequest.post("/posts", formData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["posts"]);
        setDesc("");
        setFile(null);
        setShowCropper(false);
      },
    }
  );

  const handleShare = async () => {
    if (!file && !desc) return;
    try {
      await postMutation.mutateAsync();
    } catch (err) {
      console.error("Error creating post:", err);
    }
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
            {file && !showCropper && (
              <div className="preview-container">
                <img className="file" alt="" src={URL.createObjectURL(file)} />
                <button className="remove-image" onClick={handleRemoveImage}>
                  <CloseIcon />
                </button>
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
              accept="image/*"
              onChange={handleImageChange}
              ref={fileInputRef}
            />
            <label htmlFor="file">
              <div className="item">
                <img src={Image} alt="" />
                <span>Add Image</span>
              </div>
            </label>
          </div>
          <div className="right">
            <button onClick={handleShare} disabled={!file && !desc}>Share</button>
          </div>
        </div>
      </div>

      {showCropper && file && (
        <ImageCropper
          imageUrl={URL.createObjectURL(file)}
          aspectRatio={IMAGE_TYPES[imageType].aspectRatio}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
};

export default Share;
