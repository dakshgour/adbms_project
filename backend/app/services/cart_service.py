from app.database import db
from app.models import Cart, CartItem, Product, Inventory
from app.utils.errors import NotFoundException, BadRequestException, InsufficientStockException

class CartService:
    @staticmethod
    def get_user_cart(user_id: int):
        session = db.session
        cart = session.query(Cart).filter_by(user_id=user_id).first()
        if not cart:
            cart = Cart(user_id=user_id)
            session.add(cart)
            session.commit()
        return cart.to_dict()

    @staticmethod
    def add_item(user_id: int, product_id: int, quantity: int = 1):
        session = db.session
        if quantity <= 0:
            raise BadRequestException("Quantity must be greater than zero.")

        # Validate product
        product = session.query(Product).filter_by(product_id=product_id, is_active=True).first()
        if not product:
            raise NotFoundException("Product not found or is currently inactive.")

        # Check stock
        inventory = session.query(Inventory).filter_by(product_id=product_id).first()
        if not inventory or inventory.quantity_available <= 0:
            raise InsufficientStockException("This product is currently out of stock.")

        cart = session.query(Cart).filter_by(user_id=user_id).first()
        if not cart:
            cart = Cart(user_id=user_id)
            session.add(cart)
            session.flush()

        item = session.query(CartItem).filter_by(cart_id=cart.cart_id, product_id=product_id).first()
        if item:
            new_qty = item.quantity + quantity
            if new_qty > inventory.quantity_available:
                raise InsufficientStockException(
                    f"Cannot add {quantity} more. Only {inventory.quantity_available} units available in stock."
                )
            item.quantity = new_qty
        else:
            if quantity > inventory.quantity_available:
                raise InsufficientStockException(
                    f"Requested {quantity} units, but only {inventory.quantity_available} are available."
                )
            item = CartItem(cart_id=cart.cart_id, product_id=product_id, quantity=quantity)
            session.add(item)

        session.commit()
        return CartService.get_user_cart(user_id)

    @staticmethod
    def update_item_quantity(user_id: int, cart_item_id: int, quantity: int):
        session = db.session
        if quantity <= 0:
            raise BadRequestException("Quantity must be greater than zero. To remove, use delete.")

        cart = session.query(Cart).filter_by(user_id=user_id).first()
        if not cart:
            raise NotFoundException("Cart not found.")

        item = session.query(CartItem).filter_by(cart_item_id=cart_item_id, cart_id=cart.cart_id).first()
        if not item:
            raise NotFoundException("Cart item not found.")

        # Check inventory limits
        inventory = session.query(Inventory).filter_by(product_id=item.product_id).first()
        if not inventory or quantity > inventory.quantity_available:
            avail = inventory.quantity_available if inventory else 0
            raise InsufficientStockException(f"Cannot update quantity to {quantity}. Only {avail} available in stock.")

        item.quantity = quantity
        session.commit()
        return CartService.get_user_cart(user_id)

    @staticmethod
    def remove_item(user_id: int, cart_item_id: int):
        session = db.session
        cart = session.query(Cart).filter_by(user_id=user_id).first()
        if not cart:
            raise NotFoundException("Cart not found.")

        item = session.query(CartItem).filter_by(cart_item_id=cart_item_id, cart_id=cart.cart_id).first()
        if not item:
            raise NotFoundException("Cart item not found.")

        session.delete(item)
        session.commit()
        return CartService.get_user_cart(user_id)

    @staticmethod
    def clear_cart(user_id: int):
        session = db.session
        cart = session.query(Cart).filter_by(user_id=user_id).first()
        if cart:
            session.query(CartItem).filter_by(cart_id=cart.cart_id).delete()
            session.commit()
        return True
