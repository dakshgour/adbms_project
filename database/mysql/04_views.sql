-- ==============================================================================
-- 04_views.sql
-- Relational Database Views for E-commerce Inventory & Order Management
-- Demonstrates query abstraction, security encapsulation, and join simplification
-- ==============================================================================

USE ecommerce_db;

DROP VIEW IF EXISTS vw_low_stock_products;
DROP VIEW IF EXISTS vw_sales_summary;
DROP VIEW IF EXISTS vw_order_details;
DROP VIEW IF EXISTS vw_product_inventory;

-- ------------------------------------------------------------------------------
-- 1. View: vw_product_inventory
-- Joins products, categories, and inventory.
-- Computes real-time stock alert status without storing redundant flags.
-- ------------------------------------------------------------------------------
CREATE VIEW vw_product_inventory AS
SELECT 
    p.product_id,
    p.sku,
    p.product_name,
    c.category_id,
    c.category_name,
    p.price,
    p.is_active,
    p.image_url,
    COALESCE(i.quantity_available, 0) AS quantity_available,
    COALESCE(i.reorder_level, 5) AS reorder_level,
    CASE 
        WHEN COALESCE(i.quantity_available, 0) = 0 THEN 'OUT_OF_STOCK'
        WHEN COALESCE(i.quantity_available, 0) <= COALESCE(i.reorder_level, 5) THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
    END AS stock_status,
    i.updated_at AS inventory_last_updated
FROM products p
INNER JOIN categories c ON p.category_id = c.category_id
LEFT JOIN inventory i ON p.product_id = i.product_id;

-- ------------------------------------------------------------------------------
-- 2. View: vw_order_details
-- Denormalizes order headers with customer info, item summaries, and payment status.
-- Designed for customer service representatives and order fulfillment dashboards.
-- ------------------------------------------------------------------------------
CREATE VIEW vw_order_details AS
SELECT 
    o.order_id,
    o.order_number,
    o.created_at AS order_date,
    o.order_status,
    o.total_amount,
    u.user_id AS customer_id,
    u.full_name AS customer_name,
    u.email AS customer_email,
    o.shipping_name,
    CONCAT(o.shipping_address, ', ', o.shipping_city, ', ', o.shipping_state, ' ', o.shipping_postal_code) AS full_shipping_address,
    COUNT(oi.order_item_id) AS total_distinct_items,
    COALESCE(SUM(oi.quantity), 0) AS total_units_ordered,
    COALESCE(p.payment_method, 'UNASSIGNED') AS payment_method,
    COALESCE(p.payment_status, 'PENDING') AS payment_status,
    p.transaction_reference
FROM orders o
INNER JOIN users u ON o.user_id = u.user_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
LEFT JOIN payments p ON o.order_id = p.order_id
GROUP BY 
    o.order_id, 
    o.order_number, 
    o.created_at, 
    o.order_status, 
    o.total_amount, 
    u.user_id, 
    u.full_name, 
    u.email, 
    o.shipping_name, 
    o.shipping_address, 
    o.shipping_city, 
    o.shipping_state, 
    o.shipping_postal_code,
    p.payment_method,
    p.payment_status,
    p.transaction_reference;

-- ------------------------------------------------------------------------------
-- 3. View: vw_sales_summary
-- Aggregates completed sales by category and product.
-- Filters out CANCELLED orders to represent true gross sales.
-- ------------------------------------------------------------------------------
CREATE VIEW vw_sales_summary AS
SELECT 
    c.category_id,
    c.category_name,
    p.product_id,
    p.sku,
    p.product_name,
    COUNT(DISTINCT o.order_id) AS orders_count,
    COALESCE(SUM(oi.quantity), 0) AS units_sold,
    COALESCE(SUM(oi.subtotal), 0.00) AS gross_revenue
FROM categories c
INNER JOIN products p ON c.category_id = p.category_id
LEFT JOIN order_items oi ON p.product_id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.order_id AND o.order_status != 'CANCELLED'
GROUP BY 
    c.category_id,
    c.category_name,
    p.product_id,
    p.sku,
    p.product_name;

-- ------------------------------------------------------------------------------
-- 4. View: vw_low_stock_products
-- Provides direct access to products requiring immediate procurement.
-- Filters inventory based on reorder threshold.
-- ------------------------------------------------------------------------------
CREATE VIEW vw_low_stock_products AS
SELECT 
    p.product_id,
    p.sku,
    p.product_name,
    c.category_name,
    i.quantity_available,
    i.reorder_level,
    (i.reorder_level - i.quantity_available) AS deficit_quantity,
    i.updated_at AS last_stock_update
FROM products p
INNER JOIN categories c ON p.category_id = c.category_id
INNER JOIN inventory i ON p.product_id = i.product_id
WHERE i.quantity_available <= i.reorder_level
  AND p.is_active = TRUE;
