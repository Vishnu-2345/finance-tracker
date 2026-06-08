from pydantic import BaseModel

class TransactionCreate(BaseModel):

    title: str

    amount: float

    category: str

    type: str

    user_email: str

    frequency: str

class BudgetCreate(BaseModel):

    category: str

    budget_amount: float

    user_email: str

class SavingsGoalCreate(BaseModel):

    goal_name: str

    target_amount: float

    user_email: str

class RecurringTransactionCreate(BaseModel):

    title: str

    amount: float

    category: str

    type: str

    frequency: str

    user_email: str