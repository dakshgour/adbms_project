from .auth_routes import auth_bp
from .product_routes import product_bp
from .category_routes import category_bp
from .cart_routes import cart_bp
from .order_routes import order_bp
from .inventory_routes import inventory_bp
from .analytics_routes import analytics_bp
from .audit_routes import audit_bp

__all__ = [
    "auth_bp",
    "product_bp",
    "category_routes",
    "cart_bp",
    "order_bp",
    "inventory_bp",
    "analytics_bp",
    "audit_bp",
]
