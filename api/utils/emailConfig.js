import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a transporter using environment variables
export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: process.env.EMAIL_VERIFICATION,
    pass: process.env.EMAIL_VERIFICATION_PASSWORD,
  },
  // Add timeout and connection pool settings
  pool: true, // Use pooled connections
  maxConnections: 5, // Limit concurrent connections
  maxMessages: 100, // Limit messages per connection
  socketTimeout: 30000, // 30 seconds timeout for socket connections
  connectionTimeout: 30000, // 30 seconds timeout for TCP connection
  // Add retry settings
  tls: {
    rejectUnauthorized: false // Less strict about TLS
  }
});

// Function to verify the transporter connection
export const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('Email server connection verified');
    return true;
  } catch (error) {
    console.error('Email server connection failed:', error);
    return false;
  }
};
