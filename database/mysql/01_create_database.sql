-- ==============================================================================
-- 01_create_database.sql
-- Database creation and charset/collation configuration for E-commerce ADBMS Project
-- Target Engine: MySQL 8.0+ InnoDB
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS ecommerce_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE ecommerce_db;

-- Verify database configuration
SELECT 
    SCHEMA_NAME AS 'Database',
    DEFAULT_CHARACTER_SET_NAME AS 'Charset',
    DEFAULT_COLLATION_NAME AS 'Collation'
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME = 'ecommerce_db';
