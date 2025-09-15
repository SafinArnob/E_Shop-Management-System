import db from "../config/config.js";
import { randomUUID } from 'crypto';

 
// Create a new product
const createProduct = (name, category, brand, description, price, creatorId, creatorName) => {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    const query = `
      INSERT INTO product (id, name, category, brand, description, price, creator_id, creator_name) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [id, name, category, brand, description, price, creatorId, creatorName], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

// Get all products
const getAllProducts = () => {
  return new Promise((resolve, reject) => {

    const query = 'SELECT * FROM product';

    db.query(query, (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Get a product by ID
const getProductById = (id) => {
  return new Promise((resolve, reject) => {

    const query = 'SELECT * FROM product WHERE id = ?';
    
    db.query(query, [id], (err, result) => {
      if (err) reject(err);
      resolve(result[0]);
    });
  });
};

// Update product details
const updateProduct = (id, name, category, brand, description, price) => {
  return new Promise((resolve, reject) => {

    const query = 'UPDATE product SET name = ?, category = ?, brand = ?, description = ?, price = ? WHERE id = ?';

    db.query(query, [name, category, brand, description, price, id], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

// Delete product
const deleteProduct = (id) => {
  return new Promise((resolve, reject) => {

    const query = 'DELETE FROM product WHERE id = ?';

    db.query(query, [id], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

export default { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct };
