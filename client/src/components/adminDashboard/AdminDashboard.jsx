import { useState, useEffect, useCallback } from "react";
import { makeRequest } from "../../axios";
import VerificationBadge from "../verificationBadge/VerificationBadge";
import "./adminDashboard.scss";
import { 
  Verified as VerifiedIcon,
  Block as BlockIcon,
  Person as PersonIcon,
  Star as StarIcon
} from '@mui/icons-material';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await makeRequest.get("/admin/stats");
      setStats(res.data);
    } catch (err) {
      setError("Failed to load stats");
      console.error(err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await makeRequest.get(`/admin/users?page=${currentPage}&limit=10&search=${searchTerm}`);
      setUsers(res.data.users);
    } catch (err) {
      setError("Failed to load users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchStats(), fetchUsers()]);
    };
    loadData();
  }, [fetchStats, fetchUsers, currentPage, searchTerm]);

  const handleBanUser = async (userId, isBanned, banReason = "") => {
    try {
      await makeRequest.put(`/admin/users/${userId}/ban`, { isBanned, banReason });
      fetchStats();
      fetchUsers();
    } catch (err) {
      setError("Failed to update user ban status");
      console.error(err);
    }
  };

  const handleVerifyUser = async (userId, isVerified, verificationBadge = 'none', verificationReason = '') => {
    try {
      await makeRequest.put(`/admin/users/${userId}/verify`, {
        isVerified,
        verificationBadge,
        verificationReason
      });
      fetchStats();
      fetchUsers();
      setShowVerificationModal(false);
      setSelectedUser(null);
    } catch (err) {
      setError("Failed to update user verification");
      console.error(err);
    }
  };

  const openVerificationModal = (user) => {
    setSelectedUser(user);
    setShowVerificationModal(true);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      {stats && (
        <div className="stats-container">
          <h2>Platform Statistics</h2>
          <div className="stats">
            <div className="stat-item">
              <PersonIcon className="stat-icon" />
              <div>
                <h3>Total Users</h3>
                <p>{stats.totalUsers}</p>
              </div>
            </div>
            <div className="stat-item">
              <VerifiedIcon className="stat-icon verified" />
              <div>
                <h3>Verified Users</h3>
                <p>{stats.verifiedUsers}</p>
              </div>
            </div>
            <div className="stat-item">
              <BlockIcon className="stat-icon banned" />
              <div>
                <h3>Banned Users</h3>
                <p>{stats.bannedUsers}</p>
              </div>
            </div>
            <div className="stat-item">
              <StarIcon className="stat-icon admin" />
              <div>
                <h3>Admin Users</h3>
                <p>{stats.adminUsers}</p>
              </div>
            </div>
          </div>
          
          {stats.verificationStats && (
            <div className="verification-stats">
              <h3>Verification Breakdown</h3>
              <div className="verification-counts">
                <div className="count-item">
                  <VerificationBadge badge="green" size="small" />
                  <span>Green: {stats.verificationStats.green || 0}</span>
                </div>
                <div className="count-item">
                  <VerificationBadge badge="red" size="small" />
                  <span>Red: {stats.verificationStats.red || 0}</span>
                </div>
                <div className="count-item">
                  <VerificationBadge badge="gold" size="small" />
                  <span>Golden: {stats.verificationStats.gold || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="users-container">
        <div className="users-header">
          <h2>User Management</h2>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        
        <div className="users-list">
          {users.map((user) => (
            <div key={user._id} className="user-item">
              <div className="user-info">
                <img src={user.profilePic || "/default-avatar.png"} alt={user.name} />
                <div className="user-details">
                  <div className="user-name">
                    <h3>{user.name}</h3>
                    {user.isVerified && (
                      <VerificationBadge badge={user.verificationBadge} size="small" />
                    )}
                  </div>
                  <p className="user-email">{user.email}</p>
                  <p className="user-username">@{user.username}</p>
                  {user.isBanned && (
                    <span className="user-status banned">Banned</span>
                  )}
                  {user.isAdmin && (
                    <span className="user-status admin">Admin</span>
                  )}
                </div>
              </div>
              
              <div className="user-actions">
                <button
                  className="verify-btn"
                  onClick={() => openVerificationModal(user)}
                >
                  {user.isVerified ? 'Manage Verification' : 'Verify User'}
                </button>
                
                {user.isBanned ? (
                  <button
                    className="unban-btn"
                    onClick={() => handleBanUser(user._id, false)}
                  >
                    Unban User
                  </button>
                ) : (
                  <button
                    className="ban-btn"
                    onClick={() => {
                      const reason = prompt("Enter reason for banning:");
                      if (reason) handleBanUser(user._id, true, reason);
                    }}
                  >
                    Ban User
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="page-number">Page {currentPage}</span>
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={users.length < 10}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerificationModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowVerificationModal(false)}>
          <div className="verification-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Manage Verification for {selectedUser.name}</h3>
            
            <div className="verification-options">
              <div className="option">
                <button
                  className={`option-btn ${!selectedUser.isVerified ? 'active' : ''}`}
                  onClick={() => handleVerifyUser(selectedUser._id, false)}
                >
                  <span className="option-icon">❌</span>
                  Remove Verification
                </button>
              </div>
              
              <div className="option">
                <button
                  className={`option-btn ${selectedUser.verificationBadge === 'green' ? 'active' : ''}`}
                  onClick={() => handleVerifyUser(selectedUser._id, true, 'green', 'Verified Account')}
                >
                  <VerificationBadge badge="green" size="small" />
                  Green Verification
                </button>
              </div>
              
              <div className="option">
                <button
                  className={`option-btn ${selectedUser.verificationBadge === 'red' ? 'active' : ''}`}
                  onClick={() => handleVerifyUser(selectedUser._id, true, 'red', 'Admin/Premium Account')}
                >
                  <VerificationBadge badge="red" size="small" />
                  Red Verification
                </button>
              </div>
              
              <div className="option">
                <button
                  className={`option-btn ${selectedUser.verificationBadge === 'gold' ? 'active' : ''}`}
                  onClick={() => handleVerifyUser(selectedUser._id, true, 'gold', 'VIP/Owner Account')}
                >
                  <VerificationBadge badge="gold" size="small" />
                  Golden Verification
                </button>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={() => setShowVerificationModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 