import uuid
import pytest

def test_user_registration(client):
    unique_email = f"test.user.{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/api/v1/auth/register", json={
        "full_name": "Test User",
        "email": unique_email,
        "password": "Password@123",
        "phone": "+1-555-9999"
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["user"]["email"] == unique_email
    assert "access_token" in data["data"]
    assert "password_hash" not in data["data"]["user"]

def test_duplicate_email_prevention(client):
    res = client.post("/api/v1/auth/register", json={
        "full_name": "Duplicate Alice",
        "email": "alice.johnson@example.com",
        "password": "Password@123"
    })
    assert res.status_code == 409
    data = res.get_json()
    assert data["success"] is False
    assert "already exists" in data["message"]

def test_login_success(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@ecommerce.com",
        "password": "AdminPass@123"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["user"]["role"] == "admin"
    assert "access_token" in data["data"]

def test_login_invalid_password(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@ecommerce.com",
        "password": "WrongPassword@123"
    })
    assert res.status_code == 401
    data = res.get_json()
    assert data["success"] is False

def test_current_user_me(client, customer_token):
    res = client.get("/api/v1/auth/me", headers={
        "Authorization": f"Bearer {customer_token}"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["email"] == "alice.johnson@example.com"

def test_admin_route_protection(client, customer_token):
    # Customer trying to access admin endpoint
    res = client.get("/api/v1/inventory", headers={
        "Authorization": f"Bearer {customer_token}"
    })
    assert res.status_code == 403
    data = res.get_json()
    assert data["success"] is False
    assert "Administrator privileges required" in data["message"]
