import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { saveAuth, isLoggedIn } from "../utils/auth";
import { toast } from "react-hot-toast";

const VERIFY_API = "http://localhost:8000/auth/verify-otp";
const RESEND_API = "http://localhost:8000/auth/resend-otp";

const otpSchema = z.object({
  otp: z
    .string()
    .min(1, "OTP is required")
    .regex(/^\d{4,6}$/, "OTP must be 4–6 digits"),
});

const VerifyOTP: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const identifier: string = location.state?.email || "";

  const [otp, setOtp]             = useState("");
  const [otpError, setOtpError]   = useState("");
  const [touched, setTouched]     = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoggedIn())   { navigate("/", { replace: true }); return; }
    if (!identifier)    { navigate("/login", { replace: true }); }
  }, [identifier, navigate]);

  const validateOtp = useCallback((val: string): string => {
    const r = otpSchema.safeParse({ otp: val });
    return r.success ? "" : r.error?.issues?.[0]?.message ?? "";
  }, []);

  const handleChange = (val: string) => {
    const digits = val.replace(/\D/g, "");
    setOtp(digits);
    if (touched) setOtpError(validateOtp(digits));
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const err = validateOtp(otp);
    setOtpError(err);
    if (err) return;

    setIsSubmitting(true);
    try {
      const res = await axios.post(VERIFY_API, { email: identifier, otp });

      const { access_token, user } = res.data;
      saveAuth(access_token, user);

      toast.success("Email verified! Redirecting...");
      setTimeout(() => navigate("/"), 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Invalid OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      await axios.post(RESEND_API, { email: identifier });
      toast.success("OTP resent. Please check your email.");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to resend OTP.");
    }
  };
  const displayLabel = identifier.includes("@")
    ? identifier
    : `the email linked to "${identifier}"`;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-700">Verify OTP</h2>
        <p className="text-center text-sm text-gray-500 mb-6">
          An OTP was sent to{" "}
          <span className="font-medium text-gray-700">{displayLabel}</span>
        </p>

        <form onSubmit={handleVerify} className="space-y-4" noValidate>
          <div>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              maxLength={6}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={() => { setTouched(true); setOtpError(validateOtp(otp)); }}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 text-center tracking-widest text-lg ${
                otpError ? "border-red-400 focus:ring-red-300" : "focus:ring-blue-400"
              }`}
            />
            {otpError && (
              <p className="text-red-500 text-sm mt-1">{otpError}</p>
            )}
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
          <button
            onClick={handleResend}
            className="text-blue-600 hover:underline text-sm"
          >
            Resend OTP
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;