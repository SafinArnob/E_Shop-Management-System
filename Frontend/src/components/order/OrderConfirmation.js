import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './OrderConfirmation.css';

const OrderConfirmation = ({ isOpen, onClose, onOrderSuccess }) => {
  const { cart, createOrder, loading } = useCart();
  const { token, userRole } = useAuth();
  const [orderData, setOrderData] = useState({
    shippingAddress: '',
    billingAddress: '',
    paymentMethod: 'credit_card',
    notes: '',
  });
  const [error, setError] = useState('');

  // Only show for customers
  if (userRole !== 'customer' || !isOpen) {
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!cart || !cart.items || cart.items.length === 0) {
      setError('Cart is empty');
      return;
    }

    if (!orderData.shippingAddress.trim()) {
      setError('Shipping address is required');
      return;
    }

    setError('');

    try {
      const orderPayload = {
        totalAmount: cart.total_amount,
        totalItems: cart.total_items,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress || orderData.shippingAddress,
        paymentMethod: orderData.paymentMethod,
        notes: orderData.notes
      };

      const result = await createOrder(orderPayload);

      if (result) {
        if (onOrderSuccess) {
          onOrderSuccess(result.order, result.order_number);
        }
        onClose();  // Close the order confirmation modal after success
      } else {
        setError('Failed to create order');
      }
    } catch (error) {
      setError('Error creating order: ' + error.message);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      setOrderData({
        shippingAddress: '',
        billingAddress: '',
        paymentMethod: 'credit_card',
        notes: '',
      });
      onClose();
    }
  };

  return (
    <div className="order-overlay" onClick={handleClose}>
      <div className="order-container" onClick={(e) => e.stopPropagation()}>
        <div className="order-header">
          <h2>Confirm Order</h2>
          <button className="close-order-btn" onClick={handleClose} disabled={loading}>
            ×
          </button>
        </div>

        {error && <div className="order-error">{error}</div>}

        <div className="order-content">
          {/* Order Summary */}
          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="summary-items">
              {cart.items.map((item) => (
                <div key={item.id} className="summary-item">
                  <div className="item-details">
                    <span className="item-name">{item.product_name}</span>
                    <span className="item-quantity">Qty: {item.quantity}</span>
                  </div>
                  <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="summary-total">
              <div className="total-row">
                <span>Total Items:</span>
                <span>{cart.total_items}</span>
              </div>
              <div className="total-row final">
                <span>Total Amount:</span>
                <span>${cart.total_amount?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>

          {/* Order Form */}
          <form onSubmit={handleSubmit} className="order-form">
            <div className="form-group">
              <label htmlFor="shippingAddress">Shipping Address *</label>
              <textarea
                id="shippingAddress"
                name="shippingAddress"
                value={orderData.shippingAddress}
                onChange={handleInputChange}
                placeholder="Enter your complete shipping address"
                required
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="billingAddress">Billing Address</label>
              <textarea
                id="billingAddress"
                name="billingAddress"
                value={orderData.billingAddress}
                onChange={handleInputChange}
                placeholder="Enter billing address (leave empty to use shipping address)"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="paymentMethod">Payment Method</label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={orderData.paymentMethod}
                onChange={handleInputChange}
              >
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="paypal">PayPal</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash_on_delivery">Cash on Delivery</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Order Notes (Optional)</label>
              <textarea
                id="notes"
                name="notes"
                value={orderData.notes}
                onChange={handleInputChange}
                placeholder="Any special instructions or notes for your order"
                rows="2"
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="confirm-order-btn"
                disabled={loading}
              >
                {loading ? 'Creating Order...' : 'Confirm Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
