import db from '../config/config.js';
import { randomUUID } from 'crypto';

// Create Discount
const createDiscount = (discountCode, discountType, discountValue, startDate, endDate) => {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    const query = `
      INSERT INTO discounts (id, discount_code, discount_type, discount_value, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [id, discountCode, discountType, discountValue, startDate, endDate];

    db.query(query, params, (err, result) => {
      if (err) return reject(err);
      resolve({ id, message: 'Discount created successfully' });
    });
  });
};

// Update Discount
const updateDiscount = (id, discountCode, discountType, discountValue, startDate, endDate) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE discounts
      SET discount_code = ?, discount_type = ?, discount_value = ?, start_date = ?, end_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const params = [discountCode, discountType, discountValue, startDate, endDate, id];

    db.query(query, params, (err, result) => {
      if (err) return reject(err);
      resolve({ message: 'Discount updated successfully' });
    });
  });
};

// Get All Discounts
const getAllDiscounts = () => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM discounts';
    db.query(query, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Link Discount to Product
const linkDiscountToProduct = (productId, discountId) => {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    const query = `
      INSERT INTO product_discounts (id, product_id, discount_id)
      VALUES (?, ?, ?)
    `;
    const params = [id, productId, discountId];

    db.query(query, params, (err, result) => {
      if (err) return reject(err);
      resolve({ message: 'Discount applied to product' });
    });
  });
};

// Link Discount to Order
const linkDiscountToOrder = (orderId, discountId) => {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    const query = `
      INSERT INTO order_discounts (id, order_id, discount_id)
      VALUES (?, ?, ?)
    `;
    const params = [id, orderId, discountId];

    db.query(query, params, (err, result) => {
      if (err) return reject(err);
      resolve({ message: 'Discount applied to order' });
    });
  });
};

export default {
  createDiscount,
  updateDiscount,
  getAllDiscounts,
  linkDiscountToProduct,
  linkDiscountToOrder
};
