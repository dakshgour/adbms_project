-- ==============================================================================
-- 12_deadlock_demo.sql
-- Deadlock Generation, InnoDB Cycle Detection, and Application Retry Pattern
-- ==============================================================================

USE ecommerce_db;

-- ------------------------------------------------------------------------------
-- THEORETICAL FOUNDATION:
-- A deadlock occurs when two or more transactions mutually hold locks that the other
-- transactions require to proceed, forming a circular wait graph:
--
--    Transaction 1 (Holds Lock on Product 1) ------ Wants Lock on Product 2 ----->
--           ^                                                                    |
--           |                                                                    v
--           <----- Wants Lock on Product 1 ------ Transaction 2 (Holds Lock on Product 2)
--
-- InnoDB's background deadlock detector runs an internal Wait-For Graph (WFG) analysis.
-- Upon detecting a cycle, InnoDB immediately selects one transaction (typically the one
-- whose rollback modifies fewer rows) as the "deadlock victim" and aborts it with:
-- ERROR 1213 (40001): Deadlock found when trying to get lock; try restarting transaction.
-- ------------------------------------------------------------------------------

-- ------------------------------------------------------------------------------
-- DEMONSTRATION SCRIPT (Using Two Independent Sessions)
-- ------------------------------------------------------------------------------

-- [SESSION 1 - Cart has Products [1, 2] - Unordered locking]
-- START TRANSACTION;
-- SELECT * FROM inventory WHERE product_id = 1 FOR UPDATE;
-- (Acquired Exclusive lock on Product 1)

-- [SESSION 2 - Cart has Products [2, 1] - Reverse order locking]
-- START TRANSACTION;
-- SELECT * FROM inventory WHERE product_id = 2 FOR UPDATE;
-- (Acquired Exclusive lock on Product 2)

-- [SESSION 1]
-- SELECT * FROM inventory WHERE product_id = 2 FOR UPDATE;
-- (Session 1 BLOCKS, waiting for Session 2 to release Lock on Product 2)

-- [SESSION 2]
-- SELECT * FROM inventory WHERE product_id = 1 FOR UPDATE;
-- (Session 2 requests Lock on Product 1 held by Session 1)

-- *** INSTANT INNODB ENGINE ACTION ***
-- InnoDB detects the cycle: Session 1 -> Product 2 -> Session 2 -> Product 1 -> Session 1.
-- InnoDB terminates Session 2 with:
-- ERROR 1213 (40001): Deadlock found when trying to get lock; try restarting transaction
-- Session 2 is automatically rolled back.
-- Session 1 immediately unblocks and acquires lock on Product 2!

-- [SESSION 1]
-- COMMIT;
-- (Session 1 completes successfully)

-- ------------------------------------------------------------------------------
-- ARCHITECTURAL MITIGATION IN OUR APPLICATION:
-- 1. Deterministic Lock Ordering:
--    In backend OrderService, all item product_ids are strictly sorted in ASCENDING order:
--    `sorted_product_ids = sorted(list(cart_items.keys()))`
--    `SELECT ... WHERE product_id IN (...) ORDER BY product_id ASC FOR UPDATE;`
--    Since every transaction locks resources in identical global order (1 then 2),
--    circular wait condition is mathematically broken!
--
-- 2. Bounded Exponential Backoff Retry:
--    Even if an external non-order transaction creates an unexpected deadlock,
--    the backend catches PyMySQL OperationalError 1213 and retries up to 3 times
--    with randomized exponential jitter before failing gracefully.
-- ------------------------------------------------------------------------------

-- Inspect recent deadlock status in MySQL:
SHOW ENGINE INNODB STATUS\G
