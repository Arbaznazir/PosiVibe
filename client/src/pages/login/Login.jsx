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
  CheckCircle,
  Email
} from "@mui/icons-material";
import "./login.scss";
import OtpVerification from "../../components/otpVerification/OtpVerification";

const Login = () => {
  const [inputs, setInputs] = useState({
    username: "",
    password: "",
  });
  const [forgotPasswordInputs, setForgotPasswordInputs] = useState({
    username: "",
    email: "",
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
  const [showOtpVerification, setShowOtpVerification] = useState(false);

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
  const [resetStage, setResetStage] = useState("request"); // "request", "verification", "success"

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsForgotPasswordLoading(true);
    setForgotPasswordErr(null);

    // If we're at the request stage, just request the verification code
    if (resetStage === "request") {
      try {
        // Validate email format
        if (!forgotPasswordInputs.email || !/^\S+@\S+\.\S+$/.test(forgotPasswordInputs.email)) {
          throw new Error("Please enter a valid email address");
        }
        
        // Function to get the API base URL
        const getApiBaseUrl = () => {
          // If we're on a phone/different device, use the network IP
          if (window.location.hostname !== 'localhost') {
            return `http://${window.location.hostname}:8800/api`;
          }
          // Fallback to localhost
          return "http://localhost:8800/api";
        };
        
        // Make API call to request password reset verification code
        const response = await axios.post(`${getApiBaseUrl()}/verification/request-password-reset`, {
          email: forgotPasswordInputs.email
        });
        
        // Show OTP verification
        setShowOtpVerification(true);
        setResetStage("verification");
      } catch (err) {
        console.error("Password reset error:", err);
        if (err.message === "Please enter a valid email address") {
          setForgotPasswordErr(err.message);
        } else if (err.response?.data?.error) {
          setForgotPasswordErr(err.response.data.error);
        } else {
          setForgotPasswordErr("Failed to send reset code. Please try again.");
        }
      } finally {
        setIsForgotPasswordLoading(false);
      }
      return;
    }

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
  };
  
  const handleVerifyReset = async (verificationCode, newPassword, verifyOnly = false) => {
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
      
      // Ensure verification code is properly formatted
      // Convert to string, trim whitespace, and remove any non-digit characters
      const formattedCode = String(verificationCode).trim().replace(/\D/g, '');
      
      // If this is verify-only mode (first step of two-step verification)
      if (verifyOnly) {
        console.log('Verifying OTP only (step 1 of 2):', {
          email: forgotPasswordInputs.email,
          formattedCode: formattedCode
        });
        
        // Just verify the OTP without resetting password
        const response = await axios.post(`${getApiBaseUrl()}/verification/verify-otp`, {
          email: forgotPasswordInputs.email,
          verificationCode: formattedCode
        });
        
        console.log('OTP verification response (step 1):', response.data);
        
        // Add a standard valid flag to the response data to ensure consistent interface
        const standardizedResponse = {
          ...response.data,
          valid: true  // If the request was successful (didn't throw), we consider it valid
        };
        
        console.log('Standardized OTP verification response:', standardizedResponse);
        return standardizedResponse; // Return standardized response with valid flag
      }
      
      // This is the full password reset (step 2 of two-step verification)
      console.log('Attempting to reset password with verified OTP (step 2 of 2):', {
        email: forgotPasswordInputs.email,
        originalCode: verificationCode,
        formattedCode: formattedCode,
        hasNewPassword: !!newPassword
      });
      
      // Verify the code and reset password
      // Use the password provided directly from OTP verification component
      const response = await axios.post(`${getApiBaseUrl()}/verification/verify-and-reset-password`, {
        email: forgotPasswordInputs.email,
        verificationCode: formattedCode,
        newPassword: newPassword || forgotPasswordInputs.newPassword // Use provided password or fallback
      });
      
      console.log('Password reset successful:', response.data);
      
      // Return the response data - let the OTP component handle the success state
      // This prevents showing two success messages and the brief popup flash
      return response.data;
      
      // NOTE: We're removing the code below to prevent the second popup
      // The OTP component will handle showing the success message and closing itself
      /*
      // Reset form and show success message
      setResetSuccess(true);
      setResetStage("success");
      setShowOtpVerification(false);
      
      // Reset form
      setForgotPasswordInputs({
        username: "",
        email: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetSuccess(false);
        setResetStage("request");
      }, 2000);
      */
      
      return Promise.resolve();
    } catch (err) {
      console.error('OTP verification failed:', {
        error: err.response?.data || err.message,
        status: err.response?.status,
        email: forgotPasswordInputs.email,
        verificationCodeLength: verificationCode?.length
      });
      return Promise.reject(err);
    }
  };
  
  const handleResendResetOtp = async () => {
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
      
      // Resend verification code
      await axios.post(`${getApiBaseUrl()}/verification/request-password-reset`, {
        email: forgotPasswordInputs.email
      });
      
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
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
      {/* OTP Verification is now handled inside the modal overlay */}
      {showForgotPassword && (
        <div className="modal-overlay">
          {showOtpVerification ? (
            <OtpVerification
              email={forgotPasswordInputs.email}
              onVerify={handleVerifyReset}
              onResend={handleResendResetOtp}
              onCancel={() => {
                setShowOtpVerification(false);
                setResetStage("request");
              }}
              verificationPurpose="passwordReset"
            />
          ) : (
            <div className="forgot-password-modal">
              <div className="modal-header">
                <h2>Reset Password</h2>
                <button 
                  type="button" 
                  className="close-btn" 
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetStage("request");
                  }}
                >
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleForgotPassword} className="forgot-password-form">
                {resetStage === "request" ? (
                  <>
                    <p className="modal-description">Enter your email address and we'll send you a verification code to reset your password.</p>
                    <div className="input-group">
                      <Email className="input-icon" />
                      <input
                        type="email"
                        placeholder="Email Address"
                        name="email"
                        value={forgotPasswordInputs.email}
                        onChange={handleForgotPasswordChange}
                        className={forgotPasswordErr ? 'error' : ''}
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="modal-description">Create a new secure password for your account.</p>
                    <div className="input-group">
                      <Lock className="input-icon" />
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
                      <Lock className="input-icon" />
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
                  </>
                )}
              
                {forgotPasswordErr && (
                  <div className="error-message">
                    {forgotPasswordErr}
                  </div>
                )}
                
                {resetSuccess && (
                  <div className="success-message">
                    <CheckCircle /> Password reset successful!
                  </div>
                )}
                
                <button 
                  type="submit" 
                  className="reset-btn" 
                  disabled={isForgotPasswordLoading}
                >
                  {isForgotPasswordLoading ? "Resetting..." : "Reset Password"}
                  {!isForgotPasswordLoading && <ArrowForward style={{ marginLeft: '5px' }} />}
                </button>
              </form>
            </div>
          )}
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
                  {err}
                </div>
              )}

              <div className="form-options">
                <div></div> {/* Empty div to maintain space-between layout */}
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
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
                {!isLoading && <ArrowForward style={{ marginLeft: '5px' }} />}
              </button>
              
              <div className="social-login">
                <div className="divider">
                  <span>Or Sign In With</span>
                </div>
                
                <div className="social-buttons">
                  <button type="button" className="social-btn google">
                    <Google />
                  </button>
                  <button type="button" className="social-btn facebook">
                    <Facebook />
                  </button>
                  <button type="button" className="social-btn twitter">
                    <Twitter />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
