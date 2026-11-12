-- ==============================================================================
-- 09_acid_transactions.sql
-- Demonstration of ACID Transactions, Row-Level Locking, and Rollback in InnoDB
-- ==============================================================================

USE ecommerce_db;

-- ------------------------------------------------------------------------------
-- SCENARIO A: SUCCESSFUL ACID ORDER CHECKOUT TRANSACTION
-- Demonstrates Atomicity, Consistency, Isolation, and Durability
-- ------------------------------------------------------------------------------

-- Set session context variable for audit trigger accountability
SET @app_user_id = 2; -- Customer Alice Johnson

START TRANSACTION;

-- Step 1: Pessimistic Row-Level Locking on Inventory in strictly ascending product_id order
-- This prevents concurrent deductions and avoids circular deadlock.
SELECT 
    i.product_id, 
    p.product_name, 
    p.price, 
    p.is_active, 
    i.quantity_available
FROM inventory i
INNER JOIN products p ON i.product_id = p.product_id
WHERE i.product_id IN (1, 6)
ORDER BY i.product_id ASC
FOR UPDATE;

-- Step 2: In-transaction business logic checks:
-- Product 1 has available >= 1, Product 6 has available >= 2
-- Total calculated = (1 * 899.99) + (2 * 85.00) = 1069.99

-- Step 3: Insert Order Header
INSERT INTO orders (
    user_id,
    order_number,
    total_amount,
    order_status,
    shipping_name,
    shipping_address,
    shipping_city,
    shipping_state,
    shipping_postal_code,
    created_at
) VALUES (
    2,
    'ORD-DEMO-ACID-001',
    1069.99,
    'PLACED',
    'Alice Johnson',
    '123 Maple Street',
    'Seattle',
    'WA',
    '98101',
    NOW()
);

-- Capture generated order_id
SET @new_order_id = LAST_INSERT_ID();

-- Step 4: Insert Order Items with purchase-time price snapshots
INSERT INTO order_items (
    order_id,
    product_id,
    product_name_snapshot,
    sku_snapshot,
    quantity,
    unit_price,
    subtotal
) VALUES 
(@new_order_id, 1, 'Quantum Pro Smartphone 256GB', 'ELEC-SMP-001', 1, 899.99, 899.99),
(@new_order_id, 6, 'Merino Wool Crewneck Sweater', 'CLTH-SWT-006', 2, 85.00, 170.00);

-- Step 5: Atomically Deduct Inventory
UPDATE inventory 
SET quantity_available = quantity_available - 1, updated_at = NOW() 
WHERE product_id = 1;

UPDATE inventory 
SET quantity_available = quantity_available - 2, updated_at = NOW() 
WHERE product_id = 6;

-- Step 6: Record Permanent Inventory Movement Audit
INSERT INTO inventory_movements (
    product_id,
    movement_type,
    quantity_changed,
    quantity_before,
    quantity_after,
    reference_type,
    reference_id,
    reason,
    created_by,
    created_at
) VALUES
(1, 'SALE', -1, 35, 34, 'ORDER', @new_order_id, 'ACID checkout demonstration', 2, NOW()),
(6, 'SALE', -2, 45, 43, 'ORDER', @new_order_id, 'ACID checkout demonstration', 2, NOW());

-- Step 7: Record Simulated Payment
INSERT INTO payments (
    order_id,
    payment_method,
    payment_status,
    amount,
    transaction_reference,
    created_at
) VALUES (
    @new_order_id,
    'ONLINE',
    'COMPLETED',
    1069.99,
    'TXN-SIM-ACID-SUCCESS',
    NOW()
);

-- Step 8: Commit the entire atomic unit of work
COMMIT;

-- Verify that the order, items, movements, and stock update are all durably stored:
SELECT * FROM orders WHERE order_id = @new_order_id;
SELECT * FROM order_items WHERE order_id = @new_order_id;


-- ------------------------------------------------------------------------------
-- SCENARIO B: FAILED TRANSACTION & COMPLETE ROLLBACK
-- Demonstrates that when an invariant is violated, ZERO partial records remain.
-- ------------------------------------------------------------------------------

START TRANSACTION;

-- Attempting to purchase 100 units of Product 3 (which only has 2 units in stock)
SELECT product_id, quantity_available 
FROM inventory 
WHERE product_id = 3 
FOR UPDATE;

-- Application logic detects: requested (100) > available (2)
-- Simulated failure branch:
INSERT INTO orders (
    user_id,
    order_number,
    total_amount,
    order_status,
    shipping_name,
    shipping_address,
    shipping_city,
    shipping_state,
    shipping_postal_code,
    created_at
) VALUES (
    2,
    'ORD-DEMO-ACID-FAIL',
    24950.00,
    'PLACED',
    'Alice Johnson',
    '123 Maple Street',
    'Seattle',
    'WA',
    '98101',
    NOW()
);

-- ROLLBACK all changes:
ROLLBACK;

-- Verification: The failed order MUST NOT exist:
SELECT * FROM orders WHERE order_number = 'ORD-DEMO-ACID-FAIL';
-- Stock for product 3 remains untouched:
SELECT product_id, quantity_available FROM inventory WHERE product_id = 3;
