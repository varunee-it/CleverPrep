import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { BrainCircuit, Lock, ArrowRight } from "lucide-react";
import authService from "../../services/authService";
import toast from "react-hot-toast";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  // Password Validation flags
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password && password === confirmPassword;
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasDigit && hasSpecial;

  const getPasswordStrength = () => {
    let score = 0;
    if (hasMinLength) score++;
    if (hasUpperCase) score++;
    if (hasLowerCase) score++;
    if (hasDigit) score++;
    if (hasSpecial) score++;
    return score;
  };

  const getPasswordStrengthLabel = () => {
    const score = getPasswordStrength();
    if (score <= 1) return { label: "Weak", color: "bg-rose-500", text: "text-rose-500" };
    if (score <= 3) return { label: "Medium", color: "bg-amber-500", text: "text-amber-500" };
    if (score === 4) return { label: "Strong", color: "bg-emerald-400", text: "text-emerald-400" };
    return { label: "Very Strong", color: "bg-emerald-600", text: "text-emerald-600" };
  };

  const getUnmetRequirements = () => {
    const reqs = [];
    if (!hasMinLength) reqs.push("8+ characters");
    if (!hasUpperCase) reqs.push("Uppercase letter");
    if (!hasLowerCase) reqs.push("Lowercase letter");
    if (!hasDigit) reqs.push("Number");
    if (!hasSpecial) reqs.push("Special character");
    return reqs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError("Password does not meet the complexity requirements.");
      toast.error("Please satisfy all password complexity checks.");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      toast.error("Passwords must match.");
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      toast.success("Password reset successful! Please log in.");
      navigate("/login");
    } catch (err) {
      const errorMsg = err.error || err.message || "Failed to reset password.";
      setError(errorMsg);
      toast.error(errorMsg);
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
              Reset Password
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">
              Please enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">New Password</label>
              <div
                className={`relative rounded-xl border-2 transition-all duration-200 bg-slate-50/30 flex items-center ${
                  focusedField === "password"
                    ? "border-emerald-500 bg-white"
                    : "border-slate-200/70 hover:border-slate-300/70"
                }`}
              >
                <div className={`pl-4 ${focusedField === "password" ? "text-emerald-500" : "text-slate-400"}`}>
                  <Lock className="h-5 w-5" strokeWidth={2} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className="w-full h-12 pl-3 pr-4 bg-transparent outline-none text-sm font-semibold text-slate-855 placeholder-slate-400"
                  required
                />
              </div>

              {password && (
                <div className="space-y-1.5 mt-2 animate-in fade-in duration-200 pl-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Strength</span>
                    <span className={`text-[10px] font-black uppercase tracking-wider ${getPasswordStrengthLabel().text}`}>
                      {getPasswordStrengthLabel().label}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                    <div className={`h-full flex-1 transition-all duration-300 ${getPasswordStrength() >= 1 ? getPasswordStrengthLabel().color : "bg-slate-200"}`} />
                    <div className={`h-full flex-1 transition-all duration-300 ${getPasswordStrength() >= 3 ? getPasswordStrengthLabel().color : "bg-slate-200"}`} />
                    <div className={`h-full flex-1 transition-all duration-300 ${getPasswordStrength() >= 4 ? getPasswordStrengthLabel().color : "bg-slate-200"}`} />
                    <div className={`h-full flex-1 transition-all duration-300 ${getPasswordStrength() >= 5 ? getPasswordStrengthLabel().color : "bg-slate-200"}`} />
                  </div>

                  <div className="pt-1 select-none">
                    {getUnmetRequirements().length === 0 ? (
                      <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
                        ✓ Password is strong
                      </p>
                    ) : (
                      <div className="text-[11px] font-bold text-rose-500/95 space-y-1 animate-in fade-in">
                        <p>Password must contain:</p>
                        <ul className="list-disc list-inside pl-1 space-y-0.5 font-semibold text-slate-400">
                          {getUnmetRequirements().map((req, i) => (
                            <li key={i}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Confirm Password</label>
              <div
                className={`relative rounded-xl border-2 transition-all duration-200 bg-slate-50/30 flex items-center ${
                  focusedField === "confirm"
                    ? "border-emerald-500 bg-white"
                    : "border-slate-200/70 hover:border-slate-300/70"
                }`}
              >
                <div className={`pl-4 ${focusedField === "confirm" ? "text-emerald-500" : "text-slate-400"}`}>
                  <Lock className="h-5 w-5" strokeWidth={2} />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField("confirm")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className="w-full h-12 pl-3 pr-4 bg-transparent outline-none text-sm font-semibold text-slate-855 placeholder-slate-400"
                  required
                />
              </div>

              {confirmPassword && (
                <div className="mt-1.5 animate-in fade-in duration-200 pl-1">
                  {passwordsMatch ? (
                    <p className="text-[11px] font-bold text-emerald-600">✓ Passwords match</p>
                  ) : (
                    <p className="text-[11px] font-bold text-rose-500">✗ Passwords do not match</p>
                  )}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-2.5">
                <p className="text-xs text-rose-700 font-bold leading-normal">{error}</p>
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading || !passwordsMatch || !isPasswordValid}
              className="group relative w-full h-12 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl transition-all duration-200 shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden cursor-pointer"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Resetting...
                  </>
                ) : (
                  <>
                    Reset Password
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200/80">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors w-full"
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
