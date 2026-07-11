'use client';

import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';

const Header = () => {
  return (
    <header className="header">
      <div className="header-left">
        <button className="header-icon-btn" style={{ marginRight: '1rem' }}>
          <Menu size={24} />
        </button>
      </div>
      
      <div className="header-right">
        <button className="header-icon-btn">
          <Search size={20} />
        </button>
        <button className="header-icon-btn">
          <Bell size={20} />
        </button>
        
        <div className="user-profile">
          <img 
            src="https://i.pravatar.cc/150?u=marcelo" 
            alt="User avatar" 
            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div className="user-info">
            <span className="user-name">Marcelo Martinez</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
