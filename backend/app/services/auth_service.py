from flask_jwt_extended import create_access_token
from app.database import db
from app.models import User, Cart
from app.utils.errors import BadRequestException, UnauthorizedException, ConflictException

class AuthService:
    @staticmethod
    def register(full_name: str, email: str, password: str, phone: str = None, role: str = "customer"):
        session = db.session
        email = email.strip().lower()
        
        # Check duplicate email
        existing = session.query(User).filter_by(email=email).first()
        if existing:
            raise ConflictException(f"User with email '{email}' already exists.")

        if len(password) < 6:
            raise BadRequestException("Password must be at least 6 characters long.")

        user = User(
            full_name=full_name.strip(),
            email=email,
            phone=phone.strip() if phone else None,
            role=role if role in ("customer", "admin") else "customer",
            is_active=True
        )
        user.set_password(password)
        session.add(user)
        session.flush()

        # Initialize an empty cart for the customer
        if user.role == "customer":
            cart = Cart(user_id=user.user_id)
            session.add(cart)

        session.commit()

        # Generate JWT token
        access_token = create_access_token(
            identity=str(user.user_id),
            additional_claims={"role": user.role, "email": user.email}
        )

        return {
            "user": user.to_dict(),
            "access_token": access_token
        }

    @staticmethod
    def login(email: str, password: str):
        session = db.session
        email = email.strip().lower()

        user = session.query(User).filter_by(email=email).first()
        if not user or not user.check_password(password):
            raise UnauthorizedException("Invalid email or password.")

        if not user.is_active:
            raise UnauthorizedException("Account has been deactivated. Please contact support.")

        access_token = create_access_token(
            identity=str(user.user_id),
            additional_claims={"role": user.role, "email": user.email}
        )

        return {
            "user": user.to_dict(),
            "access_token": access_token
        }
