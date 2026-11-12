import os
import json
import logging
from sqlalchemy import text
from app import create_app
from app.database import db, mongo
from app.models import User, Category, Product, Inventory, Cart
from app.services.mongodb_service import MongoDBService

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

def seed_database():
    app = create_app()
    with app.app_context():
        session = db.session
        logger.info("Starting database seeding process...")

        # 1. Seed or Update Administrator Account from Environment Variables
        admin_email = app.config.get("ADMIN_EMAIL", "admin@ecommerce.com").strip().lower()
        admin_password = app.config.get("ADMIN_PASSWORD", "AdminPass@123")
        admin_name = app.config.get("ADMIN_NAME", "System Administrator")
        admin_phone = app.config.get("ADMIN_PHONE", "+1-800-555-0199")

        admin_user = session.query(User).filter_by(email=admin_email).first()
        if not admin_user:
            admin_user = User(
                full_name=admin_name,
                email=admin_email,
                phone=admin_phone,
                role="admin",
                is_active=True
            )
            admin_user.set_password(admin_password)
            session.add(admin_user)
            logger.info(f"Created administrator account: {admin_email}")
        else:
            admin_user.full_name = admin_name
            admin_user.set_password(admin_password)
            admin_user.role = "admin"
            admin_user.is_active = True
            logger.info(f"Updated administrator password from environment for: {admin_email}")

        # 2. Seed Customer Accounts with verifiable hashes
        customer_creds = [
            ("Alice Johnson", "alice.johnson@example.com", "CustomerPass@123", "+1-555-0101"),
            ("Bob Smith", "bob.smith@example.com", "CustomerPass@123", "+1-555-0102"),
            ("Charlie Brown", "charlie.brown@example.com", "CustomerPass@123", "+1-555-0103"),
            ("Diana Prince", "diana.prince@example.com", "CustomerPass@123", "+1-555-0104"),
            ("Evan Wright", "evan.wright@example.com", "CustomerPass@123", "+1-555-0105"),
            ("Fiona Gallagher", "fiona.gallagher@example.com", "CustomerPass@123", "+1-555-0106"),
            ("George Clark", "george.clark@example.com", "CustomerPass@123", "+1-555-0107"),
            ("Hannah Abbott", "hannah.abbott@example.com", "CustomerPass@123", "+1-555-0108"),
            ("Ian Malcolm", "ian.malcolm@example.com", "CustomerPass@123", "+1-555-0109"),
            ("Julia Roberts", "julia.roberts@example.com", "CustomerPass@123", "+1-555-0110"),
        ]

        for name, email, pwd, phone in customer_creds:
            user = session.query(User).filter_by(email=email).first()
            if not user:
                user = User(
                    full_name=name,
                    email=email,
                    phone=phone,
                    role="customer",
                    is_active=True
                )
                user.set_password(pwd)
                session.add(user)
                session.flush()

                # Ensure customer has a cart
                cart = Cart(user_id=user.user_id)
                session.add(cart)
                logger.info(f"Created customer account: {email}")
            else:
                user.set_password(pwd)
                # Check cart
                cart = session.query(Cart).filter_by(user_id=user.user_id).first()
                if not cart:
                    cart = Cart(user_id=user.user_id)
                    session.add(cart)

        session.commit()

        # 3. Load MongoDB Product Metadata from JSON
        json_path = os.path.join(os.path.dirname(__file__), "..", "database", "mongodb", "sample_product_metadata.json")
        if os.path.exists(json_path) and mongo.is_connected():
            logger.info(f"Loading MongoDB metadata from {json_path}...")
            with open(json_path, "r", encoding="utf-8") as f:
                documents = json.load(f)
            
            loaded_count = 0
            for doc in documents:
                pid = doc.get("product_id")
                if pid:
                    MongoDBService.upsert_product_metadata(pid, doc)
                    loaded_count += 1
            logger.info(f"Successfully loaded {loaded_count} metadata documents into MongoDB.")
        elif not mongo.is_connected():
            logger.warning("MongoDB is currently offline. Skipping MongoDB document seeding.")

        logger.info("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database()
