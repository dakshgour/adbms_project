import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from sqlalchemy import text

from app.database import db, mongo
from app.utils.errors import AppException
from app.utils.response import error_response, success_response
from app.routes.auth_routes import auth_bp
from app.routes.product_routes import product_bp
from app.routes.category_routes import category_bp
from app.routes.cart_routes import cart_bp
from app.routes.order_routes import order_bp
from app.routes.inventory_routes import inventory_bp
from app.routes.analytics_routes import analytics_bp
from app.routes.audit_routes import audit_bp

logger = logging.getLogger(__name__)

def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "default")

    from .config import config_by_name
    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name["default"]))

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s"
    )

    # Initialize CORS
    raw_origins = app.config.get("CORS_ORIGINS", "*")
    if raw_origins.strip() == "*":
        origins = "*"
        supports_credentials = False
    else:
        origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
        supports_credentials = True
    CORS(
        app,
        resources={r"/api/*": {"origins": origins}},
        supports_credentials=supports_credentials,
        allow_headers=["Content-Type", "Authorization", "Idempotency-Key"]
    )

    # Initialize JWT
    jwt = JWTManager(app)

    @jwt.invalid_token_loader
    def invalid_token_callback(reason):
        return error_response(f"Invalid token: {reason}", status_code=401, error_code="INVALID_TOKEN")

    @jwt.unauthorized_loader
    def missing_token_callback(reason):
        return error_response("Authorization header missing or invalid format.", status_code=401, error_code="MISSING_TOKEN")

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return error_response("Token has expired. Please log in again.", status_code=401, error_code="EXPIRED_TOKEN")

    # Initialize Databases
    db.init_app(app)
    mongo.init_app(app)

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(product_bp)
    app.register_blueprint(category_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(order_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(audit_bp)

    # Health check endpoint
    @app.route("/api/v1/health", methods=["GET"])
    def health_check():
        mysql_ok = False
        try:
            db.session.execute(text("SELECT 1;"))
            mysql_ok = True
        except Exception as e:
            logger.error(f"MySQL health check failed: {e}")

        mongo_ok = mongo.is_connected()

        status_code = 200 if (mysql_ok and mongo_ok) else (207 if mysql_ok else 503)
        return jsonify({
            "status": "healthy" if (mysql_ok and mongo_ok) else ("degraded" if mysql_ok else "unhealthy"),
            "mysql": "connected" if mysql_ok else "disconnected",
            "mongodb": "connected" if mongo_ok else "disconnected",
            "environment": config_name
        }), status_code

    # Global Error Handlers
    @app.errorhandler(AppException)
    def handle_app_exception(e):
        return error_response(
            message=e.message,
            status_code=e.status_code,
            errors=e.errors,
            error_code=e.error_code
        )

    @app.errorhandler(404)
    def handle_not_found(e):
        return error_response("API endpoint not found.", status_code=404, error_code="NOT_FOUND")

    @app.errorhandler(500)
    def handle_internal_server_error(e):
        logger.exception("Unhandled server exception:")
        return error_response("An unexpected internal server error occurred.", status_code=500, error_code="INTERNAL_ERROR")

    return app
