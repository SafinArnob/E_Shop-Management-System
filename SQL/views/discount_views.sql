-- Database Views for Discount System
USE shop_management_system;

-- 1. View for Products with Active Discounts
CREATE OR REPLACE VIEW products_with_active_discounts AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.category,
    p.brand,
    p.description,
    p.price as original_price,
    d.id as discount_id,
    d.discount_code,
    d.discount_type,
    d.discount_value,
    d.start_date,
    d.end_date,
    CASE 
        WHEN d.discount_type = 'percentage' THEN 
            p.price - (p.price * d.discount_value / 100)
        WHEN d.discount_type = 'flat' THEN 
            GREATEST(0, p.price - d.discount_value)
        ELSE p.price
    END as discounted_price,
    CASE 
        WHEN d.discount_type = 'percentage' THEN 
            (p.price * d.discount_value / 100)
        WHEN d.discount_type = 'flat' THEN 
            LEAST(d.discount_value, p.price)
        ELSE 0
    END as discount_amount
FROM product p
LEFT JOIN product_discounts pd ON p.id = pd.product_id
LEFT JOIN discounts d ON pd.discount_id = d.id 
    AND (d.start_date IS NULL OR d.start_date <= NOW())
    AND (d.end_date IS NULL OR d.end_date >= NOW())
ORDER BY p.name;

-- 2. View for Global Active Discounts (not product-specific)
CREATE OR REPLACE VIEW global_active_discounts AS
SELECT 
    d.id as discount_id,
    d.discount_code,
    d.discount_type,
    d.discount_value,
    d.start_date,
    d.end_date,
    d.created_at
FROM discounts d
WHERE (d.start_date IS NULL OR d.start_date <= NOW())
    AND (d.end_date IS NULL OR d.end_date >= NOW())
    AND d.id NOT IN (
        SELECT DISTINCT discount_id 
        FROM product_discounts
    )
ORDER BY d.created_at DESC;

-- 3. View for Discount Usage Statistics
CREATE OR REPLACE VIEW discount_usage_stats AS
SELECT 
    d.id as discount_id,
    d.discount_code,
    d.discount_type,
    d.discount_value,
    COUNT(od.order_id) as times_used,
    SUM(
        CASE 
            WHEN d.discount_type = 'percentage' THEN 
                (o.total_amount * d.discount_value / (100 - d.discount_value))
            WHEN d.discount_type = 'flat' THEN 
                d.discount_value
            ELSE 0
        END
    ) as total_discount_given,
    MIN(o.created_at) as first_used,
    MAX(o.created_at) as last_used
FROM discounts d
LEFT JOIN order_discounts od ON d.id = od.discount_id
LEFT JOIN `order` o ON od.order_id = o.id
GROUP BY d.id, d.discount_code, d.discount_type, d.discount_value
ORDER BY times_used DESC;

-- 4. View for Customer Order Discounts
CREATE OR REPLACE VIEW customer_order_discounts AS
SELECT 
    o.id as order_id,
    o.order_number,
    o.customer_id,
    c.name as customer_name,
    c.email as customer_email,
    o.total_amount,
    d.discount_code,
    d.discount_type,
    d.discount_value,
    CASE 
        WHEN d.discount_type = 'percentage' THEN 
            (o.total_amount * d.discount_value / (100 - d.discount_value))
        WHEN d.discount_type = 'flat' THEN 
            d.discount_value
        ELSE 0
    END as discount_amount,
    o.created_at as order_date
FROM `order` o
INNER JOIN customer c ON o.customer_id = c.id
INNER JOIN order_discounts od ON o.id = od.order_id
INNER JOIN discounts d ON od.discount_id = d.id
ORDER BY o.created_at DESC;

-- 5. View for Product Discount Summary
CREATE OR REPLACE VIEW product_discount_summary AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.price as original_price,
    COUNT(pd.discount_id) as active_discount_count,
    MIN(
        CASE 
            WHEN d.discount_type = 'percentage' THEN 
                p.price - (p.price * d.discount_value / 100)
            WHEN d.discount_type = 'flat' THEN 
                GREATEST(0, p.price - d.discount_value)
            ELSE p.price
        END
    ) as lowest_discounted_price,
    MAX(
        CASE 
            WHEN d.discount_type = 'percentage' THEN 
                (p.price * d.discount_value / 100)
            WHEN d.discount_type = 'flat' THEN 
                LEAST(d.discount_value, p.price)
            ELSE 0
        END
    ) as max_discount_amount
FROM product p
LEFT JOIN product_discounts pd ON p.id = pd.product_id
LEFT JOIN discounts d ON pd.discount_id = d.id 
    AND (d.start_date IS NULL OR d.start_date <= NOW())
    AND (d.end_date IS NULL OR d.end_date >= NOW())
GROUP BY p.id, p.name, p.price
ORDER BY active_discount_count DESC, p.name;