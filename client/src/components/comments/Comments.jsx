import { useContext, useState } from "react";
import "./comments.scss";
import { AuthContext } from "../../context/authContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../axios";
import { 
  SendOutlined as SendIcon, 
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Reply as ReplyIcon,
  Verified as VerifiedIcon
} from "@mui/icons-material";
import toast from 'react-hot-toast';

const Comments = ({ postId }) => {
  const [desc, setDesc] = useState("");
  const [charCount, setCharCount] = useState(0);
  const maxChars = 500;
  const { currentUser } = useContext(AuthContext);

  const { isLoading, error, data } = useQuery(["comments", postId], () =>
    makeRequest.get("/comments?postId=" + postId).then((res) => {
      return res.data;
    })
  );

  const queryClient = useQueryClient();

  const mutation = useMutation(
    (newComment) => {
      return makeRequest.post("/comments", newComment);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["comments"]);
        toast.success("Comment posted! 💬");
      },
      onError: (error) => {
        console.error("Error posting comment:", error);
        
        // Handle content filter violations
        if (error.response?.status === 400 && error.response?.data?.message) {
          const errorData = error.response.data;
          
          if (errorData.message.includes("violates community guidelines") || 
              errorData.message.includes("inappropriate content")) {
            
            toast.error(
              `🚫 Comment Not Allowed\n\nYour comment contains inappropriate content that violates our community guidelines. Please keep comments respectful and appropriate.`,
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
            
            // Show additional guidance for comments
            setTimeout(() => {
              toast(
                `💡 Comment Guidelines:\n\n• Use respectful language\n• Stay on topic\n• No offensive or inappropriate content\n• Be constructive and positive`,
                {
                  duration: 6000,
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
          toast.error("Failed to post comment. Please try again.");
        }
      }
    }
  );

  const handleClick = async (e) => {
    e.preventDefault();
    if (!desc.trim()) return;
    
    mutation.mutate({ desc: desc.trim(), postId });
    setDesc("");
    setCharCount(0);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxChars) {
      setDesc(value);
      setCharCount(value.length);
    }
  };

  const handleEmojiClick = (emoji) => {
    if (desc.length + emoji.length <= maxChars) {
      setDesc(prev => prev + emoji);
      setCharCount(prev => prev + emoji.length);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const commentDate = new Date(dateString);
    const diffInMinutes = Math.floor((now - commentDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="comments">
      <div className="write">
        <div className="avatar">
          {currentUser?.profilePic ? (
            <img src={"/upload/" + currentUser.profilePic} alt="Profile" />
          ) : (
            <div style={{
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              background: 'var(--primary-gradient)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '16px',
              color: 'white',
              fontWeight: '600'
            }}>
              {currentUser?.name?.charAt(0)?.toUpperCase() || '👤'}
            </div>
          )}
          <div className="status-dot"></div>
        </div>

        <div className="input-section">
          <div className="input-wrapper">
        <input
          type="text"
              placeholder="Write a thoughtful comment..."
          value={desc}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && handleClick(e)}
            />
            <div className="char-count">
              {charCount}/{maxChars}
            </div>
          </div>

          <div className="actions">
            <div className="emoji-picker">
              {['😊', '👍', '❤️', '😂', '😮', '😢'].map((emoji, index) => (
                <div 
                  key={index}
                  className="emoji" 
                  onClick={() => handleEmojiClick(emoji)}
                  title={`Add ${emoji}`}
                >
                  {emoji}
                </div>
              ))}
            </div>

            <button 
              className="submit-btn"
              onClick={handleClick}
              disabled={!desc.trim() || mutation.isLoading}
            >
              <SendIcon style={{ fontSize: '14px' }} />
              {mutation.isLoading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>

      <div className="comments-list">
        {error ? (
          <div className="empty-state">
            <ChatBubbleOutlineIcon className="icon" />
            <div className="title">Something went wrong</div>
            <div className="subtitle">Unable to load comments. Please try again.</div>
          </div>
        ) : isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="comment" style={{
              background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 50%, #f0f0f0 50%, #f0f0f0 75%, transparent 75%, transparent)',
              backgroundSize: '20px 20px',
              animation: 'shimmer 1.5s infinite linear',
              minHeight: '80px'
            }}>
              <div className="avatar">
                <div style={{ width: '36px', height: '36px', background: '#ddd', borderRadius: '50%' }}></div>
              </div>
              <div className="content">
                <div className="header">
                  <div style={{ width: '80px', height: '14px', background: '#ddd', borderRadius: '4px' }}></div>
                </div>
                <div style={{ width: '100%', height: '12px', background: '#ddd', borderRadius: '4px', marginTop: '8px' }}></div>
                <div style={{ width: '60%', height: '12px', background: '#ddd', borderRadius: '4px', marginTop: '4px' }}></div>
              </div>
            </div>
          ))
        ) : data?.length === 0 ? (
          <div className="empty-state">
            <ChatBubbleOutlineIcon className="icon" />
            <div className="title">No comments yet</div>
            <div className="subtitle">Be the first to share your thoughts!</div>
          </div>
        ) : (
          data?.map((comment) => (
            <div className="comment" key={comment.id}>
              <div className="avatar">
                {comment.profilePic ? (
                  <img src={"/upload/" + comment.profilePic} alt="Profile" />
                ) : (
                  <div style={{
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    background: 'var(--secondary-gradient)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '14px',
                    color: 'white',
                    fontWeight: '600'
                  }}>
                    {comment.name?.charAt(0)?.toUpperCase() || '👤'}
                  </div>
                )}
              </div>

              <div className="content">
                <div className="header">
                  <span className="name">{comment.name || 'Anonymous'}</span>
                  <span className="timestamp">{formatTimeAgo(comment.createdAt)}</span>
                  {comment.verified && (
                    <VerifiedIcon className="verified" />
                  )}
                </div>

                <div className="text">{comment.desc}</div>

                <div className="actions">
                  <button className="action-btn">
                    <FavoriteBorderIcon className="icon" />
                    <span>Like</span>
                  </button>
                  <button className="action-btn">
                    <ReplyIcon className="icon" />
                    <span>Reply</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
