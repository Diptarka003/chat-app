import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        setMessage("✅ Login successful! Redirecting...");
        setTimeout(() => navigate("/HomePage"), 1000);
      } else {
        setMessage(`❌ ${data.error || "Invalid credentials"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("❌ Something went wrong. Try again.");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 w-80">
        <h2 className="text-2xl font-semibold text-center mb-6">Login</h2>

        <div className="flex flex-col space-y-4">
          <div className="flex flex-col">
            <label className="mb-1 text-gray-700">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-gray-700">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* 🔹 Changed here */}
          <button
            type="button"
            onClick={handleSubmit}
            className="mt-4 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-200"
          >
            Log In
          </button>

          {message && (
            <p className="text-center mt-2 text-sm text-gray-600">{message}</p>
          )}
        </div>

        <p className="text-sm text-center mt-4 text-gray-600">
          Don’t have an account?{" "}
          <a href="/" className="text-blue-500 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
