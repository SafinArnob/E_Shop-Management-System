-- Add original_amount column to order table
SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'shop_management_system' 
     AND TABLE_NAME = 'order' 
     AND COLUMN_NAME = 'original_amount') = 0,
    'ALTER TABLE `order` ADD COLUMN original_amount DECIMAL(10, 2) NULL COMMENT "Amount before discount" AFTER total_amount;',
    'SELECT "original_amount column already exists";'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add discount_amount column to order table
SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'shop_management_system' 
     AND TABLE_NAME = 'order' 
     AND COLUMN_NAME = 'discount_amount') = 0,
    'ALTER TABLE `order` ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0.00 COMMENT "Total discount applied" AFTER original_amount;',
    'SELECT "discount_amount column already exists";'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Set original_amount equal to total_amount for existing orders without discounts
UPDATE `order` 
SET original_amount = total_amount 
WHERE original_amount IS NULL;

-- Ensure discount_amount is 0 for existing orders
UPDATE `order` 
SET discount_amount = 0.00 
WHERE discount_amount IS NULL;

-- Create backup table if migration is needed
SET @sql = IF(@migration_needed = 1, 
    'CREATE TABLE order_discounts_backup AS SELECT * FROM order_discounts',
    'SELECT "No migration needed" as Message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Remove discounts with invalid dates
UPDATE discounts 
SET is_active = FALSE 
WHERE end_date IS NOT NULL 
AND end_date < NOW() 
AND is_active = TRUE;

-- Fix any percentage discounts over 100%
UPDATE discounts 
SET discount_value = 100, 
    description = CONCAT(description, ' (Adjusted from invalid percentage)') 
WHERE calculation_type = 'percentage' 
AND discount_value > 100;



-- Add sample discounts if none exist
INSERT IGNORE INTO discounts (id, name, discount_code, discount_type, calculation_type, discount_value, description, is_active) 
SELECT * FROM (
    SELECT 
        UUID() as id,
        'Welcome Discount' as name,
        'WELCOME10' as discount_code,
        'global' as discount_type,
        'flat' as calculation_type,
        10.00 as discount_value,
        'Welcome new customers with $10 off' as description,
        TRUE as is_active
    UNION ALL
    SELECT 
        UUID(),
        'Percentage Test',
        'TEST20',
        'global',
        'percentage',
        20.00,
        '20% off for testing purposes',
        TRUE
    UNION ALL
    SELECT 
        UUID(),
        'Bundle Deal',
        'BUNDLE3',
        'bundle',
        'percentage',
        15.00,
        '15% off when buying 3+ items',
        TRUE
) as sample_discounts
WHERE NOT EXISTS (SELECT 1 FROM discounts LIMIT 1);



