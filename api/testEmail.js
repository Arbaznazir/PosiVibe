import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('Starting email test...');
console.log('Email credentials:');
console.log('- User:', process.env.EMAIL_VERIFICATION);
console.log('- Password length:', process.env.EMAIL_VERIFICATION_PASSWORD ? process.env.EMAIL_VERIFICATION_PASSWORD.length : 0);

// Create a transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_VERIFICATION,
    pass: process.env.EMAIL_VERIFICATION_PASSWORD,
  },
});

// Test function
async function testEmail() {
  try {
    // Verify connection
    console.log('Verifying connection to email server...');
    await transporter.verify();
    console.log('Email server connection verified successfully!');
    
    // Send test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"PosiVibe Verification" <${process.env.EMAIL_VERIFICATION}>`,
      to: "saikajaan760@gmail.com",
      subject: "Test Email from PosiVibe",
      text: "This is a test email to verify the email configuration is working correctly.",
      html: "<b>This is a test email to verify the email configuration is working correctly.</b>",
    });
    
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    
    return true;
  } catch (error) {
    console.error('Error sending email:');
    console.error(error);
    return false;
  }
}

// Run the test
testEmail()
  .then(result => {
    console.log('Test completed with result:', result ? 'SUCCESS' : 'FAILURE');
    process.exit(result ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
