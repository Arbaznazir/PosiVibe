import React from 'react';
import { Link } from 'react-router-dom';
import './homePage.scss';

const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      <div className="container">
        <div className="content">
          <div className="error-code">404</div>
          <h1>Page Not Found</h1>
          <p>The page you're looking for doesn't exist or has been moved.</p>
          <Link to="/app" className="btn btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 