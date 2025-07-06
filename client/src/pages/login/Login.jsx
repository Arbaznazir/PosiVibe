import { useContext, useState } from "react";
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
  const [err, setErr] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (err) setErr(null); // Clear error when user starts typing
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login">
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="login-container">
        <div className="welcome-section">
          <div className="brand">
            <div className="logo">
              <div className="logo-icon">P</div>
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
