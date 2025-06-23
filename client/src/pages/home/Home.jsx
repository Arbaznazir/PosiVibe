import Stories from "../../components/stories/Stories"
import Posts from "../../components/posts/Posts"
import Share from "../../components/share/Share"
import { makeRequest } from "../../axios"
import "./home.scss"
import { useState } from "react"
import toast from 'react-hot-toast'

const Home = () => {
  const [showTests, setShowTests] = useState(false);

  const simulateTimeUsage = async (minutes) => {
    try {
      const res = await makeRequest.post('/users/simulate-time', { minutes });
      console.log('Time simulation result:', res.data);
      alert(`Simulated ${minutes} minutes of usage. ${res.data.message}`);
      // Refresh the page to update timer
      window.location.reload();
    } catch (err) {
      console.error('Failed to simulate time usage:', err);
      alert('Failed to simulate time usage');
    }
  };

  const testContentFilter = async (testType) => {
    let testContent = '';
    
    switch(testType) {
      case 'profanity':
        testContent = 'This is a test with some fucking bad words that should be blocked';
        break;
      case 'appropriate':
        testContent = 'This is a perfectly normal and appropriate message that should be allowed';
        break;
      case 'spam':
        testContent = 'BUY NOW!!! CLICK HERE!!! AMAZING DEAL!!! LIMITED TIME!!! CALL NOW!!!';
        break;
      default:
        return;
    }

    try {
      await makeRequest.post("/posts", { desc: testContent, img: "" });
      toast.success(`✅ Test "${testType}" passed - Content was allowed`);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('inappropriate content')) {
        toast.success(`✅ Test "${testType}" working - Content was properly blocked`);
      } else {
        toast.error(`❌ Test "${testType}" failed - Unexpected error`);
      }
    }
  };

  return (
    <div className="home">
      <Stories/>
      <Share/>
      
      {/* Test buttons for time simulation */}
      <div style={{ 
        padding: '20px', 
        background: 'var(--bg-card)', 
        borderRadius: '12px', 
        margin: '20px 0',
        textAlign: 'center',
        border: '2px dashed #e2e8f0'
      }}>
        <h3 style={{ marginBottom: '15px', color: 'var(--text-color)' }}>⚡ Time Simulation (Testing)</h3>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => simulateTimeUsage(30)}
            style={{ 
              padding: '8px 16px', 
              background: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            +30 minutes
          </button>
          <button 
            onClick={() => simulateTimeUsage(60)}
            style={{ 
              padding: '8px 16px', 
              background: '#f59e0b', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            +1 hour
          </button>
          <button 
            onClick={() => simulateTimeUsage(120)}
            style={{ 
              padding: '8px 16px', 
              background: '#ef4444', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            +2 hours (Time Up!)
          </button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-color-secondary)', marginTop: '10px' }}>
          Use these buttons to test the time limit functionality
        </p>
      </div>

      {/* Notification system info */}
      <div style={{ 
        padding: '20px', 
        background: 'var(--bg-card)', 
        borderRadius: '12px', 
        margin: '20px 0',
        border: '2px dashed #10b981'
      }}>
        <h3 style={{ marginBottom: '15px', color: 'var(--text-color)' }}>🔔 Notification System Active!</h3>
        <p style={{ color: 'var(--text-color-secondary)', marginBottom: '15px' }}>
          The notification system is now working! Try these actions to generate notifications:
        </p>
        <ul style={{ color: 'var(--text-color-secondary)', textAlign: 'left', margin: '0 auto', maxWidth: '500px' }}>
          <li style={{ marginBottom: '8px' }}>✅ <strong>Like a post</strong> - Creates a notification for the post owner</li>
          <li style={{ marginBottom: '8px' }}>✅ <strong>Comment on a post</strong> - Creates a notification for the post owner</li>
          <li style={{ marginBottom: '8px' }}>✅ <strong>Follow someone</strong> - Creates a notification for the followed user</li>
          <li style={{ marginBottom: '8px' }}>✅ <strong>Mention someone</strong> - Use @username in comments (e.g., @testuser)</li>
        </ul>
        <p style={{ fontSize: '14px', color: 'var(--primary-color)', marginTop: '15px', fontWeight: '600' }}>
          📧 Check the notification bell (🔔) in the navbar to see your notifications!
        </p>
      </div>
      
      {/* Content Filter Test Section */}
      <div className="test-section" style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '20px',
        margin: '20px 0',
        boxShadow: '0 0 25px -10px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: showTests ? '15px' : '0'
        }}>
          <h3 style={{ 
            color: 'var(--textColor)', 
            margin: 0,
            fontSize: '16px',
            fontWeight: '600'
          }}>
            🛡️ Content Filter Test
          </h3>
          <button 
            onClick={() => setShowTests(!showTests)}
            style={{
              background: 'var(--primary-gradient)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {showTests ? 'Hide Tests' : 'Show Tests'}
          </button>
        </div>
        
        {showTests && (
          <div>
            <p style={{ 
              color: 'var(--textColorSoft)', 
              fontSize: '14px', 
              marginBottom: '15px',
              lineHeight: '1.4'
            }}>
              Test the content moderation system. Try posting inappropriate content to see the notifications in action.
            </p>
            
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              flexWrap: 'wrap' 
            }}>
              <button 
                onClick={() => testContentFilter('profanity')}
                style={{
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                🚫 Test Profanity Filter
              </button>
              
              <button 
                onClick={() => testContentFilter('spam')}
                style={{
                  background: '#fef3c7',
                  color: '#d97706',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                📢 Test Spam Filter
              </button>
              
              <button 
                onClick={() => testContentFilter('appropriate')}
                style={{
                  background: '#dcfce7',
                  color: '#16a34a',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                ✅ Test Appropriate Content
              </button>
            </div>
          </div>
        )}
      </div>
      
      <Posts/>
    </div>
  )
}

export default Home