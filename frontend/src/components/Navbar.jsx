import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Lightbulb, Menu, UserCircle, X } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/upload', label: 'Upload' },
  { to: '/processing', label: 'Processing' },
  { to: '/results', label: 'Results' },
  { to: '/ai-explanation', label: 'AI Explanation' },
  { to: '/history', label: 'History' },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <NavLink to="/" className="brand" aria-label="MedAI home">
          <span className="brand__icon">
            <Lightbulb size={18} />
          </span>
          <span>MedAI</span>
        </NavLink>

        <nav className={`nav ${isMenuOpen ? 'nav--open' : ''}`} aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'nav__link nav__link--active' : 'nav__link')}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="profile-button"
          aria-label="User profile"
          onClick={() => setIsMenuOpen(false)}
        >
          <UserCircle size={18} />
        </button>

        <button
          type="button"
          className="menu-button"
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setIsMenuOpen((value) => !value)}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </header>
  );
}
