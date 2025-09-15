-- Customer Cart Queries
-- Get customer's cart with all items and product details
SELECT c.id as cart_id,
    c.customer_id,
    c.created_at as cart_created_at,
    c.updated_at as cart_updated_at,
    ci.id as item_id,
    ci.product_id,
    ci.quantity,
    ci.price as item_price,
    p.name as product_name,
    p.category,
    p.brand,
    p.description,
    p.price as current_product_price,
    (ci.quantity * ci.price) as item_total
FROM cart c
    LEFT JOIN cart_item ci ON c.id = ci.cart_id
    LEFT JOIN product p ON ci.product_id = p.id
WHERE c.customer_id = ?
ORDER BY ci.created_at DESC;
-- Get cart summary for a customer
SELECT c.id as cart_id,
    c.customer_id,
    COUNT(ci.id) as total_items,
    SUM(ci.quantity) as total_quantity,
    SUM(ci.quantity * ci.price) as total_amount,
    c.created_at,
    c.updated_at
FROM cart c
    LEFT JOIN cart_item ci ON c.id = ci.cart_id
WHERE c.customer_id = ?
GROUP BY c.id,
    c.customer_id,
    c.created_at,
    c.updated_at;
-- Get customers with active carts
SELECT cu.id as customer_id,
    cu.name as customer_name,
    cu.email,
    c.id as cart_id,
    COUNT(ci.id) as items_in_cart,
    SUM(ci.quantity) as total_quantity,
    SUM(ci.quantity * ci.price) as cart_total,
    c.updated_at as last_cart_update
FROM customer cu
    INNER JOIN cart c ON cu.id = c.customer_id
    LEFT JOIN cart_item ci ON c.id = ci.cart_id
WHERE cu.status = 'active'
GROUP BY cu.id,
    cu.name,
    cu.email,
    c.id,
    c.updated_at
HAVING items_in_cart > 0
ORDER BY c.updated_at DESC;
-- Get cart items that need price updates (products with changed prices)
SELECT ci.id as item_id,
    ci.cart_id,
    ci.product_id,
    ci.quantity,
    ci.price as cart_price,
    p.price as current_price,
    p.name as product_name,
    (p.price - ci.price) as price_difference,
    c.customer_id
FROM cart_item ci
    INNER JOIN product p ON ci.product_id = p.id
    INNER JOIN cart c ON ci.cart_id = c.id
WHERE ci.price != p.price;
-- Get abandoned carts (carts not updated in last 7 days)
SELECT c.id as cart_id,
    c.customer_id,
    cu.name as customer_name,
    cu.email,
    COUNT(ci.id) as items_count,
    SUM(ci.quantity * ci.price) as cart_total,
    c.updated_at,
    DATEDIFF(NOW(), c.updated_at) as days_since_update
FROM cart c
    INNER JOIN customer cu ON c.customer_id = cu.id
    LEFT JOIN cart_item ci ON c.id = ci.cart_id
WHERE c.updated_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY c.id,
    c.customer_id,
    cu.name,
    cu.email,
    c.updated_at
HAVING items_count > 0
ORDER BY c.updated_at ASC;