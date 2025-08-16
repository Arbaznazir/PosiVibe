import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import {
  createVerificationToken,
  verifyVerificationToken,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
} from "../utils/emailVerification.js";

// Store pending registrations temporarily
// In a production environment, consider using Redis or a database
const pendingRegistrations = new Map();
const pendingPasswordResets = new Map();

// Request email verification for registration
export const requestEmailVerification = async (req, res) => {
  try {
    const { email, username } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Check if username already exists
    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(409).json({ error: "Username already taken" });
      }
    }

    // Generate verification token and code
    const { token, verificationCode } = createVerificationToken(email);

    // Store user data temporarily
    pendingRegistrations.set(email, {
      ...req.body,
      verificationToken: token,
      createdAt: new Date()
    });

    // Send verification email
    await sendVerificationEmail(email, verificationCode);

    // Set timeout to clear pending registration after 3 minutes
    setTimeout(() => {
      if (pendingRegistrations.has(email)) {
        pendingRegistrations.delete(email);
        console.log(`Pending registration for ${email} expired`);
      }
    }, 3 * 60 * 1000); // 3 minutes

    return res.status(200).json({
      message: "Verification code sent to your email",
      email
    });
  } catch (error) {
    console.error("Email verification request error:", error);
    return res.status(500).json({ error: "Failed to send verification code" });
  }
};

// Verify email and complete registration
export const verifyAndRegister = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({ error: "Email and verification code are required" });
    }

    // Check if there's a pending registration
    const pendingUser = pendingRegistrations.get(email);
    if (!pendingUser) {
      return res.status(404).json({ 
        error: "Verification expired or not requested",
        message: "Please request a new verification code"
      });
    }

    // Verify the code
    const verification = verifyVerificationToken(
      pendingUser.verificationToken,
      verificationCode
    );

    if (!verification.valid) {
      return res.status(400).json({ 
        error: verification.message,
        message: "Invalid or expired verification code"
      });
    }

    // Hash the password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(pendingUser.password, salt);

    // Create new user
    const newUser = new User({
      username: pendingUser.username,
      email: pendingUser.email,
      password: hashedPassword,
      name: pendingUser.name,
      coverPic: null,
      profilePic: null,
      city: null,
      website: null,
    });

    await newUser.save();

    // Remove from pending registrations
    pendingRegistrations.delete(email);

    // Send welcome email
    await sendWelcomeEmail(email, pendingUser.name);

    // Return success
    return res.status(201).json({
      message: "Account created successfully! You can now log in.",
      success: true
    });
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ error: "Registration failed" });
  }
};

// Request password reset
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // For security reasons, don't reveal that the email doesn't exist
      return res.status(200).json({ 
        message: "If your email is registered, you will receive a reset code"
      });
    }

    // Generate a secure random 6-digit OTP
    const generateOTP = () => {
      // Use crypto for secure random number generation
      const randomBuffer = crypto.randomBytes(4); // 4 bytes = 32 bits of randomness
      const randomNumber = Math.abs(randomBuffer.readInt32BE(0) % 900000) + 100000;
      return randomNumber.toString();
    };
    
    // Generate OTP
    const verificationCode = generateOTP();
    console.log(`Generated secure OTP for ${email}: ${verificationCode}`);
    
    // Create a JWT token containing the OTP
    const token = jwt.sign(
      { 
        email,
        verificationCode,
        purpose: 'password_reset',
        createdAt: Date.now()
      },
      process.env.JWT_SECRET,
      { expiresIn: '3m' }
    );

    // Store reset request temporarily with the raw OTP for easier debugging
    pendingPasswordResets.set(email, {
      userId: user._id,
      verificationToken: token,
      rawOTP: verificationCode, // Store raw OTP for debugging
      createdAt: new Date()
    });

    // Send password reset email
    await sendPasswordResetEmail(email, verificationCode);

    // Set timeout to clear pending reset after 3 minutes
    setTimeout(() => {
      if (pendingPasswordResets.has(email)) {
        pendingPasswordResets.delete(email);
        console.log(`Pending password reset for ${email} expired`);
      }
    }, 3 * 60 * 1000); // 3 minutes

    return res.status(200).json({
      message: "Password reset code sent to your email",
      email
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return res.status(500).json({ error: "Failed to send reset code" });
  }
};

// Verify OTP only (step 1 of two-step verification)
export const verifyOtp = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    console.log("OTP verification attempt (step 1):", { email, verificationCode: verificationCode?.substring(0, 2) + "****" });

    if (!email || !verificationCode) {
      return res.status(400).json({ error: "Email and verification code are required" });
    }

    // Check if there's a pending password reset for this email
    const pendingReset = pendingPasswordResets.get(email);
    console.log("Pending reset status:", { 
      exists: !!pendingReset,
      tokenExists: pendingReset?.verificationToken ? "yes" : "no",
      createdAt: pendingReset?.createdAt
    });

    if (!pendingReset) {
      return res.status(404).json({ error: "No password reset request found for this email" });
    }

    // Get the stored verification token
    // NOTE: property is stored as 'rawOTP' during requestPasswordReset()
    const { verificationToken, rawOTP } = pendingReset;

    console.log("Verification inputs:", {
      storedToken: verificationToken?.substring(0, 10) + "...",
      providedCode: verificationCode?.substring(0, 2) + "****",
      storedRawOtp: rawOTP?.substring(0, 2) + "****"
    });

    // First try direct comparison with raw OTP (for debugging)
    const directMatch = rawOTP === verificationCode;
    console.log("Direct OTP comparison:", directMatch ? "MATCH" : "NO MATCH");

    // Then verify the token
    const verification = verifyVerificationToken(verificationToken, verificationCode);
    const isValid = verification?.valid === true;
    console.log("JWT verification result:", isValid ? "VALID" : "INVALID");

    // Reject only if BOTH checks fail. The directMatch is for debugging only.
    if (!isValid && !directMatch) {
      return res.status(400).json({ error: "Invalid or expired verification code" });
    }

    // OTP is valid, but we don't reset the password yet
    // We'll keep the pending reset in memory for the second step
    return res.status(200).json({ message: "OTP verification successful", valid: true });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Verify and reset password (step 2 of two-step verification)
export const verifyAndResetPassword = async (req, res) => {
  try {
    const { email, verificationCode, newPassword } = req.body;
    
    console.log('Password reset verification attempt:', { 
      email, 
      verificationCode, 
      verificationCodeType: typeof verificationCode,
      verificationCodeLength: verificationCode?.length,
      hasPassword: !!newPassword 
    });

    if (!email || !verificationCode || !newPassword) {
      console.log('Missing required fields:', { 
        hasEmail: !!email, 
        hasVerificationCode: !!verificationCode, 
        hasNewPassword: !!newPassword 
      });
      return res.status(400).json({ 
        error: "Email, verification code, and new password are required" 
      });
    }
    
    // Normalize verification code to ensure it's a string with only digits
    const normalizedCode = String(verificationCode).trim().replace(/\D/g, '');
    console.log('Normalized verification code:', { 
      original: verificationCode,
      normalized: normalizedCode,
      normalizedLength: normalizedCode.length
    });
    
    if (normalizedCode.length !== 6) {
      return res.status(400).json({ 
        error: "Verification code must be 6 digits",
        message: "Please enter a valid 6-digit code"
      });
    }

    // Password validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        error: "Password must be at least 8 characters with 1 uppercase letter and 1 number" 
      });
    }

    // Check if there's a pending password reset
    const pendingReset = pendingPasswordResets.get(email);
    console.log('Pending reset found:', { 
      email,
      pendingResetKeys: Array.from(pendingPasswordResets.keys()),
      pendingResetCount: pendingPasswordResets.size,
      pendingResetAge: pendingReset ? (Date.now() - pendingReset.createdAt) / 1000 + ' seconds' : 'N/A'
    });

    if (!pendingReset) {
      return res.status(404).json({ error: "No password reset request found for this email" });
    }

    // Get the stored verification token
    // NOTE: property is stored as 'rawOTP' during requestPasswordReset()
    const { verificationToken, rawOTP } = pendingReset;

    console.log("Verification inputs:", {
      storedToken: verificationToken?.substring(0, 10) + "...",
      providedCode: verificationCode?.substring(0, 2) + "****",
      storedRawOtp: rawOTP?.substring(0, 2) + "****"
    });

    // First try direct comparison with raw OTP (for debugging)
    const directMatch = rawOTP === verificationCode;
    console.log("Direct OTP comparison:", directMatch ? "MATCH" : "NO MATCH");

    // Then verify the token
    const verification = verifyVerificationToken(verificationToken, verificationCode);
    const isValid = verification?.valid === true;
    console.log("JWT verification result:", isValid ? "VALID" : "INVALID");

    // Reject only if BOTH checks fail. The directMatch is for debugging only.
    if (!isValid && !directMatch) {
      return res.status(400).json({ error: "Invalid or expired verification code" });
    }

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash the new password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    // Update the user's password
    await User.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );

    // Remove the pending reset
    pendingPasswordResets.delete(email);

    // Send confirmation email
    // TODO: Implement password reset confirmation email

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error in verifyAndResetPassword:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

