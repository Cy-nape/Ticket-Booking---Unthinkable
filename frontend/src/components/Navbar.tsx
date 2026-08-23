import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all duration-300">
                T
              </div>
              <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400 tracking-tight">
                TicketMaster
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
                >
                  Dashboard
                </Link>
                <span className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-400 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
                  <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></div>
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="relative overflow-hidden bg-slate-800 text-slate-200 px-4 py-2 rounded-lg hover:bg-slate-700 hover:text-white transition-all text-sm font-medium border border-slate-700 shadow-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-500 transition-all duration-300 text-sm font-semibold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
