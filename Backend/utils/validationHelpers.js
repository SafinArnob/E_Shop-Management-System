
// Validation helper functions for discount system

export const validateDiscountData = (discountData) => {
  const errors = [];
  
  if (!discountData.name || typeof discountData.name !== 'string' || discountData.name.trim().length === 0) {
    errors.push('Discount name is required and must be a non-empty string');
  }
  
  if (!discountData.discount_code || typeof discountData.discount_code !== 'string' || discountData.discount_code.trim().length === 0) {
    errors.push('Discount code is required and must be a non-empty string');
  }
  
  const validDiscountTypes = ['global', 'individual', 'bundle'];
  if (!validDiscountTypes.includes(discountData.discount_type)) {
    errors.push('Discount type must be one of: global, individual, bundle');
  }
  
  const validCalculationTypes = ['percentage', 'flat'];
  if (!validCalculationTypes.includes(discountData.calculation_type)) {
    errors.push('Calculation type must be either percentage or flat');
  }
  
  if (!discountData.discount_value || typeof discountData.discount_value !== 'number' || discountData.discount_value <= 0) {
    errors.push('Discount value must be a positive number');
  }
  
  if (discountData.calculation_type === 'percentage' && discountData.discount_value > 100) {
    errors.push('Percentage discount cannot exceed 100%');
  }
  
  if (discountData.minimum_order_amount && (typeof discountData.minimum_order_amount !== 'number' || discountData.minimum_order_amount < 0)) {
    errors.push('Minimum order amount must be a non-negative number');
  }
  
  if (discountData.minimum_quantity && (typeof discountData.minimum_quantity !== 'number' || discountData.minimum_quantity < 0)) {
    errors.push('Minimum quantity must be a non-negative number');
  }
  
  if (discountData.start_date && discountData.end_date) {
    const startDate = new Date(discountData.start_date);
    const endDate = new Date(discountData.end_date);
    
    if (startDate >= endDate) {
      errors.push('Start date must be before end date');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateOrderData = (orderData) => {
  const errors = [];
  
  if (!orderData.totalAmount || typeof orderData.totalAmount !== 'number' || orderData.totalAmount <= 0) {
    errors.push('Total amount must be a positive number');
  }
  
  if (!orderData.totalItems || typeof orderData.totalItems !== 'number' || orderData.totalItems <= 0) {
    errors.push('Total items must be a positive number');
  }
  
  if (!orderData.shippingAddress || typeof orderData.shippingAddress !== 'string' || orderData.shippingAddress.trim().length === 0) {
    errors.push('Shipping address is required');
  }
  
  if (!orderData.paymentMethod || typeof orderData.paymentMethod !== 'string' || orderData.paymentMethod.trim().length === 0) {
    errors.push('Payment method is required');
  }
  
  const validPaymentMethods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'];
  if (!validPaymentMethods.includes(orderData.paymentMethod)) {
    errors.push('Invalid payment method');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateCartItems = (cartItems) => {
  if (!Array.isArray(cartItems)) {
    return {
      isValid: false,
      errors: ['Cart items must be an array']
    };
  }
  
  if (cartItems.length === 0) {
    return {
      isValid: false,
      errors: ['Cart cannot be empty']
    };
  }
  
  const errors = [];
  
  cartItems.forEach((item, index) => {
    if (!item.product_id) {
      errors.push(`Item ${index + 1}: Product ID is required`);
    }
    
    if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Quantity must be a positive number`);
    }
    
    if (!item.price || typeof item.price !== 'number' || item.price < 0) {
      errors.push(`Item ${index + 1}: Price must be a non-negative number`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};