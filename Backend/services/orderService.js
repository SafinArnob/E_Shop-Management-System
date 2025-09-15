import orderModel from '../models/orderModel.js';
import cartModel from '../models/cartModel.js';
import productModel from '../models/productModel.js';

// Create order from cart
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

    // Create order
    const orderResult = await orderModel.createOrderFromCart(customerId, orderData);
    
    // Add order items
    await orderModel.addOrderItems(orderResult.orderId, cart.items);

    // Clear customer's cart after successful order creation
    await cartModel.clearCart(customerId);

    // Get the complete order with items
    const completeOrder = await orderModel.getOrderById(orderResult.orderId);

    return {
      success: true,
      message: 'Order created successfully',
      order: completeOrder,
      order_number: orderResult.orderNumber
    };
  } catch (error) {
    throw new Error(error.message || 'Error creating order');
  }
};

// Get order by ID
const getOrderById = async (orderId, customerId = null) => {
  try {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const order = await orderModel.getOrderById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    if (customerId && order.customer_id !== customerId) {
      throw new Error('Access denied. Order does not belong to this customer.');
    }

    return order;
  } catch (error) {
    throw new Error(error.message || 'Error fetching order');
  }
};

// Get customer's orders
const getCustomerOrders = async (customerId) => {
  try {
    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    const orders = await orderModel.getOrdersByCustomer(customerId);
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
    
    const updatedOrder = await orderModel.getOrderById(orderId);
    
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
    
    const updatedOrder = await orderModel.getOrderById(orderId);
    
    return {
      success: true,
      message: 'Payment status updated successfully',
      order: updatedOrder
    };
  } catch (error) {
    throw new Error(error.message || 'Error updating payment status');
  }
};

// Get all orders (admin/employee only)
const getAllOrders = async (limit = 50, offset = 0) => {
  try {
    const orders = await orderModel.getAllOrders(limit, offset);
    return orders;
  } catch (error) {
    throw new Error(error.message || 'Error fetching orders');
  }
};

// Get order statistics (admin/employee only)
const getOrderStats = async () => {
  try {
    const stats = await orderModel.getOrderStats();
    return stats;
  } catch (error) {
    throw new Error(error.message || 'Error fetching order statistics');
  }
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

   
    await orderModel.updateOrderStatus(orderId, 'cancelled');
    
    const updatedOrder = await orderModel.getOrderById(orderId);
    
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
  cancelOrder
};

