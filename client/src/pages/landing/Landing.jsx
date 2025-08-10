import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./landing.scss";
import { 
  Favorite, 
  Security, 
  Psychology, 
  Diversity3, 
  Lightbulb, 
  Visibility,
  KeyboardArrowDown
} from "@mui/icons-material";

const Landing = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  // Features data
  const features = [
    {
      icon: <Favorite />,
      title: "Positive Interactions",
      description: "Our AI-powered content moderation ensures a positive environment free from toxicity and negativity."
    },
    {
      icon: <Security />,
      title: "Privacy First",
      description: "Your data belongs to you. We prioritize privacy with transparent controls and minimal data collection."
    },
    {
      icon: <Psychology />,
      title: "Mental Wellbeing",
      description: "Features designed to promote digital wellbeing, including screen time management and mood tracking."
    },
    {
      icon: <Diversity3 />,
      title: "Authentic Connections",
      description: "Build meaningful relationships based on shared interests and values, not algorithms."
    },
    {
      icon: <Lightbulb />,
      title: "Creative Expression",
      description: "Express yourself freely with our creative tools for stories, posts, and interactions."
    },
    {
      icon: <Visibility />,
      title: "Transparency",
      description: "No hidden algorithms or manipulative design. We're transparent about how content is shown to you."
    }
  ];

  // Testimonials data
  const testimonials = [
    {
      name: "Jamsheed",
      role: "Content Creator",
      text: "PosiVibe has transformed how I connect with my audience. The positive environment makes sharing my work so much more rewarding."
    },
    {
      name: "Arbaz",
      role: "Student",
      text: "I love how PosiVibe helps me manage my screen time while still keeping me connected with friends. It's social media that actually cares about my wellbeing."
    },
    {
      name: "Danish",
      role: "Professional",
      text: "Finally, a social platform where meaningful conversations happen! The community here is supportive and genuinely interested in connecting."
    }
  ];

  // Handle scroll for navbar effects
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className={`landing-nav ${isScrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <div className="logo">
            <img src="/logo.png" alt="PosiVibe" />
            <span>PosiVibe</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#why-posivibe">Why PosiVibe</a>
            <a href="#testimonials">Testimonials</a>
          </div>
          <div className="auth-buttons">
            <Link to="/login" className="login-btn">Log In</Link>
            <Link to="/register" className="register-btn">Sign Up</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Connect Positively. <br />Live Authentically.</h1>
          <p>
            PosiVibe is a social platform designed to foster genuine connections
            and positive interactions in a world of digital noise.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="primary-btn">Join PosiVibe Today</Link>
            <a href="#features" className="secondary-btn">
              Learn More
              <KeyboardArrowDown />
            </a>
          </div>
        </div>
        <div className="hero-image">
          <div className="image-container">
            {/* Fallback content if image doesn't load */}
            <div className="fallback-hero">
              <div className="fallback-content">
                <Favorite className="fallback-icon" />
                <h3>PosiVibe Experience</h3>
                <p>Connect with others in a positive environment</p>
              </div>
            </div>
            <img src="/hero-image.png" alt="PosiVibe Experience" />
          </div>
          <div className="floating-element element-1">
            <Favorite /> Positive Vibes
          </div>
          <div className="floating-element element-2">
            <Security /> Safe Space
          </div>
          <div className="floating-element element-3">
            <Psychology /> Mental Wellbeing
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2>Features That Make Us Different</h2>
          <p>Designed with your wellbeing and authentic connections in mind</p>
        </div>
        
        <div className="features-container">
          <div className="features-showcase">
            <div className="feature-image">
              <div className="fallback-feature">
                <div className="fallback-content">
                  {features[activeFeature].icon}
                  <h3>{features[activeFeature].title}</h3>
                  <p>{features[activeFeature].description}</p>
                </div>
              </div>
              <img src="/feature-showcase.png" alt="Feature Showcase" />
            </div>
          </div>
          
          <div className="features-list">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`feature-item ${index === activeFeature ? "active" : ""}`}
                onClick={() => setActiveFeature(index)}
              >
                <div className="feature-icon">{feature.icon}</div>
                <div className="feature-content">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why PosiVibe Section */}
      <section id="why-posivibe" className="why-section">
        <div className="section-header">
          <h2>Why Choose PosiVibe?</h2>
          <p>We're reimagining social media with your wellbeing at the center</p>
        </div>
        
        <div className="comparison-table">
          <div className="comparison-header">
            <div className="empty-cell"></div>
            <div className="posivibe-cell">PosiVibe</div>
            <div className="others-cell">Other Platforms</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">Content Algorithm</div>
            <div className="posivibe-cell">Transparent, wellbeing-focused</div>
            <div className="others-cell">Engagement-optimized, addictive</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">Privacy</div>
            <div className="posivibe-cell">Privacy by design, minimal data collection</div>
            <div className="others-cell">Extensive tracking and data harvesting</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">Content Moderation</div>
            <div className="posivibe-cell">AI-powered, proactive, community-focused</div>
            <div className="others-cell">Reactive, inconsistent enforcement</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">Mental Health</div>
            <div className="posivibe-cell">Built-in wellbeing tools and time management</div>
            <div className="others-cell">Limited or afterthought features</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">Usage Limits</div>
            <div className="posivibe-cell">Time limited usage per day to promote digital wellbeing</div>
            <div className="others-cell">Designed for maximum engagement time</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">Community</div>
            <div className="posivibe-cell">Authentic connections, meaningful interactions</div>
            <div className="others-cell">Superficial engagement, follower counts</div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-header">
          <h2>What Our Community Says</h2>
          <p>Join thousands who've found a more positive social experience</p>
        </div>
        
        <div className="testimonials-container">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <div className="quote">"</div>
              <p className="testimonial-text">{testimonial.text}</p>
              <div className="testimonial-author">
                <div className="author-avatar">
                  {testimonial.name.charAt(0)}
                </div>
                <div className="author-info">
                  <h4>{testimonial.name}</h4>
                  <span>{testimonial.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to experience social media that puts you first?</h2>
          <p>Join PosiVibe today and be part of a community that values authentic connections and positive interactions.</p>
          <div className="cta-buttons">
            <Link to="/register" className="primary-btn join-btn">Join PosiVibe Today</Link>
            <Link to="/login" className="secondary-btn">Log In</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <img src="/logo.png" alt="PosiVibe" />
            <span>PosiVibe</span>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Platform</h4>
              <a href="#features">Features</a>
              <a href="#why-posivibe">Why PosiVibe</a>
              <a href="#testimonials">Testimonials</a>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Careers</a>
              <a href="#">Contact</a>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <a href="#">Terms of Service</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Community Guidelines</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} PosiVibe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
