-- ==============================================================================
-- 07_sample_data.sql
-- Comprehensive Seed Data for E-commerce Inventory & Order Management System
-- Seeds 5 categories, 25 products, 11 users (1 admin + 10 customers),
-- inventory with low-stock variations, orders, order items, and movements.
-- ==============================================================================

USE ecommerce_db;

-- ------------------------------------------------------------------------------
-- 1. Categories
-- ------------------------------------------------------------------------------
INSERT INTO categories (category_id, category_name, description) VALUES
(1, 'Electronics', 'Smartphones, laptops, audio systems, and high-performance computing devices.'),
(2, 'Clothing', 'Men and women apparel, activewear, jackets, and formal attire.'),
(3, 'Home & Kitchen', 'Kitchen appliances, cookware, modern furniture, and smart home lighting.'),
(4, 'Books', 'Textbooks, software engineering references, science fiction, and non-fiction.'),
(5, 'Accessories', 'Bags, watches, sunglasses, wallets, and wearable technology accessories.')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- ------------------------------------------------------------------------------
-- 2. Users (Admin + 10 Customers)
-- Note: password_hash below is generated via werkzeug.security for:
-- AdminPass@123 (for admin) and CustomerPass@123 (for customers)
-- ------------------------------------------------------------------------------
INSERT INTO users (user_id, full_name, email, password_hash, phone, role, is_active) VALUES
(1, 'System Administrator', 'admin@ecommerce.com', 'scrypt:32768:8:1$7A3iTq0zU4eH8L9J$f52b7d9036c0757754d924ca60d69fae42b262f3a61c4f52c1e6cb7e0b5c1a17b074a3f1d8f8a1e2f9d8a3b5c6d7e8f9', '+1-800-555-0199', 'admin', TRUE),
(2, 'Alice Johnson', 'alice.johnson@example.com', 'scrypt:32768:8:1$9K1mNp2rS3tV4w5X$e41a6c8025b0646643c813b950c58e9d31a151e2950b3e41b0d5ba6d0a4b0906a06392e0c7e790d1e8c792a4b5c6d7e8', '+1-555-0101', 'customer', TRUE),
(3, 'Bob Smith', 'bob.smith@example.com', 'scrypt:32768:8:1$9K1mNp2rS3tV4w5X$e41a6c8025b0646643c813b950c58e9d31a151e2950b3e41b0d5ba6d0a4b0906a06392e0c7e790d1e8c792a4b5c6d7e8', '+1-555-0102', 'customer', TRUE),
(4, 'Charlie Brown', 'charlie.brown@example.com', 'scrypt:32768:8:1$9K1mNp2rS3tV4w5X$e41a6c8025b0646643c813b950c58e9d31a151e2950b3e41b0d5ba6d0a4b0906a06392e0c7e790d1e8c792a4b5c6d7e8', '+1-555-0103', 'customer', TRUE),
(5, 'Diana Prince', 'diana.prince@example.com', 'scrypt:32768:8:1$9K1mNp2rS3tV4w5X$e41a6c8025b0646643c813b950c58e9d31a151e2950b3e41b0d5ba6d0a4b0906a06392e0c7e790d1e8c792a4b5c6d7e8', '+1-555-0104', 'customer', TRUE),
(6, 'Evan Wright', 'evan.wright@example.com', 'scrypt:32768:8:1$9K1mNp2rS3tV4w5X$e41a6c8025b0646643c813b950c58e9d31a151e2950b3e41b0d5ba6d0a4b0906a06392e0c7e790d1e8c792a4b5c6d7e8', '+1-555-0105', 'customer', TRUE),
(7, 'Fiona Gallagher', 'fiona.gallagher@example.com', 'scrypt:32768:8:1$9K1mNp2rS3tV4w5X$e41a6c8025b0646643c813b950c58e9d31a151e2950b3e41b0d5ba6d0a4b0906a06392e0c7e790d1e8c792a4b5c6d7e8', '+1-555-0106', 'customer', TRUE),
(8, 'George Clark', 'george.clark@example.com', 'scrypt:32768:8:1$9K1mNp2rS3tV4w5X$e41a6c8025b0646643c813b950c58e9d31a151e2950b3e41b0d5ba6d0a4b0906a06392e0c7e790d1e8c792a4b5c6d7e8', '+1-555-0107', 'customer', TRUE),
(9, 'Hannah Abbott', 'hannah.abbott@example.com', 'scrypt:32768:8:1$9K1mNp2rS3tV4w5X$e41a6c8025b0646643c813b950c58e9d31a151e2950b3e41b0d5ba6d0a4b0906a06392e0c7e790d1e8c792a4b5c6d7e8', '+1-555-0108', 'customer', TRUE),
(10, 'Ian Malcolm', 'ian.malcolm@example.com', 'scrypt:32768:8:1$9K1mNp2rS3tV4w5X$e41a6c8025b0646643c813b950c58e9d31a151e2950b3e41b0d5ba6d0a4b0906a06392e0c7e790d1e8c792a4b5c6d7e8', '+1-555-0109', 'customer', TRUE),
(11, 'Julia Roberts', 'julia.roberts@example.com', 'scrypt:32768:8:1$9K1mNp2rS3tV4w5X$e41a6c8025b0646643c813b950c58e9d31a151e2950b3e41b0d5ba6d0a4b0906a06392e0c7e790d1e8c792a4b5c6d7e8', '+1-555-0110', 'customer', TRUE)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- ------------------------------------------------------------------------------
-- 3. Products (25 Products across 5 Categories)
-- ------------------------------------------------------------------------------
INSERT INTO products (product_id, category_id, product_name, description, sku, price, image_url, is_active) VALUES
-- Electronics (Category 1)
(1, 1, 'Quantum Pro Smartphone 256GB', 'Next-gen smartphone with AMOLED 120Hz display, 5G connectivity, and triple camera array.', 'ELEC-SMP-001', 899.99, 'https://images.unsplash.com/photo-1511707171634-5f897ff02545?w=500', TRUE),
(2, 1, 'UltraBook Elite 14" Laptop', 'Lightweight magnesium chassis, Intel i7 processor, 16GB DDR5 RAM, 1TB NVMe SSD.', 'ELEC-LAP-002', 1299.00, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500', TRUE),
(3, 1, 'AcousticPulse Noise-Canceling Headphones', 'Over-ear wireless headphones with active hybrid noise cancellation and 40hr battery.', 'ELEC-AUD-003', 249.50, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', TRUE),
(4, 1, 'SmartWatch Chrono 4 Active', 'Heart rate monitor, GPS tracking, sleep stage analysis, 5ATM water resistance.', 'ELEC-WAT-004', 199.99, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', TRUE),
(5, 1, 'VividVision 4K Gaming Monitor 27"', 'IPS HDR400, 144Hz refresh rate, 1ms response time, FreeSync and G-Sync compatible.', 'ELEC-MON-005', 379.00, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500', TRUE),

-- Clothing (Category 2)
(6, 2, 'Merino Wool Crewneck Sweater', 'Ultra-soft sustainable Australian merino wool sweater suitable for casual and office wear.', 'CLTH-SWT-006', 85.00, 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500', TRUE),
(7, 2, 'All-Weather Waterproof Technical Jacket', 'Breathable 3-layer membrane waterproof storm jacket with YKK sealed zippers.', 'CLTH-JKT-007', 175.00, 'https://images.unsplash.com/photo-1544923246-77307dd654cb?w=500', TRUE),
(8, 2, 'Organic Stretch Slim-Fit Chinos', 'Classic tailored chinos made with 98% organic cotton and 2% elastane for comfort.', 'CLTH-PNT-008', 65.00, 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500', TRUE),
(9, 2, 'Performance Trail Running Shoes', 'Engineered mesh upper, Vibram mega-grip outsole, and shock-absorbing midsole cushioning.', 'CLTH-SHO-009', 130.00, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', TRUE),
(10, 2, 'Classic Tailored Oxford Shirt', '100% long-staple pinpoint oxford cotton with button-down collar and durable pearl buttons.', 'CLTH-SHT-010', 55.00, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500', TRUE),

-- Home & Kitchen (Category 3)
(11, 3, 'Artisan Stainless Steel Espresso Machine', '15-bar Italian pump espresso and cappuccino maker with commercial steam wand.', 'HOME-ESP-011', 450.00, 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500', TRUE),
(12, 3, 'Enameled Cast Iron Dutch Oven 6-Quart', 'Superior heat retention and distribution with durable enamel finish and tight-fitting lid.', 'HOME-DUT-012', 95.00, 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500', TRUE),
(13, 3, 'Smart Precision Air Fryer Oven 10L', 'Digital touch presets, 360-degree rapid heat circulation, stainless steel basket.', 'HOME-AFR-013', 139.99, 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500', TRUE),
(14, 3, 'Japanese Chef Knife 8-Inch VG10 Damascus', '67 layers forged Damascus steel with ergonomic G10 resin handle, razor-sharp edge.', 'HOME-KNF-014', 89.00, 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=500', TRUE),
(15, 3, 'Robot Vacuum & Mop with LiDAR Navigation', '3000Pa suction power, auto-dock charging, smart mapping, app and Alexa control.', 'HOME-VAC-015', 320.00, 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500', TRUE),

-- Books (Category 4)
(16, 4, 'Designing Data-Intensive Applications', 'The definitive guide to architecture, storage engines, distributed systems, and reliability.', 'BOOK-CS-016', 48.00, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500', TRUE),
(17, 4, 'Database System Concepts (8th Edition)', 'Comprehensive textbook covering relational algebra, concurrency control, and indexing.', 'BOOK-DB-017', 85.00, 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=500', TRUE),
(18, 4, 'Clean Architecture: A Craftsman''s Guide', 'A guide to software structure and design principles by Robert C. Martin.', 'BOOK-SE-018', 35.00, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500', TRUE),
(19, 4, 'High Performance MySQL (4th Edition)', 'Optimization, backups, replication, and scaling strategies for MySQL administrators.', 'BOOK-SQL-019', 52.00, 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500', TRUE),
(20, 4, 'MongoDB: The Definitive Guide (3rd Edition)', 'Powerful and scalable document storage, aggregation pipelines, and NoSQL modeling.', 'BOOK-MNG-020', 44.00, 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500', TRUE),

-- Accessories (Category 5)
(21, 5, 'Full-Grain Leather Commuter Backpack', 'Water-resistant vegetable tanned leather backpack with padded 15-inch laptop sleeve.', 'ACCS-BPK-021', 189.00, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', TRUE),
(22, 5, 'Polarized Aviator Sunglasses Titanium', 'Ultra-lightweight titanium frame with anti-reflective UV400 polarized optical lenses.', 'ACCS-SNG-022', 115.00, 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500', TRUE),
(23, 5, 'Minimalist RFID-Blocking Cardholder Wallet', 'Aircraft-grade anodized aluminum with elastic cash strap and quick card ejection.', 'ACCS-WLT-023', 38.00, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500', TRUE),
(24, 5, 'Automatic Skeleton Mechanical Watch', 'Exhibition sapphire caseback, 21-jewel self-winding movement, Italian leather band.', 'ACCS-WAT-024', 275.00, 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500', TRUE),
(25, 5, 'Braided USB-C Fast-Charging Cable 2-Pack', 'Kevlar reinforced 240W Power Delivery cables with aluminum alloy connectors.', 'ACCS-CBL-025', 19.99, 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500', TRUE)
ON DUPLICATE KEY UPDATE product_name = VALUES(product_name), price = VALUES(price);

-- ------------------------------------------------------------------------------
-- 4. Inventory Records (Including Low-Stock and Out-of-Stock variations)
-- ------------------------------------------------------------------------------
INSERT INTO inventory (inventory_id, product_id, quantity_available, reorder_level) VALUES
(1, 1, 35, 10),
(2, 2, 18, 5),
(3, 3, 2, 5),   -- LOW STOCK alert demo
(4, 4, 12, 5),
(5, 5, 1, 3),   -- LOW STOCK alert demo (Stock = 1 for concurrency test demo!)
(6, 6, 45, 10),
(7, 7, 22, 8),
(8, 8, 30, 10),
(9, 9, 3, 5),   -- LOW STOCK alert demo
(10, 10, 50, 15),
(11, 11, 8, 4),
(12, 12, 14, 5),
(13, 13, 16, 5),
(14, 14, 25, 8),
(15, 15, 6, 3),
(16, 16, 40, 10),
(17, 17, 0, 5),  -- OUT OF STOCK alert demo
(18, 18, 28, 10),
(19, 19, 15, 5),
(20, 20, 32, 8),
(21, 21, 10, 5),
(22, 22, 20, 5),
(23, 23, 60, 15),
(24, 24, 4, 5),  -- LOW STOCK alert demo
(25, 25, 100, 20)
ON DUPLICATE KEY UPDATE quantity_available = VALUES(quantity_available), reorder_level = VALUES(reorder_level);

-- ------------------------------------------------------------------------------
-- 5. Orders (12 realistic orders spanning PLACED, CONFIRMED, SHIPPED, DELIVERED, CANCELLED)
-- ------------------------------------------------------------------------------
INSERT INTO orders (order_id, user_id, order_number, total_amount, order_status, shipping_name, shipping_address, shipping_city, shipping_state, shipping_postal_code, created_at) VALUES
(1, 2, 'ORD-2026-00101', 899.99, 'DELIVERED', 'Alice Johnson', '123 Maple Street', 'Seattle', 'WA', '98101', '2026-10-01 10:15:00'),
(2, 3, 'ORD-2026-00102', 1548.50, 'DELIVERED', 'Bob Smith', '456 Oak Avenue', 'Portland', 'OR', '97201', '2026-10-05 14:30:00'),
(3, 4, 'ORD-2026-00103', 140.00, 'DELIVERED', 'Charlie Brown', '789 Pine Road', 'San Francisco', 'CA', '94102', '2026-10-10 11:20:00'),
(4, 5, 'ORD-2026-00104', 545.00, 'SHIPPED', 'Diana Prince', '321 Cedar Blvd', 'Austin', 'TX', '78701', '2026-10-15 16:45:00'),
(5, 6, 'ORD-2026-00105', 83.00, 'SHIPPED', 'Evan Wright', '654 Elm Court', 'Denver', 'CO', '80201', '2026-10-20 09:10:00'),
(6, 7, 'ORD-2026-00106', 450.00, 'CONFIRMED', 'Fiona Gallagher', '987 Birch Lane', 'Chicago', 'IL', '60601', '2026-10-25 13:00:00'),
(7, 8, 'ORD-2026-00107', 379.00, 'CONFIRMED', 'George Clark', '159 Walnut Dr', 'Boston', 'MA', '02108', '2026-10-28 17:25:00'),
(8, 9, 'ORD-2026-00108', 304.00, 'PLACED', 'Hannah Abbott', '753 Spruce St', 'New York', 'NY', '10001', '2026-11-01 12:40:00'),
(9, 10, 'ORD-2026-00109', 275.00, 'PLACED', 'Ian Malcolm', '852 Willow Way', 'Miami', 'FL', '33101', '2026-11-05 15:55:00'),
(10, 2, 'ORD-2026-00110', 175.00, 'CANCELLED', 'Alice Johnson', '123 Maple Street', 'Seattle', 'WA', '98101', '2026-11-08 08:30:00'),
(11, 3, 'ORD-2026-00111', 139.99, 'DELIVERED', 'Bob Smith', '456 Oak Avenue', 'Portland', 'OR', '97201', '2026-11-09 18:15:00'),
(12, 11, 'ORD-2026-00112', 38.00, 'PLACED', 'Julia Roberts', '951 Cypress Cir', 'Atlanta', 'GA', '30301', '2026-11-10 11:05:00')
ON DUPLICATE KEY UPDATE total_amount = VALUES(total_amount);

-- ------------------------------------------------------------------------------
-- 6. Order Items (Preserving purchase-time historical price & snapshot)
-- ------------------------------------------------------------------------------
INSERT INTO order_items (order_item_id, order_id, product_id, product_name_snapshot, sku_snapshot, quantity, unit_price, subtotal) VALUES
(1, 1, 1, 'Quantum Pro Smartphone 256GB', 'ELEC-SMP-001', 1, 899.99, 899.99),
(2, 2, 2, 'UltraBook Elite 14" Laptop', 'ELEC-LAP-002', 1, 1299.00, 1299.00),
(3, 2, 3, 'AcousticPulse Noise-Canceling Headphones', 'ELEC-AUD-003', 1, 249.50, 249.50),
(4, 3, 6, 'Merino Wool Crewneck Sweater', 'CLTH-SWT-006', 1, 85.00, 85.00),
(5, 3, 10, 'Classic Tailored Oxford Shirt', 'CLTH-SHT-010', 1, 55.00, 55.00),
(6, 4, 11, 'Artisan Stainless Steel Espresso Machine', 'HOME-ESP-011', 1, 450.00, 450.00),
(7, 4, 12, 'Enameled Cast Iron Dutch Oven 6-Quart', 'HOME-DUT-012', 1, 95.00, 95.00),
(8, 5, 16, 'Designing Data-Intensive Applications', 'BOOK-CS-016', 1, 48.00, 48.00),
(9, 5, 18, 'Clean Architecture: A Craftsman''s Guide', 'BOOK-SE-018', 1, 35.00, 35.00),
(10, 6, 11, 'Artisan Stainless Steel Espresso Machine', 'HOME-ESP-011', 1, 450.00, 450.00),
(11, 7, 5, 'VividVision 4K Gaming Monitor 27"', 'ELEC-MON-005', 1, 379.00, 379.00),
(12, 8, 21, 'Full-Grain Leather Commuter Backpack', 'ACCS-BPK-021', 1, 189.00, 189.00),
(13, 8, 22, 'Polarized Aviator Sunglasses Titanium', 'ACCS-SNG-022', 1, 115.00, 115.00),
(14, 9, 24, 'Automatic Skeleton Mechanical Watch', 'ACCS-WAT-024', 1, 275.00, 275.00),
(15, 10, 7, 'All-Weather Waterproof Technical Jacket', 'CLTH-JKT-007', 1, 175.00, 175.00),
(16, 11, 13, 'Smart Precision Air Fryer Oven 10L', 'HOME-AFR-013', 1, 139.99, 139.99),
(17, 12, 23, 'Minimalist RFID-Blocking Cardholder Wallet', 'ACCS-WLT-023', 1, 38.00, 38.00)
ON DUPLICATE KEY UPDATE subtotal = VALUES(subtotal);

-- ------------------------------------------------------------------------------
-- 7. Payments
-- ------------------------------------------------------------------------------
INSERT INTO payments (payment_id, order_id, payment_method, payment_status, amount, transaction_reference, created_at) VALUES
(1, 1, 'ONLINE', 'COMPLETED', 899.99, 'SIM-TXN-901001', '2026-10-01 10:15:30'),
(2, 2, 'ONLINE', 'COMPLETED', 1548.50, 'SIM-TXN-901002', '2026-10-05 14:30:25'),
(3, 3, 'COD', 'COMPLETED', 140.00, 'COD-COLLECT-003', '2026-10-10 11:20:10'),
(4, 4, 'ONLINE', 'COMPLETED', 545.00, 'SIM-TXN-901004', '2026-10-15 16:45:15'),
(5, 5, 'ONLINE', 'COMPLETED', 83.00, 'SIM-TXN-901005', '2026-10-20 09:10:45'),
(6, 6, 'ONLINE', 'COMPLETED', 450.00, 'SIM-TXN-901006', '2026-10-25 13:00:20'),
(7, 7, 'COD', 'PENDING', 379.00, 'COD-PENDING-007', '2026-10-28 17:25:35'),
(8, 8, 'ONLINE', 'PENDING', 304.00, 'SIM-TXN-901008', '2026-11-01 12:40:12'),
(9, 9, 'ONLINE', 'PENDING', 275.00, 'SIM-TXN-901009', '2026-11-05 15:55:40'),
(10, 10, 'ONLINE', 'REFUNDED', 175.00, 'SIM-REF-901010', '2026-11-08 08:35:00'),
(11, 11, 'ONLINE', 'COMPLETED', 139.99, 'SIM-TXN-901011', '2026-11-09 18:15:50'),
(12, 12, 'COD', 'PENDING', 38.00, 'COD-PENDING-012', '2026-11-10 11:05:15')
ON DUPLICATE KEY UPDATE payment_status = VALUES(payment_status);

-- ------------------------------------------------------------------------------
-- 8. Inventory Movements (Audit Trail of Initial Stocking & Sales)
-- ------------------------------------------------------------------------------
INSERT INTO inventory_movements (product_id, movement_type, quantity_changed, quantity_before, quantity_after, reference_type, reference_id, reason, created_by, created_at) VALUES
(1, 'PURCHASE', 50, 0, 50, 'INITIAL_SEED', NULL, 'Initial inventory setup', 1, '2026-09-01 08:00:00'),
(1, 'SALE', -1, 36, 35, 'ORDER', 1, 'Order checkout deduction', 2, '2026-10-01 10:15:00'),
(2, 'PURCHASE', 25, 0, 25, 'INITIAL_SEED', NULL, 'Initial inventory setup', 1, '2026-09-01 08:00:00'),
(2, 'SALE', -1, 19, 18, 'ORDER', 2, 'Order checkout deduction', 3, '2026-10-05 14:30:00'),
(3, 'SALE', -1, 3, 2, 'ORDER', 2, 'Order checkout deduction', 3, '2026-10-05 14:30:00'),
(7, 'SALE', -1, 23, 22, 'ORDER', 10, 'Order checkout deduction', 2, '2026-11-08 08:30:00'),
(7, 'CANCELLATION_RETURN', 1, 22, 23, 'ORDER', 10, 'Order cancellation restock', 2, '2026-11-08 08:35:00'),
(5, 'ADJUSTMENT', -2, 3, 1, 'MANUAL_ADJUSTMENT', NULL, 'Physical inventory stock count discrepancy', 1, '2026-11-10 14:00:00');
