import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ApiService from '../../services/apiService';
import './ProductForm.css';

const ProductForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    description: '',
    price: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await ApiService.createProduct(formData, token);
      
      if (data.message) {
        onSuccess();
        setFormData({
          name: '',
          category: '',
          brand: '',
          description: '',
          price: ''
        });
      } else {
        setError(data.message || 'Failed to create product');
      }
    } catch (error) {
      setError('Create product error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="product-form-container">
      <h3>Create New Product</h3>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <input
            type="text"
            name="name"
            placeholder="Product Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="category"
            placeholder="Category"
            value={formData.category}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-row">
          <input
            type="text"
            name="brand"
            placeholder="Brand"
            value={formData.brand}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="price"
            step="0.01"
            placeholder="Price"
            value={formData.price}
            onChange={handleChange}
            required
          />
        </div>
        
        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          required
        />
        
        <div className="form-buttons">
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Product'}
          </button>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;


