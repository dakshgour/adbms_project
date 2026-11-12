-- ==============================================================================
-- 03_indexes.sql
-- Index Definitions & Strategy for E-commerce ADBMS Project
-- Demonstrates single-column, unique, and composite B-Tree indexes in InnoDB
-- ==============================================================================

USE ecommerce_db;

-- ------------------------------------------------------------------------------
-- 1. Index Strategy Overview
-- ------------------------------------------------------------------------------
-- In InnoDB, every table has a Clustered Index based on its PRIMARY KEY.
-- Secondary indexes store the indexed columns plus the primary key value.
-- Each additional index incurs write amplification on INSERT/UPDATE/DELETE.
-- Therefore, each index must correspond directly to high-frequency query patterns.

-- ------------------------------------------------------------------------------
-- 2. Single-Column Secondary Indexes (Verification & Alter Table statements)
-- ------------------------------------------------------------------------------

-- Procedure to safely add index if it does not exist
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_add_index_if_missing$$
CREATE PROCEDURE sp_add_index_if_missing(
    IN p_table VARCHAR(64),
    IN p_index VARCHAR(64),
    IN p_columns VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = p_table 
          AND INDEX_NAME = p_index
    ) THEN
        SET @sql = CONCAT('CREATE INDEX ', p_index, ' ON ', p_table, '(', p_columns, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

-- Accelerates category navigation
CALL sp_add_index_if_missing('products', 'idx_products_category', 'category_id');

-- Accelerates product name searches
CALL sp_add_index_if_missing('products', 'idx_products_name', 'product_name');

-- Accelerates customer order history lookups
CALL sp_add_index_if_missing('orders', 'idx_orders_user_id', 'user_id');

-- Accelerates date-range reporting
CALL sp_add_index_if_missing('orders', 'idx_orders_created_at', 'created_at');

-- Accelerates order processing queue
CALL sp_add_index_if_missing('orders', 'idx_orders_status', 'order_status');

-- Accelerates order item line retrieval
CALL sp_add_index_if_missing('order_items', 'idx_order_items_order_id', 'order_id');

-- ------------------------------------------------------------------------------
-- 3. Composite Indexes (Multi-Column)
-- ------------------------------------------------------------------------------

-- Query Pattern: Customer order list sorted by most recent
CALL sp_add_index_if_missing('orders', 'idx_orders_user_created', 'user_id, created_at DESC');

-- Query Pattern: Active catalog search filtered by category and sorted by price
CALL sp_add_index_if_missing('products', 'idx_products_cat_active_price', 'category_id, is_active, price');

-- Query Pattern: Low stock identification
CALL sp_add_index_if_missing('inventory', 'idx_inventory_stock_alert', 'quantity_available, reorder_level');

-- Query Pattern: Inventory movements by product timeline
CALL sp_add_index_if_missing('inventory_movements', 'idx_movements_prod_date', 'product_id, created_at DESC');

-- Query Pattern: Filter audit logs for specific table and record
CALL sp_add_index_if_missing('audit_logs', 'idx_audit_lookup', 'table_name, record_id, changed_at DESC');

DROP PROCEDURE IF EXISTS sp_add_index_if_missing;

-- ------------------------------------------------------------------------------
-- Verification Query
-- ------------------------------------------------------------------------------
SELECT 
    TABLE_NAME, 
    INDEX_NAME, 
    NON_UNIQUE, 
    COLUMN_NAME, 
    SEQ_IN_INDEX, 
    INDEX_TYPE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'ecommerce_db'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
