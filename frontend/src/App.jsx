import { useEffect, useState } from "react";
import Login from "./components/Login";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

function App() {

  const API_URL =
    "https://finance-tracker-4akw.onrender.com";

  // =========================
  // AUTH STATE
  // =========================

  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("token") ? true : false
  );

  // =========================
  // TRANSACTION STATES
  // =========================

  const [transactions, setTransactions] = useState([]);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("expense");

  // =========================
  // EDIT STATES
  // =========================

  const [editId, setEditId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // =========================
  // CALCULATIONS
  // =========================

  const income = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );

  const expense = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );

  const balance = income - expense;

  // =========================
  // PIE CHART DATA
  // =========================

  const chartData = [
    {
      name: "Income",
      value: income
    },
    {
      name: "Expense",
      value: expense
    }
  ];

  const COLORS = [
    "#22c55e",
    "#ef4444"
  ];

  // =========================
  // MONTHLY EXPENSE DATA
  // =========================

  const monthlyExpenses = {};

  transactions.forEach((transaction) => {

    if (
      transaction.type === "expense"
    ) {

      const date = new Date(
        transaction.created_at
      );

      const month =
        date.toLocaleString(
          "default",
          { month: "short" }
        );

      if (
        !monthlyExpenses[month]
      ) {
        monthlyExpenses[month] = 0;
      }

      monthlyExpenses[month] +=
        transaction.amount;
    }
  });

  const monthlyData =
    Object.keys(
      monthlyExpenses
    ).map((month) => ({
      month,
      expense:
        monthlyExpenses[month]
    }));

  // =========================
  // FETCH TRANSACTIONS
  // =========================

  const fetchTransactions =
    async () => {

      try {

        const response =
          await fetch(
            `${API_URL}/transactions/${localStorage.getItem("email")}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
              }
            }
          );

        const data =
          await response.json();

        setTransactions(data);

      } catch (error) {

        console.log(error);

      }
    };

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {

    if (isLoggedIn) {
      fetchTransactions();
    }

  }, [isLoggedIn]);

  // =========================
  // ADD / UPDATE TRANSACTION
  // =========================

  const addTransaction =
    async () => {

      if (
        !title ||
        !amount ||
        !category ||
        !type
      ) {

        alert(
          "Please fill all fields"
        );

        return;
      }

      const transactionData = {
        title,
        amount: parseFloat(amount),
        category,
        type,
        user_email:
          localStorage.getItem(
            "email"
          )
      };

      try {

        if (isEditing) {

          await fetch(
            `${API_URL}/transactions/${editId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
              },
              body: JSON.stringify(
                transactionData
              )
            }
          );

          setEditId(null);

          setIsEditing(false);

        } else {

          await fetch(
            `${API_URL}/transactions`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
              },
              body: JSON.stringify(
                transactionData
              )
            }
          );
        }

        fetchTransactions();

        setTitle("");
        setAmount("");
        setCategory("");
        setType("expense");

      } catch (error) {

        console.log(error);

      }
    };

  // =========================
  // DELETE TRANSACTION
  // =========================

  const deleteTransaction =
    async (id) => {

      try {

        await fetch(
          `${API_URL}/transactions/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );

        fetchTransactions();

      } catch (error) {

        console.log(error);

      }
    };

  // =========================
  // EDIT TRANSACTION
  // =========================

  const editTransaction = (
    transaction
  ) => {

    setTitle(transaction.title);

    setAmount(transaction.amount);

    setCategory(
      transaction.category
    );

    setType(transaction.type);

    setEditId(transaction.id);

    setIsEditing(true);
  };

  // =========================
  // LOGOUT
  // =========================

  const logout = () => {

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "email"
    );

    setIsLoggedIn(false);
  };

  // =========================
  // LOGIN SCREEN
  // =========================

  if (!isLoggedIn) {

    return (
      <Login
        setIsLoggedIn={
          setIsLoggedIn
        }
      />
    );
  }

  // =========================
  // UI
  // =========================

  return (

    <div className="min-h-screen bg-gray-900 text-white p-8">

      <div className="max-w-5xl mx-auto">

        <div className="flex justify-between items-center mb-10">

          <h1 className="text-5xl font-bold">
            Finance Tracker
          </h1>

          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 px-5 py-3 rounded-xl"
          >
            Logout
          </button>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">

            <h2 className="text-xl font-semibold mb-2">
              Balance
            </h2>

            <p className="text-3xl font-bold text-blue-400">
              ₹{balance}
            </p>

          </div>

          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">

            <h2 className="text-xl font-semibold mb-2">
              Income
            </h2>

            <p className="text-3xl font-bold text-green-400">
              ₹{income}
            </p>

          </div>

          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">

            <h2 className="text-xl font-semibold mb-2">
              Expense
            </h2>

            <p className="text-3xl font-bold text-red-400">
              ₹{expense}
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default App;