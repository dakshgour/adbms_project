import logging
from app.database import mongo

logger = logging.getLogger(__name__)

class MongoDBService:
    @staticmethod
    def get_product_metadata(product_id: int):
        """Fetch metadata from MongoDB. Returns None if not found or MongoDB unavailable."""
        return mongo.get_metadata(product_id)

    @staticmethod
    def upsert_product_metadata(product_id: int, metadata: dict):
        """Save or update metadata document in MongoDB."""
        return mongo.upsert_metadata(product_id, metadata)

    @staticmethod
    def delete_product_metadata(product_id: int):
        """Delete metadata document in MongoDB."""
        return mongo.delete_metadata(product_id)

    @staticmethod
    def check_health():
        return {
            "connected": mongo.is_connected(),
            "database": mongo.db.name if mongo.db is not None else None
        }
