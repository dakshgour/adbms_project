import math
from sqlalchemy import or_, desc, asc
from app.database import db
from app.models import Product, Category, Inventory
from app.services.mongodb_service import MongoDBService
from app.utils.errors import NotFoundException, ConflictException, BadRequestException

class ProductService:
    @staticmethod
    def list_products(
        category_id=None,
        search=None,
        min_price=None,
        max_price=None,
        is_active=True,
        stock_status=None,
        sort_by="newest",
        page=1,
        per_page=12
    ):
        session = db.session
        query = session.query(Product).join(Category)

        if is_active is not None:
            query = query.filter(Product.is_active == is_active)

        if category_id:
            query = query.filter(Product.category_id == int(category_id))

        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Product.product_name.ilike(search_term),
                    Product.sku.ilike(search_term),
                    Product.description.ilike(search_term)
                )
            )

        if min_price is not None:
            query = query.filter(Product.price >= float(min_price))

        if max_price is not None:
            query = query.filter(Product.price <= float(max_price))

        # Join inventory for stock status filtering
        if stock_status:
            query = query.join(Inventory)
            if stock_status == "OUT_OF_STOCK":
                query = query.filter(Inventory.quantity_available <= 0)
            elif stock_status == "LOW_STOCK":
                query = query.filter(
                    Inventory.quantity_available > 0,
                    Inventory.quantity_available <= Inventory.reorder_level
                )
            elif stock_status == "IN_STOCK":
                query = query.filter(Inventory.quantity_available > Inventory.reorder_level)

        # Sorting
        if sort_by == "price_asc":
            query = query.order_by(asc(Product.price))
        elif sort_by == "price_desc":
            query = query.order_by(desc(Product.price))
        elif sort_by == "name_asc":
            query = query.order_by(asc(Product.product_name))
        else: # newest
            query = query.order_by(desc(Product.created_at))

        total_items = query.count()
        total_pages = math.ceil(total_items / per_page) if per_page else 1
        offset = (page - 1) * per_page

        products = query.offset(offset).limit(per_page).all()

        return {
            "products": [p.to_dict() for p in products],
            "pagination": {
                "total_items": total_items,
                "total_pages": total_pages,
                "current_page": page,
                "per_page": per_page
            }
        }

    @staticmethod
    def get_product(product_id: int):
        session = db.session
        product = session.query(Product).filter_by(product_id=product_id).first()
        if not product:
            raise NotFoundException(f"Product with id {product_id} not found.")

        # Hybrid Retrieval: Fetch metadata from MongoDB
        metadata = MongoDBService.get_product_metadata(product_id)

        return product.to_dict(include_inventory=True, metadata=metadata)

    @staticmethod
    def create_product(
        category_id: int,
        product_name: str,
        sku: str,
        price: float,
        description: str = None,
        image_url: str = None,
        initial_stock: int = 0,
        reorder_level: int = 5,
        metadata: dict = None
    ):
        session = db.session
        sku = sku.strip().upper()

        # Check SKU uniqueness
        existing = session.query(Product).filter_by(sku=sku).first()
        if existing:
            raise ConflictException(f"A product with SKU '{sku}' already exists.")

        category = session.query(Category).filter_by(category_id=category_id).first()
        if not category:
            raise NotFoundException(f"Category with id {category_id} does not exist.")

        product = Product(
            category_id=category_id,
            product_name=product_name.strip(),
            sku=sku,
            price=price,
            description=description,
            image_url=image_url,
            is_active=True
        )
        session.add(product)
        session.flush()

        inventory = Inventory(
            product_id=product.product_id,
            quantity_available=max(0, int(initial_stock)),
            reorder_level=max(0, int(reorder_level))
        )
        session.add(inventory)
        session.commit()

        # Save metadata to MongoDB if provided
        if metadata:
            MongoDBService.upsert_product_metadata(product.product_id, metadata)

        return ProductService.get_product(product.product_id)

    @staticmethod
    def update_product(
        product_id: int,
        category_id: int = None,
        product_name: str = None,
        sku: str = None,
        price: float = None,
        description: str = None,
        image_url: str = None,
        is_active: bool = None,
        metadata: dict = None
    ):
        session = db.session
        product = session.query(Product).filter_by(product_id=product_id).first()
        if not product:
            raise NotFoundException(f"Product with id {product_id} not found.")

        if sku is not None:
            new_sku = sku.strip().upper()
            existing = session.query(Product).filter(
                Product.sku == new_sku,
                Product.product_id != product_id
            ).first()
            if existing:
                raise ConflictException(f"Another product with SKU '{new_sku}' already exists.")
            product.sku = new_sku

        if category_id is not None:
            cat = session.query(Category).filter_by(category_id=category_id).first()
            if not cat:
                raise NotFoundException(f"Category with id {category_id} not found.")
            product.category_id = category_id

        if product_name is not None:
            product.product_name = product_name.strip()

        if price is not None:
            if float(price) < 0:
                raise BadRequestException("Product price cannot be negative.")
            product.price = price

        if description is not None:
            product.description = description

        if image_url is not None:
            product.image_url = image_url

        if is_active is not None:
            product.is_active = bool(is_active)

        session.commit()

        if metadata is not None:
            MongoDBService.upsert_product_metadata(product_id, metadata)

        return ProductService.get_product(product_id)

    @staticmethod
    def delete_product(product_id: int):
        session = db.session
        product = session.query(Product).filter_by(product_id=product_id).first()
        if not product:
            raise NotFoundException(f"Product with id {product_id} not found.")

        # Deactivate product in MySQL
        product.is_active = False
        session.commit()

        # Define how metadata is handled on deactivation: keep historical metadata or delete
        # We retain metadata for historical order integrity, or delete on hard delete
        return True
