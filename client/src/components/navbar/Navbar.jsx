import "./navbar.scss";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import { Link, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { DarkModeContext } from "../../context/darkModeContext";
import { AuthContext } from "../../context/authContext";
import Avatar from "../avatar/Avatar";

const Navbar = () => {
  const { toggle, darkMode } = useContext(DarkModeContext);
  const { currentUser, logout } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileClick = () => {
    const userId = currentUser?._id || currentUser?.id;
    console.log("Current user data:", currentUser);
    
    if (!userId) {
      console.error("No valid user ID found in currentUser:", currentUser);
      return;
    }

    // Always navigate to the full path
    navigate(`/app/profile/${userId}`);
    setMenuOpen(false);
  };

  return (
    <div className="navbar">
      <div className="left">
        <Link to="/app" className="logo">
          PosiVibe
        </Link>
        <div className="search">
          <SearchOutlinedIcon />
          <input type="text" placeholder="Search..." />
        </div>
      </div>
      <div className="right">
        <Link to="/app" className="nav-link">
          <HomeOutlinedIcon />
          <span>Home</span>
        </Link>
        <button className="theme-toggle" onClick={toggle}>
          {darkMode ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
        </button>
        <Link to="/app/messages" className="nav-link">
          <EmailOutlinedIcon />
          <span>Messages</span>
        </Link>
        <div className="notifications">
          <NotificationsNoneOutlinedIcon />
          <span className="counter">2</span>
        </div>
        <div className="user-menu" onClick={() => setMenuOpen(!menuOpen)}>
          <Avatar user={currentUser} size="small" />
          <span className="username">{currentUser?.name}</span>
          {menuOpen && (
            <div className="menu-dropdown">
              <button 
                onClick={handleProfileClick} 
                className="menu-item"
                type="button"
              >
                <PersonOutlineOutlinedIcon />
                <span>Profile</span>
              </button>
              <button 
                className="menu-item logout" 
                onClick={handleLogout}
                type="button"
              >
                <LogoutIcon />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
