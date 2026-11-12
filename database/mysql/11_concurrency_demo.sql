-- ==============================================================================
-- 11_concurrency_demo.sql
-- Two-Session Concurrency Control Demonstration Using Pessimistic Row-Level Locking
-- Target Scenario: Available Stock = 1, Two Concurrent Purchase Requests
-- ==============================================================================

USE ecommerce_db;

-- Setup test stock condition for Product 5
UPDATE inventory SET quantity_available = 1 WHERE product_id = 5;

-- ------------------------------------------------------------------------------
-- SESSION 1 (Customer A - Arrives at T = 0ms)
-- ------------------------------------------------------------------------------
-- START TRANSACTION;
--
-- -- Step 1: Acquire exclusive row lock (X-lock) on product 5 inventory
-- SELECT quantity_available FROM inventory WHERE product_id = 5 FOR UPDATE;
-- -- Result: Returns quantity_available = 1.
--
-- -- Step 2: Customer A decides to buy 1 unit. Deduct stock.
-- UPDATE inventory SET quantity_available = quantity_available - 1 WHERE product_id = 5;
--
-- -- Step 3: Insert Customer A's Order
-- INSERT INTO orders (user_id, order_number, total_amount, order_status, shipping_name, shipping_address, shipping_city, shipping_state, shipping_postal_code)
-- VALUES (2, 'ORD-CONCUR-A', 379.00, 'PLACED', 'Customer A', '100 Main St', 'Boston', 'MA', '02108');
--
-- -- (Simulate work holding lock for 2 seconds before commit...)
-- DO SLEEP(2);
--
-- COMMIT;
-- Result: Customer A's order successfully placed. Remaining stock = 0.

-- ------------------------------------------------------------------------------
-- SESSION 2 (Customer B - Arrives at T = 50ms while Session 1 is active)
-- ------------------------------------------------------------------------------
-- START TRANSACTION;
--
-- -- Step 1: Attempts to acquire lock on product 5 inventory
-- SELECT quantity_available FROM inventory WHERE product_id = 5 FOR UPDATE;
--
-- -- OBSERVED BEHAVIOR:
-- -- Session 2 is BLOCKED and put into lock-wait state by InnoDB.
-- -- It waits until Session 1 issues COMMIT.
--
-- -- Once Session 1 commits, Session 2's query resumes and returns:
-- -- quantity_available = 0!
--
-- -- Step 2: Application evaluates stock:
-- -- Since requested (1) > available (0), transaction is ABORTED.
-- ROLLBACK;
--
-- -- Result: Customer B receives HTTP 400 "Insufficient stock for product: VividVision 4K Gaming Monitor".
--
-- ------------------------------------------------------------------------------
-- Final Verification Query:
-- ------------------------------------------------------------------------------
SELECT 
    p.product_id, 
    p.product_name, 
    i.quantity_available,
    (SELECT COUNT(*) FROM orders WHERE order_number IN ('ORD-CONCUR-A', 'ORD-CONCUR-B')) AS orders_created
FROM products p
INNER JOIN inventory i ON p.product_id = i.product_id
WHERE p.product_id = 5;
-- Expected Outcome:
-- quantity_available = 0
-- orders_created = 1 (Only Customer A)
-- Inventory is NEVER negative!
