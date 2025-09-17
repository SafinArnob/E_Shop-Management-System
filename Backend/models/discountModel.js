import db from "../config/config.js";
import { randomUUID } from 'crypto';

// Create a new discount
const createDiscount = (discountData) => {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    const {
      name, discount_code, discount_type, calculation_type, discount_value,
      minimum_quantity, minimum_order_amount, start_date, end_date,
      description, created_by
    } = discountData;

    const query = `
      INSERT INTO discounts (
        id, name, discount_code, discount_type, calculation_type, discount_value,
        minimum_quantity, minimum_order_amount, start_date, end_date,
        description, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [
      id, name, discount_code, discount_type, calculation_type, discount_value,
      minimum_quantity, minimum_order_amount, start_date, end_date,
      description, created_by
    ], (err, result) => {
      if (err) reject(err);
      resolve({ id, ...result });
    });
  });
};

// Link discount to specific products
const addProductsToDiscount = (discountId, productIds) => {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      resolve({ message: 'No products to add' });
      return;
    }

    const values = productIds.map(productId => [randomUUID(), discountId, productId]);
    const query = `INSERT INTO discount_products (id, discount_id, product_id) VALUES ?`;

    db.query(query, [values], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

// Get discount by code
const getDiscountByCode = (discountCode) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM discounts 
      WHERE discount_code = ?
      AND is_active = TRUE
      AND (start_date IS NULL OR start_date <= NOW())
      AND (end_date IS NULL OR end_date >= NOW())
    `;

    db.query(query, [discountCode], (err, results) => {
      if (err) reject(err);
      resolve(results[0]);
    });
  });
};

// Get all discounts
const getAllDiscounts = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT d.*, 
             GROUP_CONCAT(DISTINCT dp.product_id) as product_ids
      FROM discounts d
      LEFT JOIN discount_products dp ON d.id = dp.discount_id
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `;

    db.query(query, (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Get discount by ID
const getDiscountById = (id) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT d.*, 
             GROUP_CONCAT(DISTINCT dp.product_id) as product_ids
      FROM discounts d
      LEFT JOIN discount_products dp ON d.id = dp.discount_id
      WHERE d.id = ?
      GROUP BY d.id
    `;

    db.query(query, [id], (err, results) => {
      if (err) reject(err);
      resolve(results[0]);
    });
  });
};

// Update discount
const updateDiscount = (id, discountData) => {
  return new Promise((resolve, reject) => {
    const {
      name, discount_code, discount_type, calculation_type, discount_value,
      minimum_quantity, minimum_order_amount, start_date, end_date,
      description, is_active
    } = discountData;

    const query = `
      UPDATE discounts SET 
      name = ?, discount_code = ?, discount_type = ?, calculation_type = ?, discount_value = ?,
      minimum_quantity = ?, minimum_order_amount = ?, start_date = ?, end_date = ?,
      description = ?, is_active = ?, updated_at = NOW()
      WHERE id = ?
    `;

    db.query(query, [
      name, discount_code, discount_type, calculation_type, discount_value,
      minimum_quantity, minimum_order_amount, start_date, end_date,
      description, is_active, id
    ], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

// Delete discount
const deleteDiscount = (id) => {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM discounts WHERE id = ?';
    db.query(query, [id], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

// Remove products from discount
const removeProductsFromDiscount = (discountId) => {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM discount_products WHERE discount_id = ?';
    db.query(query, [discountId], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

export default {
  createDiscount,
  addProductsToDiscount,
  getDiscountByCode,
  getAllDiscounts,
  getDiscountById,
  updateDiscount,
  deleteDiscount,
  removeProductsFromDiscount
};