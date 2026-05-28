from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from passlib.context import CryptContext

from jose import jwt
from datetime import datetime, timedelta

from database import engine, SessionLocal
from models import Base, Transaction
from schemas import TransactionCreate

# ====================================
# APP SETUP
# ====================================

app = FastAPI()

# ====================================
# JWT CONFIG
# ====================================

SECRET_KEY = "mysecretkey"
ALGORITHM = "HS256"

# ====================================
# CORS
# ====================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====================================
# DATABASE TABLES
# ====================================

Base.metadata.create_all(bind=engine)

# ====================================
# PASSWORD HASHING
# ====================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# ====================================
# USER SCHEMA
# ====================================

class User(BaseModel):
    username: str
    email: str
    password: str

# ====================================
# HOME ROUTE
# ====================================

@app.get("/")

def home():

    return {
        "message": "Finance Tracker API is running"
    }

# ====================================
# ADD TRANSACTION
# ====================================

@app.post("/transactions")

def add_transaction(transaction: TransactionCreate):

    db = SessionLocal()

    new_transaction = Transaction(
        title=transaction.title,
        amount=transaction.amount,
        category=transaction.category,
        type=transaction.type,
        user_email=transaction.user_email
    )

    db.add(new_transaction)

    db.commit()

    db.refresh(new_transaction)

    return {
        "message": "Transaction added successfully",
        "data": {
            "id": new_transaction.id,
            "title": new_transaction.title,
            "amount": new_transaction.amount,
            "category": new_transaction.category,
            "type": new_transaction.type,
            "user_email": new_transaction.user_email
        }
    }

# ====================================
# GET USER TRANSACTIONS
# ====================================

@app.get("/transactions/{email}")

def get_transactions(email: str):

    db = SessionLocal()

    transactions = db.query(Transaction).filter(
        Transaction.user_email == email
    ).all()

    return transactions

# ====================================
# DELETE TRANSACTION
# ====================================

@app.delete("/transactions/{transaction_id}")

def delete_transaction(transaction_id: int):

    db = SessionLocal()

    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id
    ).first()

    if transaction:

        db.delete(transaction)

        db.commit()

        return {
            "message": "Transaction deleted"
        }

    return {
        "message": "Transaction not found"
    }

# ====================================
# UPDATE TRANSACTION
# ====================================

@app.put("/transactions/{transaction_id}")

def update_transaction(
    transaction_id: int,
    transaction: TransactionCreate
):

    db = SessionLocal()

    existing_transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id
    ).first()

    if not existing_transaction:

        return {
            "message": "Transaction not found"
        }

    existing_transaction.title = transaction.title
    existing_transaction.amount = transaction.amount
    existing_transaction.category = transaction.category
    existing_transaction.type = transaction.type
    existing_transaction.user_email = transaction.user_email

    db.commit()

    return {
        "message": "Transaction updated successfully"
    }

# ====================================
# REGISTER USER
# ====================================

@app.post("/register")

def register(user: User):

    db = SessionLocal()

    hashed_password = pwd_context.hash(
        user.password
    )

    query = """
    INSERT INTO users
    (username, email, password)
    VALUES (?, ?, ?)
    """

    db.connection().connection.execute(
        query,
        (
            user.username,
            user.email,
            hashed_password
        )
    )

    db.commit()

    return {
        "message": "User registered successfully"
    }

# ====================================
# LOGIN USER
# ====================================

@app.post("/login")

def login(user: User):

    db = SessionLocal()

    query = """
    SELECT * FROM users
    WHERE email = ?
    """

    cursor = db.connection().connection.execute(
        query,
        (user.email,)
    )

    existing_user = cursor.fetchone()

    # USER NOT FOUND

    if not existing_user:

        return {
            "detail": "User not found"
        }

    stored_password = existing_user[3]

    # VERIFY PASSWORD

    password_correct = pwd_context.verify(
        user.password,
        stored_password
    )

    if not password_correct:

        return {
            "detail": "Incorrect password"
        }

    # TOKEN DATA

    token_data = {
        "sub": user.email,
        "exp": datetime.utcnow() + timedelta(hours=1)
    }

    token = jwt.encode(
        token_data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }