import "./comments.scss";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/authContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../axios";
import moment from "moment";
import toast from "react-hot-toast";
import Avatar from "../avatar/Avatar";
import SendIcon from "@mui/icons-material/Send";

/**
 * Comments Component
 * 
 * This component displays a comments section for a post, including:
 * - A dark bottom sheet with a grab handle
 * - Header with "Comments" title
 * - List of comments with avatars, usernames, timestamps, and likes
 * - Reply and translation links for each comment
 * - View more replies link
 * - Bottom emoji row and input field for adding new comments
 */

const Comments = ({ postId }) => {
  const [desc, setDesc] = useState("");
  const { currentUser } = useContext(AuthContext);

  const { isLoading, error, data } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () =>
    makeRequest.get("/comments?postId=" + postId).then((res) => {
      return res.data;
      }),
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newComment) => {
      return makeRequest.post("/comments", newComment);
    },
      onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      toast.success("Comment posted successfully!");
      },
      onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to post comment");
        }
  });

  const handleClick = (e) => {
    e.preventDefault();
    if (desc.trim()) {
    mutation.mutate({ desc: desc.trim(), postId });
    setDesc("");
    }
  };

  return (
    <div className="comments-section">
      <div className="comments-container">
        {error ? (
          <div className="error">Something went wrong!</div>
        ) : isLoading ? (
          <div className="loading">Loading comments...</div>
        ) : (
          data?.map((comment) => (
            <div className="comment" key={comment.id}>
              <div className="avatar">
                <Avatar 
                  user={{
                    profilePic: comment.profilePic,
                    name: comment.name,
                    verificationBadge: comment.verificationBadge
                  }}
                  size="small"
                />
              </div>
              
              <div className="body">
                <div className="meta">
                  <div className="name">{comment.name}</div>
                  <div className="time">{moment(comment.createdAt).fromNow()}</div>
                  {comment.likes > 0 && (
                    <div className="likes">
                      <div className="heart">❤</div>
                      <div className="count">{comment.likes}</div>
                    </div>
                  )}
                </div>
                
                <div className="text">{comment.desc}</div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Comment input area */}
      <div className="comments-composer">
        <div className="comments-emoji-row">
          <div className="emoji-item" onClick={() => { mutation.mutate({ desc: "💗", postId }); }}>💗</div>
          <div className="emoji-item" onClick={() => { mutation.mutate({ desc: "🙌", postId }); }}>🙌</div>
          <div className="emoji-item" onClick={() => { mutation.mutate({ desc: "🔥", postId }); }}>🔥</div>
          <div className="emoji-item" onClick={() => { mutation.mutate({ desc: "👏", postId }); }}>👏</div>
          <div className="emoji-item" onClick={() => { mutation.mutate({ desc: "😢", postId }); }}>😢</div>
          <div className="emoji-item" onClick={() => { mutation.mutate({ desc: "😍", postId }); }}>😍</div>
          <div className="emoji-item" onClick={() => { mutation.mutate({ desc: "😮", postId }); }}>😮</div>
          <div className="emoji-item" onClick={() => { mutation.mutate({ desc: "😂", postId }); }}>😂</div>
        </div>
        
        <div className="comments-input-wrap">
          <div className="comments-user-avatar">
            <Avatar 
              user={currentUser}
              size="small"
            />
          </div>
          <input 
            className="comments-input" 
            placeholder="What do you think of this?"
            aria-label="Add a comment"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleClick(e)}
          />
          <button 
            className="comments-send-btn" 
            aria-label="Send comment"
            onClick={handleClick}
            disabled={!desc.trim() || mutation.isLoading}
          >
            <SendIcon fontSize="small" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Comments;
