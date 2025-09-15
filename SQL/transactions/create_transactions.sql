START TRANSACTION;

-- Step 1: Insert the order into the `order` table
INSERT INTO `order` (id, customer_id, order_number, total_amount, total_items, shipping_address, billing_address, payment_method, status)
VALUES (UUID(), '5121431f-6030-4f2c-b9f7-ebbdecde61be', 'ORD-20230901-001', 100000, 2, 'AUST Campus', 'AUST Campus', 'credit_card', 'pending');

-- Get the order ID
SET @order_id = LAST_INSERT_ID();

-- Step 2: Insert order items into `order_item` table
INSERT INTO order_item (id, order_id, product_id, quantity, unit_price, total_price)
VALUES (UUID(), @order_id, 'product_id_1', 1, 75000, 75000), 
       (UUID(), @order_id, 'product_id_2', 1, 25000, 25000);

-- Step 3: Update product inventory
UPDATE product SET stock = stock - 1 WHERE id = 'product_id_1';
UPDATE product SET stock = stock - 1 WHERE id = 'product_id_2';

-- If everything is successful, commit the transaction
COMMIT;

-- If there's an error in any of the operations, you can call ROLLBACK to undo all changes
ROLLBACK;
