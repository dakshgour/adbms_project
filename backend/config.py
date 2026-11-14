"""Compatibility shim. Runtime settings live in app.config."""
from app.config import (  # noqa: F401
    Config,
    DevelopmentConfig,
    TestingConfig,
    ProductionConfig,
    config_by_name,
    get_config,
)
