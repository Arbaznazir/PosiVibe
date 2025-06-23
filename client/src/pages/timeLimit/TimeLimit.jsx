import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest } from '../../axios';
import { AuthContext } from '../../context/authContext';
import './timeLimit.scss';

const TimeLimit = () => {
  const [currentQuote, setCurrentQuote] = useState(0);
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const { logout, currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const inspirationalQuotes = [
    {
      text: "Time is the most valuable thing we have, because it is the most irrevocable.",
      author: "Dietrich Bonhoeffer"
    },
    {
      text: "The way we spend our time defines who we are.",
      author: "Jonathan Estrin"
    },
    {
      text: "Time is what we want most, but what we use worst.",
      author: "William Penn"
    },
    {
      text: "Don't spend time beating on a wall, hoping to transform it into a door.",
      author: "Coco Chanel"
    },
    {
      text: "Time flies over us, but leaves its shadow behind.",
      author: "Nathaniel Hawthorne"
    },
    {
      text: "The trouble is, you think you have time.",
      author: "Buddha"
    },
    {
      text: "Time is the wisest counselor of all.",
      author: "Pericles"
    },
    {
      text: "Lost time is never found again.",
      author: "Benjamin Franklin"
    },
    {
      text: "Time is the most valuable coin in your life. You and you alone will determine how that coin will be spent.",
      author: "Carl Sandburg"
    },
    {
      text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
      author: "Stephen Covey"
    },
    {
      text: "Time management is life management.",
      author: "Robin Sharma"
    },
    {
      text: "You may delay, but time will not.",
      author: "Benjamin Franklin"
    }
  ];

  const updateCountdown = useCallback(async () => {
    try {
      const res = await makeRequest.get('/users/time-limit');
      const resetTime = new Date(res.data.resetTime);
      const now = new Date();
      const timeDiff = resetTime - now;

      if (timeDiff > 0) {
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        setTimeUntilReset(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeUntilReset('00:00:00');
        // Refresh the page when time resets
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to get reset time:', err);
    }
  }, []);

  useEffect(() => {
    // Change quote every 10 seconds
    const quoteInterval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % inspirationalQuotes.length);
    }, 10000);

    // Update countdown every second
    const countdownInterval = setInterval(() => {
      updateCountdown();
    }, 1000);

    return () => {
      clearInterval(quoteInterval);
      clearInterval(countdownInterval);
    };
  }, [inspirationalQuotes.length, updateCountdown]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      // Navigate to login page after successful logout
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      // Fallback: manually clear and navigate
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  return (
    <div className="time-limit-page">
      {/* Floating geometric shapes */}
      <div className="floating-shape"></div>
      <div className="floating-shape"></div>
      <div className="floating-shape"></div>
      
      <div className="time-limit-container">
        <div className="time-limit-content">
          <div className="content-wrapper">
            <div className="icon-section">
              <div className="time-icon">⏰</div>
              <div className="hourglass">⏳</div>
            </div>
            
            <h1 className="title">Time's Up for Today!</h1>
            <p className="subtitle">
              You've reached your daily limit of 2 hours and 30 minutes on PosiVibe.
            </p>
            
            <div className="quote-section">
              <div className="quote-card">
                <div className="quote-text">
                  "{inspirationalQuotes[currentQuote].text}"
                </div>
                <div className="quote-author">
                  — {inspirationalQuotes[currentQuote].author}
                </div>
              </div>
            </div>
            
            <div className="reset-info">
              <h3>Time until reset:</h3>
              <div className="countdown">{timeUntilReset}</div>
              <p className="reset-note">
                Your time limit will reset at midnight. Use this time to focus on other activities!
              </p>
            </div>
            
            <div className="suggestions">
              <h3>While you wait, why not:</h3>
              <ul>
                <li>📚 Read a book or article</li>
                <li>🏃‍♂️ Go for a walk or exercise</li>
                <li>👥 Spend time with family and friends</li>
                <li>🎨 Work on a creative project</li>
                <li>🧘‍♂️ Practice mindfulness or meditation</li>
                <li>📝 Write in a journal</li>
              </ul>
            </div>
            
            <div className="actions">
              <button className="logout-btn" onClick={handleLogout}>
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeLimit; 