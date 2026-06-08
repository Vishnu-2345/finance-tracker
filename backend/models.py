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


# ====================================
# BUDGETS TABLE
# ====================================

class Budget(Base):

    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)

    category = Column(String(100))

    budget_amount = Column(Float)

    user_email = Column(String(100))


# ====================================
# SAVINGS GOALS TABLE
# ====================================

class SavingsGoal(Base):

    __tablename__ = "savings_goals"

    id = Column(Integer, primary_key=True, index=True)

    goal_name = Column(String(100))

    target_amount = Column(Float)

    user_email = Column(String(100))

class RecurringTransaction(Base):

    __tablename__ = "recurring_transactions"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String)

    amount = Column(Float)

    category = Column(String)

    type = Column(String)

    frequency = Column(String)

    user_email = Column(String)