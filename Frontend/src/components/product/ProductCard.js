import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './ProductCard.css';

const ProductCard = ({ product, onDelete }) => {
  const { userRole } = useAuth();
  const { addToCart, loading } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  const canDelete = userRole === 'admin' || userRole === 'employee';
  const canAddToCart = userRole === 'customer';

  const handleAddToCart = async () => {
    if (!canAddToCart) return;
    
    setAddingToCart(true);
    try {
      const success = await addToCart(product.id, quantity);
      if (success) {
        // Reset quantity after successful add
        setQuantity(1);
        // You could add a success message here
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div className="product-card">
      <div className="product-header">
        <h3>{product.name}</h3>
        {canDelete && (
          <button 
            className="delete-btn"
            onClick={() => onDelete(product.id)}
            title="Delete product"
          >
            ×
          </button>
        )}
      </div>
      
      <div className="product-details">
        <div className="product-info">
          <p><strong>Category:</strong> {product.category}</p>
          <p><strong>Brand:</strong> {product.brand}</p>
          <p><strong>Price:</strong> ${product.price}</p>
        </div>
        
        <div className="product-description">
          <p><strong>Description:</strong></p>
          <p>{product.description}</p>
        </div>
        
        {canAddToCart && (
          <div className="cart-actions">
            <div className="quantity-selector">
              <label htmlFor={`quantity-${product.id}`}>Quantity:</label>
              <input
                id={`quantity-${product.id}`}
                type="number"
                min="1"
                max="99"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="quantity-input"
              />
            </div>
            <button
              className="add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={addingToCart || loading}
            >
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        )}
        
        <div className="product-meta">
          <p><strong>ID:</strong> {product.id}</p>
          {product.creator_name && (
            <p><strong>Created by:</strong> {product.creator_name}</p>
          )}
          {product.created_at && (
            <p><strong>Created:</strong> {new Date(product.created_at).toLocaleDateString()}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;


