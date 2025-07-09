import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { makeRequest } from '../../axios';
import { AuthContext } from '../../context/authContext';
import { useContext } from 'react';
import Avatar from '../../components/avatar/Avatar';
import VerificationBadge from '../../components/verificationBadge/VerificationBadge';
import toast from 'react-hot-toast';
import { 
  Search as SearchIcon, 
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  Visibility as VisibilityIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import './friends.scss';

const Friends = () => {
  const { currentUser } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Fetch all users
  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => makeRequest.get('/users').then(res => res.data),
    retry: 1,
  });

  // Fetch current user's following list
  const { data: followingData = [] } = useQuery({
    queryKey: ['following', currentUser?.id],
    queryFn: () => makeRequest.get(`/relationships?followerUserId=${currentUser.id || currentUser._id}`).then(res => res.data),
    enabled: !!currentUser,
    retry: 1,
  });

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: ({ userId, isFollowing }) => {
      if (isFollowing) {
        return makeRequest.delete(`/relationships?userId=${userId}`);
      } else {
        return makeRequest.post('/relationships', { userId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['following']);
      queryClient.invalidateQueries(['relationships']);
    },
    onError: (error) => {
      toast.error('Action failed. Please try again.');
    }
  });

  const handleFollowToggle = (userId, isFollowing) => {
    followMutation.mutate({ userId, isFollowing });
    if (isFollowing) {
      toast.success('Unfollowed successfully');
    } else {
      toast.success('Followed successfully');
    }
  };

  // Filter users based on search term and exclude current user
  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const isNotCurrentUser = (user._id || user.id) !== (currentUser?.id || currentUser?._id);
    return matchesSearch && isNotCurrentUser;
  });

  // Separate users into following and suggested
  const followingUsers = filteredUsers.filter(user => 
    followingData.includes(user._id || user.id)
  );
  
  const suggestedUsers = filteredUsers.filter(user => 
    !followingData.includes(user._id || user.id)
  );

  if (usersLoading) {
    return (
      <div className="friends-page">
        <div className="loading">
          <PeopleIcon />
          <h2>Loading people...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="friends-page">
      <div className="friends-container">
        <div className="friends-header">
          <div className="header-content">
            <PeopleIcon />
            <h1>People</h1>
          </div>
          <p>Discover and connect with people on PosiVibe</p>
        </div>

        <div className="search-section">
          <div className="search-box">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search for people..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="users-sections">
          {/* Following Section */}
          {followingUsers.length > 0 && (
            <div className="users-section">
              <h2>People You Follow ({followingUsers.length})</h2>
              <div className="users-grid">
                {followingUsers.map((user) => (
                  <div key={user._id || user.id} className="user-card">
                    <Avatar 
                      src={user.profilePic} 
                      name={user.name} 
                      size="large"
                      showOnline={true}
                    />
                    <div className="user-info">
                      <div className="user-name">
                        <h3>{user.name}</h3>
                        {user.verificationBadge && (
                          <VerificationBadge 
                            badge={user.verificationBadge} 
                            reason={user.verificationReason}
                            size="medium"
                          />
                        )}
                      </div>
                      <p className="username">@{user.username}</p>
                      {user.city && (
                        <span className="location">
                          <LocationIcon /> {user.city}
                        </span>
                      )}
                    </div>
                    <div className="user-actions">
                      <button 
                        className="unfollow-btn"
                        onClick={() => handleFollowToggle(user._id || user.id, true)}
                        disabled={followMutation.isLoading}
                      >
                        <PersonRemoveIcon />
                        Unfollow
                      </button>
                      <button 
                        className="message-btn"
                        onClick={() => window.location.href = `/app/messages`}
                      >
                        <MessageIcon /> Message
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Section */}
          <div className="users-section">
            <h2>Suggested People ({suggestedUsers.length})</h2>
            {suggestedUsers.length > 0 ? (
              <div className="users-grid">
                {suggestedUsers.map((user) => (
                  <div key={user._id || user.id} className="user-card">
                    <Avatar 
                      src={user.profilePic} 
                      name={user.name} 
                      size="large"
                      showOnline={true}
                    />
                    <div className="user-info">
                      <div className="user-name">
                        <h3>{user.name}</h3>
                        {user.verificationBadge && (
                          <VerificationBadge 
                            badge={user.verificationBadge} 
                            reason={user.verificationReason}
                            size="medium"
                          />
                        )}
                      </div>
                      <p className="username">@{user.username}</p>
                      {user.city && (
                        <span className="location">
                          <LocationIcon /> {user.city}
                        </span>
                      )}
                    </div>
                    <div className="user-actions">
                      <button 
                        className="follow-btn"
                        onClick={() => handleFollowToggle(user._id || user.id, false)}
                        disabled={followMutation.isLoading}
                      >
                        <PersonAddIcon />
                        Follow
                      </button>
                      <button 
                        className="profile-btn"
                        onClick={() => window.location.href = `/app/profile/${user._id || user.id}`}
                      >
                        <VisibilityIcon /> View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <PeopleIcon />
                <h3>No people found</h3>
                <p>Try adjusting your search or check back later for new users.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Friends; 