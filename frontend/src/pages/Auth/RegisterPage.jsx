import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import authService from "../../services/authService";

import {
  BrainCircuit,
  Mail,
  Lock,
  ArrowRight,
  User,
} from "lucide-react";

import toast from "react-hot-toast";

const RegisterPage = () => {

  // ==========================================
  // States
  // ==========================================
  const [username, setUsername] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const [focusedField, setFocusedField] =
    useState(null);

  // ==========================================
  // Hooks
  // ==========================================
  const navigate = useNavigate();

  // ==========================================
  // Handle Register
  // ==========================================
  const handleSubmit = async (e) => {

    e.preventDefault();

    // Password validation
    if (password.length < 6) {

      setError(
        "Password must be at least 6 characters long"
      );

      return;
    }

    setError("");

    setLoading(true);

    try {

      // Register API Call
      await authService.register(
        username,
        email,
        password
      );

      toast.success(
        "Registration successful! Please login."
      );

      // Redirect to login page
      navigate("/login");

    } catch (err) {

      const errorMsg = err.error || err.message || "Failed to register. Please try again later.";

      setError(errorMsg);

      toast.error(errorMsg);

    } finally {

      setLoading(false);
    }
  };

  return (

    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[size:16px_16px] opacity-30"></div>

      {/* Card */}
      <div className="relative w-full max-w-md px-6">

        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-xl p-8">

          {/* Logo */}
          <div className="text-center mb-8">

            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg mb-4">

              <BrainCircuit
                className="w-8 h-8 text-white"
                strokeWidth={2}
              />

            </div>

            <h1 className="text-3xl font-bold text-slate-900">
              Create an account
            </h1>

            <p className="text-slate-500 mt-2">
              Start your AI-learning experience with LearnMate AI.
            </p>

          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Username */}
            <div className="space-y-2">

              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Username
              </label>

              <div className="relative">

                <div
                  className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${
                    focusedField === "username"
                      ? "text-emerald-500"
                      : "text-slate-400"
                  }`}
                >
                  <User
                    className="h-5 w-5"
                    strokeWidth={2}
                  />
                </div>

                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                  onFocus={() =>
                    setFocusedField("username")
                  }
                  onBlur={() =>
                    setFocusedField(null)
                  }
                  placeholder="yourUsername"
                  className="w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl bg-slate-50/50 text-sm transition-all duration-200 focus:outline-none focus:border-emerald-500"
                />

              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">

              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Email
              </label>

              <div className="relative">

                <div
                  className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${
                    focusedField === "email"
                      ? "text-emerald-500"
                      : "text-slate-400"
                  }`}
                >
                  <Mail
                    className="h-5 w-5"
                    strokeWidth={2}
                  />
                </div>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  onFocus={() =>
                    setFocusedField("email")
                  }
                  onBlur={() =>
                    setFocusedField(null)
                  }
                  placeholder="Enter your email"
                  className="w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl bg-slate-50/50 text-sm transition-all duration-200 focus:outline-none focus:border-emerald-500"
                />

              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">

              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Password
              </label>

              <div className="relative">

                <div
                  className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${
                    focusedField === "password"
                      ? "text-emerald-500"
                      : "text-slate-400"
                  }`}
                >
                  <Lock
                    className="h-5 w-5"
                    strokeWidth={2}
                  />
                </div>

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  onFocus={() =>
                    setFocusedField("password")
                  }
                  onBlur={() =>
                    setFocusedField(null)
                  }
                  placeholder="••••••••"
                  className="w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl bg-slate-50/50 text-sm transition-all duration-200 focus:outline-none focus:border-emerald-500"
                />

              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-600 text-center">
                  {error}
                </p>
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold transition-all duration-200"
            >

              <span className="flex items-center justify-center gap-2">

                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>

                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account

                    <ArrowRight
                      className="w-4 h-4"
                      strokeWidth={2.5}
                    />
                  </>
                )}

              </span>

            </button>

          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200">

            <p className="text-center text-sm text-slate-600">

              Already have an account?{" "}

              <Link
                to="/login"
                className="text-emerald-600 font-semibold hover:text-emerald-700"
              >
                Sign in
              </Link>

            </p>

          </div>

        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          By continuing, you agree to our Terms & Privacy Policy.
        </p>

      </div>
    </div>
  );
};

export default RegisterPage;