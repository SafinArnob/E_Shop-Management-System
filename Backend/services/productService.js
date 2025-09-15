import productModel from '../models/productModel.js';

const createProduct = async (name, category, brand, description, price, creatorId, creatorName) => {
  try {
    if (!name || !category || !brand || !description || !price) {
      throw new Error('All fields are required');
    }

    // Call the model function to insert the product into the database
    await productModel.createProduct(name, category, brand, description, price, creatorId, creatorName);
    return { message: 'Product created successfully' };
  } catch (error) {
    throw new Error(error.message || 'Error creating product');
  }
};

const getAllProducts = async () => {
  try {
    const products = await productModel.getAllProducts();
        return products;
  } catch (error) {
        throw new Error(error.message || 'Error fetching products');
  }
};

const getProductById = async (id) => {
  try {
    const product = await productModel.getProductById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  } catch (error) {
    throw new Error(error.message || 'Error fetching product');
  }
};

const updateProduct = async (id, name, category, brand, description, price) => {
  try {
    if (!name || !category || !brand || !description || !price) {
      throw new Error('All fields are required');
    }

    await productModel.updateProduct(id, name, category, brand, description, price);
    return { message: 'Product updated successfully' };
  } catch (error) {
    throw new Error(error.message || 'Error updating product');
  }
};

const deleteProduct = async (id) => {
  try {
    await productModel.deleteProduct(id);
    return { message: 'Product deleted successfully' };
  } catch (error) {
    throw new Error(error.message || 'Error deleting product');
  }
};

export default {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
};
