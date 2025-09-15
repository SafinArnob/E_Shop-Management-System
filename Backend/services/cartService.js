import cartModel from '../models/cartModel.js';
import productModel from '../models/productModel.js';

// Add product to cart
const addToCart = async (customerId, productId, quantity = 1) => {
  try {
    // Validate input
    if (!customerId || !productId) {
      throw new Error('Customer ID and Product ID are required');
    }

    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    // Check if product exists
    const product = await productModel.getProductById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Get or create cart for customer
    const cart = await cartModel.getOrCreateCart(customerId);

    // Add item to cart
    const result = await cartModel.addItemToCart(cart.id, productId, quantity, product.price);

    return {
      success: true,
      message: result.message,
      cartId: cart.id,
      productId,
      quantity,
      price: product.price
    };
  } catch (error) {
    throw new Error(error.message || 'Error adding item to cart');
  }
};

// Get customer's cart with items
const getCart = async (customerId) => {
  try {
    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    const cart = await cartModel.getCartWithItems(customerId);
    
    if (!cart) {
      // Create empty cart if none exists
      const newCart = await cartModel.getOrCreateCart(customerId);
      return {
        id: newCart.id,
        customer_id: newCart.customer_id,
        created_at: newCart.created_at,
        updated_at: newCart.updated_at,
        items: [],
        total_items: 0,
        total_amount: 0
      };
    }

    // Calculate totals
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return {
      ...cart,
      total_items: totalItems,
      total_amount: totalAmount
    };
  } catch (error) {
    throw new Error(error.message || 'Error fetching cart');
  }
};

// Update cart item quantity
const updateCartItem = async (customerId, productId, quantity) => {
  try {
    if (!customerId || !productId) {
      throw new Error('Customer ID and Product ID are required');
    }

    if (quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

    // Get customer's cart
    const cart = await cartModel.getOrCreateCart(customerId);

    // Update item quantity
    const result = await cartModel.updateCartItemQuantity(cart.id, productId, quantity);

    return {
      success: true,
      message: result.message,
      cartId: cart.id,
      productId,
      quantity
    };
  } catch (error) {
    throw new Error(error.message || 'Error updating cart item');
  }
};

// Remove item from cart
const removeFromCart = async (customerId, productId) => {
  try {
    if (!customerId || !productId) {
      throw new Error('Customer ID and Product ID are required');
    }

    // Get customer's cart
    const cart = await cartModel.getOrCreateCart(customerId);

    // Remove item from cart
    const result = await cartModel.removeItemFromCart(cart.id, productId);

    return {
      success: true,
      message: result.message,
      cartId: cart.id,
      productId
    };
  } catch (error) {
    throw new Error(error.message || 'Error removing item from cart');
  }
};

// Clear entire cart
const clearCart = async (customerId) => {
  try {
    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    const result = await cartModel.clearCart(customerId);

    return {
      success: true,
      message: result.message,
      customerId
    };
  } catch (error) {
    throw new Error(error.message || 'Error clearing cart');
  }
};

// Get cart item count
const getCartItemCount = async (customerId) => {
  try {
    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    const count = await cartModel.getCartItemCount(customerId);

    return {
      customerId,
      total_items: count
    };
  } catch (error) {
    throw new Error(error.message || 'Error getting cart item count');
  }
};

// Validate cart items (check if products still exist and prices are current)
const validateCart = async (customerId) => {
  try {
    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    const cart = await cartModel.getCartWithItems(customerId);
    
    if (!cart || !cart.items.length) {
      return {
        valid: true,
        message: 'Cart is empty',
        cart
      };
    }

    const validationResults = [];
    let hasChanges = false;

    for (const item of cart.items) {
      const currentProduct = await productModel.getProductById(item.product_id);
      
      if (!currentProduct) {
        // Product no longer exists
        validationResults.push({
          item_id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          issue: 'Product no longer available',
          action: 'removed'
        });
        hasChanges = true;
      } else if (currentProduct.price !== item.price) {
        // Price has changed
        validationResults.push({
          item_id: item.id,
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

    return {
      valid: !hasChanges,
      has_changes: hasChanges,
      validation_results: validationResults,
      cart
    };
  } catch (error) {
    throw new Error(error.message || 'Error validating cart');
  }
};

export default {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartItemCount,
  validateCart
};
