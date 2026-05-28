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
  // REAL MONTHLY EXPENSE DATA
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
            `http://127.0.0.1:8000/transactions/${localStorage.getItem("email")}`,
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

        // UPDATE

        if (isEditing) {

          await fetch(
            `http://127.0.0.1:8000/transactions/${editId}`,
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

          // ADD

          await fetch(
            "http://127.0.0.1:8000/transactions",
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

        // CLEAR FORM

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
          `http://127.0.0.1:8000/transactions/${id}`,
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

        {/* HEADER */}

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

        {/* DASHBOARD */}

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

        {/* FORM */}

        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-10">

          <h2 className="text-2xl font-bold mb-6">

            {isEditing
              ? "Edit Transaction"
              : "Add Transaction"}

          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
              className="p-3 rounded-lg bg-gray-700 outline-none"
            />

            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) =>
                setAmount(
                  e.target.value
                )
              }
              className="p-3 rounded-lg bg-gray-700 outline-none"
            />

            <input
              type="text"
              placeholder="Category"
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
              className="p-3 rounded-lg bg-gray-700 outline-none"
            />

            <select
              value={type}
              onChange={(e) =>
                setType(
                  e.target.value
                )
              }
              className="p-3 rounded-lg bg-gray-700 outline-none"
            >
              <option value="expense">
                Expense
              </option>

              <option value="income">
                Income
              </option>

            </select>

          </div>

          <button
            onClick={addTransaction}
            className="mt-6 bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-xl font-semibold"
          >

            {isEditing
              ? "Update Transaction"
              : "Add Transaction"}

          </button>

        </div>

        {/* PIE CHART */}

        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-10">

          <h2 className="text-2xl font-bold mb-6">
            Financial Overview
          </h2>

          <div className="flex justify-center">

            <PieChart
              width={400}
              height={300}
            >

              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label
              >

                {chartData.map(
                  (
                    entry,
                    index
                  ) => (

                    <Cell
                      key={index}
                      fill={
                        COLORS[
                          index %
                            COLORS.length
                        ]
                      }
                    />

                  )
                )}

              </Pie>

              <Tooltip />

              <Legend />

            </PieChart>

          </div>

        </div>

        {/* REAL MONTHLY CHART */}

        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-10">

          <h2 className="text-2xl font-bold mb-6">
            Monthly Expenses
          </h2>

          <ResponsiveContainer
            width="100%"
            height={300}
          >

            <BarChart
              data={monthlyData}
            >

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="expense"
                fill="#ef4444"
                radius={[
                  10,
                  10,
                  0,
                  0
                ]}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

        {/* TRANSACTIONS */}

        <div>

          <h2 className="text-3xl font-bold mb-6">
            Transactions
          </h2>

          <div className="space-y-4">

            {transactions.length === 0 ? (

              <div className="bg-gray-800 p-6 rounded-2xl text-center text-gray-400">
                No Transactions Added
              </div>

            ) : (

              transactions.map(
                (
                  transaction
                ) => (

                  <div
                    key={
                      transaction.id
                    }
                    className="bg-gray-800 p-5 rounded-2xl shadow-lg flex justify-between items-center"
                  >

                    <div>

                      <h3 className="text-xl font-semibold">
                        {
                          transaction.title
                        }
                      </h3>

                      <p className="text-gray-400">
                        Category:
                        {" "}
                        {
                          transaction.category
                        }
                      </p>

                      <p
                        className={
                          transaction.type ===
                          "income"
                            ? "text-green-400 text-lg font-semibold"
                            : "text-red-400 text-lg font-semibold"
                        }
                      >
                        ₹
                        {
                          transaction.amount
                        }
                      </p>

                    </div>

                    <div className="flex gap-3">

                      <button
                        onClick={() =>
                          editTransaction(
                            transaction
                          )
                        }
                        className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-lg"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          deleteTransaction(
                            transaction.id
                          )
                        }
                        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                )
              )
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default App;