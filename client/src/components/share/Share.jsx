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
import toast from 'react-hot-toast';

const Share = () => {
  const { currentUser } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [desc, setDesc] = useState("");
  const [showCropper, setShowCropper] = useState(false);
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
        if (response.data.trustScore !== undefined) {
          // Show trust score feedback
          const score = response.data.trustScore;
          let message = `Post created. Your trust score: ${score}`;
          if (score < 50) {
            message += ". Please be mindful of our community guidelines.";
          }
          toast.success(message);
        } else {
          toast.success("Post created successfully!");
        }
        
        setDesc("");
        setFile(null);
        queryClient.invalidateQueries(["posts"]);
      },
      onError: (error) => {
        const message = error?.response?.data?.message || "Error creating post";
        toast.error(message);
        if (error?.response?.data?.trustScore !== undefined) {
          toast.error(`Trust score reduced to: ${error.response.data.trustScore}`);
        }
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
    </div>
  );
};

export default Share;
