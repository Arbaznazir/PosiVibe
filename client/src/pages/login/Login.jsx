import { useContext, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/authContext";
import { 
  Visibility, 
  VisibilityOff, 
  Person, 
  Lock, 
  Google, 
  Facebook, 
  Twitter,
  ArrowForward,
  CheckCircle
} from "@mui/icons-material";
import "./login.scss";

const Login = () => {
  const [inputs, setInputs] = useState({
    username: "",
    password: "",
  });
  const [forgotPasswordInputs, setForgotPasswordInputs] = useState({
    username: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [err, setErr] = useState(null);
  const [forgotPasswordErr, setForgotPasswordErr] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (err) setErr(null); // Clear error when user starts typing
  };

  const handleForgotPasswordChange = (e) => {
    setForgotPasswordInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (forgotPasswordErr) setForgotPasswordErr(null); // Clear error when user starts typing
  };

  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErr(null);

    try {
      await login(inputs);
    } catch (err) {
      setErr(err.response?.data?.message || err.response?.data || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const [resetSuccess, setResetSuccess] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsForgotPasswordLoading(true);
    setForgotPasswordErr(null);

    // Password validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/;
    if (!passwordRegex.test(forgotPasswordInputs.newPassword)) {
      setForgotPasswordErr("Password must be at least 8 characters with 1 uppercase letter and 1 number");
      setIsForgotPasswordLoading(false);
      return;
    }

    // Check if passwords match
    if (forgotPasswordInputs.newPassword !== forgotPasswordInputs.confirmPassword) {
      setForgotPasswordErr("Passwords do not match");
      setIsForgotPasswordLoading(false);
      return;
    }

    try {
      // Function to get the API base URL
      const getApiBaseUrl = () => {
        // If we're on a phone/different device, use the network IP
        if (window.location.hostname !== 'localhost') {
          return `http://${window.location.hostname}:8800/api`;
        }
        // Fallback to localhost
        return "http://localhost:8800/api";
      };
      
      // Make API call to reset password
      await axios.post(`${getApiBaseUrl()}/auth/reset-password`, {
        username: forgotPasswordInputs.username,
        newPassword: forgotPasswordInputs.newPassword
      });
      
      // Reset form and show success message
      setResetSuccess(true);
      setForgotPasswordInputs({
        username: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetSuccess(false);
      }, 2000);
    } catch (err) {
      setForgotPasswordErr(err.response?.data || "Password reset failed");
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="login">
      {showForgotPassword && (
        <div className="modal-overlay">
          <div className="forgot-password-modal">
            <div className="modal-header">
              <h2>Reset Password</h2>
              <button 
                type="button" 
                className="close-btn" 
                onClick={() => setShowForgotPassword(false)}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleForgotPassword} className="forgot-password-form">
              <div className="input-group">
                <Person style={{ marginRight: '10px' }} />
                <input
                  type="text"
                  placeholder="Username"
                  name="username"
                  value={forgotPasswordInputs.username}
                  onChange={handleForgotPasswordChange}
                  className={forgotPasswordErr ? 'error' : ''}
                  required
                />
              </div>
              
              <div className="input-group">
                <Lock style={{ marginRight: '10px' }} />
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New Password"
                  name="newPassword"
                  value={forgotPasswordInputs.newPassword}
                  onChange={handleForgotPasswordChange}
                  className={forgotPasswordErr ? 'error' : ''}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={toggleNewPasswordVisibility}
                >
                  {showNewPassword ? <VisibilityOff /> : <Visibility />}
                </button>
              </div>
              
              <div className="password-requirements">
                Password must be at least 8 characters with 1 uppercase letter and 1 number
              </div>
              
              <div className="input-group">
                <Lock style={{ marginRight: '10px' }} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  name="confirmPassword"
                  value={forgotPasswordInputs.confirmPassword}
                  onChange={handleForgotPasswordChange}
                  className={forgotPasswordErr ? 'error' : ''}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={toggleConfirmPasswordVisibility}
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </button>
              </div>
              
              {forgotPasswordErr && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {forgotPasswordErr}
                </div>
              )}
              
              {resetSuccess && (
                <div className="success-message">
                  <span className="success-icon">✓</span>
                  Password reset successful! Please login with your new password.
                </div>
              )}
              
              <button 
                type="submit" 
                className="reset-password-btn"
                disabled={isForgotPasswordLoading || resetSuccess || !forgotPasswordInputs.username || !forgotPasswordInputs.newPassword || !forgotPasswordInputs.confirmPassword}
              >
                {isForgotPasswordLoading ? (
                  <div className="loading-spinner"></div>
                ) : resetSuccess ? (
                  <>Success</>
                ) : (
                  <>Reset Password</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
      
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="login-container">
        <div className="welcome-section">
          <div className="brand">
            <div className="logo">
              <img src="/logo.png" alt="PosiVibe" className="logo-icon" />
              <span className="logo-text">PosiVibe</span>
            </div>
            <div className="tagline">Connect • Share • Inspire</div>
          </div>

          <div className="welcome-content">
            <h1>Welcome Back!</h1>
            <p>
              Join millions of people sharing positive vibes and meaningful connections. 
              Your journey to authentic social networking starts here.
            </p>

            <div className="features">
              <div className="feature">
                <CheckCircle className="feature-icon" />
                <span>Privacy-focused platform</span>
              </div>
              <div className="feature">
                <CheckCircle className="feature-icon" />
                <span>Authentic connections</span>
              </div>
              <div className="feature">
                <CheckCircle className="feature-icon" />
                <span>Positive community</span>
              </div>
            </div>
          </div>

          <div className="auth-switch">
            <span>New to PosiVibe?</span>
            <Link to="/register" className="switch-link">
              Create Account
              <ArrowForward className="arrow-icon" />
          </Link>
          </div>
        </div>

        <div className="form-section">
          <div className="form-container">
            <div className="form-header">
              <h2>Sign In</h2>
              <p>Enter your credentials to access your account</p>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <div className="input-group">
                <div className="input-wrapper">
                  <Person className="input-icon" />
            <input
              type="text"
                    placeholder="Username or Email"
              name="username"
                    value={inputs.username}
              onChange={handleChange}
                    className={err ? 'error' : ''}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <div className="input-wrapper">
                  <Lock className="input-icon" />
            <input
                    type={showPassword ? "text" : "password"}
              placeholder="Password"
              name="password"
                    value={inputs.password}
              onChange={handleChange}
                    className={err ? 'error' : ''}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </button>
                </div>
              </div>

              {err && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {err}
                </div>
              )}

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  Remember me
                </label>
                <button 
                  type="button" 
                  className="forgot-password-link"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot Password?
                </button>
              </div>

              <button 
                type="submit" 
                className="login-btn"
                disabled={isLoading || !inputs.username || !inputs.password}
              >
                {isLoading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <>
                    Sign In
                    <ArrowForward className="btn-icon" />
                  </>
                )}
              </button>
          </form>

            <div className="divider">
              <span>or continue with</span>
            </div>

            <div className="social-login">
              <button className="social-btn google" disabled>
                <Google className="social-icon" />
                Google
              </button>
              <button className="social-btn facebook" disabled>
                <Facebook className="social-icon" />
                Facebook
              </button>
              <button className="social-btn twitter" disabled>
                <Twitter className="social-icon" />
                Twitter
              </button>
            </div>

            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-color-secondary)', marginTop: '10px' }}>
              Social login coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
