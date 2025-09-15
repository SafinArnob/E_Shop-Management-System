import db from '../config/config.js';
import { randomUUID } from 'crypto';

// Register a new user (admin/employee/customer)
const registerUser = (username, email, password, role, salesman_id) => {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
  

    let query = '';
    let params = [];

    if (role === 'admin') 
    {
      query = 'INSERT INTO owner (id, username, email, password) VALUES (?, ?, ?, ?)';
      params = [id, username, email, password];
    } 
    else if (role === 'employee') 
    {
      query = 'INSERT INTO salesman (id, name, email, password, status, owner_id) VALUES (?, ?, ?, ?, ?, ?)';
      params = [id, username, email, password, 'active', null];
    } 
    else if (role === 'customer') 
    {
      query = 'INSERT INTO customer (id, name, email, password, phone, address, status, salesman_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      params = [id, username, email, password, null, null, 'active', salesman_id || null];
    } 
    else {
      return reject(new Error('Invalid role'));
    }

    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve({ id, role, email, username });
    });
  });
};

// Get a user by email across all user tables, normalized
const getUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id, username, email, password, 'admin' AS role FROM owner WHERE email = ?
      UNION ALL
      SELECT id, name AS username, email, password, 'employee' AS role FROM salesman WHERE email = ?
      UNION ALL
      SELECT id, name AS username, email, password, 'customer' AS role FROM customer WHERE email = ?
      LIMIT 1
    `;
    db.query(query, [email, email, email], (err, results) => {
      if (err) return reject(err);
      resolve(results && results[0] ? results[0] : null);
    });
  });
};

export default { registerUser, getUserByEmail };