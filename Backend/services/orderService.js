import orderModel from '../models/orderModel.js';
import cartModel from '../models/cartModel.js';
import productModel from '../models/productModel.js';
import discountService from './discountService.js';
import discountModel from '../models/discountModel.js';
import { randomUUID } from 'crypto';
import db from "../config/config.js";

// Create order from cart with discount support
const createOrderFromCart = async (customerId, orderData) => {
  try {
    // Validate input
    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    if (!orderData || !orderData.totalAmount || !orderData.totalItems) {
      throw new Error('Order data is incomplete');
    }

    // Get customer's cart with items
    const cart = await cartModel.getCartWithItems(customerId);
    
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error('Cart is empty. Cannot create order.');
    }

    // Validate cart items (check if products still exist and prices are current)
    const validationResults = [];
    let hasChanges = false;

    for (const item of cart.items) {
      const currentProduct = await productModel.getProductById(item.product_id);
      
      if (!currentProduct) {
        validationResults.push({
          product_id: item.product_id,
          product_name: item.product_name,
          issue: 'Product no longer available',
          action: 'removed'
        });
        hasChanges = true;
      } else if (currentProduct.price !== item.price) {
        validationResults.push({
          product_id: item.product_id,
          product_name: item.product_name,
          old_price: item.price,
          new_price: currentProduct.price,
          issue: 'Price has changed',
          action: 'updated'
        });
        hasChanges = true;
      }
    }

    if (hasChanges) {
      return {
        success: false,
        message: 'Cart items have changed. Please review your cart before placing order.',
        validation_results: validationResults,
        cart: cart
      };
    }

    // Apply discount if provided
    let finalOrderData = { ...orderData };
    let discountInfo = null;
    
    if (orderData.discount_code) {
      const discountResult = await discountService.applyDiscountCode(orderData.discount_code, cart.items);
      
      if (!discountResult.success) {
        return {
          success: false,
          message: discountResult.message,
          validation_results: [],
          cart: cart
        };
      }

      finalOrderData.totalAmount = discountResult.cart_summary.final_total;
      finalOrderData.originalAmount = discountResult.cart_summary.original_total;
      finalOrderData.discountAmount = discountResult.cart_summary.total_discount;
      discountInfo = discountResult.discount_info;
    }

    // Create order
    const orderResult = await orderModel.createOrderFromCart(customerId, finalOrderData);
    
    // Add order items
    await orderModel.addOrderItems(orderResult.orderId, cart.items);

    // If discount was applied, link it to the order
    if (discountInfo && orderData.discount_code) {
      await linkDiscountToOrder(orderResult.orderId, orderData.discount_code);
    }

    // Clear customer's cart after successful order creation
    await cartModel.clearCart(customerId);

    // Get the complete order with items
    const completeOrder = await orderModel.getOrderById(orderResult.orderId);

    return {
      success: true,
      message: 'Order created successfully',
      order: completeOrder,
      order_number: orderResult.orderNumber,
      discount_applied: discountInfo
    };
  } catch (error) {
    throw new Error(error.message || 'Error creating order');
  }
};

// Helper function to link discount to order
const linkDiscountToOrder = async (orderId, discountCode) => {
  return new Promise((resolve, reject) => {
    
    // First get the discount ID
    const getDiscountQuery = `
      SELECT id FROM discounts 
      WHERE discount_code = ? 
        AND is_active = TRUE
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW())
    `;

    db.query(getDiscountQuery, [discountCode], (err, results) => {
      if (err) {
        console.error('Error fetching discount:', err);
        return reject(err);
      }
      
      if (!results || results.length === 0) {
        return reject(new Error('Discount not found or expired'));
      }

      const discountId = results[0].id;
      const linkId = randomUUID();

      // Check if discount is already linked to this order
      const checkLinkQuery = `
        SELECT id FROM order_discounts 
        WHERE order_id = ? AND discount_id = ?
      `;

      db.query(checkLinkQuery, [orderId, discountId], (checkErr, checkResults) => {
        if (checkErr) {
          console.error('Error checking existing discount link:', checkErr);
          return reject(checkErr);
        }

        if (checkResults && checkResults.length > 0) {
          // Already linked
          return resolve({ message: 'Discount already linked to order' });
        }

        // Link discount to order
        const linkQuery = `
          INSERT INTO order_discounts (id, order_id, discount_id)
          VALUES (?, ?, ?)
        `;

        db.query(linkQuery, [linkId, orderId, discountId], (linkErr, linkResult) => {
          if (linkErr) {
            console.error('Error linking discount to order:', linkErr);
            return reject(linkErr);
          }
          resolve(linkResult);
        });
      });
    });
  });
};

// Get order by ID with discount information
const getOrderById = async (orderId, customerId = null) => {
  try {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const order = await orderModel.getOrderById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    // If customerId is provided, ensure the order belongs to the customer
    if (customerId && order.customer_id !== customerId) {
      throw new Error('Access denied. Order does not belong to this customer.');
    }

    // Get discount information if any
    const discountInfo = await getOrderDiscountInfo(orderId);
    if (discountInfo) {
      order.discount_applied = discountInfo;
    }

    return order;
  } catch (error) {
    throw new Error(error.message || 'Error fetching order');
  }
};

// Helper function to get discount information for an order
const getOrderDiscountInfo = async (orderId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        d.discount_code,
        d.discount_type,
        d.discount_value,
        d.start_date,
        d.end_date
      FROM order_discounts od
      JOIN discounts d ON od.discount_id = d.id
      WHERE od.order_id = ?
    `;

    db.query(query, [orderId], (err, results) => {
      if (err) return reject(err);
      
      if (!results || results.length === 0) {
        return resolve(null);
      }

      resolve({
        discount_code: results[0].discount_code,
        discount_type: results[0].discount_type,
        discount_value: results[0].discount_value,
        start_date: results[0].start_date,
        end_date: results[0].end_date
      });
    });
  });
};

// Get customer's orders with discount information
const getCustomerOrders = async (customerId) => {
  try {
    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    const orders = await orderModel.getOrdersByCustomer(customerId);
    
    // Add discount information to each order
    for (let order of orders) {
      const discountInfo = await getOrderDiscountInfo(order.id);
      if (discountInfo) {
        order.discount_applied = discountInfo;
      }
    }

    return orders;
  } catch (error) {
    throw new Error(error.message || 'Error fetching customer orders');
  }
};

// Update order status (admin/employee only)
const updateOrderStatus = async (orderId, status) => {
  try {
    if (!orderId || !status) {
      throw new Error('Order ID and status are required');
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid order status');
    }

    await orderModel.updateOrderStatus(orderId, status);
    
    const updatedOrder = await getOrderById(orderId);
    
    return {
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    };
  } catch (error) {
    throw new Error(error.message || 'Error updating order status');
  }
};

// Update payment status
const updatePaymentStatus = async (orderId, paymentStatus) => {
  try {
    if (!orderId || !paymentStatus) {
      throw new Error('Order ID and payment status are required');
    }

    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      throw new Error('Invalid payment status');
    }

    await orderModel.updatePaymentStatus(orderId, paymentStatus);
    
    const updatedOrder = await getOrderById(orderId);
    
    return {
      success: true,
      message: 'Payment status updated successfully',
      order: updatedOrder
    };
  } catch (error) {
    throw new Error(error.message || 'Error updating payment status');
  }
};

// Get all orders (admin/employee only) with discount information
const getAllOrders = async (limit = 50, offset = 0) => {
  try {
    const orders = await orderModel.getAllOrders(limit, offset);
    
    // Add discount information to each order
    for (let order of orders) {
      const discountInfo = await getOrderDiscountInfo(order.id);
      if (discountInfo) {
        order.discount_applied = discountInfo;
      }
    }

    return orders;
  } catch (error) {
    throw new Error(error.message || 'Error fetching orders');
  }
};

// Get order statistics with discount analytics
const getOrderStats = async () => {
  try {
    const basicStats = await orderModel.getOrderStats();
    
    // Add discount-related statistics
    const discountStats = await getDiscountOrderStats();
    
    return {
      ...basicStats,
      discount_statistics: discountStats
    };
  } catch (error) {
    throw new Error(error.message || 'Error fetching order statistics');
  }
};

// Helper function to get discount order statistics
const getDiscountOrderStats = async () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        COUNT(DISTINCT od.order_id) as orders_with_discounts,
        COUNT(DISTINCT od.discount_id) as unique_discounts_used,
        AVG(
          CASE 
            WHEN d.discount_type = 'percentage' THEN 
              (o.total_amount * d.discount_value / (100 - d.discount_value))
            WHEN d.discount_type = 'flat' THEN 
              d.discount_value
            ELSE 0
          END
        ) as avg_discount_per_order,
        SUM(
          CASE 
            WHEN d.discount_type = 'percentage' THEN 
              (o.total_amount * d.discount_value / (100 - d.discount_value))
            WHEN d.discount_type = 'flat' THEN 
              d.discount_value
            ELSE 0
          END
        ) as total_discount_given
      FROM order_discounts od
      JOIN discounts d ON od.discount_id = d.id
      JOIN \`order\` o ON od.order_id = o.id
    `;

    db.query(query, (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || {
        orders_with_discounts: 0,
        unique_discounts_used: 0,
        avg_discount_per_order: 0,
        total_discount_given: 0
      });
    });
  });
};

// Cancel order (customer only, if order is still pending)
const cancelOrder = async (orderId, customerId) => {
  try {
    if (!orderId || !customerId) {
      throw new Error('Order ID and customer ID are required');
    }

    // Get order and verify ownership
    const order = await orderModel.getOrderById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.customer_id !== customerId) {
      throw new Error('Access denied. Order does not belong to this customer.');
    }

    // Check if order can be cancelled
    if (order.status !== 'pending') {
      throw new Error('Order cannot be cancelled. Only pending orders can be cancelled.');
    }

    // Update order status to cancelled
    await orderModel.updateOrderStatus(orderId, 'cancelled');
    
    const updatedOrder = await getOrderById(orderId);
    
    return {
      success: true,
      message: 'Order cancelled successfully',
      order: updatedOrder
    };
  } catch (error) {
    throw new Error(error.message || 'Error cancelling order');
  }
};

export default {
  createOrderFromCart,
  getOrderById,
  getCustomerOrders,
  updateOrderStatus,
  updatePaymentStatus,
  getAllOrders,
  getOrderStats,
  cancelOrder,
  linkDiscountToOrder,
  getOrderDiscountInfo
};