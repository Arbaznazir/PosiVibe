import { useState, useRef, useEffect } from "react";
import { CheckCircle } from "@mui/icons-material";
import "./otpVerification.scss";

const OtpVerification = ({ 
  email, 
  onVerify, 
  onResend, 
  onCancel, 
  verificationPurpose = "registration" // "registration" or "passwordReset"
}) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [resendCount, setResendCount] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false); // Track if OTP is verified
  const [lastVerifiedOtp, setLastVerifiedOtp] = useState(""); // Track the last OTP that was verified
  
  const inputRefs = useRef([]);
  
  // Reset error state when component mounts
  useEffect(() => {
    setError("");
    setOtpVerified(false);
  }, []);

  // Set up refs for each input
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  // Handle resend timer
  useEffect(() => {
    let interval;
    if (resendTimer > 0 && !canResend) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }

    return () => clearInterval(interval);
  }, [resendTimer, canResend]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    
    // Only allow digits
    if (value && !/^\d+$/.test(value)) {
      return;
    }

    // Update the OTP array
    const newOtp = [...otp];
    newOtp[index] = value.substring(0, 1); // Only take the first character
    setOtp(newOtp);

    // Always clear errors when user changes input
    // This ensures that after an incorrect OTP, entering a new OTP will give a fresh start
    setError("");
    
    // Get the current OTP being entered
    const currentOtp = [...newOtp].join('');
    
    // Only reset verification state if the OTP is being changed and was previously verified
    // This ensures we don't unnecessarily reset verification state
    if (otpVerified && currentOtp !== lastVerifiedOtp && lastVerifiedOtp !== "") {
      console.log("OTP changed from verified OTP, resetting verification state");
      setOtpVerified(false);
    }

    // Auto-focus next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Handle backspace
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // If current input is empty and backspace is pressed, focus previous input
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    
    // Check if pasted content is a 6-digit number
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      
      // Focus the last input
      inputRefs.current[5].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if OTP is complete
    if (otp.some(digit => !digit)) {
      setError("Please enter all 6 digits of the verification code");
      return;
    }
    
    // Reset any previous error but don't reset verification state
    // This allows a previously successful verification to persist
    setError("");

    // If OTP is already verified and we're in password reset mode, validate and submit password
    if (otpVerified && verificationPurpose === "passwordReset") {
      if (!newPassword) {
        setError("Please enter a new password");
        return;
      }
      
      if (newPassword.length < 8) {
        setError("Password must be at least 8 characters long");
        return;
      }
      
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      
      setIsLoading(true);
      setError("");
      
      try {
        // Get the verification code from the already verified OTP
        const verificationCode = otp.join('');
        
        // Submit the password reset request with the verified OTP and new password
        await onVerify(verificationCode, newPassword);
        
        // Show success message in this component instead of closing immediately
        setIsSuccess(true);
        
        // Let the success message show for 2 seconds before closing the entire modal
        setTimeout(() => {
          // First call onCancel to close the OTP verification component
          if (onCancel) {
            onCancel();
          }
          
          // Then close the parent modal by redirecting to login page
          setTimeout(() => {
            window.location.href = "/login";
          }, 100);
        }, 2000);
      } catch (err) {
        console.error('Password reset error:', err.response?.data || err);
        setError(err.response?.data?.message || err.response?.data?.error || "Password reset failed");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // If OTP is not yet verified, verify it first
    setIsLoading(true);
    setError("");

    try {
      // FIXED: Use a more reliable method to create the verification code
      // First, ensure each digit is a number (or '0' if invalid)
      const cleanDigits = otp.map(digit => {
        const numDigit = parseInt(digit, 10);
        return isNaN(numDigit) ? '0' : numDigit.toString();
      });
      
      // Join the digits into a 6-digit string
      const verificationCode = cleanDigits.join('');
      
      // Final validation check
      if (verificationCode.length !== 6) {
        console.error('Invalid OTP length:', verificationCode);
        setError("Please enter exactly 6 digits");
        setIsLoading(false);
        return;
      }
      
      // Log verification attempt
      console.log("Attempting to verify OTP:", {
        originalOtp: otp,
        cleanDigits: cleanDigits,
        verificationCode: verificationCode,
        email: email
      });
      
      // For registration, complete the verification
      if (verificationPurpose === "registration") {
        await onVerify(verificationCode);
        setIsSuccess(true);
        
        // Show success message for 2 seconds before redirecting
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } else {
        try {
          // For password reset, just verify the OTP without submitting password yet
          // We'll use a special verification mode that just checks the OTP
          const response = await onVerify(verificationCode, null, true); // true = verify only mode
          
          // Detailed debugging of the response structure
          console.log("Server OTP verification response (full):", response);
          console.log("Response type:", typeof response);
          console.log("Response has valid property:", response && 'valid' in response);
          console.log("Response has data property:", response && 'data' in response);
          if (response && response.data) {
            console.log("Response.data has valid property:", 'valid' in response.data);
          }
          
          // Extract the actual response data
          // In Login.jsx, we standardized the response to always include a 'valid' property
          console.log("FULL RESPONSE OBJECT:", JSON.stringify(response, null, 2));
          
          // Simple check for the standardized valid flag
          // This is the ONLY check we need now that we've standardized the response
          const isValid = response && response.valid === true;
          
          if (isValid) {
            // OTP is valid - show password fields
            console.log("Server confirmed OTP is valid!");
            setOtpVerified(true);
            setLastVerifiedOtp(verificationCode); // Store the verified OTP
            setError(""); // Important: clear any previous error
            setIsLoading(false); // Make sure to stop loading
            // Ensure we don't throw any errors after successful verification
            return; // Exit early on success
          } else {
            // Something went wrong but no error was thrown
            console.log("Server response did not confirm OTP validity:", response);
            setOtpVerified(false);
            setLastVerifiedOtp(""); // Clear the last verified OTP
            setError("OTP verification failed. Please check your code.");
            setIsLoading(false); // Make sure to stop loading
          }
        } catch (verifyError) {
          // Handle verification error specifically
          console.error('OTP verification error:', verifyError);
          setOtpVerified(false);
          setLastVerifiedOtp(""); // Clear the last verified OTP
          setError("OTP entered is wrong");
          setIsLoading(false); // Make sure to stop loading
          // Don't re-throw the error, handle it here completely
          // This prevents the outer catch block from overriding our error message
          return; // Exit early on error to prevent further error handling
        }
      }
    } catch (err) {
      // This is the outer catch block - it should only run if the inner try/catch didn't handle the error
      console.error('Outer verification error handler:', err.response?.data || err);
      
      // Only set error if it's not already set (don't override inner catch block)
      if (!error) {
        // Reset OTP verification status when there's an error
        setOtpVerified(false);
        setLastVerifiedOtp(""); // Clear the last verified OTP
        
        // Check for specific OTP error messages
        if (err.response?.data?.error?.includes("verification code") || 
            err.response?.status === 400) {
          setError("OTP entered is wrong");
        } else {
          setError(err.response?.data?.message || err.response?.data?.error || "Verification failed");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      await onResend();
      
      // Reset timer and increment resend count
      setResendCount(prev => prev + 1);
      setCanResend(false);
      
      // Set timer to 30s for first resend, then 60s for subsequent resends
      setResendTimer(resendCount === 0 ? 30 : 60);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="otp-verification">
      <div className="otp-container">
        <div className="otp-header">
          <h2>{verificationPurpose === "registration" ? "Verify Your Email" : "Reset Your Password"}</h2>
          <button 
            type="button" 
            className="close-btn" 
            onClick={onCancel}
          >
            &times;
          </button>
        </div>
        
        <div className="otp-content">
          <p className="otp-message">
            We've sent a 6-digit verification code to <strong>{email}</strong>
          </p>
          
          <form onSubmit={handleSubmit} className="otp-form">
            <div className="otp-inputs">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={index === 0 ? handlePaste : null}
                  disabled={isLoading || isSuccess}
                  autoFocus={index === 0 && !otpVerified}
                />
              ))}
            </div>
            
            {/* Password fields for password reset - only shown after OTP verification */}
            {otpVerified && !error && verificationPurpose === "passwordReset" && (
              <div className="password-fields">
                <div className="success-message">
                  OTP verified successfully! Please set your new password.
                </div>
                <div className="password-field">
                  <label>New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="password-field">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="otp-actions">
              <button 
                type="submit" 
                className="verify-btn"
                disabled={isLoading || isSuccess || otp.some(digit => !digit) || 
                  (otpVerified && verificationPurpose === "passwordReset" && 
                   (!newPassword || !confirmPassword))}
              >
                {isLoading ? "Verifying..." : isSuccess ? (
                  <>
                    <CheckCircle /> Verified
                  </>
                ) : otpVerified ? "Reset Password" : "Verify Code"}
              </button>
              
              <div className="resend-container">
                <button 
                  type="button"
                  className={`resend-btn ${!canResend ? "disabled" : ""}`}
                  onClick={handleResend}
                  disabled={!canResend || isLoading || isSuccess || otpVerified}
                >
                  Resend Code
                </button>
                {!canResend && !otpVerified && (
                  <span className="resend-timer">in {resendTimer}s</span>
                )}
              </div>
            </div>
          </form>
          
          <div className="otp-footer">
            <p>
              Didn't receive the code? Check your spam folder or{" "}
              <button 
                type="button"
                className="text-btn"
                onClick={onCancel}
              >
                try a different email
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpVerification;
