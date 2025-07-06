import "./leftBar.scss";
import { AuthContext } from "../../context/authContext";
import { useContext } from "react";
import { Link } from "react-router-dom";
import {
  Home as HomeIcon,
  Message as MessageIcon,
  People as PeopleIcon,
  Group as GroupIcon,
  OndemandVideo as VideoIcon,
  PhotoLibrary as PhotoIcon,
  Event as EventIcon,
  SportsEsports as GamingIcon,
  AdminPanelSettings as AdminIcon,
} from "@mui/icons-material";

const LeftBar = () => {
  const { currentUser } = useContext(AuthContext);

  return (
    <div className="leftBar">
      <div className="container">
        <div className="menu">
          <Link to={`/app/profile/${currentUser.id || currentUser._id}`} className="user">
            <img src={currentUser.profilePic} alt="" />
            <span>{currentUser.name}</span>
          </Link>
          
          <Link to="/app" className="item">
            <HomeIcon />
            <span>Home</span>
          </Link>
          
          <Link to="/app/messages" className="item">
            <MessageIcon />
            <span>Messages</span>
          </Link>
          
          <Link to="/app/friends" className="item">
            <PeopleIcon />
            <span>Friends</span>
          </Link>
          
          {currentUser.isAdmin && (
            <Link to="/app/admin" className="item admin">
              <AdminIcon />
              <span>Admin Panel</span>
            </Link>
          )}
          
          <div className="item disabled">
            <GroupIcon />
            <span>Groups</span>
          </div>
          
          <div className="item disabled">
            <VideoIcon />
            <span>Watch</span>
          </div>
          
          <div className="item disabled">
            <PhotoIcon />
            <span>Memories</span>
          </div>
        </div>
        <hr />
        <div className="menu">
          <span>Your shortcuts</span>
          <div className="item disabled">
            <EventIcon />
            <span>Events</span>
          </div>
          <div className="item disabled">
            <GamingIcon />
            <span>Gaming</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftBar;
