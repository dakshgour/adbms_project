-- ==============================================================================
-- 05_triggers.sql
-- Database Triggers for Automated Audit Logging in MySQL 8.0+
-- Uses session variable @app_user_id to identify the acting application user
-- ==============================================================================

USE ecommerce_db;

DELIMITER $$

-- ------------------------------------------------------------------------------
-- 1. Trigger: trg_products_after_insert
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_products_after_insert$$
CREATE TRIGGER trg_products_after_insert
AFTER INSERT ON products
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (
        table_name,
        operation,
        record_id,
        old_values,
        new_values,
        changed_by,
        changed_at
    ) VALUES (
        'products',
        'INSERT',
        NEW.product_id,
        NULL,
        JSON_OBJECT(
            'product_id', NEW.product_id,
            'category_id', NEW.category_id,
            'product_name', NEW.product_name,
            'sku', NEW.sku,
            'price', NEW.price,
            'is_active', NEW.is_active
        ),
        @app_user_id,
        NOW()
    );
END$$

-- ------------------------------------------------------------------------------
-- 2. Trigger: trg_products_after_update
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_products_after_update$$
CREATE TRIGGER trg_products_after_update
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
    -- Log only if relevant attributes actually changed
    IF (OLD.product_name <> NEW.product_name OR
        OLD.category_id <> NEW.category_id OR
        OLD.sku <> NEW.sku OR
        OLD.price <> NEW.price OR
        OLD.is_active <> NEW.is_active OR
        (OLD.description IS NULL AND NEW.description IS NOT NULL) OR
        (OLD.description IS NOT NULL AND NEW.description IS NULL) OR
        (OLD.description <> NEW.description)) THEN

        INSERT INTO audit_logs (
            table_name,
            operation,
            record_id,
            old_values,
            new_values,
            changed_by,
            changed_at
        ) VALUES (
            'products',
            'UPDATE',
            NEW.product_id,
            JSON_OBJECT(
                'category_id', OLD.category_id,
                'product_name', OLD.product_name,
                'sku', OLD.sku,
                'price', OLD.price,
                'is_active', OLD.is_active
            ),
            JSON_OBJECT(
                'category_id', NEW.category_id,
                'product_name', NEW.product_name,
                'sku', NEW.sku,
                'price', NEW.price,
                'is_active', NEW.is_active
            ),
            @app_user_id,
            NOW()
        );
    END IF;
END$$

-- ------------------------------------------------------------------------------
-- 3. Trigger: trg_inventory_after_insert
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_inventory_after_insert$$
CREATE TRIGGER trg_inventory_after_insert
AFTER INSERT ON inventory
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (
        table_name,
        operation,
        record_id,
        old_values,
        new_values,
        changed_by,
        changed_at
    ) VALUES (
        'inventory',
        'INSERT',
        NEW.inventory_id,
        NULL,
        JSON_OBJECT(
            'inventory_id', NEW.inventory_id,
            'product_id', NEW.product_id,
            'quantity_available', NEW.quantity_available,
            'reorder_level', NEW.reorder_level
        ),
        @app_user_id,
        NOW()
    );
END$$

-- ------------------------------------------------------------------------------
-- 4. Trigger: trg_inventory_after_update
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_inventory_after_update$$
CREATE TRIGGER trg_inventory_after_update
AFTER UPDATE ON inventory
FOR EACH ROW
BEGIN
    IF (OLD.quantity_available <> NEW.quantity_available OR
        OLD.reorder_level <> NEW.reorder_level) THEN

        INSERT INTO audit_logs (
            table_name,
            operation,
            record_id,
            old_values,
            new_values,
            changed_by,
            changed_at
        ) VALUES (
            'inventory',
            'UPDATE',
            NEW.inventory_id,
            JSON_OBJECT(
                'product_id', OLD.product_id,
                'quantity_available', OLD.quantity_available,
                'reorder_level', OLD.reorder_level
            ),
            JSON_OBJECT(
                'product_id', NEW.product_id,
                'quantity_available', NEW.quantity_available,
                'reorder_level', NEW.reorder_level
            ),
            @app_user_id,
            NOW()
        );
    END IF;
END$$

-- ------------------------------------------------------------------------------
-- 5. Trigger: trg_orders_after_update
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_orders_after_update$$
CREATE TRIGGER trg_orders_after_update
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF (OLD.order_status <> NEW.order_status OR
        OLD.total_amount <> NEW.total_amount) THEN

        INSERT INTO audit_logs (
            table_name,
            operation,
            record_id,
            old_values,
            new_values,
            changed_by,
            changed_at
        ) VALUES (
            'orders',
            'UPDATE',
            NEW.order_id,
            JSON_OBJECT(
                'order_number', OLD.order_number,
                'order_status', OLD.order_status,
                'total_amount', OLD.total_amount
            ),
            JSON_OBJECT(
                'order_number', NEW.order_number,
                'order_status', NEW.order_status,
                'total_amount', NEW.total_amount
            ),
            @app_user_id,
            NOW()
        );
    END IF;
END$$

DELIMITER ;
