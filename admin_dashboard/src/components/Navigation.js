import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import './Navigation.css';

function Navigation() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { connected } = useSocket();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h2>🍔 Restaurant</h2>
        <div className="connection-status">
          <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`}></span>
          {connected ? 'Live' : 'Offline'}
        </div>
      </div>

      <ul className="nav-menu">
        <li className={isActive('/')}>
          <Link to="/">📊 Dashboard</Link>
        </li>
        <li className={isActive('/orders')}>
          <Link to="/orders">📦 Orders</Link>
        </li>
        <li className={isActive('/menu')}>
          <Link to="/menu">🍽️ Menu</Link>
        </li>
        <li className={isActive('/deliveries')}>
          <Link to="/deliveries">🚚 Deliveries</Link>
        </li>
        <li className={isActive('/settings')}>
          <Link to="/settings">⚙️ Settings</Link>
        </li>
      </ul>

      <div className="sidebar-footer">
        <div className="user-info">
          <strong>{user?.firstName} {user?.lastName}</strong>
          <small>{user?.email}</small>
        </div>
        <button onClick={logout} className="btn btn-secondary">
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navigation;
