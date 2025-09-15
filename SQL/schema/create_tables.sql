-- Create the database
CREATE DATABASE IF NOT EXISTS shop_management_system;
-- Use the created database
USE shop_management_system;

-- Owner (Admin) Table
CREATE TABLE IF NOT EXISTS owner (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Salesman (Employee) Table
CREATE TABLE IF NOT EXISTS salesman (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive', 'suspended', 'terminated') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    owner_id VARCHAR(255),
    FOREIGN KEY (owner_id) REFERENCES owner(id)
);
-- Customer Table
CREATE TABLE IF NOT EXISTS customer (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    status ENUM(
        'active',
        'inactive',
        'blocked',
        'pending_verification'
    ) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    salesman_id VARCHAR(255),
    FOREIGN KEY (salesman_id) REFERENCES salesman(id)
);
-- Product Table
CREATE TABLE IF NOT EXISTS product (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    brand VARCHAR(255),
    description TEXT,
    price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creator_id VARCHAR(255),
    creator_name VARCHAR(255)
);
-- Cart Table
CREATE TABLE IF NOT EXISTS cart (
    id VARCHAR(255) PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE CASCADE
);
-- Cart Items Table
CREATE TABLE IF NOT EXISTS cart_item (
    id VARCHAR(255) PRIMARY KEY,
    cart_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_product (cart_id, product_id)
);
-- Order Table
CREATE TABLE IF NOT EXISTS `order` (
    id VARCHAR(255) PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    total_items INT NOT NULL DEFAULT 0,
    shipping_address TEXT,
    billing_address TEXT,
    payment_method ENUM('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery') DEFAULT 'credit_card',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE CASCADE
);
-- Order Items Table
CREATE TABLE IF NOT EXISTS order_item (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_brand VARCHAR(255),
    product_category VARCHAR(255),
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES `order`(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
);
-- Discounts Table with more fields
DROP TABLE IF EXISTS discounts;
CREATE TABLE IF NOT EXISTS discounts (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_code VARCHAR(100) UNIQUE,
    discount_type ENUM('percentage', 'flat', 'bundle', 'category', 'global') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    minimum_order_amount DECIMAL(10, 2) DEFAULT 0,
    maximum_discount_amount DECIMAL(10, 2) DEFAULT NULL,
    usage_limit INT DEFAULT NULL,
    usage_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    apply_to_all BOOLEAN DEFAULT FALSE,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP DEFAULT NULL,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- Product Discounts Table
DROP TABLE IF EXISTS product_discounts;
CREATE TABLE IF NOT EXISTS product_discounts (
    id VARCHAR(255) PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    discount_id VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_product_discount (product_id, discount_id)
);
-- Category Discounts Table
CREATE TABLE IF NOT EXISTS category_discounts (
    id VARCHAR(255) PRIMARY KEY,
    category VARCHAR(255) NOT NULL,
    discount_id VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_category_discount (category, discount_id)
);
-- Bundle Products Table
CREATE TABLE IF NOT EXISTS bundle_products (
    id VARCHAR(255) PRIMARY KEY,
    bundle_name VARCHAR(255) NOT NULL,
    discount_id VARCHAR(255) NOT NULL,
    minimum_quantity INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE CASCADE
);
-- Bundle Product Items Table
CREATE TABLE IF NOT EXISTS bundle_product_items (
    id VARCHAR(255) PRIMARY KEY,
    bundle_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    quantity_required INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bundle_id) REFERENCES bundle_products(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    UNIQUE KEY unique_bundle_product (bundle_id, product_id)
);
-- Order Discounts Table
DROP TABLE IF EXISTS order_discounts;
CREATE TABLE IF NOT EXISTS order_discounts (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    discount_id VARCHAR(255) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    original_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES `order`(id) ON DELETE CASCADE,
    FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_order_customer_id ON `order`(customer_id);
CREATE INDEX idx_order_status ON `order`(status);
CREATE INDEX idx_order_created_at ON `order`(created_at);
CREATE INDEX idx_order_item_order_id ON order_item(order_id);
CREATE INDEX idx_order_item_product_id ON order_item(product_id);
CREATE INDEX idx_discounts_active ON discounts(is_active);
CREATE INDEX idx_discounts_dates ON discounts(start_date, end_date);
CREATE INDEX idx_discounts_type ON discounts(discount_type);
CREATE INDEX idx_product_discounts_active ON product_discounts(is_active);
CREATE INDEX idx_category_discounts_active ON category_discounts(is_active);
CREATE INDEX idx_bundle_products_active ON bundle_products(is_active);
CREATE INDEX idx_order_discounts_order_id ON order_discounts(order_id);
CREATE INDEX idx_order_discounts_discount_id ON order_discounts(discount_id);

SELECT * FROM owner;
SELECT * FROM salesman;
SELECT * FROM customer;
SELECT * FROM product;
SELECT * FROM product;
SELECT * FROM cart;
SELECT * FROM cart_item;
SELECT * FROM `order`;
SELECT * FROM order_item;