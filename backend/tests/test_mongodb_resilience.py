from app.services.product_service import ProductService
from app.services.mongodb_service import MongoDBService

def test_missing_metadata_handled_gracefully(client):
    # Product 999 does not exist, but let's test fetching product with nonexistent metadata
    product = ProductService.get_product(2)
    assert product is not None
    # Product 2 should have its metadata or None, but the response still has all MySQL fields
    assert "product_name" in product
    assert "price" in product
    assert "quantity_available" in product

def test_mongodb_service_health():
    health = MongoDBService.check_health()
    assert "connected" in health
    assert isinstance(health["connected"], bool)
