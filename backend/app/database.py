from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def create_tables():
    async with engine.begin() as conn:
        from app.models import user, competency, assessment, course, material, recommendation, notification, training, biometrics  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)
        
        # Check and add new columns for SQLite backwards compatibility
        def migrate_user_columns(connection):
            from sqlalchemy import inspect, text
            inspector = inspect(connection)
            tables = inspector.get_table_names()
            if "users" in tables:
                cols = [col["name"] for col in inspector.get_columns("users")]
                if "face_authentication_enabled" not in cols:
                    connection.execute(text("ALTER TABLE users ADD COLUMN face_authentication_enabled BOOLEAN DEFAULT 0"))
                if "face_enrollment_status" not in cols:
                    connection.execute(text("ALTER TABLE users ADD COLUMN face_enrollment_status VARCHAR(50) DEFAULT 'NOT_ENROLLED'"))

            if "user_competencies" in tables:
                uc_cols = [col["name"] for col in inspector.get_columns("user_competencies")]
                if "confidence" not in uc_cols:
                    connection.execute(text("ALTER TABLE user_competencies ADD COLUMN confidence VARCHAR(50) DEFAULT 'Medium'"))
                if "primary_evidence" not in uc_cols:
                    connection.execute(text("ALTER TABLE user_competencies ADD COLUMN primary_evidence VARCHAR(500)"))
                if "status" not in uc_cols:
                    connection.execute(text("ALTER TABLE user_competencies ADD COLUMN status VARCHAR(50) DEFAULT 'Verified'"))

        await conn.run_sync(migrate_user_columns)
