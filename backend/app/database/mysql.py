import logging
from contextlib import contextmanager
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, scoped_session, declarative_base

logger = logging.getLogger(__name__)

Base = declarative_base()

class MySQLDatabase:
    def __init__(self):
        self.engine = None
        self.session_factory = None
        self._scoped_session = None

    def init_app(self, app):
        db_uri = app.config.get("SQLALCHEMY_DATABASE_URI")
        engine_options = app.config.get("SQLALCHEMY_ENGINE_OPTIONS", {})
        
        self.engine = create_engine(db_uri, **engine_options)
        self.session_factory = sessionmaker(bind=self.engine, expire_on_commit=False)
        self._scoped_session = scoped_session(self.session_factory)
        
        # Register teardown to clean up scoped session at the end of each request
        @app.teardown_appcontext
        def cleanup_session(exception=None):
            if self._scoped_session is not None:
                # Reset session variable @app_user_id before releasing connection back to pool
                try:
                    self._scoped_session.execute(text("SET @app_user_id = NULL;"))
                except Exception:
                    pass
                self._scoped_session.remove()

    @property
    def session(self):
        if self._scoped_session is None:
            raise RuntimeError("Database is not initialized with Flask app.")
        return self._scoped_session

    @contextmanager
    def transaction_scope(self, user_id=None):
        """
        Transactional context manager.
        Begins a transaction, optionally sets @app_user_id session variable for audit triggers,
        commits on clean exit, and rolls back on exception.
        """
        session = self.session
        try:
            if user_id is not None:
                session.execute(text("SET @app_user_id = :uid"), {"uid": user_id})
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Transaction rolled back due to: {e}")
            raise
        finally:
            if user_id is not None:
                try:
                    session.execute(text("SET @app_user_id = NULL"))
                except Exception:
                    pass

db = MySQLDatabase()
