-- ==============================================================================
-- 06_stored_procedures.sql
-- Stored Procedures for Business Operations & Reporting in MySQL 8.0+
-- Implements encapsulated transactions, pessimistic locking, and parameter validation
-- ==============================================================================

USE ecommerce_db;

DELIMITER $$

-- ------------------------------------------------------------------------------
-- 1. Procedure: sp_get_sales_summary
-- Calculates high-level financial KPIs for a specified datetime window
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_get_sales_summary$$
CREATE PROCEDURE sp_get_sales_summary(
    IN p_start_date DATETIME,
    IN p_end_date DATETIME
)
BEGIN
    SELECT 
        COALESCE(SUM(o.total_amount), 0.00) AS total_revenue,
        COUNT(DISTINCT o.order_id) AS total_orders,
        COALESCE(SUM(oi.quantity), 0) AS total_units_sold,
        COALESCE(AVG(o.total_amount), 0.00) AS average_order_value
    FROM orders o
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.order_status IN ('PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED')
      AND o.created_at >= COALESCE(p_start_date, '1970-01-01 00:00:00')
      AND o.created_at <= COALESCE(p_end_date, '2099-12-31 23:59:59');
END$$

-- ------------------------------------------------------------------------------
-- 2. Procedure: sp_get_low_stock_products
-- Returns all active products whose stock has dipped at or below the reorder threshold
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_get_low_stock_products$$
CREATE PROCEDURE sp_get_low_stock_products()
BEGIN
    SELECT 
        p.product_id,
        p.sku,
        p.product_name,
        c.category_name,
        i.quantity_available,
        i.reorder_level,
        (i.reorder_level - i.quantity_available) AS shortage
    FROM products p
    INNER JOIN categories c ON p.category_id = c.category_id
    INNER JOIN inventory i ON p.product_id = i.product_id
    WHERE i.quantity_available <= i.reorder_level
      AND p.is_active = TRUE
    ORDER BY (i.reorder_level - i.quantity_available) DESC, i.quantity_available ASC;
END$$

-- ------------------------------------------------------------------------------
-- 3. Procedure: sp_adjust_inventory
-- Atomically adjusts stock for a product, locks the row, logs an inventory movement,
-- and guarantees stock never falls below zero.
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_adjust_inventory$$
CREATE PROCEDURE sp_adjust_inventory(
    IN p_product_id BIGINT,
    IN p_adjustment_qty INT,
    IN p_reason VARCHAR(255),
    IN p_user_id BIGINT
)
proc_label: BEGIN
    DECLARE v_current_qty INT;
    DECLARE v_new_qty INT;
    DECLARE v_movement_type VARCHAR(20);
    DECLARE v_inventory_id BIGINT;

    -- Error handler for automatic rollback
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Basic parameter validation
    IF p_product_id IS NULL OR p_adjustment_qty IS NULL OR p_adjustment_qty = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Invalid adjustment parameters: product_id and non-zero adjustment_qty are required.';
    END IF;

    -- Set acting user session variable for audit triggers
    SET @app_user_id = p_user_id;

    START TRANSACTION;

    -- Lock the specific inventory row using SELECT ... FOR UPDATE (Row-Level Pessimistic Lock)
    SELECT inventory_id, quantity_available
    INTO v_inventory_id, v_current_qty
    FROM inventory
    WHERE product_id = p_product_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Inventory record not found for the specified product.';
    END IF;

    SET v_new_qty = v_current_qty + p_adjustment_qty;

    -- Validate non-negativity constraint
    IF v_new_qty < 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Adjustment rejected: Resulting quantity cannot be negative.';
    END IF;

    -- Determine movement type
    IF p_adjustment_qty > 0 THEN
        SET v_movement_type = 'RESTOCK';
    ELSE
        SET v_movement_type = 'ADJUSTMENT';
    END IF;

    -- Update inventory
    UPDATE inventory
    SET quantity_available = v_new_qty,
        updated_at = NOW()
    WHERE inventory_id = v_inventory_id;

    -- Insert permanent inventory movement ledger record
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
    ) VALUES (
        p_product_id,
        v_movement_type,
        p_adjustment_qty,
        v_current_qty,
        v_new_qty,
        'MANUAL_ADJUSTMENT',
        NULL,
        COALESCE(p_reason, 'Manual inventory adjustment via procedure'),
        p_user_id,
        NOW()
    );

    COMMIT;

    -- Return the updated inventory status
    SELECT 
        v_inventory_id AS inventory_id,
        p_product_id AS product_id,
        v_current_qty AS quantity_before,
        p_adjustment_qty AS quantity_changed,
        v_new_qty AS quantity_after,
        'SUCCESS' AS status;
END proc_label$$

DELIMITER ;
