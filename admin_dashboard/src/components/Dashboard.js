import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    todayRevenue: 0,
    activeDeliveries: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('order:update', handleOrderUpdate);
      return () => socket.off('order:update', handleOrderUpdate);
    }
  }, [socket]);

  const handleOrderUpdate = (data) => {
    loadDashboardData();
  };

  const loadDashboardData = async () => {
    try {
      const ordersRes = await axios.get(`${API_URL}/orders`);
      const orders = ordersRes.data.orders;

      const today = new Date().setHours(0, 0, 0, 0);
      const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
      
      const activeOrders = orders.filter(o => 
        !['delivered', 'cancelled'].includes(o.status)
      );

      const todayRevenue = todayOrders
        .filter(o => o.paymentStatus === 'completed')
        .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

      setStats({
        totalOrders: orders.length,
        activeOrders: activeOrders.length,
        todayRevenue: todayRevenue.toFixed(2),
        activeDeliveries: activeOrders.filter(o => o.status === 'out_for_delivery').length
      });

      setRecentOrders(orders.slice(0, 10));
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="container">
      <h1>Dashboard</h1>
      
      <div className="grid">
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <h3>Total Orders</h3>
          <div className="value">{stats.totalOrders}</div>
          <div className="change">All time</div>
        </div>
        
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
          <h3>Active Orders</h3>
          <div className="value">{stats.activeOrders}</div>
          <div className="change">Currently processing</div>
        </div>
        
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
          <h3>Today's Revenue</h3>
          <div className="value">${stats.todayRevenue}</div>
          <div className="change">Completed orders</div>
        </div>
        
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
          <h3>Active Deliveries</h3>
          <div className="value">{stats.activeDeliveries}</div>
          <div className="change">Out for delivery</div>
        </div>
      </div>

      <div className="card">
        <h2>Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <div className="empty-state">
            <p>No orders yet</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.customer?.firstName} {order.customer?.lastName}</td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>${order.totalAmount}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
