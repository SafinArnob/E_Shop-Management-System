import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Register user
export const register = async (req, res) => {
  try {
    const { username, email, password, role, salesman_id } = req.body;

    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password before storing it
    const hashedPassword = bcrypt.hashSync(password, 10);  

    await userModel.registerUser(username, email, hashedPassword, role, salesman_id);
      res.status(201).json({ message: 'User registered successfully' });
  } 
    catch (error) {
      res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password); 
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};