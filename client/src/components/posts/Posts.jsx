import Post from "../post/Post";
import "./posts.scss";
import { useQuery } from "@tanstack/react-query";
import { makeRequest } from "../../axios";

const Posts = ({ userId }) => {
  const { isLoading, error, data } = useQuery(["posts", userId], () =>
    makeRequest.get("/posts" + (userId ? `?userId=${userId}` : "")).then((res) => {
      return res.data;
    })
  );

  if (error) {
    console.error("Error loading posts:", error);
    return (
      <div className="posts">
        <div className="posts-error">
          <span>😕 Something went wrong loading posts!</span>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="posts">
        <div className="posts-loading">
          <div className="loading-spinner"></div>
          <span>Loading posts...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="posts">
        <div className="posts-empty">
          <span>📭 No posts to show</span>
          <p>Start following people or create your first post!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="posts">
      {data.map((post) => <Post post={post} key={post.id} />)}
    </div>
  );
};

export default Posts;
