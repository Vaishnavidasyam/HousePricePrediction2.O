import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Target, BarChart3, Map, Search, Moon, Sun, GitCompare, Box, Bot, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import { useTheme } from './hooks/useTheme';
import './PlatformLayout.css';

const navItems = [
  { to: '/platform/hub', label: 'Hub', icon: LayoutDashboard },
  { to: '/platform/valuation', label: 'Valuation', icon: Target },
  { to: '/platform/investment', label: 'Investment', icon: BarChart3 },
  { to: '/platform/comparison', label: 'Compare', icon: GitCompare },
  { to: '/platform/city', label: 'City & Land', icon: Map },
  { to: '/platform/visuals', label: 'Visual Studio', icon: Box },
  { to: '/platform/assistant', label: 'AI Assistant', icon: Bot },
];

const pageNames = {
  hub: 'Property Intelligence Hub',
  valuation: 'AI Valuation',
  investment: 'Investment Intelligence',
  comparison: 'Property Comparison',
  city: 'City & Land Intelligence',
  visuals: 'Visual Studio',
  assistant: 'AI Assistant',
};

const PlatformLayout = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const currentKey = location.pathname.split('/').filter(Boolean).pop() || 'hub';
  const pageTitle = pageNames[currentKey] || 'EstateVerse AI';

  return (
    <div className="platform-layout">
      <aside className={`platform-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">EV</div>
            {!isCollapsed && (
              <div className="logo-text">
                <span>EstateVerse</span>
                <small>AI Real Estate</small>
              </div>
            )}
          </div>
          <button className="collapse-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="nav-item" title={isCollapsed ? label : ""}>
              <Icon size={20} strokeWidth={2.2} />
              {!isCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="platform-main">
        <header className="platform-navbar">
          <div className="platform-title">
            <span className="subtitle">Workspace /</span>
            <strong className="title">{pageTitle}</strong>
          </div>
          
          <div className="nav-center">
            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Search insights, localities, AI reports..." />
              <div className="search-shortcut">⌘K</div>
            </div>
          </div>
          
          <div className="nav-actions">
            <button className="icon-btn" aria-label="Notifications">
              <Bell size={20} />
              <span className="badge"></span>
            </button>
            <button className="icon-btn theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
            </button>
            <div className="user-profile">
              <img src="https://i.pravatar.cc/100?img=33" alt="User" />
            </div>
          </div>
        </header>
        <main className="platform-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PlatformLayout;
