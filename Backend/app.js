import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import discountRoutes from './routes/discountRoutes.js';


dotenv.config();

const app = express();


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes); 
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);    
app.use('/api/support', supportRoutes);   
app.use('/api/discounts', discountRoutes);       

export default app;
