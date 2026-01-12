import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/" className="logo-link">
            <span className="logo-icon">📚</span>
            <span className="logo-text">Readers' Choice</span>
          </Link>
        </div>

        <div className="nav-menu">
          <Link 
            to="/search" 
            className={location.pathname === '/search' ? 'nav-link active' : 'nav-link'}
          >
            Search
          </Link>
          {isAuthenticated ? (
            <>
              <Link 
                to="/my-library" 
                className={location.pathname === '/my-library' ? 'nav-link active' : 'nav-link'}
              >
                My Library
              </Link>
              <div className="nav-user">
                <span className="username">👤 {user?.username}</span>
                <button onClick={handleLogout} className="nav-logout-btn">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className={location.pathname === '/login' ? 'nav-link active' : 'nav-link'}
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className={location.pathname === '/signup' ? 'nav-link btn-signup' : 'nav-link btn-signup'}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
