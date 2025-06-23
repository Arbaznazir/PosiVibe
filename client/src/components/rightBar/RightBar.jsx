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
import { useContext } from "react";
import { AuthContext } from "../../context/authContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../axios";
import Avatar from "../avatar/Avatar";
import toast from 'react-hot-toast';

const RightBar = () => {
  const { currentUser } = useContext(AuthContext);
  const queryClient = useQueryClient();

  // Fetch user suggestions from API
  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: ["suggestions"],
    queryFn: () => makeRequest.get("/users/suggestions").then((res) => res.data),
    enabled: !!currentUser,
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: (userId) => {
      return makeRequest.post("/relationships", { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["suggestions"]);
      queryClient.invalidateQueries(["following"]);
      queryClient.invalidateQueries(["posts"]);
      toast.success("User followed successfully!");
    },
    onError: (error) => {
      console.error("Follow error:", error);
      toast.error("Failed to follow user");
    },
  });

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

  const handleFollow = (userId) => {
    followMutation.mutate(userId);
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
            {suggestionsLoading ? (
              <div className="suggestion-item">
                <div className="loading">Loading suggestions...</div>
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((user) => (
                <div key={user._id} className="suggestion-item">
                  <div className="user-info">
                    <Avatar 
                      src={user.profilePic} 
                      name={user.name} 
                      size="medium" 
                      className="avatar"
                      showOnline={false}
                    />
                    
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
                      className="follow-btn"
                      onClick={() => handleFollow(user._id)}
                      disabled={followMutation.isPending}
                    >
                      <PersonAdd className="icon" />
                      {followMutation.isPending ? 'Following...' : 'Follow'}
                    </button>
                    <button 
                      className="dismiss-btn"
                      onClick={() => {
                        // Remove from local state
                        queryClient.setQueryData(["suggestions"], (old) =>
                          old?.filter((u) => u._id !== user._id) || []
                        );
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="suggestion-item">
                <div className="empty-state">
                  <p>No suggestions available</p>
                </div>
              </div>
            )}
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
                  <Avatar 
                    src={friend.profilePic} 
                    name={friend.name} 
                    size="medium" 
                    className="avatar"
                    showOnline={true}
                  />
                  
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
