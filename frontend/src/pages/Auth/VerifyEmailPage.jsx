import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { BrainCircuit, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import authService from "../../services/authService";
import toast from "react-hot-toast";

const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useParams();
  const { login: performLogin } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const emailAddress = location.state?.email || searchParams.get("email") || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(null);

  // Auto-verify legacy URL verification token if present
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await authService.verifyEmail(token);
        if (response.user && response.token) {
          performLogin(response.user, response.token);
        }
        toast.success(response.message || "Email verified successfully!");
        navigate("/dashboard");
      } catch (err) {
        toast.error(err.error || err.message || "Link verification failed.");
      }
    };
    if (token) {
      verifyToken();
    }
  }, [token, navigate, performLogin]);

  // Focus first input on mount
  useEffect(() => {
    if (!token) {
      document.getElementById("otp-input-0")?.focus();
    }
  }, [token]);

  // Countdown timer logic
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (element, index) => {
    const val = element.value;
    if (isNaN(val)) return;

    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto focus next field
    if (val && index < 5) {
      document.getElementById(`otp-input-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        document.getElementById(`otp-input-${index - 1}`)?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (pasteData.length === 6 && /^\d+$/.test(pasteData)) {
      setOtp(pasteData.split(""));
      document.getElementById("otp-input-5")?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setTimer(60);
    setCanResend(false);
    setError("");
    try {
      await authService.resendVerification(emailAddress);
      toast.success("Verification code resent successfully!");
      setOtp(["", "", "", "", "", ""]);
      document.getElementById("otp-input-0")?.focus();
    } catch (err) {
      const errorMsg = err.error || err.message || "Failed to resend code.";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      toast.error("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifyOtp(emailAddress, otpCode);
      performLogin(response.user, response.token);
      toast.success("Welcome to CleverPrep!");
      navigate("/dashboard");
    } catch (err) {
      const errorMsg = err.error || err.message || "Failed to verify code.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (token) {
    return (
      <div className="relative flex items-center justify-center min-h-screen bg-linear-to-br from-emerald-50/20 via-slate-50 to-teal-50/10 overflow-hidden py-12">
        <div className="bg-white/85 backdrop-blur-xl border border-slate-200/70 rounded-[32px] shadow-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 font-semibold text-sm">Verifying your email address...</p>
        </div>
      </div>
    );
  }

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
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-15 h-15 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-500/10 mb-4 animate-pulse">
              <BrainCircuit className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              Verify your email
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-medium leading-relaxed">
              We've sent a 6-digit verification code to:
            </p>
            {emailAddress && (
              <p className="text-emerald-600 font-bold text-sm mt-0.5 break-all select-all">
                {emailAddress}
              </p>
            )}
            <p className="text-slate-400 text-xs mt-1.5 font-semibold">
              Enter the code below to complete your registration.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Boxes */}
            <div className="flex justify-between gap-2 max-w-xs mx-auto py-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(null)}
                  className={`w-12 h-12 text-center text-xl font-extrabold border-2 rounded-xl transition-all duration-200 bg-slate-50/30 text-slate-900 focus:outline-none ${
                    focusedIndex === index 
                      ? "border-emerald-500 bg-white ring-2 ring-emerald-500/10 shadow-sm" 
                      : "border-slate-200/80 hover:border-slate-300/80"
                  }`}
                  id={`otp-input-${index}`}
                />
              ))}
            </div>

            {/* Resend link & timer */}
            <div className="flex items-center justify-center gap-2 text-xs font-semibold select-none">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors cursor-pointer"
                >
                  Resend Code
                </button>
              ) : (
                <span className="text-slate-400">
                  Resend available in {timer} seconds.
                </span>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-2.5">
                <p className="text-xs text-rose-700 font-bold leading-normal text-center w-full">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otp.join("").length < 6}
              className="group relative w-full h-12 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl transition-all duration-200 shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden cursor-pointer"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Footer Back actions */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200/80">
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              ← Back
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Sign In
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
