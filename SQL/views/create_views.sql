-- View to get customer order details with product information
CREATE VIEW customer_order_details AS
SELECT 
    o.id AS order_id,
    o.order_number,
    o.status AS order_status,
    o.total_amount,
    o.total_items,
    o.shipping_address,
    o.billing_address,
    oi.product_name,
    oi.quantity,
    oi.unit_price,
    oi.total_price,
    c.name AS customer_name,
    c.email AS customer_email
FROM `order` o
JOIN customer c ON o.customer_id = c.id
JOIN order_item oi ON o.id = oi.order_id;

-- View to get products with their applicable discounts
CREATE VIEW product_discount_details AS
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.category,
    p.price AS product_price,
    d.discount_code,
    d.discount_value,
    d.discount_type,
    d.start_date,
    d.end_date
FROM product p
LEFT JOIN product_discounts pd ON p.id = pd.product_id
LEFT JOIN discounts d ON pd.discount_id = d.id
WHERE d.start_date <= CURRENT_TIMESTAMP AND d.end_date >= CURRENT_TIMESTAMP;

--View for products with their applicable discounts
CREATE OR REPLACE VIEW product_with_discounts AS
SELECT 
    p.id,
    p.name,
    p.category,
    p.brand,
    p.description,
    p.price as original_price,
    COALESCE(
        -- Individual product discount
        CASE 
            WHEN pd_disc.discount_type = 'percentage' 
            THEN p.price - (p.price * pd_disc.discount_value / 100)
            WHEN pd_disc.discount_type = 'flat' 
            THEN GREATEST(0, p.price - pd_disc.discount_value)
            ELSE p.price
        END,
        -- Category discount
        CASE 
            WHEN cd_disc.discount_type = 'percentage' 
            THEN p.price - (p.price * cd_disc.discount_value / 100)
            WHEN cd_disc.discount_type = 'flat' 
            THEN GREATEST(0, p.price - cd_disc.discount_value)
            ELSE p.price
        END,
        -- Global discount
        CASE 
            WHEN g_disc.discount_type = 'percentage' 
            THEN p.price - (p.price * g_disc.discount_value / 100)
            WHEN g_disc.discount_type = 'flat' 
            THEN GREATEST(0, p.price - g_disc.discount_value)
            ELSE p.price
        END,
        p.price
    ) as discounted_price,
    COALESCE(pd_disc.discount_value, cd_disc.discount_value, g_disc.discount_value, 0) as discount_value,
    COALESCE(pd_disc.discount_type, cd_disc.discount_type, g_disc.discount_type) as discount_type,
    COALESCE(pd_disc.discount_code, cd_disc.discount_code, g_disc.discount_code) as discount_code,
    COALESCE(pd_disc.id, cd_disc.id, g_disc.id) as discount_id,
    p.created_at
FROM product p
LEFT JOIN (
    SELECT pd.product_id, d.*
    FROM product_discounts pd
    JOIN discounts d ON pd.discount_id = d.id
    WHERE pd.is_active = TRUE 
    AND d.is_active = TRUE 
    AND (d.start_date <= NOW() OR d.start_date IS NULL)
    AND (d.end_date >= NOW() OR d.end_date IS NULL)
) pd_disc ON p.id = pd_disc.product_id
LEFT JOIN (
    SELECT cd.category, d.*
    FROM category_discounts cd
    JOIN discounts d ON cd.discount_id = d.id
    WHERE cd.is_active = TRUE 
    AND d.is_active = TRUE 
    AND (d.start_date <= NOW() OR d.start_date IS NULL)
    AND (d.end_date >= NOW() OR d.end_date IS NULL)
) cd_disc ON p.category = cd_disc.category
LEFT JOIN (
    SELECT d.*
    FROM discounts d
    WHERE d.discount_type = 'global' 
    AND d.apply_to_all = TRUE
    AND d.is_active = TRUE 
    AND (d.start_date <= NOW() OR d.start_date IS NULL)
    AND (d.end_date >= NOW() OR d.end_date IS NULL)
    LIMIT 1
) g_disc ON TRUE;

-- View for active discounts summary
CREATE OR REPLACE VIEW active_discounts_summary AS
SELECT 
    d.id,
    d.name,
    d.discount_code,
    d.discount_type,
    d.discount_value,
    d.minimum_order_amount,
    d.maximum_discount_amount,
    d.usage_limit,
    d.usage_count,
    d.start_date,
    d.end_date,
    CASE 
        WHEN d.discount_type = 'global' THEN 'All Products'
        WHEN d.discount_type = 'category' THEN GROUP_CONCAT(DISTINCT cd.category)
        WHEN d.discount_type = 'bundle' THEN GROUP_CONCAT(DISTINCT bp.bundle_name)
        ELSE CONCAT(COUNT(DISTINCT pd.product_id), ' Products')
    END as applies_to
FROM discounts d
LEFT JOIN product_discounts pd ON d.id = pd.discount_id AND pd.is_active = TRUE
LEFT JOIN category_discounts cd ON d.id = cd.discount_id AND cd.is_active = TRUE
LEFT JOIN bundle_products bp ON d.id = bp.discount_id AND bp.is_active = TRUE
WHERE d.is_active = TRUE
AND (d.start_date <= NOW() OR d.start_date IS NULL)
AND (d.end_date >= NOW() OR d.end_date IS NULL)
GROUP BY d.id;


SELECT * FROM customer_order_details WHERE customer_name = 'kawser';
SELECT * FROM product_discount_details WHERE product_name = 'Vivo X200 pro';


