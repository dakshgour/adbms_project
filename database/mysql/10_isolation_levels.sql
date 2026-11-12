-- ==============================================================================
-- 10_isolation_levels.sql
-- Transaction Isolation Levels & Concurrency Phenomena in MySQL InnoDB
-- Demonstrates READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, and SERIALIZABLE
-- ==============================================================================

USE ecommerce_db;

-- ==============================================================================
-- 1. READ UNCOMMITTED: Demonstrates Dirty Reads
-- Dirty Read: A transaction reads uncommitted modifications made by another transaction.
-- ==============================================================================

-- [SESSION 1]
-- SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
-- START TRANSACTION;
-- UPDATE inventory SET quantity_available = 999 WHERE product_id = 4;
-- (Do NOT commit yet)

-- [SESSION 2]
-- SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
-- START TRANSACTION;
-- SELECT product_id, quantity_available FROM inventory WHERE product_id = 4;
-- Result: Session 2 observes 999 (a DIRTY READ of uncommitted data).
-- COMMIT;

-- [SESSION 1]
-- ROLLBACK;
-- Result: The 999 was never saved! Any decision Session 2 made based on 999 was invalid.

-- ==============================================================================
-- 2. READ COMMITTED: Prevents Dirty Reads, Allows Non-Repeatable Reads
-- Non-Repeatable Read: Within the same transaction, re-reading the same row returns
-- different data because another transaction committed an update in the meantime.
-- ==============================================================================

-- [SESSION 2]
-- SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
-- START TRANSACTION;
-- Query 1:
-- SELECT product_id, quantity_available FROM inventory WHERE product_id = 4;
-- (Suppose quantity = 12)

-- [SESSION 1]
-- START TRANSACTION;
-- UPDATE inventory SET quantity_available = 10 WHERE product_id = 4;
-- COMMIT;

-- [SESSION 2]
-- Query 2 (same transaction):
-- SELECT product_id, quantity_available FROM inventory WHERE product_id = 4;
-- Result in READ COMMITTED: Sees quantity = 10!
-- The read was NOT repeatable because each SELECT creates a fresh read snapshot.
-- COMMIT;

-- ==============================================================================
-- 3. REPEATABLE READ (MySQL InnoDB Default): Eliminates Non-Repeatable Reads
-- Uses Multi-Version Concurrency Control (MVCC) Read Views.
-- Consistent Non-Locking Reads read from the snapshot established at the first read.
-- ==============================================================================

-- [SESSION 2]
-- SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
-- START TRANSACTION;
-- Query 1:
-- SELECT product_id, quantity_available FROM inventory WHERE product_id = 4;
-- (Returns 12)

-- [SESSION 1]
-- START TRANSACTION;
-- UPDATE inventory SET quantity_available = 5 WHERE product_id = 4;
-- COMMIT;

-- [SESSION 2]
-- Query 2 (same transaction):
-- SELECT product_id, quantity_available FROM inventory WHERE product_id = 4;
-- Result in REPEATABLE READ: Still returns 12! (Read view snapshot protects consistency).
-- But if Session 2 runs a LOCKING read:
-- SELECT product_id, quantity_available FROM inventory WHERE product_id = 4 FOR UPDATE;
-- It reads the latest committed engine value (5) because FOR UPDATE always locks current row.
-- COMMIT;

-- ==============================================================================
-- 4. SERIALIZABLE: Strictest Isolation Level
-- In InnoDB, SERIALIZABLE implicitly converts every plain SELECT into
-- SELECT ... FOR SHARE (shared read lock) if autocommit is disabled.
-- ==============================================================================

-- [SESSION 2]
-- SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
-- START TRANSACTION;
-- SELECT * FROM products WHERE category_id = 1;
-- (Acquires Shared Locks (S-locks) and Next-Key gap locks on category 1 records)

-- [SESSION 1]
-- START TRANSACTION;
-- INSERT INTO products (category_id, product_name, sku, price, is_active)
-- VALUES (1, 'New Phantom Tablet', 'ELEC-TAB-999', 499.00, TRUE);
-- Result: Session 1 BLOCKS (waits) until Session 2 commits or rollback,
-- completely preventing phantom inserts!
-- COMMIT;
