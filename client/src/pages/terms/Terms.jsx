import "./terms.scss";
import { Link } from "react-router-dom";
import { ArrowBack } from "@mui/icons-material";
import { useState, useEffect } from "react";

const Terms = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="terms-page">
      {/* Navigation bar */}
      <div className={`terms-nav ${isScrolled ? "scrolled" : ""}`}>
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
      <div className="terms-hero">
        <div className="container">
          <h1>Terms of Service</h1>
          <p className="last-updated">Last Updated: August 10, 2025</p>
        </div>
      </div>

      {/* Content section */}
      <div className="terms-content">
        <div className="container">
          <div className="section">
            <h2>1. Introduction</h2>
            <p>
              Welcome to PosiVibe! These Terms of Service ("Terms") govern your access to and use of the PosiVibe website, mobile application, and services (collectively, the "Service"). By using our Service, you agree to be bound by these Terms. If you don't agree to these Terms, you may not use the Service.
            </p>
            <p>
              <strong>Honest Disclosure:</strong> PosiVibe is a student project created for educational purposes and is not a commercial product. While we strive to provide a positive social media experience, we have limited resources and may not offer the same level of features, security, or support as established platforms.
            </p>
          </div>

          <div className="section">
            <h2>2. Who Can Use the Service</h2>
            <p>
              PosiVibe is designed for users who are 13 years of age or older. The platform is safe and family-friendly, as we do not allow any 18+ content or inappropriate material. If you're under 13, you are not permitted to use our Service.
            </p>
            <ul>
              <li>You must be at least 13 years old to use our Service</li>
              <li>You have the right, authority, and capacity to agree to these Terms</li>
              <li>You will use PosiVibe in compliance with all applicable laws and regulations</li>
            </ul>
            <p>
              <strong>Honest Disclosure:</strong> We maintain a safe environment by strictly prohibiting inappropriate content and employing AI-powered content moderation to ensure all interactions remain positive and appropriate for users 13 and older.
            </p>
          </div>

          <div className="section">
            <h2>3. Your Account and Responsibilities</h2>
            <p>
              When you create an account, you must provide accurate and complete information. You are responsible for:
            </p>
            <ul>
              <li>Safeguarding your password</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
            <p>
              <strong>Honest Disclosure:</strong> While we implement basic security measures, we cannot guarantee that unauthorized access to your account will never occur. We're a small team with limited resources for security monitoring.
            </p>
          </div>

          <div className="section">
            <h2>4. Content and Conduct</h2>
            <p>
              You retain ownership of the content you post on PosiVibe. However, by posting content, you grant us a non-exclusive, royalty-free license to use, display, and distribute your content in connection with the Service.
            </p>
            <p>
              You agree not to post content that:
            </p>
            <ul>
              <li>Violates others' rights, including intellectual property rights</li>
              <li>Is illegal, harmful, threatening, abusive, or harassing</li>
              <li>Contains malware or attempts to interfere with the Service</li>
              <li>Impersonates others or provides false information</li>
              <li>Promotes discrimination, hatred, or violence</li>
              <li>Contains explicit or pornographic material</li>
            </ul>
            <p>
              <strong>Honest Disclosure:</strong> We use automated AI content moderation systems that may occasionally flag legitimate content or miss problematic content. Our moderation team is small, and response times for content review may be delayed.
            </p>
          </div>

          <div className="section">
            <h2>5. Content Moderation</h2>
            <p>
              PosiVibe uses a combination of automated systems and human review to moderate content. We reserve the right to remove any content that violates these Terms. We also reserve the right to:
            </p>
            <ul>
              <li>Temporarily or permanently suspend accounts</li>
              <li>Limit the visibility of certain content</li>
              <li>Take any action we deem appropriate to maintain a positive environment</li>
            </ul>
            <p>
              <strong>Honest Disclosure:</strong> Our content moderation system uses OpenAI's content filtering API, which has its own limitations and biases. We're continuously working to improve our systems, but perfect moderation is not possible.
            </p>
          </div>

          <div className="section">
            <h2>6. Privacy and Data</h2>
            <p>
              Your privacy matters to us. Our Privacy Policy explains how we collect, use, and share your personal information. By using PosiVibe, you agree to our collection and use of information as described in the Privacy Policy.
            </p>
            <p>
              <strong>Honest Disclosure:</strong> We store user data on standard cloud servers which, while reasonably secure, may not have the same level of protection as enterprise-grade systems. We have limited resources for data protection and security audits.
            </p>
          </div>

          <div className="section">
            <h2>7. Third-Party Services</h2>
            <p>
              PosiVibe may contain links to third-party websites or services that are not owned or controlled by us. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party websites or services.
            </p>
            <p>
              <strong>Honest Disclosure:</strong> We use several third-party services for functionality, including Cloudinary for image storage, OpenAI for content moderation, and various open-source libraries. Each of these services has its own terms and privacy policies.
            </p>
          </div>

          <div className="section">
            <h2>8. Service Availability and Changes</h2>
            <p>
              We strive to keep PosiVibe available at all times, but we do not guarantee uninterrupted access to the Service. We reserve the right to modify, suspend, or discontinue any part of the Service without notice.
            </p>
            <p>
              <strong>Honest Disclosure:</strong> As a student project, PosiVibe may experience downtime, performance issues, or sudden changes. We operate with limited server resources and technical support capabilities.
            </p>
          </div>

          <div className="section">
            <h2>9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, PosiVibe and its team members will not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, resulting from your access to or use of the Service.
            </p>
            <p>
              <strong>Honest Disclosure:</strong> We're a small team of students without significant financial resources or legal protection. We cannot offer the same guarantees or take on the same liabilities as established companies.
            </p>
          </div>

          <div className="section">
            <h2>10. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. If we make material changes, we'll provide notice through the Service or by other means. Your continued use of PosiVibe after the changes take effect constitutes your acceptance of the revised Terms.
            </p>
            <p>
              <strong>Honest Disclosure:</strong> We may not always provide advance notice of minor changes to the Terms. We encourage you to review the Terms periodically.
            </p>
          </div>

          <div className="section">
            <h2>11. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time for any reason without notice. You may also delete your account at any time through the account settings.
            </p>
            <p>
              <strong>Honest Disclosure:</strong> While we strive to provide fair warning before account termination, we may need to take immediate action in cases of severe violations. Our account deletion process may not immediately remove all your data from our backups.
            </p>
          </div>

          <div className="section">
            <h2>12. Governing Law</h2>
            <p>
              These Terms shall be governed by the laws of India, without regard to its conflict of law provisions. Any disputes relating to these Terms or the Service shall be subject to the exclusive jurisdiction of the courts in Jammu and Kashmir, India.
            </p>
          </div>

          <div className="section">
            <h2>13. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="contact-info">
              Email: arbaznazir74@gmail.com<br />
              GitHub: <a href="https://github.com/Arbaznazir/PosiVibe" target="_blank" rel="noopener noreferrer">https://github.com/Arbaznazir/PosiVibe</a>
            </p>
            <p>
              <strong>Honest Disclosure:</strong> Response times to inquiries may vary as we're a small team managing this project alongside other academic commitments.
            </p>
          </div>

          <div className="section conclusion">
            <h2>Final Note</h2>
            <p>
              PosiVibe was created with the goal of providing a more positive social media experience. We're committed to transparency and continuous improvement. Thank you for being part of our community and helping us build a better social platform.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="terms-footer">
        <div className="container">
          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/about">About Us</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
          <p className="copyright">© 2025 PosiVibe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Terms;
