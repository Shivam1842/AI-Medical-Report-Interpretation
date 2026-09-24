import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Lightbulb, Menu, Moon, SunMedium, UserCircle, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const protectedNavItems = [
  { to: '/', label: 'Home' },
  { to: '/upload', label: 'Upload' },
  { to: '/processing', label: 'Processing' },
  { to: '/results', label: 'Results' },
  { to: '/ai-explanation', label: 'AI Explanation' },
  { to: '/history', label: 'History' },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  // Pull in authentication state and logout function
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (logout) logout();
    setIsMenuOpen(false);
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <NavLink to="/" className="brand" aria-label="ReportMitra home">
          <span className="brand__icon">
            <Lightbulb size={18} />
          </span>
          <span>ReportMitra</span>
        </NavLink>

        <div className="navbar__right">
          <nav className={`nav ${isMenuOpen ? 'nav--open' : ''}`} aria-label="Main navigation">
            {token ? (
              /* Menu for Authenticated Users */
              <>
                {protectedNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => (isActive ? 'nav__link nav__link--active' : 'nav__link')}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                ))}
                <button 
                  onClick={handleLogout} 
                  className="nav__link" 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
                >
                  Logout
                </button>
              </>
            ) : (
              /* Menu for Logged Out Users */
              <>
                <NavLink to="/login" className="nav__link" onClick={() => setIsMenuOpen(false)}>
                  Login
                </NavLink>
                <NavLink to="/register" className="nav__link nav__link--active" onClick={() => setIsMenuOpen(false)}>
                  Sign Up
                </NavLink>
              </>
            )}
          </nav>

          <div className="navbar__actions">
            {/* Only show the user profile icon if logged in */}
            {token && (
              <button
                type="button"
                className="profile-button"
                aria-label="User profile"
                onClick={() => setIsMenuOpen(false)}
              >
                <UserCircle size={18} />
              </button>
            )}

            <button
              type="button"
              className="theme-toggle"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <SunMedium size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <button
            type="button"
            className="menu-button"
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setIsMenuOpen((value) => !value)}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}