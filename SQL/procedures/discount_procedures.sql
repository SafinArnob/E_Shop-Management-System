-- Stored Procedures for Discount System
USE shop_management_system;

-- 1. Procedure to calculate discounted price for a product
DELIMITER $$
CREATE PROCEDURE CalculateDiscountedPrice(
    IN p_product_id VARCHAR(255),
    IN p_discount_code VARCHAR(100),
    OUT p_original_price DECIMAL(10,2),
    OUT p_discounted_price DECIMAL(10,2),
    OUT p_discount_amount DECIMAL(10,2),
    OUT p_is_valid BOOLEAN
)
BEGIN
    DECLARE v_product_price DECIMAL(10,2);
    DECLARE v_discount_type VARCHAR(20);
    DECLARE v_discount_value DECIMAL(10,2);
    DECLARE v_discount_id VARCHAR(255);
    DECLARE v_is_active BOOLEAN DEFAULT FALSE;
    DECLARE v_is_product_specific BOOLEAN DEFAULT FALSE;
    
    -- Initialize output parameters
    SET p_original_price = 0;
    SET p_discounted_price = 0;
    SET p_discount_amount = 0;
    SET p_is_valid = FALSE;
    
    -- Get product price
    SELECT price INTO v_product_price 
    FROM product 
    WHERE id = p_product_id;
    
    IF v_product_price IS NULL THEN
        LEAVE sp;
    END IF;
    
    SET p_original_price = v_product_price;
    
    -- Get discount information
    SELECT id, discount_type, discount_value INTO v_discount_id, v_discount_type, v_discount_value
    FROM discounts 
    WHERE discount_code = p_discount_code
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW());
    
    IF v_discount_id IS NULL THEN
        LEAVE sp;
    END IF;
    
    SET v_is_active = TRUE;
    
    -- Check if discount applies to this product
    IF EXISTS (SELECT 1 FROM product_discounts WHERE discount_id = v_discount_id) THEN
        SET v_is_product_specific = TRUE;
        IF NOT EXISTS (SELECT 1 FROM product_discounts WHERE discount_id = v_discount_id AND product_id = p_product_id) THEN
            LEAVE sp;
        END IF;
    END IF;
    
    -- Calculate discounted price
    IF v_discount_type = 'percentage' THEN
        SET p_discount_amount = (v_product_price * v_discount_value) / 100;
        SET p_discounted_price = v_product_price - p_discount_amount;
    ELSEIF v_discount_type = 'flat' THEN
        SET p_discount_amount = LEAST(v_discount_value, v_product_price);
        SET p_discounted_price = v_product_price - p_discount_amount;
    ELSE
        SET p_discounted_price = v_product_price;
    END IF;
    
    SET p_discounted_price = GREATEST(0, p_discounted_price);
    SET p_is_valid = TRUE;
    
sp: BEGIN END;
END$$
DELIMITER ;

-- 2. Procedure to apply discount to entire cart
DELIMITER $$
CREATE PROCEDURE ApplyDiscountToCart(
    IN p_customer_id VARCHAR(255),
    IN p_discount_code VARCHAR(100),
    OUT p_original_total DECIMAL(10,2),
    OUT p_discount_total DECIMAL(10,2),
    OUT p_final_total DECIMAL(10,2),
    OUT p_is_valid BOOLEAN
)
BEGIN
    DECLARE v_discount_id VARCHAR(255);
    DECLARE v_discount_type VARCHAR(20);
    DECLARE v_discount_value DECIMAL(10,2);
    DECLARE v_is_global BOOLEAN DEFAULT FALSE;
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_product_id VARCHAR(255);
    DECLARE v_quantity INT;
    DECLARE v_price DECIMAL(10,2);
    DECLARE v_item_total DECIMAL(10,2);
    DECLARE v_item_discount DECIMAL(10,2);
    
    DECLARE cart_cursor CURSOR FOR
        SELECT ci.product_id, ci.quantity, ci.price
        FROM cart c
        JOIN cart_item ci ON c.id = ci.cart_id
        WHERE c.customer_id = p_customer_id;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Initialize
    SET p_original_total = 0;
    SET p_discount_total = 0;
    SET p_final_total = 0;
    SET p_is_valid = FALSE;
    
    -- Get discount information
    SELECT id, discount_type, discount_value 
    INTO v_discount_id, v_discount_type, v_discount_value
    FROM discounts 
    WHERE discount_code = p_discount_code
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW());
    
    IF v_discount_id IS NULL THEN
        LEAVE sp;
    END IF;
    
    -- Check if it's a global discount
    IF NOT EXISTS (SELECT 1 FROM product_discounts WHERE discount_id = v_discount_id) THEN
        SET v_is_global = TRUE;
    END IF;
    
    -- Calculate totals
    OPEN cart_cursor;
    read_loop: LOOP
        FETCH cart_cursor INTO v_product_id, v_quantity, v_price;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        SET v_item_total = v_price * v_quantity;
        SET p_original_total = p_original_total + v_item_total;
        SET v_item_discount = 0;
        
        -- Apply discount if applicable
        IF v_is_global OR EXISTS (SELECT 1 FROM product_discounts WHERE discount_id = v_discount_id AND product_id = v_product_id) THEN
            IF v_discount_type = 'percentage' THEN
                SET v_item_discount = (v_item_total * v_discount_value) / 100;
            ELSEIF v_discount_type = 'flat' THEN
                SET v_item_discount = LEAST(v_discount_value, v_item_total);
            END IF;
        END IF;
        
        SET p_discount_total = p_discount_total + v_item_discount;
    END LOOP;
    CLOSE cart_cursor;
    
    SET p_final_total = p_original_total - p_discount_total;
    SET p_is_valid = TRUE;
    
sp: BEGIN END;
END$$
DELIMITER ;

-- 3. Procedure to get discount statistics
DELIMITER $$
CREATE PROCEDURE GetDiscountStatistics(
    IN p_discount_id VARCHAR(255)
)
BEGIN
    SELECT 
        d.discount_code,
        d.discount_type,
        d.discount_value,
        d.start_date,
        d.end_date,
        COUNT(od.order_id) as times_used,
        COALESCE(SUM(
            CASE 
                WHEN d.discount_type = 'percentage' THEN 
                    (o.total_amount * d.discount_value / (100 - d.discount_value))
                WHEN d.discount_type = 'flat' THEN 
                    d.discount_value
                ELSE 0
            END
        ), 0) as total_discount_given,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value,
        MIN(o.created_at) as first_used,
        MAX(o.created_at) as last_used
    FROM discounts d
    LEFT JOIN order_discounts od ON d.id = od.discount_id
    LEFT JOIN `order` o ON od.order_id = o.id
    WHERE d.id = p_discount_id
    GROUP BY d.id, d.discount_code, d.discount_type, d.discount_value, d.start_date, d.end_date;
END$$
DELIMITER ;

-- 4. Procedure to clean expired discounts
DELIMITER $$
CREATE PROCEDURE CleanExpiredDiscounts()
BEGIN
    DECLARE v_deleted_count INT DEFAULT 0;
    
    -- First, remove product associations for expired discounts
    DELETE pd FROM product_discounts pd
    JOIN discounts d ON pd.discount_id = d.id
    WHERE d.end_date IS NOT NULL AND d.end_date < NOW();
    
    -- Then, delete expired discounts that haven't been used
    DELETE FROM discounts 
    WHERE end_date IS NOT NULL 
        AND end_date < NOW() 
        AND id NOT IN (SELECT DISTINCT discount_id FROM order_discounts);
    
    SET v_deleted_count = ROW_COUNT();
    
    SELECT CONCAT('Cleaned ', v_deleted_count, ' expired discounts') as result;
END$$
DELIMITER ;

-- 5. Procedure to get top performing discounts
DELIMITER $$
CREATE PROCEDURE GetTopPerformingDiscounts(
    IN p_limit INT
)
BEGIN
    SELECT 
        d.id,
        d.discount_code,
        d.discount_type,
        d.discount_value,
        COUNT(od.order_id) as usage_count,
        SUM(
            CASE 
                WHEN d.discount_type = 'percentage' THEN 
                    (o.total_amount * d.discount_value / (100 - d.discount_value))
                WHEN d.discount_type = 'flat' THEN 
                    d.discount_value
                ELSE 0
            END
        ) as total_discount_given,
        AVG(o.total_amount) as avg_order_value
    FROM discounts d
    INNER JOIN order_discounts od ON d.id = od.discount_id
    INNER JOIN `order` o ON od.order_id = o.id
    GROUP BY d.id, d.discount_code, d.discount_type, d.discount_value
    ORDER BY usage_count DESC, total_discount_given DESC
    LIMIT p_limit;
END$$
DELIMITER ;

-- 6. Procedure to validate and create order with discount
DELIMITER $$
CREATE PROCEDURE CreateOrderWithDiscount(
    IN p_customer_id VARCHAR(255),
    IN p_discount_code VARCHAR(100),
    IN p_order_data JSON,
    OUT p_order_id VARCHAR(255),
    OUT p_final_total DECIMAL(10,2),
    OUT p_discount_amount DECIMAL(10,2),
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(500)
)
BEGIN
    DECLARE v_discount_id VARCHAR(255);
    DECLARE v_original_total DECIMAL(10,2);
    DECLARE v_cart_exists INT DEFAULT 0;
    
    -- Initialize
    SET p_success = FALSE;
    SET p_message = '';
    SET p_order_id = NULL;
    SET p_final_total = 0;
    SET p_discount_amount = 0;
    
    -- Check if customer has items in cart
    SELECT COUNT(*) INTO v_cart_exists
    FROM cart c
    JOIN cart_item ci ON c.id = ci.cart_id
    WHERE c.customer_id = p_customer_id;
    
    IF v_cart_exists = 0 THEN
        SET p_message = 'Cart is empty';
        LEAVE sp;
    END IF;
    
    -- Apply discount to cart
    CALL ApplyDiscountToCart(p_customer_id, p_discount_code, v_original_total, p_discount_amount, p_final_total, p_success);
    
    IF NOT p_success THEN
        SET p_message = 'Invalid discount code';
        LEAVE sp;
    END IF;
    
    -- Get discount ID for order association
    SELECT id INTO v_discount_id
    FROM discounts 
    WHERE discount_code = p_discount_code
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW());
    
    -- Create order (this would call your existing order creation logic)
    -- For now, we'll just set success
    SET p_order_id = UUID();
    SET p_success = TRUE;
    SET p_message = 'Order created successfully with discount applied';
    
sp: BEGIN END;
END$$
DELIMITER ;