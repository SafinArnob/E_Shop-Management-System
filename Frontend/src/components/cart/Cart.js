import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './Cart.css';

const Cart = ({ isOpen, onClose }) => {
  const { cart, loading, error, updateCartItem, removeFromCart, clearCart, refreshCart } = useCart();
  const { userRole } = useAuth();
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [showOrderPlacement, setShowOrderPlacement] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Only show cart for customers
  if (userRole !== 'customer') {
    return null;
  }

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 0) return;
    
    setUpdatingItems(prev => new Set(prev).add(productId));
    try {
      await updateCartItem(productId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (productId) => {
    if (!window.confirm('Are you sure you want to remove this item from your cart?')) {
      return;
    }
    
    try {
      await removeFromCart(productId);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your entire cart?')) {
      return;
    }
    
    try {
      await clearCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const handleRefreshCart = async () => {
    try {
      await refreshCart();
    } catch (error) {
      console.error('Error refreshing cart:', error);
    }
  };

  const handleCheckout = () => {
    if (!cart || !cart.items || cart.items.length === 0) {
      alert('Your cart is empty');
      return;
    }
    setShowOrderPlacement(true);
  };

  const handleOrderSuccess = (order, orderNumber) => {
    setOrderSuccess({ order, orderNumber });
    setShowOrderPlacement(false);
    
    // Show success message
    alert(`Order created successfully! Order Number: ${orderNumber}`);
  };

  const handleCloseOrderPlacement = () => {
    setShowOrderPlacement(false);
  };

  if (!isOpen) return null;

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-container" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2>Shopping Cart</h2>
          <button className="close-cart-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {error && (
          <div className="cart-error">
            {error}
            <button onClick={handleRefreshCart} className="retry-btn">
              Retry
            </button>
          </div>
        )}

        {loading && (
          <div className="cart-loading">
            Loading cart...
          </div>
        )}

        {!loading && !error && (
          <>
            {!cart || !cart.items || cart.items.length === 0 ? (
              <div className="empty-cart">
                <p>Your cart is empty</p>
                <p>Add some products to get started!</p>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.items.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div className="item-info">
                        <h4>{item.product_name}</h4>
                        <p className="item-details">
                          {item.brand} • {item.category}
                        </p>
                        <p className="item-price">${item.price}</p>
                      </div>
                      
                      <div className="item-actions">
                        <div className="quantity-controls">
                          <button
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                            disabled={updatingItems.has(item.product_id)}
                          >
                            −
                          </button>
                          <span className="quantity-display">
                            {updatingItems.has(item.product_id) ? '...' : item.quantity}
                          </span>
                          <button
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                            disabled={updatingItems.has(item.product_id)}
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="item-total">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                        
                        <button
                          className="remove-item-btn"
                          onClick={() => handleRemoveItem(item.product_id)}
                          title="Remove item"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <div className="summary-row">
                    <span>Total Items:</span>
                    <span>{cart.total_items}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total Amount:</span>
                    <span>${cart.total_amount?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>

                <div className="cart-actions">
                  <button
                    className="clear-cart-btn"
                    onClick={handleClearCart}
                  >
                    Clear Cart
                  </button>
                  <button
                    className="checkout-btn"
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;
