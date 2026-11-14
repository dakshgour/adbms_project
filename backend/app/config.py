import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

_backend_dir = Path(__file__).resolve().parents[1]
_repo_root = _backend_dir.parent
load_dotenv(_repo_root / ".env")
load_dotenv(_backend_dir / ".env")


class Config:
    """Base application configuration."""
    SECRET_KEY = os.getenv("SECRET_KEY", "default-fallback-secret-key-change-in-production")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default-fallback-jwt-secret-key-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_HOURS", 24)))

    MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
    MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3312))
    MYSQL_USER = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "password")
    MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "ecommerce_db")

    SQLALCHEMY_DATABASE_URI = os.getenv("SQLALCHEMY_DATABASE_URI") or (
        f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"
        "?charset=utf8mb4"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": int(os.getenv("DB_POOL_SIZE", 10)),
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", 20)),
        "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", 1800)),
        "pool_pre_ping": True,
        "pool_timeout": 30,
    }

    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017")
    MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "ecommerce_nosql")
    MONGODB_SERVER_SELECTION_TIMEOUT_MS = int(os.getenv("MONGODB_TIMEOUT_MS", 3000))

    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")

    ADMIN_NAME = os.getenv("ADMIN_NAME", "System Administrator")
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@ecommerce.com")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "AdminPass@123")
    ADMIN_PHONE = os.getenv("ADMIN_PHONE", "+1-800-555-0199")


class DevelopmentConfig(Config):
    DEBUG = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    TESTING = False


class TestingConfig(Config):
    TESTING = True
    DEBUG = False
    MYSQL_DATABASE = os.getenv("MYSQL_TEST_DATABASE", "ecommerce_test_db")
    SQLALCHEMY_DATABASE_URI = os.getenv("SQLALCHEMY_TEST_DATABASE_URI") or (
        f"mysql+pymysql://{Config.MYSQL_USER}:{Config.MYSQL_PASSWORD}@{Config.MYSQL_HOST}:{Config.MYSQL_PORT}/{os.getenv('MYSQL_TEST_DATABASE', 'ecommerce_test_db')}"
        "?charset=utf8mb4"
    )
    MONGODB_DATABASE = "ecommerce_test_nosql"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=60)


class ProductionConfig(Config):
    DEBUG = False
    TESTING = False


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}


def get_config(name="default"):
    return config_by_name.get(name, config_by_name["default"])
