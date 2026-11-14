import os

if os.getenv("INIT_DB", "true").lower() in ("1", "true", "yes"):
    from bootstrap_db import ensure_schema
    ensure_schema()

from app import create_app

app = create_app(os.getenv("FLASK_ENV", "development"))

if os.getenv("INIT_DB", "true").lower() in ("1", "true", "yes"):
    from seed_db import seed_database
    seed_database()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=app.config.get("DEBUG", False))
