import React from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import '../../styles/header.css';

const LOGO_WHITE_URL = 'https://mietjmu.in/wp-content/uploads/2020/11/miet-logo-white.png';

function Header({ onMenuClick }) {
  return (
    <header className="app-header">
      <button type="button" className="header-menu-btn" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={24} />
      </button>
      <Link to="/" className="header-logo">
        <img src={LOGO_WHITE_URL} alt="MIET" className="header-logo-img" />
        <div className="header-title-group">
          <span className="header-institute-name">Classroom Insights</span>
          <span className="header-subtitle">Analytics Dashboard</span>
        </div>
      </Link>
      <div className="header-spacer" aria-hidden="true" />
    </header>
  );
}

export default Header;
