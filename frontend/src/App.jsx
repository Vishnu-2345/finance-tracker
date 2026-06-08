import { useEffect, useState } from "react";
import Login from "./components/Login";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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
  
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);

  const [goalName, setGoalName] = useState("");

  const [targetAmount, setTargetAmount] = useState("");

  const [budgetCategory, setBudgetCategory] = useState("");

  const [budgetAmount, setBudgetAmount] = useState("");

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("expense");
  const [search, setSearch] = useState("");
  const [frequency, setFrequency] =
  useState("One Time");
 
  // =========================
  // EDIT STATES
  // =========================

  const [editId, setEditId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // =========================
  // SAFE ARRAY
  // =========================

  const safeTransactions = Array.isArray(transactions)
    ? transactions
    : [];

  // =========================
  // CALCULATIONS
  // =========================

  const income = safeTransactions
    .filter(
      (transaction) =>
        transaction.type === "income"
    )
    .reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );

  const expense = safeTransactions
    .filter(
      (transaction) =>
        transaction.type === "expense"
    )
    .reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );

  const balance = income - expense;
  const currentSavings = balance > 0 ? balance : 0;
  const budgetWarnings = budgets.map((budget) => {

  const spent = safeTransactions
    .filter(
      (transaction) =>
        (transaction.type || "").toLowerCase() === "expense" &&
        (transaction.category || "").toLowerCase() ===
        budget.category.toLowerCase()
    )
    .reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );

  return {
    category: budget.category,
    budget: budget.budget_amount,
    spent,
    exceeded:
      spent > budget.budget_amount
  };
});

  // =========================
  // PIE CHART DATA
  // =========================
  const categoryData = Object.values(

  safeTransactions
    .filter(
      (transaction) =>
        (transaction.type || "").toLowerCase() ===
        "expense"
    )

    .reduce((acc, transaction) => {

      const category =
        transaction.category;

      if (!acc[category]) {

        acc[category] = {
          name: category,
          value: 0
        };

      }

      acc[category].value +=
        transaction.amount;

      return acc;

    }, {})

);

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
  "#ef4444",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316"
];
  // =========================
  // MONTHLY EXPENSE DATA
  // =========================

  const monthlyExpenses = {};

  safeTransactions.forEach(
    (transaction) => {

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
    }
  );

  const monthlyData =
    Object.keys(
      monthlyExpenses
    ).map((month) => ({
      month,
      expense:
        monthlyExpenses[month]
    }));

  const fetchBudgets = async () => {
    try {
      
      const response =
      await fetch(
        `${API_URL}/budgets/${localStorage.getItem("email")}`
      );
      
      const data =
      await response.json();

      setBudgets(data);

  } catch (error) {
    console.log(error);

  }
};

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
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${localStorage.getItem("token")}`
              }
            }
          );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch transactions"
          );
        }

        const data =
          await response.json();

        if (Array.isArray(data)) {
          setTransactions(data);
        } else {
          setTransactions([]);
        }

      } catch (error) {

        console.log(error);

        setTransactions([]);
      }
    };

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {

    if (isLoggedIn) {
      fetchTransactions();
      fetchBudgets();
      fetchGoals();
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
        frequency,
        user_email: localStorage.getItem("email"),
        
      };

      console.log("TRANSACTION DATA:", transactionData);

      try {

        if (isEditing) {

          await fetch(
            `${API_URL}/transactions/${editId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${localStorage.getItem("token")}`
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
                Authorization:
                  `Bearer ${localStorage.getItem("token")}`
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
        setFrequency("One Time");
        

      } catch (error) {

        console.log(error);

      }
    };


    const addBudget = async () => {

  if (
    !budgetCategory ||
    !budgetAmount
  ) {
    alert("Fill all fields");
    return;
  }

  const budgetData = {
    category: budgetCategory,
    budget_amount: parseFloat(budgetAmount),
    user_email: localStorage.getItem("email")
  };

  try {

    await fetch(
      `${API_URL}/budgets`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify(budgetData)
      }
    );

    setBudgetCategory("");
    setBudgetAmount("");

    fetchBudgets();

  } catch (error) {

    console.log(error);

  }
};

const addGoal = async () => {

  if (
    !goalName ||
    !targetAmount
  ) {
    alert("Fill all fields");
    return;
  }

  const goalData = {
    goal_name: goalName,
    target_amount: parseFloat(targetAmount),
    user_email: localStorage.getItem("email")
  };

  try {

    await fetch(
      `${API_URL}/goals`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify(goalData)
      }
    );

    setGoalName("");
    setTargetAmount("");

    fetchGoals();

  } catch (error) {

    console.log(error);

  }
};


const fetchGoals = async () => {

  try {

    const response =
      await fetch(
        `${API_URL}/goals/${localStorage.getItem("email")}`
      );

    const data =
      await response.json();

    setGoals(data);

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
              Authorization:
                `Bearer ${localStorage.getItem("token")}`
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

  const editTransaction =
    (transaction) => {

      setTitle(
        transaction.title
      );

      setAmount(
        transaction.amount
      );

      setCategory(
        transaction.category
      );

      setType(
        transaction.type
      );

      setFrequency(
        transaction.frequency || "One Time"
      );

      setEditId(
        transaction.id
      );

      setIsEditing(true);
    };
    

const exportToExcel = () => {

  const worksheet =
    XLSX.utils.json_to_sheet(
      safeTransactions
    );

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Transactions"
  );

  const excelBuffer =
    XLSX.write(
      workbook,
      {
        bookType: "xlsx",
        type: "array"
      }
    );

  const fileData =
    new Blob(
      [excelBuffer],
      {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }
    );

  saveAs(
    fileData,
    "transactions.xlsx"
  );

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

          <div>

  <h1 className="text-5xl font-bold">
    Finance Tracker
  </h1>

  <button
    onClick={exportToExcel}
    className="mt-3 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg"
  >
    Export Excel
  </button>

</div>

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
  value={frequency}
  onChange={(e) =>
    setFrequency(
      e.target.value
    )
  }
  className="p-3 rounded-lg bg-gray-700 outline-none"
>

  <option>One Time</option>

  <option>Monthly</option>

  <option>Weekly</option>

  <option>Yearly</option>

</select>

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

        {/* BUDGETS */}

<div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-10">

  <h2 className="text-2xl font-bold mb-6">
    Budget Management
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

    <input
      type="text"
      placeholder="Budget Category"
      value={budgetCategory}
      onChange={(e) =>
        setBudgetCategory(
          e.target.value
        )
      }
      className="p-3 rounded-lg bg-gray-700 outline-none"
    />

    <input
      type="number"
      placeholder="Budget Amount"
      value={budgetAmount}
      onChange={(e) =>
        setBudgetAmount(
          e.target.value
        )
      }
      className="p-3 rounded-lg bg-gray-700 outline-none"
    />

  </div>

  <button
    onClick={addBudget}
    className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl"
  >
    Add Budget
  </button>

  <div className="mt-6 space-y-3">

    {budgets.map((budget) => (

      <div
        key={budget.id}
        className="bg-gray-700 p-4 rounded-xl"
      >

        <p className="font-semibold">
          {budget.category}
        </p>

        <p className="text-green-400">
          ₹{budget.budget_amount}
        </p>

      </div>

    ))}

  </div>
  <div className="mt-6">

  <h3 className="text-xl font-bold mb-3">
    Budget Status
  </h3>

  {budgetWarnings.map((item) => (

    <div
      key={item.category}
      className="mb-3"
    >

      {item.exceeded ? (

        <div className="bg-red-900 p-3 rounded-lg">

          ⚠ {item.category} Budget Exceeded by ₹
          {Math.round(item.spent - item.budget)}

        </div>

      ) : (

        <div className="bg-green-900 p-3 rounded-lg">

          ✓ {item.category} Budget Remaining ₹
          {Math.round(item.budget - item.spent)}

        </div>

      )}

    </div>

  ))}

</div>

</div>

{/* SAVINGS GOALS */}

<div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-10">

  <h2 className="text-2xl font-bold mb-6">
    Savings Goals
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

    <input
      type="text"
      placeholder="Goal Name"
      value={goalName}
      onChange={(e) =>
        setGoalName(e.target.value)
      }
      className="p-3 rounded-lg bg-gray-700 outline-none"
    />

    <input
      type="number"
      placeholder="Target Amount"
      value={targetAmount}
      onChange={(e) =>
        setTargetAmount(e.target.value)
      }
      className="p-3 rounded-lg bg-gray-700 outline-none"
    />

  </div>

  <button
    onClick={addGoal}
    className="bg-purple-500 hover:bg-purple-600 px-6 py-3 rounded-xl"
  >
    Add Goal
  </button>

  <div className="mt-6">

    {goals.map((goal) => {

      const progress =
        Math.min(
          (currentSavings /
            goal.target_amount) *
            100,
          100
        );

      return (

        <div
          key={goal.id}
          className="mb-6"
        >

          <h3 className="font-bold text-lg">
            {goal.goal_name}
          </h3>

          <p className="text-gray-300">
            Target ₹{goal.target_amount}
          </p>

          <div className="w-full bg-gray-700 h-4 rounded-full mt-2">

            <div
              className="bg-green-500 h-4 rounded-full"
              style={{
                width: `${progress}%`
              }}
            />

          </div>

          <p className="mt-2 text-green-400">
            {progress.toFixed(1)}%
          </p>

        </div>

      );

    })}

  </div>

</div>

{/* PIE CHART */}

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


        {/* MONTHLY CHART */}

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

        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mt-10">

  <h2 className="text-2xl font-bold mb-6">
    Expense Category Analytics
  </h2>

  <ResponsiveContainer
    width="100%"
    height={350}
  >

    <PieChart>

      <Pie
      data={categoryData}
      dataKey="value"
      nameKey="name"
      outerRadius={120}
      label={({ name, value }) =>
      `${name}: ₹${value}`
  }
>

        {categoryData.map(
          (_, index) => (
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

  </ResponsiveContainer>

</div>

        {/* TRANSACTIONS */}

        <div>

          <h2 className="text-3xl font-bold mb-6">
            Transactions
          </h2>
          <input
          type="text"
          placeholder="Search Transaction..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="w-full p-3 mb-4 rounded-lg bg-gray-700 outline-none"
          />

          <div className="space-y-4">

            {safeTransactions.length === 0 ? (

              <div className="bg-gray-800 p-6 rounded-2xl text-center text-gray-400">
                No Transactions Added
              </div>

            ) : (

              safeTransactions
  .filter(
    (transaction) =>
      transaction.title
        .toLowerCase()
        .includes(
          search.toLowerCase()
        ) ||
      transaction.category
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
  )
  .map(
    (transaction) => (

      <div
        key={transaction.id}
        className="bg-gray-800 p-5 rounded-2xl shadow-lg flex justify-between items-center"
      >

        <div>

          <h3 className="text-xl font-semibold">
            {transaction.title}
          </h3>

          <p className="text-gray-400">
            Category: {transaction.category}
          </p>

          <p className="text-gray-400">
             Frequency: {transaction.frequency}
          </p>

          <p
            className={
              transaction.type === "income"
                ? "text-green-400 text-lg font-semibold"
                : "text-red-400 text-lg font-semibold"
            }
          >
            ₹{transaction.amount}
          </p>

        </div>

        <div className="flex gap-3">

          <button
            onClick={() =>
              editTransaction(transaction)
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