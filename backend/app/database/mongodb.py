import logging
from pymongo import MongoClient
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError

logger = logging.getLogger(__name__)

class MongoDBDatabase:
    def __init__(self):
        self.client = None
        self.db = None
        self.collection_name = "product_metadata"

    def init_app(self, app):
        uri = app.config.get("MONGODB_URI", "mongodb://127.0.0.1:27017")
        db_name = app.config.get("MONGODB_DATABASE", "ecommerce_nosql")
        timeout = app.config.get("MONGODB_SERVER_SELECTION_TIMEOUT_MS", 3000)

        try:
            self.client = MongoClient(uri, serverSelectionTimeoutMS=timeout)
            self.db = self.client[db_name]
            # Quick health check
            self.client.admin.command("ping")
            logger.info(f"Connected to MongoDB database '{db_name}' successfully.")
        except (ServerSelectionTimeoutError, PyMongoError) as e:
            logger.warning(
                f"MongoDB connection failed at {uri}: {e}. "
                "Application will operate in resilient MySQL-only mode for relational data."
            )
            self.db = None

    def is_connected(self) -> bool:
        if self.client is None or self.db is None:
            return False
        try:
            self.client.admin.command("ping")
            return True
        except Exception:
            return False

    @property
    def product_metadata(self):
        if self.db is not None:
            return self.db[self.collection_name]
        return None

    def get_metadata(self, product_id: int):
        """Fetch metadata for a given product_id. Returns dict or None."""
        if not self.is_connected():
            logger.warning(f"MongoDB unavailable when fetching metadata for product_id={product_id}")
            return None
        try:
            doc = self.product_metadata.find_one({"product_id": int(product_id)}, {"_id": 0})
            return doc
        except Exception as e:
            logger.error(f"Error fetching MongoDB metadata for product_id={product_id}: {e}")
            return None

    def upsert_metadata(self, product_id: int, data: dict):
        """Insert or update metadata document for product_id."""
        if not self.is_connected():
            logger.warning(f"MongoDB unavailable when upserting metadata for product_id={product_id}")
            return False
        try:
            doc = dict(data)
            doc["product_id"] = int(product_id)
            self.product_metadata.replace_one(
                {"product_id": int(product_id)},
                doc,
                upsert=True
            )
            return True
        except Exception as e:
            logger.error(f"Error upserting MongoDB metadata for product_id={product_id}: {e}")
            return False

    def delete_metadata(self, product_id: int):
        """Delete metadata document when a product is deleted."""
        if not self.is_connected():
            return False
        try:
            self.product_metadata.delete_one({"product_id": int(product_id)})
            return True
        except Exception as e:
            logger.error(f"Error deleting MongoDB metadata for product_id={product_id}: {e}")
            return False

mongo = MongoDBDatabase()
