import "./guidelines.scss";
import { Link } from "react-router-dom";
import { ArrowBack } from "@mui/icons-material";
import { useState, useEffect } from "react";

const Guidelines = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="guidelines-page">
      {/* Navigation bar */}
      <div className={`guidelines-nav ${isScrolled ? "scrolled" : ""}`}>
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
      <div className="guidelines-hero">
        <div className="container">
          <h1>Community Guidelines</h1>
          <p className="last-updated">Last Updated: August 10, 2025</p>
        </div>
      </div>

      {/* Content section */}
      <div className="guidelines-content">
        <div className="container">
          <div className="intro-section">
            <p>
              At PosiVibe, we're building a community where everyone feels welcome, safe, and empowered to express themselves positively. These guidelines outline the values and behaviors we expect from all community members to maintain a healthy and supportive environment.
            </p>
            <p>
              Our AI-powered content moderation helps enforce these guidelines, but we also rely on you—our community—to uphold these standards in your interactions and report content that violates them.
            </p>
          </div>

          <div className="section">
            <h2>1. Be Positive and Supportive</h2>
            <p>
              PosiVibe is founded on the principle of positive interactions. We encourage:
            </p>
            <ul>
              <li>Sharing uplifting content and stories</li>
              <li>Offering constructive feedback and support</li>
              <li>Celebrating others' achievements and milestones</li>
              <li>Using encouraging and respectful language</li>
            </ul>
            <div className="example-box">
              <h4>Examples:</h4>
              <div className="example good">
                <h5>✓ Encouraged</h5>
                <p>"I love how you expressed yourself in this post! Your creativity is inspiring."</p>
              </div>
              <div className="example bad">
                <h5>✗ Discouraged</h5>
                <p>"This is boring. Nobody cares about your achievements."</p>
              </div>
            </div>
          </div>

          <div className="section">
            <h2>2. Respect Everyone's Dignity</h2>
            <p>
              Treat all community members with respect, regardless of their background, identity, or beliefs:
            </p>
            <ul>
              <li>Be mindful of cultural differences and perspectives</li>
              <li>Avoid making assumptions about others</li>
              <li>Listen actively when others share their experiences</li>
              <li>Acknowledge and respect different viewpoints, even when you disagree</li>
            </ul>
            <div className="example-box">
              <h4>Examples:</h4>
              <div className="example good">
                <h5>✓ Encouraged</h5>
                <p>"I see this differently, but I appreciate you sharing your perspective."</p>
              </div>
              <div className="example bad">
                <h5>✗ Discouraged</h5>
                <p>"Your opinion is stupid and you should feel bad for thinking that way."</p>
              </div>
            </div>
          </div>

          <div className="section">
            <h2>3. No Hate Speech or Discrimination</h2>
            <p>
              We have zero tolerance for content that promotes hatred, discrimination, or prejudice based on:
            </p>
            <ul>
              <li>Race, ethnicity, or national origin</li>
              <li>Religion or belief system</li>
              <li>Gender identity or expression</li>
              <li>Sexual orientation</li>
              <li>Age, disability, or health condition</li>
              <li>Any other personal characteristic</li>
            </ul>
            <p>
              This includes slurs, stereotypes, or content that dehumanizes or encourages violence against any group or individual.
            </p>
          </div>

          <div className="section">
            <h2>4. No Harassment or Bullying</h2>
            <p>
              Everyone deserves to feel safe on PosiVibe. The following behaviors are prohibited:
            </p>
            <ul>
              <li>Targeted insults or humiliation</li>
              <li>Persistent unwanted contact or attention</li>
              <li>Threats or intimidation</li>
              <li>Encouraging others to harass someone</li>
              <li>Sharing someone's personal information without consent (doxxing)</li>
              <li>Creating multiple accounts to circumvent blocks or continue unwanted contact</li>
            </ul>
          </div>

          <div className="section">
            <h2>5. Truthful and Authentic Content</h2>
            <p>
              Build trust within our community by:
            </p>
            <ul>
              <li>Not intentionally spreading misinformation</li>
              <li>Verifying information before sharing it as fact</li>
              <li>Not impersonating others or creating misleading accounts</li>
              <li>Being transparent about sponsored content or affiliations</li>
              <li>Not using bots or automated systems to artificially boost engagement</li>
            </ul>
            <div className="example-box">
              <h4>Examples:</h4>
              <div className="example good">
                <h5>✓ Encouraged</h5>
                <p>"Based on my research, this information appears to be accurate, but here's a link to verify it yourself."</p>
              </div>
              <div className="example bad">
                <h5>✗ Discouraged</h5>
                <p>Sharing fabricated statistics or quotes without verification or sources.</p>
              </div>
            </div>
          </div>

          <div className="section">
            <h2>6. Respect Privacy and Consent</h2>
            <p>
              Protect your privacy and respect others' by:
            </p>
            <ul>
              <li>Not sharing others' personal information without explicit permission</li>
              <li>Getting consent before posting photos or videos of others</li>
              <li>Respecting boundaries when someone asks you to stop contacting them</li>
              <li>Not accessing or attempting to access others' accounts</li>
            </ul>
          </div>

          <div className="section">
            <h2>7. No Adult or Explicit Content</h2>
            <p>
              PosiVibe is designed to be accessible for users 13 and older. To maintain a safe environment:
            </p>
            <ul>
              <li>Do not post sexually explicit or pornographic content</li>
              <li>Do not share content depicting violence or gore</li>
              <li>Do not post content that sexualizes minors in any way</li>
              <li>Use appropriate language in posts and messages</li>
            </ul>
            <p>
              Our AI content moderation system automatically filters inappropriate content, but we rely on our community to report anything that slips through.
            </p>
          </div>

          <div className="section">
            <h2>8. Respect Intellectual Property</h2>
            <p>
              Honor the creative work of others by:
            </p>
            <ul>
              <li>Not posting content you don't have the right to share</li>
              <li>Giving proper credit when sharing others' work</li>
              <li>Respecting copyright, trademark, and other intellectual property rights</li>
              <li>Getting permission before adapting or building upon someone else's work</li>
            </ul>
          </div>

          <div className="section">
            <h2>9. No Illegal Activities</h2>
            <p>
              Do not use PosiVibe to:
            </p>
            <ul>
              <li>Promote, organize, or encourage illegal activities</li>
              <li>Buy, sell, or trade illegal goods or services</li>
              <li>Share instructions for dangerous or illegal activities</li>
              <li>Evade law enforcement or legal obligations</li>
            </ul>
          </div>

          <div className="section">
            <h2>10. Digital Wellbeing</h2>
            <p>
              We encourage healthy social media habits:
            </p>
            <ul>
              <li>Take breaks from the platform when needed</li>
              <li>Don't pressure others to respond immediately</li>
              <li>Use our screen time management features to maintain balance</li>
              <li>Focus on quality interactions rather than quantity</li>
            </ul>
          </div>

          <div className="section">
            <h2>11. Reporting and Enforcement</h2>
            <p>
              If you encounter content that violates these guidelines:
            </p>
            <ol>
              <li>Use the report button on the post, comment, or profile</li>
              <li>Select the appropriate reason for your report</li>
              <li>Provide additional context if requested</li>
            </ol>
            <p>
              Our team reviews reports and takes appropriate action, which may include:
            </p>
            <ul>
              <li>Removing the content</li>
              <li>Issuing warnings</li>
              <li>Temporarily restricting account features</li>
              <li>Permanently suspending accounts for serious or repeated violations</li>
            </ul>
            <p>
              <strong>Note:</strong> We prioritize educational responses for first-time or minor violations, reserving stricter measures for serious or repeated issues.
            </p>
          </div>

          <div className="section">
            <h2>12. Appeals Process</h2>
            <p>
              If you believe a moderation decision was made in error, you can appeal by:
            </p>
            <ol>
              <li>Going to your account settings</li>
              <li>Selecting "Support"</li>
              <li>Choosing "Appeal a Decision"</li>
              <li>Providing relevant information about why you believe the decision should be reconsidered</li>
            </ol>
            <p>
              We review all appeals carefully and aim to respond within 48 hours.
            </p>
          </div>

          <div className="section">
            <h2>13. Changes to Guidelines</h2>
            <p>
              These guidelines may evolve as our community grows and online behaviors change. We will notify users of significant updates and always maintain the current version on this page.
            </p>
          </div>

          <div className="section">
            <h2>14. Contact Us</h2>
            <p>
              If you have questions about these guidelines or suggestions for improvement, please contact us at:
            </p>
            <p>
              Email: arbaznazir74@gmail.com<br />
              Address: Kuchmulla Tral, Pulwama, Kashmir
            </p>
          </div>

          <div className="section conclusion">
            <h2>Final Note</h2>
            <p>
              These guidelines aren't just rules—they're a reflection of the community we're building together. By following them, you help make PosiVibe a place where authentic connections and positive interactions flourish. Thank you for being part of our community and contributing to a healthier social media experience.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="guidelines-footer">
        <div className="container">
          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/about">About Us</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/guidelines">Community Guidelines</Link>
          </div>
          <p className="copyright">© 2025 PosiVibe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Guidelines;
