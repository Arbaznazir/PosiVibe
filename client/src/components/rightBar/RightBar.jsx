import "./rightBar.scss";
import { 
  PeopleAlt, 
  Notifications, 
  PersonAdd, 
  Favorite,
  ChatBubble,
  Share,
  PersonAddAlt1,
  Verified
} from "@mui/icons-material";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/authContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../axios";

const RightBar = () => {
  const { currentUser } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [suggestions, setSuggestions] = useState([]);

  // Fetch all users to show as suggestions
  const { data: allUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      // Since we don't have a get all users endpoint, we'll manually create suggestions
      // from the users we know exist in the system
      const knownUsers = [
        { _id: "1", name: "Test User", username: "testuser", profilePic: null },
        { _id: "3", name: "John Doe", username: "johndoe", profilePic: null },
        { _id: "4", name: "Sarah Smith", username: "sarahsmith", profilePic: null },
        { _id: "5", name: "Mike Johnson", username: "mikejohnson", profilePic: null },
        { _id: "6", name: "Emily Davis", username: "emilydavis", profilePic: null },
      ];
      // Filter out current user
      return knownUsers.filter(user => user._id !== currentUser?.id);
    },
  });

  // Fetch relationships to know who we're already following
  const { data: relationships } = useQuery({
    queryKey: ["following", currentUser?.id],
    queryFn: () => makeRequest.get("/relationships/following").then((res) => res.data),
    enabled: !!currentUser?.id,
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: (userId) => {
      return makeRequest.post("/relationships", { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["following"]);
      queryClient.invalidateQueries(["posts"]);
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: (userId) => {
      return makeRequest.delete(`/relationships?userId=${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["following"]);
      queryClient.invalidateQueries(["posts"]);
    },
  });

  // Update suggestions based on users and relationships
  useEffect(() => {
    if (allUsers && relationships) {
      const suggestedUsers = allUsers.map(user => ({
        id: user._id,
        name: user.name,
        username: `@${user.username}`,
        profilePic: user.profilePic,
        mutualFriends: Math.floor(Math.random() * 15) + 1, // Random for demo
        isVerified: false,
        isFollowing: relationships.includes(user._id)
      }));
      setSuggestions(suggestedUsers);
    }
  }, [allUsers, relationships]);

  // Mock data for activities
  const activities = [
    {
      id: 1,
      type: "like",
      userName: "Alex Turner",
      action: "liked your photo",
      time: "2 min ago"
    },
    {
      id: 2,
      type: "comment",
      userName: "Jessica Lee",
      action: "commented on your post",
      time: "5 min ago"
    },
    {
      id: 3,
      type: "follow",
      userName: "David Kim",
      action: "started following you",
      time: "10 min ago"
    },
    {
      id: 4,
      type: "share",
      userName: "Lisa Park",
      action: "shared your post",
      time: "15 min ago"
    }
  ];

  // Mock data for online friends
  const onlineFriends = [
    {
      id: 1,
      name: "John Doe",
      profilePic: null,
      status: "Active now"
    },
    {
      id: 2,
      name: "Jane Smith",
      profilePic: null,
      status: "Active 5m ago"
    },
    {
      id: 3,
      name: "Bob Wilson",
      profilePic: null,
      status: "Active now"
    }
  ];

  const handleFollow = (userId, isFollowing) => {
    if (isFollowing) {
      unfollowMutation.mutate(userId);
    } else {
      followMutation.mutate(userId);
    }
  };

  const handleDismiss = (userId) => {
    setSuggestions(prev => prev.filter(user => user.id !== userId));
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "like":
        return <Favorite />;
      case "comment":
        return <ChatBubble />;
      case "share":
        return <Share />;
      case "follow":
        return <PersonAddAlt1 />;
      default:
        return <Notifications />;
    }
  };

  return (
    <div className="rightBar">
      <div className="container">
        {/* Suggestions Section */}
        <div className="item">
          <div className="header">
            <div className="title">
              <PeopleAlt className="icon" />
              Suggestions For You
            </div>
            <button className="see-all" onClick={() => console.log('See all suggestions')}>See All</button>
          </div>
          
          <div className="content">
            {suggestions.map((user) => (
              <div key={user.id} className="suggestion-item">
                <div className="user-info">
                  <div className="avatar">
                    {user.profilePic ? (
                      <img src={`/upload/${user.profilePic}`} alt={user.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="status-indicator"></div>
                  </div>
                  
                  <div className="details">
                    <div className="name">
                      {user.name}
                      {user.isVerified && <Verified className="verified" />}
                    </div>
                    <div className="subtitle">
                      <span className="mutual-count">{user.mutualFriends}</span> mutual friends
                    </div>
                  </div>
                </div>
                
                <div className="actions">
                  <button 
                    className={`follow-btn ${user.isFollowing ? 'following' : ''}`}
                    onClick={() => handleFollow(user.id, user.isFollowing)}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                  >
                    <PersonAdd className="icon" />
                    {user.isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button 
                    className="dismiss-btn"
                    onClick={() => handleDismiss(user.id)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Activities Section */}
        <div className="item">
          <div className="header">
            <div className="title">
              <Notifications className="icon" />
              Latest Activities
            </div>
          </div>
          
          <div className="content">
            {activities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-content">
                  <div className={`activity-icon ${activity.type}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="activity-text">
                    <span className="user-name">{activity.userName}</span>
                    <span className="action"> {activity.action}</span>
                  </div>
                  
                  <div className="time">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Online Friends Section */}
        <div className="item">
          <div className="header">
            <div className="title">
              <PeopleAlt className="icon" />
              Online Friends
            </div>
            <span className="see-all">{onlineFriends.length} online</span>
          </div>
          
          <div className="content">
            {onlineFriends.map((friend) => (
              <div key={friend.id} className="friend-item">
                <div className="user-info">
                  <div className="avatar">
                    {friend.profilePic ? (
                      <img src={friend.profilePic} alt={friend.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {friend.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="status-indicator"></div>
                  </div>
                  
                  <div className="details">
                    <div className="name">{friend.name}</div>
                  </div>
                </div>
                
                <div className="friend-status">
                  <div className="status-dot"></div>
                  <div className="status-text">{friend.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightBar;
