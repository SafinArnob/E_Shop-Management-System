-- Create the database
CREATE DATABASE IF NOT EXISTS shop_management_system;
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
    status ENUM('active', 'inactive', 'blocked', 'pending_verification') NOT NULL,
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

-- Order Table (UPDATED with discount fields)
CREATE TABLE IF NOT EXISTS `order` (
    id VARCHAR(255) PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    original_amount DECIMAL(10, 2) NULL COMMENT 'Amount before discount',
    discount_amount DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Total discount applied',
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

-- DISCOUNT SYSTEM TABLES

-- 1. Main Discounts Table (CORRECTED)
CREATE TABLE IF NOT EXISTS discounts (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'Discount name (e.g., Summer Sale)',
    discount_code VARCHAR(100) UNIQUE NOT NULL COMMENT 'Code customers use (e.g., SUMMER20)',
    discount_type ENUM('global', 'individual', 'bundle') NOT NULL COMMENT 'Type of discount',
    calculation_type ENUM('percentage', 'flat') NOT NULL COMMENT 'How discount is calculated',
    discount_value DECIMAL(10, 2) NOT NULL COMMENT 'Discount value (20 for 20% or 50 for $50)',
    
    -- Optional Conditions
    minimum_quantity INT DEFAULT NULL COMMENT 'Min items needed (for bundle discounts)',
    minimum_order_amount DECIMAL(10, 2) DEFAULT NULL COMMENT 'Min order total required',
    
    -- Timing
    start_date TIMESTAMP NULL COMMENT 'When discount starts',
    end_date TIMESTAMP NULL COMMENT 'When discount expires',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Enable/disable discount',
    
    -- Metadata
    description TEXT NULL COMMENT 'Description for customers',
    created_by VARCHAR(255) NULL COMMENT 'Admin/Employee who created it',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_discount_value_positive CHECK (discount_value > 0),
    CONSTRAINT chk_percentage_max_100 CHECK (
        calculation_type != 'percentage' OR discount_value <= 100
    )
);

-- 2. Individual Product Discounts
CREATE TABLE IF NOT EXISTS discount_products (
    id VARCHAR(255) PRIMARY KEY,
    discount_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    UNIQUE KEY unique_discount_product (discount_id, product_id)
);

-- 3. Order Discount Applications (RENAMED from order_discount_applications to match code)
CREATE TABLE IF NOT EXISTS order_discounts (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    discount_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES `order`(id) ON DELETE CASCADE,
    FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_order_discount (order_id, discount_id)
);

-- Support Categories Table
CREATE TABLE IF NOT EXISTS support_categories (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Support Tickets Table (Simplified)
CREATE TABLE IF NOT EXISTS support_tickets (
    id VARCHAR(255) PRIMARY KEY,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(255) NOT NULL,
    category_id VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    assigned_to VARCHAR(255) NULL,
    assigned_type ENUM('owner', 'salesman') NULL,
    order_id VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES support_categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (order_id) REFERENCES `order`(id) ON DELETE SET NULL
);

-- Support Messages Table (Simplified)
CREATE TABLE IF NOT EXISTS support_messages (
    id VARCHAR(255) PRIMARY KEY,
    ticket_id VARCHAR(255) NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    sender_type ENUM('customer', 'owner', 'salesman') NOT NULL,
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
);


-- PERFORMANCE INDEXES

-- Order table indexes
CREATE INDEX idx_order_customer ON `order`(customer_id);
CREATE INDEX idx_order_status ON `order`(status);
CREATE INDEX idx_order_payment_status ON `order`(payment_status);
CREATE INDEX idx_order_created ON `order`(created_at);
CREATE INDEX idx_order_number ON `order`(order_number);

-- Order items indexes
CREATE INDEX idx_order_item_order ON order_item(order_id);
CREATE INDEX idx_order_item_product ON order_item(product_id);

-- Cart indexes
CREATE INDEX idx_cart_customer ON cart(customer_id);
CREATE INDEX idx_cart_created ON cart(created_at);

-- Cart items indexes
CREATE INDEX idx_cart_item_cart ON cart_item(cart_id);
CREATE INDEX idx_cart_item_product ON cart_item(product_id);
CREATE INDEX idx_cart_item_cart_product ON cart_item(cart_id, product_id);

-- Discount indexes
CREATE INDEX idx_discounts_code ON discounts(discount_code);
CREATE INDEX idx_discounts_active ON discounts(is_active, start_date, end_date);
CREATE INDEX idx_discounts_type ON discounts(discount_type);
CREATE INDEX idx_discounts_dates ON discounts(start_date, end_date);

-- Discount products indexes
CREATE INDEX idx_discount_products_discount ON discount_products(discount_id);
CREATE INDEX idx_discount_products_product ON discount_products(product_id);

-- Order discounts indexes
CREATE INDEX idx_order_discounts_order ON order_discounts(order_id);
CREATE INDEX idx_order_discounts_discount ON order_discounts(discount_id);

-- Customer indexes
CREATE INDEX idx_customer_email ON customer(email);
CREATE INDEX idx_customer_phone ON customer(phone);
CREATE INDEX idx_customer_status ON customer(status);

-- Product indexes
CREATE INDEX idx_product_name ON product(name);
CREATE INDEX idx_product_category ON product(category);
CREATE INDEX idx_product_brand ON product(brand);
CREATE INDEX idx_product_price ON product(price);

-- Support system indexes
CREATE INDEX idx_support_tickets_customer ON support_tickets(customer_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_assigned ON support_tickets(assigned_to, assigned_type);
CREATE INDEX idx_support_messages_ticket ON support_messages(ticket_id);
CREATE INDEX idx_support_messages_sender ON support_messages(sender_id, sender_type);

-- Support tickets indexes
CREATE INDEX idx_support_tickets_customer_id ON support_tickets(customer_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_category_id ON support_tickets(category_id);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX idx_support_tickets_updated_at ON support_tickets(updated_at);
CREATE INDEX idx_support_tickets_order_id ON support_tickets(order_id);

-- Composite indexes for common query patterns
CREATE INDEX idx_support_tickets_customer_status ON support_tickets(customer_id, status);
CREATE INDEX idx_support_tickets_status_priority ON support_tickets(status, priority);
CREATE INDEX idx_support_tickets_assigned_status ON support_tickets(assigned_to, status);

-- Support messages indexes
CREATE INDEX idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX idx_support_messages_sender ON support_messages(sender_id, sender_type);
CREATE INDEX idx_support_messages_created_at ON support_messages(created_at);
CREATE INDEX idx_support_messages_internal ON support_messages(is_internal);

-- Composite index for message queries
CREATE INDEX idx_support_messages_ticket_internal ON support_messages(ticket_id, is_internal);

-- Support categories indexes
CREATE INDEX idx_support_categories_active ON support_categories(is_active);







SELECT * FROM owner;
SELECT * FROM `order`;
SELECT * FROM discounts;
SELECT * FROM customer;
SELECT * FROM salesman;
SELECT * FROM cart_item;
SELECT * FROM support_tickets;  
SELECT * FROM support_categories;

INSERT INTO support_categories (id, name)
VALUES ('cat1', 'Login Issues');


SHOW INDEX FROM `order`;
SHOW INDEX FROM order_item;
SHOW INDEX FROM cart;
SHOW INDEX FROM cart_item;
SHOW INDEX FROM discounts;
SHOW INDEX FROM discount_products;
SHOW INDEX FROM order_discounts;
SHOW INDEX FROM customer;
SHOW INDEX FROM product;

SELECT id, name FROM salesman WHERE name = 'sahid';
