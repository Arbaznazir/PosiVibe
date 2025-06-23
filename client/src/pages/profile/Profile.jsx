import "./profile.scss";
import FacebookTwoToneIcon from "@mui/icons-material/FacebookTwoTone";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import InstagramIcon from "@mui/icons-material/Instagram";
import PinterestIcon from "@mui/icons-material/Pinterest";
import TwitterIcon from "@mui/icons-material/Twitter";
import PlaceIcon from "@mui/icons-material/Place";
import LanguageIcon from "@mui/icons-material/Language";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CloseIcon from "@mui/icons-material/Close";
import Posts from "../../components/posts/Posts";
import Avatar from "../../components/avatar/Avatar";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { makeRequest } from "../../axios";
import { useParams, Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/authContext";
import Update from "../../components/update/Update";
import { useState } from "react";
import moment from "moment";

const Profile = () => {
  const [openUpdate, setOpenUpdate] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const { currentUser } = useContext(AuthContext);
  const { id: userId } = useParams();

  // Fetch user data
  const { isLoading, data, error } = useQuery(["user", userId], () =>
    makeRequest.get("/users/find/" + userId).then((res) => {
      return res.data;
    })
  );

  // Fetch relationship data (followers)
  const { isLoading: rIsLoading, data: relationshipData } = useQuery(
    ["relationship", userId],
    () =>
      makeRequest.get("/relationships?followedUserId=" + userId).then((res) => {
        return res.data;
      })
  );

  // Fetch posts count
  const { data: postsData } = useQuery(["posts", userId], () =>
    makeRequest.get("/posts?userId=" + userId).then((res) => {
      return res.data;
    })
  );

  // Fetch followers count
  const { data: followersData } = useQuery(["followers", userId], () =>
    makeRequest.get("/relationships?followedUserId=" + userId).then((res) => {
      return res.data;
    })
  );

  // Fetch following count
  const { data: followingData } = useQuery(["following", userId], () =>
    makeRequest.get("/relationships?followerUserId=" + userId).then((res) => {
      return res.data;
    })
  );

  // Fetch detailed followers list with user info
  const { data: followersDetails } = useQuery(
    ["followersDetails", userId],
    async () => {
      if (!followersData || followersData.length === 0) return [];
      
      const followers = await Promise.all(
        followersData.map(async (followerId) => {
          const userRes = await makeRequest.get("/users/find/" + followerId);
          return userRes.data;
        })
      );
      return followers;
    },
    { enabled: !!followersData }
  );

  // Fetch detailed following list with user info
  const { data: followingDetails } = useQuery(
    ["followingDetails", userId],
    async () => {
      if (!followingData || followingData.length === 0) return [];
      
      const following = await Promise.all(
        followingData.map(async (followingId) => {
          const userRes = await makeRequest.get("/users/find/" + followingId);
          return userRes.data;
        })
      );
      return following;
    },
    { enabled: !!followingData }
  );

  const queryClient = useQueryClient();

  const mutation = useMutation(
    (following) => {
      if (following)
        return makeRequest.delete("/relationships?userId=" + userId);
      return makeRequest.post("/relationships", { userId });
    },
    {
      onSuccess: () => {
        // Invalidate and refetch
        queryClient.invalidateQueries(["relationship"]);
        queryClient.invalidateQueries(["followers"]);
        queryClient.invalidateQueries(["following"]);
        queryClient.invalidateQueries(["followersDetails"]);
        queryClient.invalidateQueries(["followingDetails"]);
      },
    }
  );

  const handleFollow = () => {
    const userIdToCheck = currentUser?.id || currentUser?._id;
    mutation.mutate(relationshipData?.includes(userIdToCheck?.toString()) || relationshipData?.includes(userIdToCheck));
  };

  // Fix profile ownership check
  const currentUserId = (currentUser?.id || currentUser?._id)?.toString();
  const profileUserId = userId?.toString();
  const isOwnProfile = currentUserId === profileUserId;
  
  console.log("Profile ownership check:", {
    currentUserId,
    profileUserId,
    isOwnProfile,
    currentUser: currentUser?.name
  });
  
  const isFollowing = relationshipData && (relationshipData.includes(currentUserId) || relationshipData.includes(currentUser?.id || currentUser?._id));

  // Calculate counts
  const postsCount = Array.isArray(postsData) ? postsData.length : 0;
  const followersCount = Array.isArray(followersData) ? followersData.length : 0;
  const followingCount = Array.isArray(followingData) ? followingData.length : 0;

  // User list component for modals
  const UserList = ({ users, title, onClose }) => (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body">
          {users && users.length > 0 ? (
            users.map((user) => (
              <div key={user.id} className="user-item">
                <Link to={`/profile/${user._id || user.id}`} onClick={onClose}>
                  <Avatar 
                    src={user.profilePic} 
                    name={user.name} 
                    size="medium" 
                    className="user-avatar"
                  />
                  <div className="user-info">
                    <span className="user-name">{user.name}</span>
                    <span className="user-username">@{user.username || user.name?.toLowerCase().replace(' ', '')}</span>
                  </div>
                </Link>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No {title.toLowerCase()} yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="profile">
        <div className="error-container">
          <h2>Profile Not Found</h2>
          <p>Sorry, we couldn't find the profile you're looking for.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile">
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      ) : (
        <>
          <div className="images">
            <div className="cover-container">
              {data.coverPic ? (
            <img src={data.coverPic.startsWith('http') ? data.coverPic : "/upload/"+data.coverPic} alt="" className="cover" />
              ) : (
                <div className="cover-placeholder">
                  <div className="placeholder-content">
                    <h3>Add a cover photo</h3>
                    <p>Make your profile stand out</p>
                  </div>
                </div>
              )}
              {isOwnProfile && (
                <button className="edit-cover-btn">
                  <EditIcon />
                </button>
              )}
            </div>
            
            <div className="profile-pic-container">
              <Avatar 
                src={data.profilePic} 
                name={data.name} 
                size="xlarge" 
                className="profilePic"
                onClick={isOwnProfile ? () => setOpenUpdate(true) : null}
              />
              {isOwnProfile && (
                <button className="edit-profile-pic-btn" onClick={() => setOpenUpdate(true)}>
                  <EditIcon />
                </button>
              )}
            </div>
          </div>
          
          <div className="profileContainer">
            <div className="profile-header">
              <div className="profile-info">
                <h1 className="profile-name">{data.name}</h1>
                <p className="profile-username">@{data.username || data.name?.toLowerCase().replace(' ', '')}</p>
                
                {data.bio && (
                  <div className="profile-bio">
                    <p>
                      {showFullBio ? data.bio : `${data.bio?.substring(0, 100)}${data.bio?.length > 100 ? '...' : ''}`}
                      {data.bio?.length > 100 && (
                        <button 
                          className="show-more-btn"
                          onClick={() => setShowFullBio(!showFullBio)}
                        >
                          {showFullBio ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </p>
                  </div>
                )}

                <div className="profile-stats">
                  <div className="stat-item">
                    <span className="stat-number">{postsCount}</span>
                    <span className="stat-label">Posts</span>
              </div>
                  <div className="stat-item clickable" onClick={() => setShowFollowersModal(true)}>
                    <span className="stat-number">{followersCount}</span>
                    <span className="stat-label">Followers</span>
                  </div>
                  <div className="stat-item clickable" onClick={() => setShowFollowingModal(true)}>
                    <span className="stat-number">{followingCount}</span>
                    <span className="stat-label">Following</span>
                  </div>
                </div>
              </div>

              <div className="profile-actions">
                {rIsLoading ? (
                  <div className="btn-loading">Loading...</div>
                ) : isOwnProfile ? (
                  <button className="edit-profile-btn" onClick={() => setOpenUpdate(true)}>
                    <EditIcon />
                    Edit Profile
                  </button>
                ) : (
                  <button 
                    className={`follow-btn ${isFollowing ? 'following' : 'follow'}`}
                    onClick={handleFollow}
                    disabled={mutation.isLoading}
                  >
                    {mutation.isLoading ? (
                      'Loading...'
                    ) : isFollowing ? (
                      <>
                        <PersonRemoveIcon />
                        Following
                      </>
                    ) : (
                      <>
                        <PersonAddIcon />
                        Follow
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="profile-details">
              <div className="details-section">
                <h3>About</h3>
                <div className="detail-items">
                  {data.city && (
                    <div className="detail-item">
                      <PlaceIcon />
                      <span>Lives in {data.city}</span>
                    </div>
                  )}
                  {data.website && (
                    <div className="detail-item">
                      <LanguageIcon />
                      <a href={data.website} target="_blank" rel="noopener noreferrer">
                        {data.website}
                      </a>
                    </div>
                  )}
                  <div className="detail-item">
                    <CalendarTodayIcon />
                    <span>Joined {moment(data.createdAt || '2024-01-01').format('MMMM YYYY')}</span>
                  </div>
                </div>
              </div>

              <div className="social-links">
                <h3>Connect</h3>
                <div className="social-icons">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link facebook">
                    <FacebookTwoToneIcon />
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link instagram">
                    <InstagramIcon />
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link twitter">
                    <TwitterIcon />
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link linkedin">
                    <LinkedInIcon />
                  </a>
                  <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="social-link pinterest">
                    <PinterestIcon />
                  </a>
                </div>
              </div>
            </div>

            <div className="profile-content">
              <div className="content-header">
                <h2>Posts</h2>
                <div className="content-actions">
                <EmailOutlinedIcon />
                <MoreVertIcon />
              </div>
            </div>
            <Posts userId={userId} />
            </div>
          </div>
        </>
      )}
      {openUpdate && <Update setOpenUpdate={setOpenUpdate} user={data} />}
      {showFollowersModal && (
        <UserList
          users={followersDetails}
          title="Followers"
          onClose={() => setShowFollowersModal(false)}
        />
      )}
      {showFollowingModal && (
        <UserList
          users={followingDetails}
          title="Following"
          onClose={() => setShowFollowingModal(false)}
        />
      )}
    </div>
  );
};

export default Profile;
