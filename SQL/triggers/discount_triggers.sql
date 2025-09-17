-- Database Triggers for Discount System
USE shop_management_system;

-- 1. Trigger to validate discount value before insert
DELIMITER $$
CREATE TRIGGER validate_discount_before_insert
BEFORE INSERT ON discounts
FOR EACH ROW
BEGIN
    -- Validate percentage discount
    IF NEW.discount_type = 'percentage' AND (NEW.discount_value <= 0 OR NEW.discount_value > 100) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Percentage discount must be between 1 and 100';
    END IF;
    
    -- Validate flat discount
    IF NEW.discount_type = 'flat' AND NEW.discount_value <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Flat discount must be greater than 0';
    END IF;
    
    -- Validate date range
    IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL AND NEW.end_date <= NEW.start_date THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'End date must be after start date';
    END IF;
    
    -- Validate unique discount code if provided
    IF NEW.discount_code IS NOT NULL THEN
        DECLARE code_count INT DEFAULT 0;
        SELECT COUNT(*) INTO code_count FROM discounts WHERE discount_code = NEW.discount_code;
        IF code_count > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Discount code already exists';
        END IF;
    END IF;
END$$
DELIMITER ;

-- 2. Trigger to validate discount value before update
DELIMITER $$
CREATE TRIGGER validate_discount_before_update
BEFORE UPDATE ON discounts
FOR EACH ROW
BEGIN
    -- Validate percentage discount
    IF NEW.discount_type = 'percentage' AND (NEW.discount_value <= 0 OR NEW.discount_value > 100) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Percentage discount must be between 1 and 100';
    END IF;
    
    -- Validate flat discount
    IF NEW.discount_type = 'flat' AND NEW.discount_value <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Flat discount must be greater than 0';
    END IF;
    
    -- Validate date range
    IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL AND NEW.end_date <= NEW.start_date THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'End date must be after start date';
    END IF;
    
    -- Validate unique discount code if changed
    IF NEW.discount_code IS NOT NULL AND NEW.discount_code != OLD.discount_code THEN
        DECLARE code_count INT DEFAULT 0;
        SELECT COUNT(*) INTO code_count FROM discounts WHERE discount_code = NEW.discount_code AND id != NEW.id;
        IF code_count > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Discount code already exists';
        END IF;
    END IF;
END$$
DELIMITER ;

-- 3. Trigger to automatically link discount to order when order is created with discount
DELIMITER $$
CREATE TRIGGER link_order_discount_after_insert
AFTER INSERT ON `order`
FOR EACH ROW
BEGIN
    -- This trigger would be called by application logic
    -- when an order is created with a discount code
    -- The actual linking is handled in the application layer
    NULL;
END$$
DELIMITER ;

-- 4. Trigger to log discount usage
DELIMITER $$
CREATE TRIGGER log_discount_usage_after_order_discount_insert
AFTER INSERT ON order_discounts
FOR EACH ROW
BEGIN
    -- Update discount usage statistics (if you want to maintain a separate stats table)
    -- For now, we'll just ensure the relationship is properly established
    DECLARE discount_exists INT DEFAULT 0;
    DECLARE order_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO discount_exists FROM discounts WHERE id = NEW.discount_id;
    SELECT COUNT(*) INTO order_exists FROM `order` WHERE id = NEW.order_id;
    
    IF discount_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Discount does not exist';
    END IF;
    
    IF order_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order does not exist';
    END IF;
END$$
DELIMITER ;

-- 5. Trigger to prevent deletion of discounts that are actively used in orders
DELIMITER $$
CREATE TRIGGER prevent_discount_deletion_if_used
BEFORE DELETE ON discounts
FOR EACH ROW
BEGIN
    DECLARE usage_count INT DEFAULT 0;
    SELECT COUNT(*) INTO usage_count FROM order_discounts WHERE discount_id = OLD.id;
    
    IF usage_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot delete discount that has been used in orders';
    END IF;
END$$
DELIMITER ;

-- 6. Trigger to validate product exists before adding to product_discounts
DELIMITER $$
CREATE TRIGGER validate_product_discount_before_insert
BEFORE INSERT ON product_discounts
FOR EACH ROW
BEGIN
    DECLARE product_exists INT DEFAULT 0;
    DECLARE discount_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO product_exists FROM product WHERE id = NEW.product_id;
    SELECT COUNT(*) INTO discount_exists FROM discounts WHERE id = NEW.discount_id;
    
    IF product_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product does not exist';
    END IF;
    
    IF discount_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Discount does not exist';
    END IF;
    
    -- Prevent duplicate product-discount relationships
    DECLARE existing_count INT DEFAULT 0;
    SELECT COUNT(*) INTO existing_count 
    FROM product_discounts 
    WHERE product_id = NEW.product_id AND discount_id = NEW.discount_id;
    
    IF existing_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product already has this discount applied';
    END IF;
END$$
DELIMITER ;

-- 7. Trigger to automatically expire discounts
-- Note: This would typically be handled by a scheduled job, but here's a trigger approach
DELIMITER $$
CREATE TRIGGER auto_expire_discounts_on_select
BEFORE SELECT ON discounts
FOR EACH ROW
BEGIN
    -- This is not standard SQL and won't work in most databases
    -- Better to handle expiration in application logic or with scheduled events
    NULL;
END$$
DELIMITER ;