import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Cart from '../cart/Cart';
import './Header.css';

const Header = () => {
  const { userRole, logout } = useAuth();
  const { cartItemCount } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleCartClick = () => {
    setIsCartOpen(true);
  };

  const handleCloseCart = () => {
    setIsCartOpen(false);
  };

  return (
    <>
      <header className="app-header">
        <div className="header-content">
          <h1>Product Management System</h1>
          <div className="user-info">
            {userRole === 'customer' && (
              <button className="cart-btn" onClick={handleCartClick}>
                <span className="cart-icon">🛒</span>
                <span className="cart-text">Cart</span>
                {cartItemCount > 0 && (
                  <span className="cart-count">{cartItemCount}</span>
                )}
              </button>
            )}
            <span className="user-role">Role: {userRole}</span>
            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <Cart isOpen={isCartOpen} onClose={handleCloseCart} />
    </>
  );
};

export default Header;




