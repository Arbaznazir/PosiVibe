import "./privacy.scss";
import { Link } from "react-router-dom";
import { ArrowBack } from "@mui/icons-material";
import { useState, useEffect } from "react";

const Privacy = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="privacy-page">
      {/* Navigation bar */}
      <div className={`privacy-nav ${isScrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <Link to="/" className="back-link">
            <ArrowBack />
            Back to Home
          </Link>
          <div className="logo">
            <img src="/logo.png" alt="PosiVibe Logo" />
            <span>PosiVibe</span>
          </div>
        </div>
      </div>

      {/* Hero section */}
      <div className="privacy-hero">
        <div className="container">
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last Updated: August 10, 2025</p>
        </div>
      </div>

      {/* Content section */}
      <div className="privacy-content">
        <div className="container">
          <div className="section">
            <h2>1. Introduction</h2>
            <p>
              At PosiVibe, we believe in complete transparency about how we handle your data. This Privacy Policy explains in clear terms what information we collect, why we collect it, how we use it, and the control you have over your information.
            </p>
            <p>
              <strong>Our Promise:</strong> We are committed to minimizing data collection to only what's necessary, being transparent about our practices, and giving you control over your information.
            </p>
          </div>

          <div className="section">
            <h2>2. Information We Collect</h2>
            <p>
              We collect only the minimum information needed to provide you with a positive social media experience:
            </p>
            <h3>2.1 Information You Provide</h3>
            <ul>
              <li><strong>Account Information:</strong> Your name, email address, password (stored securely), and optional profile information like bio and profile picture.</li>
              <li><strong>Content You Create:</strong> Posts, comments, stories, and messages you create on the platform.</li>
              <li><strong>Communications:</strong> Messages you exchange with other users.</li>
            </ul>
            
            <h3>2.2 Information Collected Automatically</h3>
            <ul>
              <li><strong>Usage Data:</strong> How you interact with our platform, including features you use and time spent.</li>
              <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers.</li>
              <li><strong>Log Data:</strong> IP address, browser type, pages visited, time and date of visits, and other statistics.</li>
            </ul>
            
            <h3>2.3 What We DON'T Collect</h3>
            <ul>
              <li>We don't track your activity across other websites or apps</li>
              <li>We don't sell your browsing history or search queries to advertisers</li>
              <li>We don't collect unnecessary personal information</li>
              <li>We don't access your contacts or address book unless you explicitly permit it for finding friends</li>
            </ul>
          </div>

          <div className="section">
            <h2>3. How We Use Your Information</h2>
            <p>
              We use your information only for specific, limited purposes:
            </p>
            <ul>
              <li><strong>Provide and Improve Services:</strong> To operate the platform, personalize your experience, and develop new features.</li>
              <li><strong>Content Moderation:</strong> To maintain a positive environment through our AI-powered moderation system.</li>
              <li><strong>Communications:</strong> To send you important updates about the service.</li>
              <li><strong>Security:</strong> To protect against harmful activity and maintain the safety of our platform.</li>
            </ul>
            <p>
              <strong>Honest Disclosure:</strong> We use AI-powered content moderation to review posts, stories, and messages to ensure they comply with our community guidelines. This helps maintain a positive environment, but we want you to know that your content is being analyzed for this purpose.
            </p>
          </div>

          <div className="section">
            <h2>4. Data Sharing and Disclosure</h2>
            <p>
              We share your information in very limited circumstances:
            </p>
            <ul>
              <li><strong>With Your Consent:</strong> When you explicitly allow us to share your information.</li>
              <li><strong>Service Providers:</strong> With trusted partners who help us operate our services (e.g., cloud storage providers).</li>
              <li><strong>Legal Requirements:</strong> When required by law, legal process, or to protect rights and safety.</li>
            </ul>
            <p>
              <strong>We Do Not Sell Your Data:</strong> Unlike many social platforms, we do not sell your personal information to advertisers or data brokers under any circumstances.
            </p>
          </div>

          <div className="section">
            <h2>5. Your Rights and Controls</h2>
            <p>
              You have complete control over your data:
            </p>
            <ul>
              <li><strong>Access:</strong> You can access and download a copy of your data at any time.</li>
              <li><strong>Edit:</strong> You can update or correct your personal information.</li>
              <li><strong>Delete:</strong> You can delete specific content or your entire account.</li>
              <li><strong>Restrict:</strong> You can limit what information is visible to others.</li>
              <li><strong>Object:</strong> You can object to our processing of your data in certain circumstances.</li>
            </ul>
            <p>
              To exercise these rights, visit your account settings or contact us at privacy@posivibe.com.
            </p>
          </div>

          <div className="section">
            <h2>6. Data Security</h2>
            <p>
              We implement strong security measures to protect your information:
            </p>
            <ul>
              <li>Encryption of sensitive data in transit and at rest</li>
              <li>Regular security audits and vulnerability testing</li>
              <li>Access controls limiting who can access user data</li>
              <li>Continuous monitoring for suspicious activity</li>
            </ul>
            <p>
              <strong>Honest Disclosure:</strong> As a student project, our security resources may be more limited than commercial platforms. We implement best practices within our capabilities, but we cannot guarantee absolute security.
            </p>
          </div>

          <div className="section">
            <h2>7. Data Retention</h2>
            <p>
              We keep your data only as long as necessary:
            </p>
            <ul>
              <li>Account information is retained while your account is active</li>
              <li>Content you create remains until you delete it or your account</li>
              <li>Stories automatically delete after 24 hours</li>
              <li>Log data is retained for a maximum of 90 days</li>
            </ul>
            <p>
              When you delete your account, we permanently delete your personal information within 30 days, except where legally required to retain it.
            </p>
          </div>

          <div className="section">
            <h2>8. Children's Privacy</h2>
            <p>
              PosiVibe is designed for users who are 13 years of age or older. We do not knowingly collect information from children under 13. If we learn that we have collected information from a child under 13, we will delete that information as quickly as possible.
            </p>
            <p>
              If you believe we might have information from or about a child under 13, please contact us at privacy@posivibe.com.
            </p>
          </div>

          <div className="section">
            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any significant changes through the platform or via email. Your continued use of PosiVibe after such modifications constitutes your acknowledgment of the modified Privacy Policy.
            </p>
          </div>

          <div className="section">
            <h2>10. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p>
              Email: arbaznazir74@gmail.com<br />
              Address: Kuchmulla Tral, Pulwama, Kashmir
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="privacy-footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} PosiVibe. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
