import db from "../config/config.js";
import { randomUUID } from 'crypto';

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp.slice(-6)}-${random}`;
};

// Create a new order from cart
const createOrderFromCart = (customerId, orderData) => {
  return new Promise((resolve, reject) => {
    const orderId = randomUUID();
    const orderNumber = generateOrderNumber();
    
    const {
      totalAmount,
      totalItems,
      shippingAddress,
      billingAddress,
      paymentMethod,
      notes
    } = orderData;

    const orderQuery = `
      INSERT INTO \`order\` (
        id, customer_id, order_number, status, total_amount, total_items,
        shipping_address, billing_address, payment_method, payment_status, notes
      ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, 'pending', ?)
    `;

    const orderParams = [
      orderId, customerId, orderNumber, totalAmount, totalItems,
      shippingAddress, billingAddress, paymentMethod, notes
    ];

    db.query(orderQuery, orderParams, (err, result) => {
      if (err) return reject(err);
      resolve({ orderId, orderNumber, result });
    });
  });
};

// Add items to order
const addOrderItems = (orderId, cartItems) => {
  return new Promise((resolve, reject) => {
    if (!cartItems || cartItems.length === 0) {
      return resolve([]);
    }

    const itemPromises = cartItems.map(item => {
      return new Promise((itemResolve, itemReject) => {
        const itemId = randomUUID();
        const totalPrice = item.price * item.quantity;
        
        const itemQuery = `
          INSERT INTO order_item (
            id, order_id, product_id, product_name, product_brand, product_category,
            quantity, unit_price, total_price
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const itemParams = [
          itemId, orderId, item.product_id, item.product_name, item.brand,
          item.category, item.quantity, item.price, totalPrice
        ];

        db.query(itemQuery, itemParams, (err, result) => {
          if (err) return itemReject(err);
          itemResolve({ itemId, result });
        });
      });
    });

    Promise.all(itemPromises)
      .then(results => resolve(results))
      .catch(error => reject(error));
  });
};

// Get order by ID with items and customer details
const getOrderById = (orderId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        o.id, o.customer_id, o.order_number, o.status, o.total_amount, o.total_items,
        o.shipping_address, o.billing_address, o.payment_method, o.payment_status,
        o.notes, o.created_at, o.updated_at,
        c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
        oi.id as item_id, oi.product_id, oi.product_name, oi.product_brand,
        oi.product_category, oi.quantity, oi.unit_price, oi.total_price,
        oi.created_at as item_created_at
      FROM \`order\` o
      LEFT JOIN customer c ON o.customer_id = c.id
      LEFT JOIN order_item oi ON o.id = oi.order_id
      WHERE o.id = ?
      ORDER BY oi.created_at ASC
    `;

    db.query(query, [orderId], (err, results) => {
      if (err) return reject(err);
      
      if (!results || results.length === 0) {
        return resolve(null);
      }

      // Group results by order
      const order = {
        id: results[0].id,
        customer_id: results[0].customer_id,
        customer_name: results[0].customer_name,
        customer_email: results[0].customer_email,
        customer_phone: results[0].customer_phone,
        order_number: results[0].order_number,
        status: results[0].status,
        total_amount: results[0].total_amount,
        total_items: results[0].total_items,
        shipping_address: results[0].shipping_address,
        billing_address: results[0].billing_address,
        payment_method: results[0].payment_method,
        payment_status: results[0].payment_status,
        notes: results[0].notes,
        created_at: results[0].created_at,
        updated_at: results[0].updated_at,
        items: []
      };

      // Add items to order
      results.forEach(row => {
        if (row.item_id) {
          order.items.push({
            id: row.item_id,
            product_id: row.product_id,
            product_name: row.product_name,
            product_brand: row.product_brand,
            product_category: row.product_category,
            quantity: row.quantity,
            unit_price: row.unit_price,
            total_price: row.total_price,
            created_at: row.item_created_at
          });
        }
      });

      resolve(order);
    });
  });
};

// Get orders by customer ID
const getOrdersByCustomer = (customerId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        o.id, o.customer_id, o.order_number, o.status, o.total_amount, o.total_items,
        o.payment_method, o.payment_status, o.created_at, o.updated_at,
        COUNT(oi.id) as item_count
      FROM \`order\` o
      LEFT JOIN order_item oi ON o.id = oi.order_id
      WHERE o.customer_id = ?
      GROUP BY o.id, o.customer_id, o.order_number, o.status, o.total_amount, 
               o.total_items, o.payment_method, o.payment_status, o.created_at, o.updated_at
      ORDER BY o.created_at DESC
    `;

    db.query(query, [customerId], (err, results) => {
      if (err) return reject(err);
      resolve(results || []);
    });
  });
};

// Update order status
const updateOrderStatus = (orderId, status) => {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE `order` SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    
    db.query(query, [status, orderId], (err, result) => {
      if (err) return reject(err);
      if (result.affectedRows === 0) {
        return reject(new Error('Order not found'));
      }
      resolve(result);
    });
  });
};

// Update payment status
const updatePaymentStatus = (orderId, paymentStatus) => {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE `order` SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    
    db.query(query, [paymentStatus, orderId], (err, result) => {
      if (err) return reject(err);
      if (result.affectedRows === 0) {
        return reject(new Error('Order not found'));
      }
      resolve(result);
    });
  });
};

// Get all orders (for admin/employee) with customer details
const getAllOrders = (limit = 50, offset = 0) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        o.id, o.customer_id, o.order_number, o.status, o.total_amount, o.total_items,
        o.payment_method, o.payment_status, o.created_at, o.updated_at,
        c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
        COUNT(oi.id) as item_count
      FROM \`order\` o
      LEFT JOIN customer c ON o.customer_id = c.id
      LEFT JOIN order_item oi ON o.id = oi.order_id
      GROUP BY o.id, o.customer_id, o.order_number, o.status, o.total_amount, 
               o.total_items, o.payment_method, o.payment_status, o.created_at, o.updated_at,
               c.name, c.email, c.phone
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    db.query(query, [limit, offset], (err, results) => {
      if (err) return reject(err);
      resolve(results || []);
    });
  });
};

// Get order statistics
const getOrderStats = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_order_value,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
        COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
      FROM \`order\`
    `;

    db.query(query, (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || {});
    });
  });
};

export default {
  createOrderFromCart,
  addOrderItems,
  getOrderById,
  getOrdersByCustomer,
  updateOrderStatus,
  updatePaymentStatus,
  getAllOrders,
  getOrderStats
};

