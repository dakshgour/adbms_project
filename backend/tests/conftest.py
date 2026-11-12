import pytest
import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.database import db, mongo
from app.models import User, Product, Inventory, Cart
from app.services import AuthService

@pytest.fixture(scope="session")
def app():
    # Use development or existing test db
    test_app = create_app("development")
    yield test_app

@pytest.fixture(scope="session")
def client(app):
    return app.test_client()

@pytest.fixture(scope="session")
def admin_token(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@ecommerce.com",
        "password": "AdminPass@123"
    })
    data = res.get_json()
    assert res.status_code == 200, f"Admin login failed: {data}"
    return data["data"]["access_token"]

@pytest.fixture(scope="session")
def customer_token(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "alice.johnson@example.com",
        "password": "CustomerPass@123"
    })
    data = res.get_json()
    assert res.status_code == 200, f"Customer login failed: {data}"
    return data["data"]["access_token"]
