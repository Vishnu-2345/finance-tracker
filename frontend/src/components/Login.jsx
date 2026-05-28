import { useState } from "react";

function Login({ setIsLoggedIn }) {

  const [isRegister, setIsRegister] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // MESSAGE STATES
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // =========================
  // LOGIN
  // =========================

  const handleLogin = async () => {

    setMessage("");

    const response = await fetch(
      "http://127.0.0.1:8000/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "anything",
          email,
          password,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {

      localStorage.setItem(
        "token",
        data.access_token
      );

      localStorage.setItem(
        "email",
        email
      );

      setMessage("Login Successful");
      setMessageType("success");

      setTimeout(() => {
        setIsLoggedIn(true);
      }, 1000);

    } else {

      setMessage(data.detail);
      setMessageType("error");

    }
  };

  // =========================
  // REGISTER
  // =========================

  const handleRegister = async () => {

    setMessage("");

    const response = await fetch(
      "http://127.0.0.1:8000/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {

      setMessage("Registration Successful");
      setMessageType("success");

      setIsRegister(false);

      setUsername("");
      setEmail("");
      setPassword("");

    } else {

      setMessage("Registration Failed");
      setMessageType("error");

    }
  };

  return (

    <div className="min-h-screen bg-gray-900 flex justify-center items-center">

      <div className="bg-gray-800 p-10 rounded-2xl w-[400px] shadow-2xl">

        <h1 className="text-4xl font-bold text-center text-white mb-8">

          {isRegister ? "Register" : "Login"}

        </h1>

        {/* MESSAGE BOX */}

        {message && (

          <div
            className={`mb-4 p-3 rounded-xl text-center font-semibold ${
              messageType === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {message}
          </div>

        )}

        {/* USERNAME */}

        {isRegister && (

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            className="w-full p-4 mb-4 rounded-xl bg-gray-700 text-white outline-none"
          />

        )}

        {/* EMAIL */}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full p-4 mb-4 rounded-xl bg-gray-700 text-white outline-none"
        />

        {/* PASSWORD */}

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full p-4 mb-6 rounded-xl bg-gray-700 text-white outline-none"
        />

        {/* BUTTON */}

        <button
          onClick={
            isRegister
              ? handleRegister
              : handleLogin
          }
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold"
        >
          {isRegister ? "Register" : "Login"}
        </button>

        {/* SWITCH LOGIN / REGISTER */}

        <p className="text-gray-400 text-center mt-6">

          {isRegister
            ? "Already have an account?"
            : "Don't have an account?"}

          <span
            onClick={() => {

              setIsRegister(!isRegister);

              setMessage("");

            }}
            className="text-blue-400 ml-2 cursor-pointer"
          >
            {isRegister ? "Login" : "Register"}
          </span>

        </p>

      </div>

    </div>

  );
}

export default Login;