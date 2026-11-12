import os

class Config:
    """Base configuration for the Flask app."""
    # General Flask settings
    DEBUG = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    TESTING = os.getenv("FLASK_TESTING", "false").lower() == "true"
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")

    # JWT settings
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret")
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", "3600"))  # seconds

    # SQLAlchemy (MySQL) settings
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "SQLALCHEMY_DATABASE_URI",
        "mysql+pymysql://root:password@127.0.0.1:3306/ecommerce_db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.getenv("SQLALCHEMY_ECHO", "false").lower() == "true"

    # MongoDB settings
    MONGODB_URI = os.getenv(
        "MONGODB_URI",
        "mongodb://localhost:27017/ecommerce_meta"
    )

    # CORS settings
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")

# Mapping for easy import elsewhere
def get_config(name="default"):
    return Config

config_by_name = {
    "default": Config,
}
