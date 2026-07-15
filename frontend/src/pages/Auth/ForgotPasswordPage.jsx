import React, { useState } from "react";
import { Link } from "react-router-dom";
import { BrainCircuit, Mail, ArrowRight, ArrowLeft } from "lucide-react";
import authService from "../../services/authService";
import toast from "react-hot-toast";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
      toast.success("If registered, a reset link was sent!");
    } catch (err) {
      toast.error(err.error || err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-linear-to-br from-emerald-50/20 via-slate-50 to-teal-50/10 overflow-hidden py-12">
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 pointer-events-none"></div>

      <div className="relative w-full max-w-md px-6">
        <div className="bg-white/85 backdrop-blur-xl border border-slate-200/70 rounded-[32px] shadow-2xl p-8 sm:p-10 transition-all duration-300">
          
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-15 h-15 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-500/10 mb-4 animate-pulse">
              <BrainCircuit className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              Forgot Password
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-medium leading-relaxed">
              {!submitted 
                ? "Enter your email address and we'll send you a secure password reset link."
                : "Reset link dispatched successfully!"}
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Email Address</label>
                <div
                  className={`relative rounded-xl border-2 transition-all duration-200 bg-slate-50/30 flex items-center ${
                    focusedField === "email"
                      ? "border-emerald-500 bg-white"
                      : "border-slate-200/70 hover:border-slate-300/70"
                  }`}
                >
                  <div className={`pl-4 ${focusedField === "email" ? "text-emerald-500" : "text-slate-400"}`}>
                    <Mail className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="name@domain.com"
                    className="w-full h-12 pl-3 pr-4 bg-transparent outline-none text-sm font-semibold text-slate-850 placeholder-slate-400"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full h-12 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl transition-all duration-200 shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden cursor-pointer"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending Link...
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                    </>
                  )}
                </span>
              </button>
            </form>
          ) : (
            <div className="space-y-6 text-center animate-in fade-in duration-300">
              <div className="bg-emerald-50/50 border border-emerald-100/80 p-5 rounded-2xl space-y-1.5">
                <h3 className="text-lg font-black text-emerald-950">Reset link sent!</h3>
                <p className="text-sm font-semibold text-emerald-800 leading-relaxed">
                  We've sent a password reset link to your email. Please check your inbox.
                </p>
              </div>

              <button
                onClick={() => setSubmitted(false)}
                className="text-xs font-bold text-slate-450 hover:text-slate-600 underline cursor-pointer"
              >
                Try a different email address
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-200/80">
            <p className="text-center text-sm text-slate-500 font-semibold">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors ml-1"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
