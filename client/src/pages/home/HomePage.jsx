import React from 'react';
import { useNavigate } from 'react-router-dom';
import './homePage.scss';

const HomePage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: '🛡️',
      title: 'Content Moderation',
      description: 'Advanced AI-powered content filtering keeps your feed clean and positive, blocking inappropriate content automatically.',
      highlight: 'Zero Tolerance Policy'
    },
    {
      icon: '⏰',
      title: 'Healthy Usage Limits',
      description: 'Built-in time tracking with daily limits to promote digital wellness and prevent social media addiction.',
      highlight: '2.5 Hours Daily Limit'
    },
    {
      icon: '🔔',
      title: 'Smart Notifications',
      description: 'Real-time notifications for likes, comments, follows, and mentions to keep you connected without overwhelming you.',
      highlight: 'Real-time Updates'
    },
    {
      icon: '🌙',
      title: 'Dark Mode Support',
      description: 'Beautiful dark and light themes that adapt to your preference and reduce eye strain during extended use.',
      highlight: 'Eye-friendly Design'
    },
    {
      icon: '📱',
      title: 'Mobile Responsive',
      description: 'Seamless experience across all devices with optimized mobile interface and touch-friendly interactions.',
      highlight: 'Cross-platform'
    },
    {
      icon: '🎨',
      title: 'Modern UI/UX',
      description: 'Clean, intuitive interface with smooth animations and glassmorphism effects for a premium feel.',
      highlight: 'Premium Experience'
    }
  ];

  const testimonials = [
    {
             name: 'Sarah Johnson',
       role: 'Digital Wellness Advocate',
       text: 'PosiVibe helped me maintain a healthy relationship with social media. The time limits are a game-changer!',
       avatar: '👩‍💼'
    },
    {
      name: 'Mike Chen',
      role: 'Content Creator',
      text: 'The content moderation is incredible. My feed is finally free from negativity and inappropriate content.',
      avatar: '👨‍💻'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Student',
      text: 'Beautiful design and the notifications system keeps me connected without being overwhelming.',
      avatar: '👩‍🎓'
    }
  ];

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
          <div className="floating-shape shape-4"></div>
        </div>
        
        <div className="hero-content">
          <div className="hero-text">
                         <h1 className="hero-title">
               Welcome to <span className="brand-gradient">PosiVibe</span>
             </h1>
            <p className="hero-subtitle">
              The social media platform that prioritizes your mental health and digital wellness
            </p>
            <p className="hero-description">
              Experience social networking with built-in content moderation, healthy usage limits, 
              and a beautiful interface designed for positive interactions.
            </p>
            
            <div className="hero-actions">
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/register')}
              >
                Get Started Free
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
            </div>
            
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">2.5h</span>
                <span className="stat-label">Daily Limit</span>
              </div>
              <div className="stat">
                <span className="stat-number">100%</span>
                <span className="stat-label">Content Filtered</span>
              </div>
              <div className="stat">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Moderation</span>
              </div>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="phone-mockup">
              <div className="phone-screen">
                <div className="mockup-header">
                  <div className="mockup-navbar">
                    <div className="nav-item">🏠</div>
                    <div className="nav-item">🔔</div>
                    <div className="nav-item">⏰</div>
                  </div>
                </div>
                <div className="mockup-content">
                  <div className="mockup-post">
                    <div className="post-header">
                      <div className="post-avatar">👤</div>
                      <div className="post-info">
                        <div className="post-name">John Doe</div>
                        <div className="post-time">2 hours ago</div>
                      </div>
                    </div>
                    <div className="post-content">
                      Beautiful sunset today! 🌅
                    </div>
                    <div className="post-actions">
                      <span>❤️ 12</span>
                      <span>💬 3</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
                     <div className="section-header">
             <h2 className="section-title">Why Choose PosiVibe?</h2>
             <p className="section-subtitle">
               Discover the features that make us different from other social platforms
             </p>
           </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <div className="feature-highlight">{feature.highlight}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Get started in just three simple steps
            </p>
          </div>
          
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Create Account</h3>
                <p>Sign up with your email and create your profile in seconds</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Set Preferences</h3>
                <p>Customize your content filters and usage limits</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Enjoy Safely</h3>
                <p>Connect with friends in a positive, moderated environment</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">What Our Users Say</h2>
            <p className="section-subtitle">
              Real feedback from people who've transformed their social media experience
            </p>
          </div>
          
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-content">
                  <p>"{testimonial.text}"</p>
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">{testimonial.avatar}</div>
                  <div className="author-info">
                    <div className="author-name">{testimonial.name}</div>
                    <div className="author-role">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Transform Your Social Experience?</h2>
            <p className="cta-subtitle">
              Join thousands of users who've already discovered healthier social networking
            </p>
            <div className="cta-actions">
              <button 
                className="btn btn-primary btn-large"
                onClick={() => navigate('/register')}
              >
                Start Your Journey
              </button>
              <button 
                className="btn btn-outline btn-large"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
                     <div className="footer-content">
             <div className="footer-brand">
               <h3>PosiVibe</h3>
               <p>Positive social networking for digital wellness</p>
               <p className="authors">Created by Arbaz Nazir, Jamsheed Mushtaq & Danish Manzoor</p>
             </div>
            <div className="footer-links">
              <div className="link-group">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="#security">Security</a>
              </div>
              <div className="link-group">
                <h4>Company</h4>
                <a href="#about">About</a>
                <a href="#careers">Careers</a>
                <a href="#contact">Contact</a>
              </div>
              <div className="link-group">
                <h4>Support</h4>
                <a href="#help">Help Center</a>
                <a href="#community">Community</a>
                <a href="#status">Status</a>
              </div>
            </div>
          </div>
                     <div className="footer-bottom">
             <p>&copy; 2024 PosiVibe. All rights reserved. Created by Arbaz Nazir, Jamsheed Mushtaq & Danish Manzoor.</p>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage; 