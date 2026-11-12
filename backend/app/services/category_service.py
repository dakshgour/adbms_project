from app.database import db
from app.models import Category, Product
from app.utils.errors import NotFoundException, ConflictException, BadRequestException

class CategoryService:
    @staticmethod
    def list_categories():
        session = db.session
        categories = session.query(Category).order_by(Category.category_name.asc()).all()
        return [c.to_dict() for c in categories]

    @staticmethod
    def get_category(category_id: int):
        session = db.session
        cat = session.query(Category).filter_by(category_id=category_id).first()
        if not cat:
            raise NotFoundException(f"Category with id {category_id} not found.")
        return cat.to_dict()

    @staticmethod
    def create_category(category_name: str, description: str = None):
        session = db.session
        name = category_name.strip()
        if not name:
            raise BadRequestException("Category name cannot be empty.")

        existing = session.query(Category).filter_by(category_name=name).first()
        if existing:
            raise ConflictException(f"Category '{name}' already exists.")

        cat = Category(category_name=name, description=description)
        session.add(cat)
        session.commit()
        return cat.to_dict()

    @staticmethod
    def update_category(category_id: int, category_name: str = None, description: str = None):
        session = db.session
        cat = session.query(Category).filter_by(category_id=category_id).first()
        if not cat:
            raise NotFoundException(f"Category with id {category_id} not found.")

        if category_name:
            name = category_name.strip()
            existing = session.query(Category).filter(
                Category.category_name == name,
                Category.category_id != category_id
            ).first()
            if existing:
                raise ConflictException(f"Category '{name}' already exists.")
            cat.category_name = name

        if description is not None:
            cat.description = description

        session.commit()
        return cat.to_dict()

    @staticmethod
    def delete_category(category_id: int):
        session = db.session
        cat = session.query(Category).filter_by(category_id=category_id).first()
        if not cat:
            raise NotFoundException(f"Category with id {category_id} not found.")

        # Check if products exist in category
        products_count = session.query(Product).filter_by(category_id=category_id).count()
        if products_count > 0:
            raise BadRequestException(f"Cannot delete category: {products_count} products are currently assigned to it.")

        session.delete(cat)
        session.commit()
        return True
