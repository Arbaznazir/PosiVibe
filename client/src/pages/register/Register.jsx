import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Visibility, 
  VisibilityOff, 
  Person, 
  Lock, 
  Email,
  Badge,
  Google, 
  Facebook, 
  Twitter,
  ArrowForward,
  CheckCircle
} from "@mui/icons-material";
import "./register.scss";
import { makeRequest } from "../../axios";

const Register = () => {
  const [inputs, setInputs] = useState({
    username: "",
    email: "",
    password: "",
    name: "",
  });
  const [err, setErr] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (err) setErr(null); // Clear error when user starts typing
    
    // Clear specific validation error
    if (validationErrors[e.target.name]) {
      setValidationErrors(prev => ({ ...prev, [e.target.name]: null }));
    }
  };

  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};
    
    if (!inputs.name.trim()) {
      errors.name = "Full name is required";
    }
    
    if (!inputs.username.trim()) {
      errors.username = "Username is required";
    } else if (inputs.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }
    
    if (!inputs.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(inputs.email)) {
      errors.email = "Please enter a valid email";
    }
    
    if (!inputs.password) {
      errors.password = "Password is required";
    } else if (inputs.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleClick = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setErr(null);

    try {
      await makeRequest.post("/auth/register", inputs);
      navigate("/login");
    } catch (err) {
      setErr(err.response?.data?.message || err.response?.data || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="register">
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="register-container">
        <div className="form-section">
          <div className="form-container">
            <div className="form-header">
              <div className="brand">
                <div className="logo">
                  <div className="logo-icon">P</div>
                  <span className="logo-text">PosiVibe</span>
                </div>
              </div>
              <h2>Create Account</h2>
              <p>Join our community and start sharing positive vibes</p>
            </div>

            <form onSubmit={handleClick} className="register-form">
              <div className="input-group">
                <div className="input-wrapper">
                  <Badge className="input-icon" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    name="name"
                    value={inputs.name}
                    onChange={handleChange}
                    className={validationErrors.name ? 'error' : ''}
                    required
                  />
                </div>
                {validationErrors.name && (
                  <span className="field-error">{validationErrors.name}</span>
                )}
        </div>

              <div className="input-group">
                <div className="input-wrapper">
                  <Person className="input-icon" />
            <input
              type="text"
              placeholder="Username"
              name="username"
                    value={inputs.username}
              onChange={handleChange}
                    className={validationErrors.username ? 'error' : ''}
                    required
                  />
                </div>
                {validationErrors.username && (
                  <span className="field-error">{validationErrors.username}</span>
                )}
              </div>

              <div className="input-group">
                <div className="input-wrapper">
                  <Email className="input-icon" />
            <input
              type="email"
                    placeholder="Email Address"
              name="email"
                    value={inputs.email}
              onChange={handleChange}
                    className={validationErrors.email ? 'error' : ''}
                    required
                  />
                </div>
                {validationErrors.email && (
                  <span className="field-error">{validationErrors.email}</span>
                )}
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
                    className={validationErrors.password ? 'error' : ''}
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
                {validationErrors.password && (
                  <span className="field-error">{validationErrors.password}</span>
                )}
              </div>

              {err && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {err}
                </div>
              )}

              <div className="terms-agreement">
                <label className="terms-checkbox">
                  <input type="checkbox" required />
                  <span className="checkmark"></span>
                  I agree to the Terms of Service and Privacy Policy
                </label>
              </div>

              <button 
                type="submit" 
                className="register-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <>
                    Create Account
                    <ArrowForward className="btn-icon" />
                  </>
                )}
              </button>
          </form>

            <div className="divider">
              <span>or sign up with</span>
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

        <div className="welcome-section">
          <div className="welcome-content">
            <h1>Join PosiVibe Today!</h1>
            <p>
              Become part of a community that values authentic connections, 
              meaningful conversations, and positive interactions.
            </p>

            <div className="features">
              <div className="feature">
                <CheckCircle className="feature-icon" />
                <div>
                  <h4>Connect Authentically</h4>
                  <span>Build genuine relationships with like-minded people</span>
                </div>
              </div>
              <div className="feature">
                <CheckCircle className="feature-icon" />
                <div>
                  <h4>Share Your Story</h4>
                  <span>Express yourself through posts, stories, and comments</span>
                </div>
              </div>
              <div className="feature">
                <CheckCircle className="feature-icon" />
                <div>
                  <h4>Stay Positive</h4>
                  <span>Join a community focused on spreading good vibes</span>
                </div>
              </div>
            </div>

            <div className="stats">
              <div className="stat">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Active Users</div>
              </div>
              <div className="stat">
                <div className="stat-number">50K+</div>
                <div className="stat-label">Posts Shared</div>
              </div>
              <div className="stat">
                <div className="stat-number">100K+</div>
                <div className="stat-label">Connections Made</div>
              </div>
            </div>
          </div>

          <div className="auth-switch">
            <span>Already have an account?</span>
            <Link to="/login" className="switch-link">
              Sign In
              <ArrowForward className="arrow-icon" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
