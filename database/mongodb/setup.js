/**
 * setup.js - MongoDB Database & Collection Initialization Script
 * Database: ecommerce_nosql
 * Collection: product_metadata
 * 
 * Run using mongosh:
 * mongosh ecommerce_nosql database/mongodb/setup.js
 */

const dbName = "ecommerce_nosql";
const dbTarget = db.getSiblingDB(dbName);

print(`=======================================================`);
print(`Initializing MongoDB database: ${dbName}`);
print(`=======================================================`);

// Create or verify collection
if (!dbTarget.getCollectionNames().includes("product_metadata")) {
    dbTarget.createCollection("product_metadata");
    print("Created collection: product_metadata");
} else {
    print("Collection product_metadata already exists.");
}

// Create unique index on product_id (logical reference to MySQL products.product_id)
dbTarget.product_metadata.createIndex(
    { product_id: 1 }, 
    { unique: true, name: "idx_product_id_unique" }
);
print("Created unique index: idx_product_id_unique on product_id");

// Create text index on brand, tags, specifications for flexible text search
dbTarget.product_metadata.createIndex(
    { 
        brand: "text", 
        tags: "text" 
    },
    { name: "idx_brand_tags_text" }
);
print("Created text index: idx_brand_tags_text on brand and tags");

// Display index summary
const indexes = dbTarget.product_metadata.getIndexes();
print("Active Indexes on product_metadata:");
printjson(indexes);

print(`\nDatabase setup complete. Total documents: ${dbTarget.product_metadata.countDocuments()}`);
