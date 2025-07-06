import { useState, useEffect, useCallback } from "react";
import { makeRequest } from "../../axios";
import "./adminDashboard.scss";

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await makeRequest.get("/admin/dashboard");
      setDashboard(res.data);
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error(err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await makeRequest.get(`/admin/users?page=${currentPage}&limit=10`);
      setUsers(res.data.users);
    } catch (err) {
      setError("Failed to load users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchDashboard(), fetchUsers()]);
    };
    loadData();
  }, [fetchDashboard, fetchUsers, currentPage]);

  const handleBanUser = async (userId, reason) => {
    try {
      await makeRequest.post(`/admin/users/${userId}/ban`, { reason });
      fetchDashboard();
      fetchUsers();
    } catch (err) {
      setError("Failed to ban user");
      console.error(err);
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      await makeRequest.post(`/admin/users/${userId}/unban`);
      fetchDashboard();
      fetchUsers();
    } catch (err) {
      setError("Failed to unban user");
      console.error(err);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      {dashboard && (
        <div className="stats-container">
          <h2>Content Moderation Stats</h2>
          <div className="stats">
            <div className="stat-item">
              <h3>Total Violations</h3>
              <p>{dashboard.stats.total}</p>
            </div>
            <div className="stat-item">
              <h3>Last 24 Hours</h3>
              <p>{dashboard.stats.last24Hours}</p>
            </div>
            <div className="stat-item">
              <h3>Banned Users</h3>
              <p>{dashboard.stats.bannedUsers}</p>
            </div>
            <div className="stat-item">
              <h3>Flagged Users</h3>
              <p>{dashboard.stats.flaggedUsers}</p>
            </div>
          </div>
        </div>
      )}

      <div className="users-container">
        <h2>User Management</h2>
        <div className="users-list">
          {users.map((user) => (
            <div key={user._id} className="user-item">
              <div className="user-info">
                <img src={user.profilePic || "/default-avatar.png"} alt={user.name} />
                <div>
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                </div>
              </div>
              <div className="user-actions">
                {user.isBanned ? (
                  <button
                    className="unban-btn"
                    onClick={() => handleUnbanUser(user._id)}
                  >
                    Unban User
                  </button>
                ) : (
                  <button
                    className="ban-btn"
                    onClick={() => {
                      const reason = prompt("Enter reason for banning:");
                      if (reason) handleBanUser(user._id, reason);
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
    </div>
  );
};

export default AdminDashboard; 