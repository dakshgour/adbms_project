import uuid

def test_list_products(client):
    res = client.get("/api/v1/products?per_page=5")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert len(data["data"]) <= 5
    assert "total_items" in data["meta"]

def test_filter_products_by_category(client):
    res = client.get("/api/v1/products?category_id=1")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    for p in data["data"]:
        assert p["category_id"] == 1

def test_search_products(client):
    res = client.get("/api/v1/products?search=Smartphone")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert any("Smartphone" in p["product_name"] for p in data["data"])

def test_get_product_detail_hybrid_mongodb(client):
    # Product 1 is Quantum Pro Smartphone which has MongoDB metadata
    res = client.get("/api/v1/products/1")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    product = data["data"]
    assert product["product_id"] == 1
    assert product["product_name"] == 'Quantum Pro Smartphone 256GB'
    assert "quantity_available" in product
    
    # Verify MongoDB metadata integration
    if product.get("metadata"):
        assert product["metadata"]["brand"] == "QuantumTech"
        assert "specifications" in product["metadata"]
        assert "display" in product["metadata"]["specifications"]

def test_admin_create_update_product(client, admin_token):
    sku = f"TEST-PROD-{uuid.uuid4().hex[:6].upper()}"
    res = client.post("/api/v1/products", headers={
        "Authorization": f"Bearer {admin_token}"
    }, json={
        "category_id": 1,
        "product_name": "Test Wireless Mouse",
        "sku": sku,
        "price": 49.99,
        "description": "Ergonomic 2.4GHz wireless mouse",
        "initial_stock": 25,
        "reorder_level": 5,
        "metadata": {
            "brand": "TechLogix",
            "specifications": {"dpi": "4000 DPI", "sensor": "Optical"}
        }
    })
    assert res.status_code == 201
    created = res.get_json()["data"]
    prod_id = created["product_id"]

    # Update product
    update_res = client.put(f"/api/v1/products/{prod_id}", headers={
        "Authorization": f"Bearer {admin_token}"
    }, json={
        "price": 44.99,
        "description": "Updated ergonomic mouse"
    })
    assert update_res.status_code == 200
    updated = update_res.get_json()["data"]
    assert updated["price"] == 44.99
    assert updated["description"] == "Updated ergonomic mouse"
