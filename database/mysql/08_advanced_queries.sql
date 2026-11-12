-- ==============================================================================
-- 08_advanced_queries.sql
-- Advanced SQL Query Demonstrations for ADBMS College Project
-- Demonstrates Joins, Subqueries, CTEs, Aggregates, and Window Functions
-- ==============================================================================

USE ecommerce_db;

-- ------------------------------------------------------------------------------
-- 1. WINDOW FUNCTION: ROW_NUMBER()
-- Scenario: Top 5 Best-Selling Products by Revenue
-- Assigns a unique sequential integer to each product ordered by total revenue.
-- ------------------------------------------------------------------------------
WITH ProductRevenue AS (
    SELECT 
        p.product_id,
        p.product_name,
        c.category_name,
        COALESCE(SUM(oi.subtotal), 0.00) AS total_revenue,
        COALESCE(SUM(oi.quantity), 0) AS total_units_sold,
        ROW_NUMBER() OVER(ORDER BY COALESCE(SUM(oi.subtotal), 0.00) DESC) AS revenue_rank
    FROM products p
    INNER JOIN categories c ON p.category_id = c.category_id
    LEFT JOIN order_items oi ON p.product_id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.order_id AND o.order_status != 'CANCELLED'
    GROUP BY p.product_id, p.product_name, c.category_name
)
SELECT * FROM ProductRevenue
WHERE revenue_rank <= 5;

-- ------------------------------------------------------------------------------
-- 2. WINDOW FUNCTION: DENSE_RANK() & RANK() with PARTITION BY
-- Scenario: Rank products by revenue WITHIN their respective categories.
-- DENSE_RANK does not leave gaps between tied ranks.
-- ------------------------------------------------------------------------------
SELECT 
    c.category_name,
    p.product_name,
    p.price,
    COALESCE(SUM(oi.subtotal), 0.00) AS category_revenue,
    RANK() OVER(
        PARTITION BY c.category_id 
        ORDER BY COALESCE(SUM(oi.subtotal), 0.00) DESC
    ) AS rank_in_category,
    DENSE_RANK() OVER(
        PARTITION BY c.category_id 
        ORDER BY COALESCE(SUM(oi.subtotal), 0.00) DESC
    ) AS dense_rank_in_category
FROM categories c
INNER JOIN products p ON c.category_id = p.category_id
LEFT JOIN order_items oi ON p.product_id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.order_id AND o.order_status != 'CANCELLED'
GROUP BY c.category_id, c.category_name, p.product_id, p.product_name, p.price
ORDER BY c.category_name, dense_rank_in_category;

-- ------------------------------------------------------------------------------
-- 3. WINDOW FUNCTION: SUM() OVER() (Running Total / Cumulative Sales)
-- Scenario: Calculate daily running total of revenue over time.
-- ------------------------------------------------------------------------------
SELECT 
    DATE(o.created_at) AS sale_date,
    COUNT(DISTINCT o.order_id) AS orders_count,
    SUM(o.total_amount) AS daily_revenue,
    SUM(SUM(o.total_amount)) OVER(
        ORDER BY DATE(o.created_at) 
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_total_revenue
FROM orders o
WHERE o.order_status != 'CANCELLED'
GROUP BY DATE(o.created_at)
ORDER BY sale_date ASC;

-- ------------------------------------------------------------------------------
-- 4. WINDOW FUNCTION: LAG() (Month-over-Month Revenue Growth)
-- Scenario: Compare each month's sales with the previous month.
-- ------------------------------------------------------------------------------
WITH MonthlySales AS (
    SELECT 
        DATE_FORMAT(o.created_at, '%Y-%m') AS sales_month,
        COUNT(DISTINCT o.order_id) AS orders_count,
        SUM(o.total_amount) AS current_month_revenue
    FROM orders o
    WHERE o.order_status != 'CANCELLED'
    GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
)
SELECT 
    sales_month,
    orders_count,
    current_month_revenue,
    LAG(current_month_revenue, 1, 0.00) OVER(ORDER BY sales_month) AS previous_month_revenue,
    ROUND(
        current_month_revenue - LAG(current_month_revenue, 1, 0.00) OVER(ORDER BY sales_month), 
        2
    ) AS revenue_difference,
    ROUND(
        CASE 
            WHEN LAG(current_month_revenue, 1, 0.00) OVER(ORDER BY sales_month) = 0 THEN 100.0
            ELSE ((current_month_revenue - LAG(current_month_revenue, 1, 0.00) OVER(ORDER BY sales_month)) / 
                  LAG(current_month_revenue, 1, 0.00) OVER(ORDER BY sales_month)) * 100
        END, 
        2
    ) AS growth_percentage
FROM MonthlySales
ORDER BY sales_month;

-- ------------------------------------------------------------------------------
-- 5. COMPLEX JOIN & SUBQUERY with GROUP BY and HAVING
-- Scenario: High-Value Customers who have spent more than the average order value
-- ------------------------------------------------------------------------------
SELECT 
    u.user_id,
    u.full_name,
    u.email,
    COUNT(o.order_id) AS total_orders_placed,
    SUM(o.total_amount) AS total_lifetime_spend,
    AVG(o.total_amount) AS customer_avg_order_value
FROM users u
INNER JOIN orders o ON u.user_id = o.user_id
WHERE o.order_status != 'CANCELLED'
GROUP BY u.user_id, u.full_name, u.email
HAVING SUM(o.total_amount) > (
    -- Subquery computing global average order total
    SELECT AVG(total_amount) FROM orders WHERE order_status != 'CANCELLED'
)
ORDER BY total_lifetime_spend DESC;

-- ------------------------------------------------------------------------------
-- 6. RIGHT JOIN Scenario: Identifying Inactive or Zero-Sale Categories
-- Demonstrates outer join identifying categories with no order items placed
-- ------------------------------------------------------------------------------
SELECT 
    c.category_id,
    c.category_name,
    COUNT(DISTINCT p.product_id) AS total_products,
    COUNT(oi.order_item_id) AS times_ordered,
    COALESCE(SUM(oi.subtotal), 0.00) AS total_sales
FROM order_items oi
RIGHT JOIN products p ON oi.product_id = p.product_id
RIGHT JOIN categories c ON p.category_id = c.category_id
GROUP BY c.category_id, c.category_name
ORDER BY total_sales ASC;
