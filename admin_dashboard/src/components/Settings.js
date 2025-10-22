import React from 'react';

function Settings() {
  return (
    <div className="container">
      <h1>Settings</h1>
      
      <div className="card">
        <h3>Restaurant Information</h3>
        <div className="form-group">
          <label>Restaurant Name</label>
          <input type="text" defaultValue="Delicious Bites" />
        </div>
        <div className="form-group">
          <label>Address</label>
          <input type="text" defaultValue="123 Main Street" />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input type="tel" defaultValue="+1234567890" />
        </div>
        <button className="btn btn-success">Save Changes</button>
      </div>

      <div className="card">
        <h3>Delivery Settings</h3>
        <div className="form-group">
          <label>Default Delivery Fee</label>
          <input type="number" step="0.01" defaultValue="5.00" />
        </div>
        <div className="form-group">
          <label>Estimated Delivery Time (minutes)</label>
          <input type="number" defaultValue="30" />
        </div>
        <button className="btn btn-success">Save Changes</button>
      </div>

      <div className="card">
        <h3>Telegram Bot</h3>
        <p>Bot Status: <span className="status-badge status-ready">Active</span></p>
        <div className="form-group">
          <label>Bot Token</label>
          <input type="password" placeholder="••••••••••••••••" />
        </div>
        <button className="btn btn-success">Update Token</button>
      </div>

      <div className="card">
        <h3>Payment Gateway</h3>
        <div className="form-group">
          <label>API Key</label>
          <input type="password" placeholder="••••••••••••••••" />
        </div>
        <div className="form-group">
          <label>Webhook Secret</label>
          <input type="password" placeholder="••••••••••••••••" />
        </div>
        <button className="btn btn-success">Save Changes</button>
      </div>
    </div>
  );
}

export default Settings;
