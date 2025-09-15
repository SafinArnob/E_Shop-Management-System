import db from "../config/config.js";
import { randomUUID } from 'crypto';

// Create or get customer's cart
const getOrCreateCart = (customerId) => {
  return new Promise((resolve, reject) => {
    // First, try to get existing cart
    const getQuery = 'SELECT * FROM cart WHERE customer_id = ?';
    
    db.query(getQuery, [customerId], (err, results) => {
      if (err) return reject(err);
      
      if (results && results.length > 0) {
        // Cart exists, return it
        resolve(results[0]);
      } else {
        // Create new cart
        const cartId = randomUUID();
        const createQuery = 'INSERT INTO cart (id, customer_id) VALUES (?, ?)';
        
        db.query(createQuery, [cartId, customerId], (err, result) => {
          if (err) return reject(err);
          resolve({ id: cartId, customer_id: customerId });
        });
      }
    });
  });
};

// Add item to cart
const addItemToCart = (cartId, productId, quantity, price) => {
  return new Promise((resolve, reject) => {
    const itemId = randomUUID();
    
    // Check if item already exists in cart
    const checkQuery = 'SELECT * FROM cart_item WHERE cart_id = ? AND product_id = ?';
    
    db.query(checkQuery, [cartId, productId], (err, results) => {
      if (err) return reject(err);
      
      if (results && results.length > 0) {
        // Item exists, update quantity
        const newQuantity = results[0].quantity + quantity;
        const updateQuery = 'UPDATE cart_item SET quantity = ?, price = ?, updated_at = CURRENT_TIMESTAMP WHERE cart_id = ? AND product_id = ?';
        
        db.query(updateQuery, [newQuantity, price, cartId, productId], (err, result) => {
          if (err) return reject(err);
          resolve({ message: 'Item quantity updated in cart', itemId: results[0].id });
        });
      } else {
        // Item doesn't exist, create new cart item
        const insertQuery = 'INSERT INTO cart_item (id, cart_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)';
        
        db.query(insertQuery, [itemId, cartId, productId, quantity, price], (err, result) => {
          if (err) return reject(err);
          resolve({ message: 'Item added to cart', itemId });
        });
      }
    });
  });
};

// Get cart with items
const getCartWithItems = (customerId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        c.id as cart_id,
        c.customer_id,
        c.created_at as cart_created_at,
        c.updated_at as cart_updated_at,
        ci.id as item_id,
        ci.product_id,
        ci.quantity,
        ci.price as item_price,
        ci.created_at as item_created_at,
        p.name as product_name,
        p.category,
        p.brand,
        p.description,
        p.price as current_product_price
      FROM cart c
      LEFT JOIN cart_item ci ON c.id = ci.cart_id
      LEFT JOIN product p ON ci.product_id = p.id
      WHERE c.customer_id = ?
      ORDER BY ci.created_at DESC
    `;
    
    db.query(query, [customerId], (err, results) => {
      if (err) return reject(err);
      
      if (!results || results.length === 0) {
        return resolve(null);
      }
      
      // Group results by cart
      const cart = {
        id: results[0].cart_id,
        customer_id: results[0].customer_id,
        created_at: results[0].cart_created_at,
        updated_at: results[0].cart_updated_at,
        items: []
      };
      
      // Add items to cart
      results.forEach(row => {
        if (row.item_id) {
          cart.items.push({
            id: row.item_id,
            product_id: row.product_id,
            product_name: row.product_name,
            category: row.category,
            brand: row.brand,
            description: row.description,
            quantity: row.quantity,
            price: row.item_price,
            current_product_price: row.current_product_price,
            created_at: row.item_created_at
          });
        }
      });
      
      resolve(cart);
    });
  });
};

// Update cart item quantity
const updateCartItemQuantity = (cartId, productId, quantity) => {
  return new Promise((resolve, reject) => {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      const deleteQuery = 'DELETE FROM cart_item WHERE cart_id = ? AND product_id = ?';
      db.query(deleteQuery, [cartId, productId], (err, result) => {
        if (err) return reject(err);
        resolve({ message: 'Item removed from cart' });
      });
    } else {
      // Update quantity
      const updateQuery = 'UPDATE cart_item SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE cart_id = ? AND product_id = ?';
      db.query(updateQuery, [quantity, cartId, productId], (err, result) => {
        if (err) return reject(err);
        if (result.affectedRows === 0) {
          return reject(new Error('Cart item not found'));
        }
        resolve({ message: 'Cart item quantity updated' });
      });
    }
  });
};

// Remove item from cart
const removeItemFromCart = (cartId, productId) => {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM cart_item WHERE cart_id = ? AND product_id = ?';
    
    db.query(query, [cartId, productId], (err, result) => {
      if (err) return reject(err);
      if (result.affectedRows === 0) {
        return reject(new Error('Cart item not found'));
      }
      resolve({ message: 'Item removed from cart' });
    });
  });
};

// Clear entire cart
const clearCart = (customerId) => {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM cart_item WHERE cart_id IN (SELECT id FROM cart WHERE customer_id = ?)';
    
    db.query(query, [customerId], (err, result) => {
      if (err) return reject(err);
      resolve({ message: 'Cart cleared successfully' });
    });
  });
};

// Get cart item count
const getCartItemCount = (customerId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT COALESCE(SUM(ci.quantity), 0) as total_items
      FROM cart c
      LEFT JOIN cart_item ci ON c.id = ci.cart_id
      WHERE c.customer_id = ?
    `;
    
    db.query(query, [customerId], (err, results) => {
      if (err) return reject(err);
      resolve(results[0].total_items);
    });
  });
};

export default {
  getOrCreateCart,
  addItemToCart,
  getCartWithItems,
  updateCartItemQuantity,
  removeItemFromCart,
  clearCart,
  getCartItemCount
};

