from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from passlib.context import CryptContext

from jose import jwt
from datetime import datetime, timedelta

from database import engine, SessionLocal
from models import (
    Base,
    Transaction,
    Budget,
    SavingsGoal,
    RecurringTransaction
)
from schemas import (
    TransactionCreate,
    BudgetCreate,
    SavingsGoalCreate,
    RecurringTransactionCreate,
    AdviceRequest
)

import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()


genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

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
    allow_origins=[
        "http://localhost:5173",
        "https://finance-tracker-kohl-psi.vercel.app"
    ],
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

    try:

        new_transaction = Transaction(
            title=transaction.title,
            amount=transaction.amount,
            category=transaction.category,
            type=transaction.type,
            frequency=transaction.frequency,
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
                "frequency": new_transaction.frequency,
                "user_email": new_transaction.user_email
            }
        }

    finally:
        db.close()

# ====================================
# GET USER TRANSACTIONS
# ====================================

@app.get("/transactions/{email}")
def get_transactions(email: str):

    db = SessionLocal()

    try:

        transactions = db.query(Transaction).filter(
            Transaction.user_email == email
        ).all()

        return transactions

    finally:
        db.close()

# ====================================
# DELETE TRANSACTION
# ====================================

@app.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: int):

    db = SessionLocal()

    try:

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

    finally:
        db.close()

# ====================================
# UPDATE TRANSACTION
# ====================================

@app.put("/transactions/{transaction_id}")
def update_transaction(
    transaction_id: int,
    transaction: TransactionCreate
):

    db = SessionLocal()

    try:

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
        existing_transaction.frequency = transaction.frequency
        existing_transaction.user_email = transaction.user_email

        db.commit()

        return {
            "message": "Transaction updated successfully"
        }

    finally:
        db.close()



# ====================================
# REGISTER USER
# ====================================

@app.post("/register")
def register(user: User):

    db = SessionLocal()

    try:

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

    finally:
        db.close()


# ====================================
# LOGIN USER
# ====================================

@app.post("/login")
def login(user: User):

    db = SessionLocal()

    try:

        query = """
        SELECT * FROM users
        WHERE email = ?
        """

        cursor = db.connection().connection.execute(
            query,
            (user.email,)
        )

        existing_user = cursor.fetchone()

        if not existing_user:

            return {
                "detail": "User not found"
            }

        stored_password = existing_user[3]

        password_correct = pwd_context.verify(
            user.password,
            stored_password
        )

        if not password_correct:

            return {
                "detail": "Incorrect password"
            }

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

    finally:
        db.close()

# ====================================
# ADD BUDGET
# ====================================

@app.post("/budgets")
def add_budget(budget: BudgetCreate):

    db = SessionLocal()

    try:

        new_budget = Budget(
            category=budget.category,
            budget_amount=budget.budget_amount,
            user_email=budget.user_email
        )

        db.add(new_budget)
        db.commit()
        db.refresh(new_budget)

        return {
            "message": "Budget added successfully"
        }

    finally:
        db.close()

# ====================================
# GET USER BUDGETS
# ====================================

@app.get("/budgets/{email}")
def get_budgets(email: str):

    db = SessionLocal()

    try:

        budgets = db.query(Budget).filter(
            Budget.user_email == email
        ).all()

        return budgets

    finally:
        db.close()

# ====================================
# DELETE BUDGET
# ====================================

@app.delete("/budgets/{budget_id}")
def delete_budget(budget_id: int):

    db = SessionLocal()

    try:

        budget = db.query(Budget).filter(
            Budget.id == budget_id
        ).first()

        if budget:

            db.delete(budget)
            db.commit()

            return {
                "message": "Budget deleted"
            }

        return {
            "message": "Budget not found"
        }

    finally:
        db.close()

# ====================================
# ADD SAVINGS GOAL
# ====================================

@app.post("/goals")
def add_goal(goal: SavingsGoalCreate):

    db = SessionLocal()

    try:

        new_goal = SavingsGoal(
            goal_name=goal.goal_name,
            target_amount=goal.target_amount,
            user_email=goal.user_email
        )

        db.add(new_goal)
        db.commit()
        db.refresh(new_goal)

        return {
            "message": "Goal added"
        }

    finally:
        db.close()

# ====================================
# GET GOALS
# ====================================

@app.get("/goals/{email}")
def get_goals(email: str):

    db = SessionLocal()

    try:

        goals = db.query(
            SavingsGoal
        ).filter(
            SavingsGoal.user_email == email
        ).all()

        return goals

    finally:
        db.close()

# ====================================
# ADD RECURRING TRANSACTION
# ====================================

@app.post("/recurring")

def add_recurring(
    recurring: RecurringTransactionCreate
):

    db = SessionLocal()

    try:

        new_recurring = RecurringTransaction(
            title=recurring.title,
            amount=recurring.amount,
            category=recurring.category,
            type=recurring.type,
            frequency=recurring.frequency,
            user_email=recurring.user_email
            
        )

        db.add(new_recurring)

        db.commit()

        db.refresh(new_recurring)

        return {
            "message": "Recurring transaction added"
        }

    finally:

        db.close()


# ====================================
# GET RECURRING TRANSACTIONS
# ====================================

@app.get("/recurring/{email}")

def get_recurring(email: str):

    db = SessionLocal()

    try:

        recurring = db.query(
            RecurringTransaction
        ).filter(
            RecurringTransaction.user_email == email
        ).all()

        return recurring

    finally:

        db.close()



@app.post("/ai-advice")
def get_ai_advice(data: AdviceRequest):

    try:

        model = genai.GenerativeModel(
            "gemini-2.0-flash"
        )

        prompt = f"""
        You are a personal finance advisor.

        Income: ₹{data.income}
        Expenses: ₹{data.expense}

        Savings Rate:
        {data.savings_rate}%

        Highest Spending Category:
        {data.highest_category}

        Savings Goal:
        {data.goal_name}

        Goal Amount:
        ₹{data.goal_amount}

        Give:
        1. Spending analysis
        2. Savings suggestion
        3. Goal recommendation
        4. Financial tip

        Keep answer under 150 words.
        """

        response = model.generate_content(
            prompt
        )

        return {
            "advice": response.text
        }

    except Exception:

        advice = f"""
Savings Rate: {data.savings_rate}%

Your highest spending category is {data.highest_category}.

Try reducing expenses in this category by 10-15%.

Continue saving toward your goal:
{data.goal_name} (₹{data.goal_amount})

Maintain an emergency fund and invest regularly.
"""

        return {
            "advice": advice
        }