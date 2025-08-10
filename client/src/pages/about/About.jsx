import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./about.scss";
import { 
  GitHub, 
  LinkedIn, 
  ArrowBack
} from "@mui/icons-material";

// Custom X (formerly Twitter) icon component
const XIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const About = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  // Team members data
  const teamMembers = [
    {
      name: "Jamsheed Mushtaq",
      role: "Backend Developer",
      bio: "The architecture mastermind behind our robust systems. Creates elegant database solutions that handle millions of interactions while ensuring bulletproof security and lightning-fast performance.",
      image: "/jamsheed.jpg", // Using the images from public folder
      social: {
        github: "https://github.com/BhatJamsheed",
        linkedin: "https://www.linkedin.com/in/jamsheed-mushtaq-9b4995194",
        twitter: "https://x.com/bhatjunaid1231"
      }
    },
    {
      name: "Arbaz Nazir",
      role: "Full Stack Developer + Data Analyst",
      bio: "Visionary full-stack wizard who transforms ideas into reality. Combines cutting-edge development with powerful data insights to create seamless experiences that users fall in love with.",
      image: "/arbaz.jpg",
      social: {
        github: "https://github.com/Arbaznazir",
        linkedin: "https://www.linkedin.com/in/arbaz-nazir1",
        twitter: "https://x.com/arbaz_nazir_1"
      }
    },
    {
      name: "Danish Manzoor",
      role: "Frontend Developer",
      bio: "UI/UX virtuoso who crafts digital experiences that captivate and delight. Blends artistic vision with technical excellence to create interfaces so intuitive they feel like magic.",
      image: "/danish.jpg",
      social: {
        github: "https://github.com/daanixhmanzoor786",
        linkedin: "https://linkedin.com/in/danish",
        twitter: "https://x.com/maalik_daanixh"
      }
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

  return (
    <div className="about-page">
      {/* Navbar */}
      <nav className={`about-nav ${isScrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <Link to="/" className="back-link">
            <ArrowBack /> Back to Home
          </Link>
          <div className="logo">
            <img src="/logo.png" alt="PosiVibe" />
            <span>PosiVibe</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-content">
          <h1>Our Story</h1>
          <p className="subtitle">Building a positive social experience</p>
        </div>
      </section>

      {/* Story Section */}
      <section className="story-section">
        <div className="container">
          <div className="story-content">
            <h2>How PosiVibe Began</h2>
            <p>
              PosiVibe was born during our final semester at university when we, Jamsheed, Arbaz, and Danish, 
              came together with a shared vision: to create a social platform that prioritizes positivity, 
              mental wellbeing, and authentic connections.
            </p>
            <p>
              Frustrated by the negative aspects of existing social media platforms, we wanted to build 
              something different—a space where people could connect without the anxiety, toxicity, and 
              addictive design patterns that have become so common elsewhere.
            </p>
            <p>
              What started as a university project quickly evolved into a passion. We spent countless nights 
              coding, designing, and reimagining what social media could be if it were built with user 
              wellbeing as the primary focus.
            </p>
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <h3>The Idea</h3>
                  <p>During our final semester, we identified the need for a more positive social platform</p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <h3>Research & Planning</h3>
                  <p>We studied existing platforms and identified key areas for improvement</p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <h3>Development</h3>
                  <p>Building the platform with React, Node.js, and MongoDB</p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <h3>Launch</h3>
                  <p>Releasing PosiVibe to create a more positive social media experience</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section">
        <div className="container">
          <div className="mission-content">
            <h2>Our Mission</h2>
            <p>
              At PosiVibe, we're on a mission to transform how people connect online. We believe social media 
              should enhance your life, not detract from it. Our platform is designed to:
            </p>
            <div className="mission-points">
              <div className="mission-point">
                <div className="point-icon">💫</div>
                <h3>Foster Positivity</h3>
                <p>Create an environment where positive interactions are the norm</p>
              </div>
              <div className="mission-point">
                <div className="point-icon">🛡️</div>
                <h3>Protect Privacy</h3>
                <p>Give users complete control over their data and experience</p>
              </div>
              <div className="mission-point">
                <div className="point-icon">🧠</div>
                <h3>Support Wellbeing</h3>
                <p>Design features that promote digital wellness and mental health</p>
              </div>
              <div className="mission-point">
                <div className="point-icon">🤝</div>
                <h3>Build Community</h3>
                <p>Enable meaningful connections based on shared interests and values</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <div className="container">
          <h2>Meet Our Team</h2>
          <p className="team-intro">
            We're a passionate team of developers who met at university and share a vision 
            for creating a more positive social media experience.
          </p>
          <div className="team-grid">
            {teamMembers.map((member, index) => (
              <div key={index} className="team-card">
                <div className="member-image">
                  <img src={member.image} alt={member.name} />
                </div>
                <h3>{member.name}</h3>
                <p className="member-role">{member.role}</p>
                <p className="member-bio">{member.bio}</p>
                <div className="social-links">
                  <a href={member.social.github} target="_blank" rel="noopener noreferrer" aria-label={`${member.name}'s GitHub`}>
                    <GitHub />
                  </a>
                  <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${member.name}'s LinkedIn`}>
                    <LinkedIn />
                  </a>
                  <a href={member.social.twitter} target="_blank" rel="noopener noreferrer" aria-label={`${member.name}'s X (formerly Twitter)`}>
                    <XIcon />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="container">
          <h2>Get In Touch</h2>
          <p>
            Have questions or feedback? We'd love to hear from you! Reach out to our team 
            and we'll get back to you as soon as possible.
          </p>
          <div className="contact-info">
            <div className="contact-item">
              <h3>Email</h3>
              <p>arbaznazir74@gmail.com</p>
            </div>
            <div className="contact-item">
              <h3>Follow Us</h3>
              <div className="social-links">
                <a href="https://github.com/Arbaznazir" target="_blank" rel="noopener noreferrer" aria-label="Arbaz's GitHub">
                  <GitHub />
                </a>
                <a href="https://www.linkedin.com/in/arbaz-nazir1" target="_blank" rel="noopener noreferrer" aria-label="Arbaz's LinkedIn">
                  <LinkedIn />
                </a>
                <a href="https://x.com/arbaz_nazir_1" target="_blank" rel="noopener noreferrer" aria-label="Arbaz's X (formerly Twitter)">
                  <XIcon />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="about-footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} PosiVibe. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
