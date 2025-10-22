import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';

function Menu() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    preparationTime: 15,
    ingredients: '',
    isAvailable: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      const response = await axios.get(`${API_URL}/menu`);
      setItems(response.data.items);
      setLoading(false);
    } catch (error) {
      console.error('Error loading menu:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        await axios.put(`${API_URL}/menu/${editingItem.id}`, formData);
      } else {
        await axios.post(`${API_URL}/menu`, formData);
      }
      
      loadMenuItems();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save menu item');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`${API_URL}/menu/${id}`);
        loadMenuItems();
      } catch (error) {
        alert('Failed to delete item');
      }
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price,
        category: item.category,
        preparationTime: item.preparationTime,
        ingredients: item.ingredients || '',
        isAvailable: item.isAvailable
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        preparationTime: 15,
        ingredients: '',
        isAvailable: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const groupByCategory = () => {
    const grouped = {};
    items.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  };

  if (loading) {
    return <div className="loading">Loading menu...</div>;
  }

  const categorizedItems = groupByCategory();

  return (
    <div className="container">
      <div className="section-header">
        <h1>Menu Management</h1>
        <button onClick={() => openModal()} className="btn btn-primary">
          + Add Item
        </button>
      </div>

      {Object.entries(categorizedItems).map(([category, categoryItems]) => (
        <div key={category} className="card">
          <h2>{category}</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Price</th>
                <th>Prep Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categoryItems.map(item => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.description}</td>
                  <td>${item.price}</td>
                  <td>{item.preparationTime} min</td>
                  <td>
                    <span className={`status-badge ${item.isAvailable ? 'status-ready' : 'status-cancelled'}`}>
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => openModal(item)}
                      className="btn btn-primary"
                      style={{ marginRight: '5px' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="btn btn-danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Preparation Time (minutes)</label>
                  <input
                    type="number"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.value === 'true' })}
                  >
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Ingredients</label>
                <textarea
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  rows="2"
                />
              </div>

              <div className="actions">
                <button type="submit" className="btn btn-success">
                  {editingItem ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={closeModal} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Menu;
