from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
from datetime import datetime

# ====================================
# TRANSACTIONS TABLE
# ====================================

class Transaction(Base):

    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(100))

    amount = Column(Float)

    category = Column(String(100))

    type = Column(String(20))

    user_email = Column(String(100))

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

# ====================================
# USERS TABLE
# ====================================

class UserDB(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String(100))

    email = Column(String(100), unique=True)

    password = Column(String(200))