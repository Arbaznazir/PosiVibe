import "./profile.scss";
import Posts from "../../components/posts/Posts";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { makeRequest } from "../../axios";
import { useNavigate, useParams } from "react-router-dom";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../context/authContext";
import CoverPhoto from "../../components/coverPhoto/CoverPhoto";
import Avatar from "../../components/avatar/Avatar";
import ProfileInfo from "../../components/profileInfo/ProfileInfo";

const Profile = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();  // Use useParams instead of parsing location
  
  // Get userId from URL params
  const userId = id;
  
  // Validate MongoDB ObjectId format
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
  
  // Check if it's own profile
  const currentUserId = currentUser?._id || currentUser?.id;
  const isOwnProfile = currentUserId?.toString() === userId?.toString();

  // Debug logging
  console.log("Profile component:", {
    userId,
    isValidObjectId,
    currentUserId,
    isOwnProfile
  });

  // Redirect if userId is invalid
  useEffect(() => {
    if (!userId || !isValidObjectId) {
      console.log("Invalid user ID, redirecting to home:", userId);
      navigate("/app");
      return;
    }
  }, [userId, navigate, isValidObjectId]);

  const { isLoading, error, data: userData } = useQuery(
    ["user", userId],
    () => makeRequest.get("/users/find/" + userId).then((res) => res.data),
    {
      enabled: !!userId && isValidObjectId,
      retry: 1,
      onError: (err) => {
        console.error("Error fetching user:", err);
        if (err.response?.status === 404) {
          navigate("/app");
        }
      }
    }
  );

  const { isLoading: rIsLoading, data: relationshipData } = useQuery(
    ["relationship", userId],
    () => makeRequest.get("/relationships?followedUserId=" + userId).then((res) => res.data),
    {
      enabled: !!userId && isValidObjectId && !isOwnProfile,
      retry: 1,
      onError: (err) => {
        console.error("Error fetching relationship:", err);
      }
    }
  );

  const queryClient = useQueryClient();

  const mutation = useMutation(
    (following) => {
      if (following) {
        return makeRequest.delete("/relationships?userId=" + userId);
      }
      return makeRequest.post("/relationships", { userId });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["relationship"]);
      },
      onError: (err) => {
        console.error("Follow/unfollow error:", err);
      }
    }
  );

  const handleFollow = () => {
    if (!relationshipData || !currentUserId) return;
    mutation.mutate(relationshipData.includes(currentUserId.toString()));
  };

  if (!userId || !isValidObjectId) {
    return null; // Will redirect via useEffect
  }

  if (isLoading) {
    return (
      <div className="profile loading">
        <div className="loading-spinner">Loading profile...</div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="profile error">
        <div className="error-message">
          {error?.response?.status === 404 
            ? "Profile not found" 
            : "Error loading profile. Please try again later."}
        </div>
      </div>
    );
  }

  return (
    <div className="profile">
      <div className="images">
        <CoverPhoto user={userData} editable={isOwnProfile} />
        <div className="profile-picture">
          <Avatar user={userData} size="large" editable={isOwnProfile} />
        </div>
      </div>
      <div className="profile-container">
        <ProfileInfo user={userData} />
        {!isOwnProfile && (
          <button 
            className="follow-button" 
            onClick={handleFollow}
            disabled={rIsLoading || mutation.isLoading}
          >
            {rIsLoading 
              ? "Loading..." 
              : mutation.isLoading 
                ? "Processing..." 
                : relationshipData?.includes(currentUserId?.toString()) 
                  ? "Following" 
                  : "Follow"}
          </button>
        )}
      </div>
      <Posts userId={userId} />
    </div>
  );
};

export default Profile;
