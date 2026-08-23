import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_URL } from "../api";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "CUSTOMER" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Registration failed");
      }

      navigate("/login");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative max-w-md w-full bg-slate-900/80 backdrop-blur-xl p-8 border border-slate-800 shadow-2xl rounded-2xl mx-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-white mb-2">Create Account</h2>
          <p className="text-slate-400 text-sm">Join to get exclusive access to premium events</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 mb-6 text-sm rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              className="block w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all placeholder-slate-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="block w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all placeholder-slate-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-teal-500 to-indigo-600 text-white py-3 px-4 rounded-lg font-bold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.02] transition-all"
          >
            Register
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-slate-400">
          Already have an account? <Link to="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}
