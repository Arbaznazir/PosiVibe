import "./share.scss";
import Image from "../../assets/img.png";
import Map from "../../assets/map.png";
import Friend from "../../assets/friend.png";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/authContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../axios";
import toast from 'react-hot-toast';
import Avatar from "../avatar/Avatar";

const Share = () => {
  const [file, setFile] = useState(null);
  const [desc, setDesc] = useState("");
  const [charCount, setCharCount] = useState(0);
  const maxChars = 500;

  const { currentUser } = useContext(AuthContext);

  const queryClient = useQueryClient();

  const mutation = useMutation(
    (newPost) => {
      return makeRequest.post("/posts", newPost);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["posts"]);
        setDesc("");
        setFile(null);
        setCharCount(0);
        toast.success("Post shared successfully! 🎉");
      },
      onError: (error) => {
        console.error("Error creating post:", error);
        
        // Handle content filter violations
        if (error.response?.status === 400 && error.response?.data?.message) {
          const errorData = error.response.data;
          
          if (errorData.message.includes("violates community guidelines") || 
              errorData.message.includes("inappropriate content")) {
            
            toast.error(
              `🚫 Content Not Allowed\n\nYour post contains inappropriate content that violates our community guidelines. Please review your content and try again with appropriate material.`,
              {
                duration: 6000,
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
            
            // Show additional guidance
            setTimeout(() => {
              toast(
                `💡 Community Guidelines:\n\n• No profanity or offensive language\n• No adult or inappropriate content\n• Keep content positive and respectful\n• No hate speech or discrimination`,
                {
                  duration: 8000,
                  style: {
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1d4ed8',
                    maxWidth: '400px',
                    fontSize: '13px',
                    lineHeight: '1.4'
                  },
                  icon: '💡'
                }
              );
            }, 1000);
            
          } else {
            toast.error(errorData.message);
          }
        } else {
          toast.error("Failed to create post. Please try again.");
        }
      }
    }
  );

  const upload = async () => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await makeRequest.post("/upload", formData);
      
      // Handle new Cloudinary response format
      if (res.data && res.data.url) {
        return res.data.url; // Return the Cloudinary URL
      } else if (typeof res.data === 'string') {
        return res.data; // Fallback for old format
      }
      
      return res.data;
    } catch (err) {
      console.error("Upload error:", err);
      
      // Handle image content filter violations
      if (err.response?.status === 400 && err.response?.data?.message) {
        const errorData = err.response.data;
        
        if (errorData.message.includes("inappropriate content") || 
            errorData.message.includes("cannot be uploaded")) {
          
          toast.error(
            `🚫 Image Not Allowed\n\nThe image you uploaded contains inappropriate content and cannot be shared. Please select a different image.`,
            {
              duration: 6000,
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
          
          // Remove the blocked file
          setFile(null);
          return null;
        }
      }
      
      toast.error("Failed to upload image. Please try again.");
      return null;
    }
  };

  const handleClick = async (e) => {
    e.preventDefault();
    
    if (!desc.trim() && !file) return;

    let imgUrl = "";
    if (file) {
      imgUrl = await upload();
    }

    mutation.mutate({ desc: desc.trim(), img: imgUrl });
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxChars) {
      setDesc(value);
      setCharCount(value.length);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const removeFile = () => {
    setFile(null);
  };

  return (
    <div className="share">
      <div className="container">
        <div className="top">
          <Avatar 
            src={currentUser?.profilePic} 
            name={currentUser?.name} 
            size="large" 
            className="avatar"
            showOnline={true}
          />

          <div className="input-section">
            <div className="input-wrapper">
              <textarea
                placeholder={`What's on your mind, ${currentUser?.name || 'there'}?`}
                value={desc}
                onChange={handleInputChange}
              />
              <div className={`char-counter ${charCount > maxChars * 0.8 ? 'warning' : ''} ${charCount >= maxChars ? 'error' : ''}`}>
                {charCount}/{maxChars}
              </div>
            </div>

            {file && (
              <div className="media-preview has-file">
                <img src={URL.createObjectURL(file)} alt="Preview" />
                <button className="remove-media" onClick={removeFile}>
                  ✕
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
              accept="image/*,video/*"
              onChange={handleFileChange}
            />
            <label htmlFor="file" className="item">
              <img src={Image} alt="" />
              <span>Add Image</span>
            </label>
            <div className="item">
              <img src={Map} alt="" />
              <span>Add Place</span>
            </div>
            <div className="item">
              <img src={Friend} alt="" />
              <span>Tag Friends</span>
            </div>
          </div>
          <div className="right">
            <button 
              onClick={handleClick}
              disabled={!desc.trim() || mutation.isLoading}
              className="share-btn"
            >
              {mutation.isLoading ? "Sharing..." : "Share"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Share;
