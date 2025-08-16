import jwt from 'jsonwebtoken';
import { transporter } from './emailConfig.js';
import { 
  Verification_Email_Template, 
  Welcome_Email_Template,
  Password_Reset_Email_Template 
} from './emailTemplates.js';
import crypto from 'crypto';
import { checkEmailConfig } from './fixEnv.js';

// Generate a cryptographically secure random 6-digit verification code
const generateVerificationCode = () => {
  // Use a more secure approach to generate random numbers
  // Generate a random buffer and convert to a number between 100000-999999
  const randomBuffer = crypto.randomBytes(4); // 4 bytes = 32 bits of randomness
  const randomNumber = Math.abs(randomBuffer.readInt32BE(0) % 900000) + 100000;
  // Always return as string to ensure consistent type handling
  return randomNumber.toString();
};

// Create a JWT token with the verification code and email
// Token expires in 3 minutes (180 seconds)
export const createVerificationToken = (email) => {
  // First generate a random OTP
  const verificationCode = generateVerificationCode();
  console.log(`Generated OTP for ${email}: ${verificationCode}`);
  
  // Then create a JWT token containing the OTP and email
  const token = jwt.sign(
    { 
      email, 
      verificationCode,
      createdAt: Date.now() 
    },
    process.env.JWT_SECRET,
    { expiresIn: '3m' }
  );
  
  return { token, verificationCode };
};

// Verify the token and check if the verification code matches
export const verifyVerificationToken = (token, userProvidedCode) => {
  try {
    // Validate inputs
    if (!token || !userProvidedCode) {
      console.error('Missing token or verification code');
      return { valid: false, message: 'Missing verification information' };
    }
    
    // Normalize user-provided code (remove spaces, non-digits, etc.)
    const normalizeCode = (code) => {
      return String(code).trim().replace(/\D/g, '');
    };
    
    const normalizedUserCode = normalizeCode(userProvidedCode);
    
    // Log verification attempt
    console.log('OTP Verification attempt:', { 
      hasToken: !!token, 
      userCode: normalizedUserCode
    });
    
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Extract the OTP from the token
    const tokenOTP = normalizeCode(decoded.verificationCode);
    const tokenEmail = decoded.email;
    const tokenCreatedAt = decoded.createdAt;
    const tokenAge = Date.now() - tokenCreatedAt;
    
    // Log detailed verification information
    console.log('OTP Verification details:', { 
      tokenOTP,
      userOTP: normalizedUserCode,
      tokenEmail,
      tokenCreatedAt: new Date(tokenCreatedAt).toISOString(),
      tokenAgeSeconds: Math.floor(tokenAge / 1000),
      match: tokenOTP === normalizedUserCode
    });
    
    // Check if the verification code matches exactly
    if (tokenOTP === normalizedUserCode) {
      console.log('✅ OTP Verification successful!');
      return { valid: true, email: tokenEmail };
    } else {
      console.log('❌ OTP Verification failed: codes do not match');
      console.log(`  Expected: '${tokenOTP}', Received: '${normalizedUserCode}'`);
      return { valid: false, message: 'Invalid verification code' };
    }
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return { valid: false, message: 'Verification code has expired (3-minute limit)' };
    }
    
    return { valid: false, message: 'Invalid or corrupted verification token' };
  }
};

// Send verification email
export const sendVerificationEmail = async (email, verificationCode) => {
  try {
    // Check if we should use mock email service
    if (process.env.USE_MOCK_EMAIL === 'true') {
      console.log('📧 MOCK EMAIL: Verification code for', email, 'is:', verificationCode);
      console.log('📧 MOCK EMAIL: Using mock email service (no actual email sent)');
      return { success: true, mock: true };
    }
    
    // Use real email service
    const response = await transporter.sendMail({
      from: '"PosiVibe" <posivibe.verify@gmail.com>',
      to: email,
      subject: "Verify your Email",
      text: "Verify your Email",
      html: Verification_Email_Template.replace("{verificationCode}", verificationCode)
    });
    console.log('Verification email sent successfully', response);
    return { success: true };
  } catch (error) {
    console.error('Email error', error);
    
    // Fallback to mock email if real email fails
    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 FALLBACK TO MOCK EMAIL: Verification code for', email, 'is:', verificationCode);
      console.log('📧 FALLBACK TO MOCK EMAIL: Real email failed, using mock service');
      process.env.USE_MOCK_EMAIL = 'true'; // Switch to mock for future emails
      return { success: true, mock: true, fallback: true };
    }
    
    return { success: false, error };
  }
};

// Send welcome email
export const sendWelcomeEmail = async (email, name) => {
  try {
    const response = await transporter.sendMail({
      from: '"PosiVibe" <posivibe.verify@gmail.com>',
      to: email,
      subject: "Welcome to PosiVibe!",
      text: "Welcome to PosiVibe!",
      html: Welcome_Email_Template.replace("{name}", name)
    });
    console.log('Welcome email sent successfully', response);
    return { success: true };
  } catch (error) {
    console.error('Email error', error);
    return { success: false, error };
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, verificationCode) => {
  try {
    // Check if we should use mock email service
    if (process.env.USE_MOCK_EMAIL === 'true') {
      console.log('📧 MOCK EMAIL: Password reset code for', email, 'is:', verificationCode);
      console.log('📧 MOCK EMAIL: Using mock email service (no actual email sent)');
      return { success: true, mock: true };
    }
    
    // Use real email service
    const response = await transporter.sendMail({
      from: '"PosiVibe" <posivibe.verify@gmail.com>',
      to: email,
      subject: "Password Reset Request",
      text: "Password Reset Request",
      html: Password_Reset_Email_Template.replace("{verificationCode}", verificationCode)
    });
    console.log('Password reset email sent successfully', response);
    return { success: true };
  } catch (error) {
    console.error('Email error', error);
    
    // Fallback to mock email if real email fails
    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 FALLBACK TO MOCK EMAIL: Password reset code for', email, 'is:', verificationCode);
      console.log('📧 FALLBACK TO MOCK EMAIL: Real email failed, using mock service');
      process.env.USE_MOCK_EMAIL = 'true'; // Switch to mock for future emails
      return { success: true, mock: true, fallback: true };
    }
    
    return { success: false, error };
  }
};
