import productService from '../services/productService.js';

// Create product
export const createProduct = async (req, res) => {
  try {
    const { name, category, brand, description, price } = req.body;

    
    const creatorId = req.user.userId;  
    const creatorName = req.user.username; 
    
    // console.log('JWT User object:', req.user);
    // console.log('Creator ID:', creatorId);
    // console.log('Creator Name:', creatorName);

    
    const response = await productService.createProduct(name, category, brand, description, price, creatorId, creatorName);
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    const products = await productService.getAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, brand, description, price } = req.body;
    const response = await productService.updateProduct(id, name, category, brand, description, price);
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await productService.deleteProduct(id);
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};
