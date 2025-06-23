import "./post.scss";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";
import TextsmsOutlinedIcon from "@mui/icons-material/TextsmsOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { Link } from "react-router-dom";
import Comments from "../comments/Comments";
import Avatar from "../avatar/Avatar";
import { useState, useRef, useEffect } from "react";
import moment from "moment";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { makeRequest } from "../../axios";
import { useContext } from "react";
import { AuthContext } from "../../context/authContext";

const Post = ({ post }) => {
  const [commentOpen, setCommentOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const { currentUser } = useContext(AuthContext);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const { isLoading, data } = useQuery(["likes", post.id], () =>
    makeRequest.get("/likes?postId=" + post.id).then((res) => {
      return res.data;
    })
  );

  const queryClient = useQueryClient();

  const mutation = useMutation(
    (liked) => {
      if (liked) {
        return makeRequest.delete("/likes?postId=" + post.id);
      } else {
      return makeRequest.post("/likes", { postId: post.id });
      }
    },
    {
      onSuccess: () => {
        // Invalidate specific post likes query for immediate update
        queryClient.invalidateQueries(["likes", post.id]);
        // Also invalidate all likes queries to update other posts if needed
        queryClient.invalidateQueries(["likes"]);
      },
      onError: (error) => {
        console.error("Like mutation error:", error);
        // Still invalidate to refresh the current state
        queryClient.invalidateQueries(["likes", post.id]);
        queryClient.invalidateQueries(["likes"]);
      },
    }
  );

  const deleteMutation = useMutation(
    (postId) => {
      return makeRequest.delete("/posts/" + postId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["posts"]);
      },
    }
  );

  const handleLike = () => {
    const userId = currentUser?.id || currentUser?._id;
    if (!userId) {
      console.error("No user ID found");
      return;
    }
    
    if (!Array.isArray(data)) {
      console.error("Likes data is not an array:", data);
      return;
    }
    
    const userHasLiked = data.includes(userId.toString()) || data.includes(userId);
    console.log("Handle like - userId:", userId, "userHasLiked:", userHasLiked, "data:", data);
    mutation.mutate(userHasLiked);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
    deleteMutation.mutate(post.id);
      setMenuOpen(false);
    }
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    alert("Edit functionality coming soon!");
    setMenuOpen(false);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${post.name}'s Post`,
        text: post.desc,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const userId = currentUser?.id || currentUser?._id;
  const userHasLiked = data && userId && (data.includes(userId.toString()) || data.includes(userId));
  const isOwnPost = userId && post.userId.toString() === userId.toString();

  return (
    <div className="post">
      <div className="container">
        <div className="user">
          <div className="userInfo">
            <Avatar 
              src={post.profilePic} 
              name={post.name} 
              size="medium" 
              className="avatar"
              showOnline={true}
            />
            <div className="details">
              <Link
                to={`/profile/${post.userId}`}
                className="name"
              >
                {post.name}
              </Link>
              <span className="date">
                <AccessTimeIcon className="time-icon" />
                {moment(post.createdAt).fromNow()}
              </span>
            </div>
          </div>
          
          <div className="post-menu" ref={menuRef}>
            <button 
              className="menu-button" 
              onClick={() => setMenuOpen(!menuOpen)}
              title="More options"
            >
              <MoreVertIcon />
            </button>
            
            {menuOpen && (
              <div className="dropdown-menu">
                {isOwnPost && (
                  <>
                    <button 
                      className="dropdown-item edit" 
                      onClick={handleEdit}
                    >
                      <EditOutlinedIcon className="icon" />
                      <span>Edit Post</span>
                    </button>
                    <button 
                      className="dropdown-item delete" 
                      onClick={handleDelete}
                    >
                      <DeleteOutlineIcon className="icon" />
                      <span>Delete Post</span>
                    </button>
                    <div className="dropdown-divider"></div>
                  </>
                )}
                <button className="dropdown-item">
                  <ShareOutlinedIcon className="icon" />
                  <span>Copy Link</span>
                </button>
                <button className="dropdown-item">
                  <span>🚫</span>
                  <span>Report Post</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="content">
          {post.desc && (
            <div className="description">{post.desc}</div>
          )}
          {post.img && (
            <img 
              src={post.img.startsWith('http') ? post.img : "/upload/" + post.img} 
              alt="Post content" 
              className="post-image"
            />
          )}
        </div>

        <div className="info">
          <div className="actions">
            <button 
              className={`action-item like ${userHasLiked ? 'liked' : ''}`}
              onClick={handleLike}
              title={userHasLiked ? 'Unlike' : 'Like'}
              disabled={isLoading}
            >
            {isLoading ? (
                <div className="loading-spinner-sm"></div>
              ) : userHasLiked ? (
                <FavoriteOutlinedIcon className="icon" />
            ) : (
                <FavoriteBorderOutlinedIcon className="icon" />
            )}
              <span className="count">{data?.length || 0}</span>
              <span className="text">Like{data?.length !== 1 ? 's' : ''}</span>
            </button>

            <button 
              className="action-item comment" 
              onClick={() => setCommentOpen(!commentOpen)}
              title="View comments"
            >
              <TextsmsOutlinedIcon className="icon" />
              <span className="text">Comment</span>
            </button>

            <button 
              className="action-item share" 
              onClick={handleShare}
              title="Share post"
            >
              <ShareOutlinedIcon className="icon" />
              <span className="text">Share</span>
            </button>
          </div>
        </div>

        {commentOpen && <Comments postId={post.id} />}
      </div>
    </div>
  );
};

export default Post;
