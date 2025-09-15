
-- Trigger to update discount usage count
DELIMITER $$
CREATE TRIGGER update_discount_usage
    AFTER INSERT ON order_discounts
    FOR EACH ROW
BEGIN
    UPDATE discounts 
    SET usage_count = usage_count + 1
    WHERE id = NEW.discount_id;
END$$
DELIMITER ;

-- Trigger to validate discount usage limit
DELIMITER $$
CREATE TRIGGER validate_discount_limit
    BEFORE INSERT ON order_discounts
    FOR EACH ROW
BEGIN
    DECLARE current_usage INT DEFAULT 0;
    DECLARE usage_limit_val INT DEFAULT NULL;
    
    SELECT usage_count, usage_limit 
    INTO current_usage, usage_limit_val
    FROM discounts 
    WHERE id = NEW.discount_id;
    
    IF usage_limit_val IS NOT NULL AND current_usage >= usage_limit_val THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Discount usage limit exceeded';
    END IF;
END$$
DELIMITER ;

-- Trigger to auto-deactivate expired discounts
DELIMITER $$
CREATE TRIGGER deactivate_expired_discounts
    BEFORE UPDATE ON discounts
    FOR EACH ROW
BEGIN
    IF NEW.end_date IS NOT NULL AND NEW.end_date < NOW() THEN
        SET NEW.is_active = FALSE;
    END IF;
END$$
DELIMITER ;