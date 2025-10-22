import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    loadDeliveries();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('delivery:update', handleDeliveryUpdate);
      return () => socket.off('delivery:update', handleDeliveryUpdate);
    }
  }, [socket]);

  const handleDeliveryUpdate = (data) => {
    loadDeliveries();
  };

  const loadDeliveries = async () => {
    try {
      const ordersRes = await axios.get(`${API_URL}/orders?status=out_for_delivery`);
      const readyOrdersRes = await axios.get(`${API_URL}/orders?status=ready`);
      
      const allOrders = [...ordersRes.data.orders, ...readyOrdersRes.data.orders];
      
      const deliveryPromises = allOrders.map(async (order) => {
        if (order.delivery) {
          try {
            const deliveryRes = await axios.get(`${API_URL}/deliveries/${order.delivery.id}`);
            return deliveryRes.data.delivery;
          } catch (error) {
            return order.delivery;
          }
        }
        return null;
      });

      const deliveriesData = await Promise.all(deliveryPromises);
      setDeliveries(deliveriesData.filter(d => d !== null));
      setLoading(false);
    } catch (error) {
      console.error('Error loading deliveries:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading deliveries...</div>;
  }

  return (
    <div className="container">
      <div className="section-header">
        <h1>Deliveries</h1>
        <button onClick={loadDeliveries} className="btn btn-primary">
          Refresh
        </button>
      </div>

      <div className="card">
        {deliveries.length === 0 ? (
          <div className="empty-state">
            <p>No active deliveries</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Delivery ID</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Address</th>
                <th>Driver</th>
                <th>Status</th>
                <th>Times</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map(delivery => (
                <tr key={delivery.id}>
                  <td>#{delivery.id}</td>
                  <td>#{delivery.order?.id}</td>
                  <td>
                    {delivery.order?.customer?.firstName} {delivery.order?.customer?.lastName}
                    <br />
                    <small>{delivery.order?.customerPhone}</small>
                  </td>
                  <td>{delivery.order?.deliveryAddress}</td>
                  <td>
                    {delivery.driver ? (
                      <>
                        {delivery.driver.firstName} {delivery.driver.lastName}
                        <br />
                        <small>⭐ {delivery.driver.rating} ({delivery.driver.totalDeliveries} deliveries)</small>
                      </>
                    ) : (
                      <span className="status-badge status-pending">Unassigned</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge status-${delivery.status}`}>
                      {delivery.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {delivery.pickupTime && (
                      <>Picked: {new Date(delivery.pickupTime).toLocaleTimeString()}<br /></>
                    )}
                    {delivery.deliveryTime && (
                      <>Delivered: {new Date(delivery.deliveryTime).toLocaleTimeString()}</>
                    )}
                    {!delivery.pickupTime && !delivery.deliveryTime && '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Deliveries;
