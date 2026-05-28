from pydantic import BaseModel

class TransactionCreate(BaseModel):

    title: str

    amount: float

    category: str

    type: str

    user_email: str