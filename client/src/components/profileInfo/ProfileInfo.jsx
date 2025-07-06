import { useState } from "react";
import "./profileInfo.scss";
import { makeRequest } from "../../axios";
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const ProfileInfo = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    username: user.username || "",
    city: user.city || "",
    website: user.website || ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // Validate username (only letters, numbers, and underscores)
      if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        throw new Error("Username can only contain letters, numbers, and underscores");
      }

      // Validate website format if provided
      if (formData.website && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(formData.website)) {
        throw new Error("Please enter a valid website URL");
      }

      await makeRequest.put("/users", formData);
      setIsEditing(false);
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || "",
      username: user.username || "",
      city: user.city || "",
      website: user.website || ""
    });
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="profile-info">
      {!isEditing ? (
        <>
          <div className="info-display">
            <h1>{user.name}</h1>
            <p className="username">@{user.username}</p>
            {user.city && <p className="city">{user.city}</p>}
            {user.website && (
              <a href={user.website} target="_blank" rel="noopener noreferrer" className="website">
                {user.website}
              </a>
            )}
          </div>
          <button className="edit-button" onClick={() => setIsEditing(true)}>
            <EditIcon />
            Edit Profile
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Website</label>
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://example.com"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="button-group">
            <button type="submit" className="save-button" disabled={loading}>
              <SaveIcon />
              Save
            </button>
            <button type="button" className="cancel-button" onClick={handleCancel} disabled={loading}>
              <CancelIcon />
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && <div className="loading-overlay">Saving...</div>}
    </div>
  );
};

export default ProfileInfo; 