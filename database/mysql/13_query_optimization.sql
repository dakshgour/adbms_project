-- ==============================================================================
-- 13_query_optimization.sql
-- Query Optimization, Execution Plans, and EXPLAIN ANALYZE Demonstration
-- Compares Full Table Scans vs B-Tree Index Lookups and Covering Indexes
-- ==============================================================================

USE ecommerce_db;

-- ------------------------------------------------------------------------------
-- 1. EXPLAIN Plan Demonstration on User Login Query
-- ------------------------------------------------------------------------------

-- Query Pattern: Finding user by email
EXPLAIN 
SELECT user_id, full_name, password_hash, role 
FROM users 
WHERE email = 'alice.johnson@example.com';

-- Expected Plan:
-- select_type: SIMPLE
-- table: users
-- type: const (Highest efficiency - unique index lookup)
-- possible_keys: email, idx_users_email
-- key: email
-- rows: 1
-- Extra: NULL

-- With EXPLAIN ANALYZE (Execution Profiling in MySQL 8.0+):
EXPLAIN ANALYZE
SELECT user_id, full_name, password_hash, role 
FROM users 
WHERE email = 'alice.johnson@example.com';


-- ------------------------------------------------------------------------------
-- 2. Range Scan & Index Selection on Orders
-- ------------------------------------------------------------------------------

-- Scenario: Filter orders for a customer sorted by recency
EXPLAIN ANALYZE
SELECT order_id, order_number, total_amount, order_status, created_at
FROM orders
WHERE user_id = 2
ORDER BY created_at DESC;

-- Plan Analysis:
-- Uses composite index `idx_orders_user_created` (user_id, created_at DESC).
-- Eliminates an explicit 'filesort' step because the B-tree index stores rows
-- already ordered by created_at descending!


-- ------------------------------------------------------------------------------
-- 3. Composite Covering Index vs Table Scan on Products
-- ------------------------------------------------------------------------------

-- Scenario: Admin browsing active products in Category 1 ordered by price
EXPLAIN ANALYZE
SELECT product_id, category_id, is_active, price
FROM products
WHERE category_id = 1 AND is_active = TRUE
ORDER BY price ASC;

-- Plan Analysis:
-- Key used: `idx_products_cat_active_price`
-- Extra: "Using index" (Covering Index!)
-- Since product_id is the primary key and part of every secondary index in InnoDB,
-- all requested columns (product_id, category_id, is_active, price) reside directly
-- inside the secondary B-Tree leaf node.
-- Result: Zero reads from the clustered index table space!


-- ------------------------------------------------------------------------------
-- 4. Trade-Off Analysis: Index Cost & Write Amplification
-- ------------------------------------------------------------------------------
-- 1. Write Amplification:
--    For every INSERT into `products`, the database must insert into:
--    - Clustered PK index
--    - idx_products_category
--    - idx_products_sku
--    - idx_products_name
--    - idx_products_cat_active_price
--    This increases I/O write operations from 1 page to up to 5 page writes.
--
-- 2. Buffer Pool Memory Overhead:
--    Every secondary index occupies pages in InnoDB Buffer Pool memory.
--    Unused indexes reduce buffer pool hit ratio for active transaction data.
--
-- Conclusion:
-- Only add indexes that match high-frequency WHERE, JOIN, and ORDER BY clauses.
