import discountModel from '../models/discountModel.js';

const createDiscount = async (discountData, productIds) => {
  try {
    const { name, discount_type, calculation_type, discount_value } = discountData;
    
    if (!name || !discount_type || !calculation_type || !discount_value) {
      throw new Error('Name, discount_type, calculation_type, and discount_value are required');
    }

    if (calculation_type === 'percentage' && discount_value > 100) {
      throw new Error('Percentage discount cannot exceed 100%');
    }

    // Create the discount
    const discount = await discountModel.createDiscount(discountData);
    
    // Add products for individual discounts
    if (discount_type === 'individual' && productIds && productIds.length > 0) {
      await discountModel.addProductsToDiscount(discount.id, productIds);
    }

    return { message: 'Discount created successfully', discount };
  } catch (error) {
    throw new Error(error.message || 'Error creating discount');
  }
};

const getAllDiscounts = async () => {
  try {
    const discounts = await discountModel.getAllDiscounts();
    return discounts;
  } catch (error) {
    throw new Error(error.message || 'Error fetching discounts');
  }
};

const getDiscountById = async (id) => {
  try {
    const discount = await discountModel.getDiscountById(id);
    if (!discount) {
      throw new Error('Discount not found');
    }
    return discount;
  } catch (error) {
    throw new Error(error.message || 'Error fetching discount');
  }
};

const updateDiscount = async (id, discountData, productIds) => {
  try {
    const existingDiscount = await discountModel.getDiscountById(id);
    if (!existingDiscount) {
      throw new Error('Discount not found');
    }

    await discountModel.updateDiscount(id, discountData);
    
    // Update products for individual discounts
    if (discountData.discount_type === 'individual') {
      await discountModel.removeProductsFromDiscount(id);
      if (productIds && productIds.length > 0) {
        await discountModel.addProductsToDiscount(id, productIds);
      }
    }

    return { message: 'Discount updated successfully' };
  } catch (error) {
    throw new Error(error.message || 'Error updating discount');
  }
};

const deleteDiscount = async (id) => {
  try {
    const existingDiscount = await discountModel.getDiscountById(id);
    if (!existingDiscount) {
      throw new Error('Discount not found');
    }

    await discountModel.deleteDiscount(id);
    return { message: 'Discount deleted successfully' };
  } catch (error) {
    throw new Error(error.message || 'Error deleting discount');
  }
};

// Apply discount code to cart

const applyDiscountCode = async (discountCode, cartItems) => {
  try {
    const discount = await discountModel.getDiscountByCode(discountCode);
    
    if (!discount) {
      return {
        success: false,
        message: 'Invalid or expired discount code'
      };
    }
    
    // Calculate original totals
    const originalTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Check minimum requirements
    if (discount.minimum_order_amount && originalTotal < discount.minimum_order_amount) {
      return {
        success: false,
        message: `Minimum order amount of $${discount.minimum_order_amount} required`
      };
    }
    
    if (discount.minimum_quantity && totalQuantity < discount.minimum_quantity) {
      return {
        success: false,
        message: `Minimum ${discount.minimum_quantity} items required`
      };
    }
    
    let discountAmount = 0;
    
    // Apply discount based on type
    if (discount.discount_type === 'global') {
      // Apply to entire cart
      if (discount.calculation_type === 'percentage') {
        discountAmount = originalTotal * (discount.discount_value / 100);
      } else {
        discountAmount = Math.min(discount.discount_value, originalTotal);
      }
    } 
    else if (discount.discount_type === 'individual') {
      // Apply only to specific products
      const productIds = discount.product_ids ? discount.product_ids.split(',') : [];
      const eligibleItems = cartItems.filter(item => productIds.includes(item.product_id));
      
      if (eligibleItems.length === 0) {
        return {
          success: false,
          message: 'No eligible items in cart for this discount'
        };
      }
      
      const eligibleTotal = eligibleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      if (discount.calculation_type === 'percentage') {
        discountAmount = eligibleTotal * (discount.discount_value / 100);
      } else {
        discountAmount = Math.min(discount.discount_value, eligibleTotal);
      }
    }
    else if (discount.discount_type === 'bundle') {
      // Bundle discount applies to entire cart
      if (discount.calculation_type === 'percentage') {
        discountAmount = originalTotal * (discount.discount_value / 100);
      } else {
        discountAmount = Math.min(discount.discount_value, originalTotal);
      }
    }
    
    const finalTotal = Math.max(0, originalTotal - discountAmount);
    
    return {
      success: true,
      cart_summary: {
        original_total: originalTotal,
        total_discount: discountAmount,
        final_total: finalTotal
      },
      discount_info: {
        code: discount.discount_code,
        name: discount.name,
        type: discount.discount_type,
        calculation_type: discount.calculation_type,
        value: discount.discount_value,
        description: discount.description
      },
      savings_percentage: originalTotal > 0 ? ((discountAmount / originalTotal) * 100).toFixed(2) : 0
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Error applying discount code'
    };
  }
};

export default {
  createDiscount,
  getAllDiscounts,
  getDiscountById,
  updateDiscount,
  deleteDiscount,
  applyDiscountCode
};