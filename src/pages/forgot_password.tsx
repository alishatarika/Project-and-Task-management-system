import React, { useState, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "react-hot-toast";

const FORGOT_API = "http://localhost:8000/auth/forgot-password";
const VERIFY_API = "http://localhost:8000/auth/verify-forgot-otp";
const RESET_API  = "http://localhost:8000/auth/reset-password";
const RESEND_API = "http://localhost:8000/auth/resend-forgot-otp";

type Step = "email" | "otp" | "reset";

const emailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

const otpSchema = z.object({
  otp: z
    .string()
    .min(1, "OTP is required")
    .regex(/^\d{4,6}$/, "OTP must be 4–6 digits"),
});

const resetBaseSchema = z.object({
  newPassword: z
    .string()
    .min(1, "Password is required")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/,
      "Password needs: uppercase, lowercase, number, special character (!@#$%^&*), min 8 chars"
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
});

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep]   = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [otp, setOtp]       = useState("");
  const [otpError, setOtpError]   = useState("");
  const [otpTouched, setOtpTouched] = useState(false);
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword]         = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetErrors, setResetErrors] = useState({ newPassword: "", confirmPassword: "" });
  const [resetTouched, setResetTouched] = useState({ newPassword: false, confirmPassword: false });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = useCallback((val: string): string => {
    const r = emailSchema.safeParse({ email: val });
    return r.success ? "" : r.error?.issues?.[0]?.message ?? "";
  }, []);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (emailTouched) setEmailError(validateEmail(val));
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;

    setIsSubmitting(true);
    try {
      await axios.post(FORGOT_API, { email });
      toast.success("OTP sent to your email.");
      setStep("otp");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      await axios.post(RESEND_API, { email });
      toast.success("OTP resent. Please check your email.");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to resend OTP.");
    }
  };

  const validateOtp = useCallback((val: string): string => {
    const r = otpSchema.safeParse({ otp: val });
    return r.success ? "" : r.error?.issues?.[0]?.message ?? "";
  }, []);

  const handleOtpChange = (val: string) => {
    const digits = val.replace(/\D/g, "");
    setOtp(digits);
    if (otpTouched) setOtpError(validateOtp(digits));
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpTouched(true);
    const err = validateOtp(otp);
    setOtpError(err);
    if (err) return;

    setIsSubmitting(true);
    try {
      await axios.post(VERIFY_API, { email, otp });
      toast.success("OTP verified! Now set your new password.");
      setStep("reset");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Invalid OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateResetField = useCallback(
    (field: "newPassword" | "confirmPassword", val: string, other?: string): string => {
      if (field === "newPassword") {
        const r = resetBaseSchema.pick({ newPassword: true }).safeParse({ newPassword: val });
        return r.success ? "" : r.error?.issues?.[0]?.message ?? "";
      }
      if (!val) return "Please confirm your password";
      if (val !== (other ?? newPassword)) return "Passwords do not match";
      return "";
    },
    [newPassword]
  );

  const handleResetChange = (field: "newPassword" | "confirmPassword", val: string) => {
    if (field === "newPassword") {
      setNewPassword(val);
      if (resetTouched.newPassword)
        setResetErrors((p) => ({ ...p, newPassword: validateResetField("newPassword", val) }));
      if (resetTouched.confirmPassword)
        setResetErrors((p) => ({ ...p, confirmPassword: validateResetField("confirmPassword", confirmPassword, val) }));
    } else {
      setConfirmPassword(val);
      if (resetTouched.confirmPassword)
        setResetErrors((p) => ({ ...p, confirmPassword: validateResetField("confirmPassword", val) }));
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetTouched({ newPassword: true, confirmPassword: true });

    const errs = {
      newPassword: validateResetField("newPassword", newPassword),
      confirmPassword: validateResetField("confirmPassword", confirmPassword),
    };
    if (errs.newPassword || errs.confirmPassword) {
      setResetErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(RESET_API, {
        email,
        new_password:     newPassword,
        confirm_password: confirmPassword,
      });
      toast.success("Password reset successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
        {step === "email" && (
          <>
            <h2 className="text-2xl font-bold text-center mb-2 text-gray-700">Forgot Password</h2>
            <p className="text-center text-sm text-gray-500 mb-6">
              Enter your email and we'll send you an OTP.
            </p>

            <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
              <div>
                <input
                  type="text"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={() => { setEmailTouched(true); setEmailError(validateEmail(email)); }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    emailError ? "border-red-400 focus:ring-red-300" : "focus:ring-blue-400"
                  }`}
                />
                {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-60"
              >
                {isSubmitting ? "Sending..." : "Send OTP"}
              </button>
            </form>

            <p className="text-center text-sm mt-4 text-gray-600">
              Remember your password?{" "}
              <Link to="/login" className="text-blue-600 hover:underline">Back to Login</Link>
            </p>
          </>
        )}

        {step === "otp" && (
          <>
            <h2 className="text-2xl font-bold text-center mb-2 text-gray-700">Enter OTP</h2>
            <p className="text-center text-sm text-gray-500 mb-6">
              OTP sent to <span className="font-medium text-gray-700">{email}</span>
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
              <div>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  maxLength={6}
                  onChange={(e) => handleOtpChange(e.target.value)}
                  onBlur={() => { setOtpTouched(true); setOtpError(validateOtp(otp)); }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 text-center tracking-widest text-lg ${
                    otpError ? "border-red-400 focus:ring-red-300" : "focus:ring-blue-400"
                  }`}
                />
                {otpError && <p className="text-red-500 text-sm mt-1">{otpError}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-60"
              >
                {isSubmitting ? "Verifying..." : "Verify OTP"}
              </button>
            </form>

            <div className="text-center mt-4">
              <button onClick={handleResend} className="text-blue-600 hover:underline text-sm">
                Resend OTP
              </button>
            </div>
            <p className="text-center text-sm mt-2 text-gray-600">
              Wrong email?{" "}
              <button
                onClick={() => { setStep("email"); setOtp(""); setOtpError(""); }}
                className="text-blue-600 hover:underline"
              >
                Change it
              </button>
            </p>
          </>
        )}

        {step === "reset" && (
          <>
            <h2 className="text-2xl font-bold text-center mb-2 text-gray-700">Reset Password</h2>
            <p className="text-center text-sm text-gray-500 mb-6">
              Set a new password for your account.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
              <div>
                <div className="flex">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => handleResetChange("newPassword", e.target.value)}
                    onBlur={() => {
                      setResetTouched((p) => ({ ...p, newPassword: true }));
                      setResetErrors((p) => ({ ...p, newPassword: validateResetField("newPassword", newPassword) }));
                    }}
                    className={`w-full px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 ${
                      resetErrors.newPassword ? "border-red-400 focus:ring-red-300" : "focus:ring-blue-400"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="px-3 border border-l-0 rounded-r-lg bg-gray-100 text-sm text-gray-600"
                  >
                    {showNewPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {resetErrors.newPassword && (
                  <p className="text-red-500 text-sm mt-1">{resetErrors.newPassword}</p>
                )}
              </div>

              <div>
                <div className="flex">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => handleResetChange("confirmPassword", e.target.value)}
                    onBlur={() => {
                      setResetTouched((p) => ({ ...p, confirmPassword: true }));
                      setResetErrors((p) => ({ ...p, confirmPassword: validateResetField("confirmPassword", confirmPassword) }));
                    }}
                    className={`w-full px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 ${
                      resetErrors.confirmPassword ? "border-red-400 focus:ring-red-300" : "focus:ring-blue-400"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="px-3 border border-l-0 rounded-r-lg bg-gray-100 text-sm text-gray-600"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {resetErrors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{resetErrors.confirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-60"
              >
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;