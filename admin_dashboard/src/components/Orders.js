import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('order:update', handleOrderUpdate);
      socket.on('order:admin_notification', handleAdminNotification);
      return () => {
        socket.off('order:update', handleOrderUpdate);
        socket.off('order:admin_notification', handleAdminNotification);
      };
    }
  }, [socket]);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter]);

  const handleOrderUpdate = (data) => {
    loadOrders();
  };

  const handleAdminNotification = (data) => {
    console.log('Admin notification:', data);
  };

  const loadOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders`);
      setOrders(response.data.orders);
      setLoading(false);
    } catch (error) {
      console.error('Error loading orders:', error);
      setLoading(false);
    }
  };

  const filterOrders = () => {
    if (statusFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(o => o.status === statusFilter));
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(`${API_URL}/orders/${orderId}/status`, { status: newStatus });
      loadOrders();
      setSelectedOrder(null);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update order');
    }
  };

  const getNextStatus = (currentStatus) => {
    const transitions = {
      pending: 'paid',
      paid: 'preparing',
      preparing: 'ready',
      ready: 'out_for_delivery',
      out_for_delivery: 'delivered'
    };
    return transitions[currentStatus];
  };

  if (loading) {
    return <div className="loading">Loading orders...</div>;
  }

  return (
    <div className="container">
      <div className="section-header">
        <h1>Orders Management</h1>
        <button onClick={loadOrders} className="btn btn-primary">
          Refresh
        </button>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="card">
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <p>No orders found</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>
                    {order.customer?.firstName} {order.customer?.lastName}
                    <br />
                    <small>{order.customerPhone}</small>
                  </td>
                  <td>{order.items?.length || 0} items</td>
                  <td>${order.totalAmount}</td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${order.paymentStatus}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                  <td>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="btn btn-primary"
                      style={{ marginRight: '5px' }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Order #{selectedOrder.id}</h2>
            
            <div className="order-details">
              <h4>Customer Information</h4>
              <p>
                <strong>Name:</strong> {selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}<br />
                <strong>Phone:</strong> {selectedOrder.customerPhone}<br />
                <strong>Address:</strong> {selectedOrder.deliveryAddress}
              </p>

              {selectedOrder.deliveryInstructions && (
                <p><strong>Instructions:</strong> {selectedOrder.deliveryInstructions}</p>
              )}

              <h4>Order Items</h4>
              <ul className="order-items">
                {selectedOrder.items?.map(item => (
                  <li key={item.id}>
                    <span>
                      {item.quantity}x {item.menuItem?.name}
                      {item.specialInstructions && <small> - {item.specialInstructions}</small>}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              <p>
                <strong>Subtotal:</strong> ${(selectedOrder.totalAmount - selectedOrder.deliveryFee).toFixed(2)}<br />
                <strong>Delivery Fee:</strong> ${selectedOrder.deliveryFee}<br />
                <strong>Total:</strong> ${selectedOrder.totalAmount}
              </p>

              <h4>Status</h4>
              <p>
                Current Status: <span className={`status-badge status-${selectedOrder.status}`}>
                  {selectedOrder.status.replace('_', ' ')}
                </span>
              </p>

              {selectedOrder.delivery && (
                <>
                  <h4>Delivery Information</h4>
                  <p>
                    <strong>Driver:</strong> {selectedOrder.delivery.driver ? 
                      `${selectedOrder.delivery.driver.firstName} ${selectedOrder.delivery.driver.lastName}` : 
                      'Not assigned yet'
                    }<br />
                    <strong>Delivery Status:</strong> {selectedOrder.delivery.status}
                  </p>
                </>
              )}
            </div>

            <div className="actions">
              {getNextStatus(selectedOrder.status) && (
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, getNextStatus(selectedOrder.status))}
                  className="btn btn-success"
                >
                  Mark as {getNextStatus(selectedOrder.status).replace('_', ' ')}
                </button>
              )}
              
              {!['delivered', 'cancelled'].includes(selectedOrder.status) && (
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                  className="btn btn-danger"
                >
                  Cancel Order
                </button>
              )}
              
              <button onClick={() => setSelectedOrder(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
