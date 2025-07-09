import "./comments.scss";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/authContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../axios";
import moment from "moment";
import { 
  Send as SendIcon,
} from "@mui/icons-material";
import toast from 'react-hot-toast';
import Avatar from "../avatar/Avatar";
import VerificationBadge from "../verificationBadge/VerificationBadge";

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
    <div className="comments">
      <div className="write">
        <Avatar 
          src={currentUser.profilePic} 
          alt={currentUser.name}
          size="small"
        />
        <div className="comment-input-container">
            <input
              type="text"
              placeholder="Write a comment..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleClick(e)}
            />
            <button 
              onClick={handleClick} 
              disabled={!desc.trim() || mutation.isLoading}
              className="send-btn"
            >
              <SendIcon />
            </button>
        </div>
      </div>

        {error ? (
        <div className="error">Something went wrong!</div>
        ) : isLoading ? (
        <div className="loading">Loading comments...</div>
        ) : (
          data?.map((comment) => (
            <div className="comment" key={comment.id}>
              <Avatar 
                src={comment.profilePic} 
              alt={comment.name}
              size="small"
              />
              <div className="info">
                <div className="comment-header">
                  <div className="name-container">
                  <span className="name">{comment.name}</span>
                    {comment.verificationBadge && (
                      <VerificationBadge badge={comment.verificationBadge} size="small" />
                    )}
                  </div>
                  <span className="date">{moment(comment.createdAt).fromNow()}</span>
                </div>
                <p className="comment-text">{comment.desc}</p>
              </div>
            </div>
          ))
        )}
    </div>
  );
};

export default Comments;
