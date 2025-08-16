import "./bottomNav.scss";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PeopleIcon from "@mui/icons-material/People";
import { Link, useLocation } from "react-router-dom";
import { useContext, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../../context/authContext";
import { makeRequest } from "../../axios";
import Avatar from "../avatar/Avatar";

const formatTimeRemaining = (milliseconds) => {
  if (!milliseconds || milliseconds <= 0) return "0:00";
  const totalMinutes = Math.floor(milliseconds / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${Math.floor((milliseconds % (1000 * 60)) / 1000)
    .toString()
    .padStart(2, "0")}`;
};

const getTimeColor = (remaining) => {
  if (!remaining) return "";
  const HOUR = 60 * 60 * 1000;
  if (remaining <= HOUR / 4) return "critical"; // < 15 min
  if (remaining <= HOUR / 2) return "warning"; // < 30 min
  if (remaining <= HOUR) return "low"; // < 60 min
  return "";
};

const BottomNav = () => {
  const { currentUser } = useContext(AuthContext);
  const location = useLocation();
  const userId = currentUser?._id || currentUser?.id;
  // Hide-on-scroll (mobile)
  const [isHidden, setIsHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false
  );
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 768px)');
    const handleChange = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handleChange);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setIsHidden(false);
      return;
    }
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      const last = lastScrollYRef.current;
      const delta = y - last;
      const threshold = 5;
      if (Math.abs(delta) <= threshold) return;
      if (y <= 0) {
        setIsHidden(false);
      } else if (delta > 0) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }
      lastScrollYRef.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isMobile]);

  const { data: timeLimit } = useQuery({
    queryKey: ["timeLimit"],
    queryFn: () => makeRequest.get("/users/time-limit").then((res) => res.data),
    enabled: !!currentUser,
    refetchInterval: 60000,
  });

  const { data: unreadMessages } = useQuery({
    queryKey: ["messages-unread"],
    queryFn: () =>
      makeRequest.get("/messages/unread/count").then((res) => res.data),
    enabled: !!currentUser,
    refetchInterval: 30000,
  });

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <nav className={`bottom-nav ${isHidden ? 'hide-on-scroll' : ''}`}>
      <Link
        to="/app"
        className={`nav-item ${location.pathname === "/app" ? "active" : ""}`}
        aria-label="Home"
      >
        <HomeOutlinedIcon />
      </Link>

      <Link
        to="/app/friends"
        className={`nav-item ${isActive("/app/friends") ? "active" : ""}`}
        aria-label="Friends"
      >
        <PeopleIcon />
      </Link>

      <div
        className={`time-indicator ${getTimeColor(timeLimit?.remaining)}`}
        aria-label="Daily time left"
      >
        <AccessTimeIcon />
        <span className="time-text">
          {formatTimeRemaining(timeLimit?.remaining)}
        </span>
      </div>

      <Link
        to="/app/messages"
        className={`nav-item ${isActive("/app/messages") ? "active" : ""}`}
        aria-label="Messages"
      >
        <EmailOutlinedIcon />
        {unreadMessages?.count > 0 && (
          <span className="counter">{unreadMessages.count}</span>
        )}
      </Link>

      <Link
        to={userId ? `/app/profile/${userId}` : "/app"}
        className={`nav-item ${isActive("/app/profile") ? "active" : ""}`}
        aria-label="Profile"
      >
        <Avatar user={currentUser} size="small" />
      </Link>
    </nav>
  );
};

export default BottomNav;
