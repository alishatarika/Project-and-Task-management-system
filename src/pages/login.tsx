import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { saveAuth, isLoggedIn } from "../utils/auth";
import { toast } from "react-hot-toast";

const LOGIN_API = "http://localhost:8000/auth/login";

const loginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;
type FormErrors = Partial<Record<keyof LoginForm, string>>;

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<LoginForm>({ identifier: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof LoginForm, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) navigate("/", { replace: true });
  }, [navigate]);

  const validateField = useCallback((field: keyof LoginForm, value: string): string => {
    const result = loginSchema.pick({ [field]: true } as any).safeParse({ [field]: value });
    return result.success ? "" : result.error?.issues?.[0]?.message ?? "";
  }, []);

  const handleChange = useCallback(
    (field: keyof LoginForm, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (touched[field]) {
        setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
      }
    },
    [touched, validateField]
  );

  const handleBlur = useCallback(
    (field: keyof LoginForm) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      setErrors((prev) => ({ ...prev, [field]: validateField(field, form[field]) }));
    },
    [form, validateField]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ identifier: true, password: true });

    const fieldErrors: FormErrors = {};
    (["identifier", "password"] as (keyof LoginForm)[]).forEach((field) => {
      const err = validateField(field, form[field]);
      if (err) fieldErrors[field] = err;
    });
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(LOGIN_API, {
        identifier: form.identifier,
        password:   form.password,
        remember:   rememberMe,
      });
      const { access_token, user } = res.data;
      saveAuth(access_token, user, rememberMe);

      if (user.is_verified === false) {
        toast("Please verify your email first.", { icon: "📧" });
        navigate("/verify-otp", { state: { email: user.email } });
        return;
      }

      toast.success("Logged in successfully!");
      navigate("/");

    } catch (error: any) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail;

      if (status === 403) {
        const isNotVerified =
          typeof detail === "object"
            ? detail?.code === "USER_NOT_VERIFIED"
            : typeof detail === "string" && detail.toLowerCase().includes("verify");

        if (isNotVerified) {
          const emailToUse =
            (typeof detail === "object" ? detail?.email : null) || form.identifier;

          toast("Please verify your email first.", { icon: "📧" });
          navigate("/verify-otp", { state: { email: emailToUse } });
          return;
        }
        const msg =
          typeof detail === "object" ? detail?.message : detail || "Access denied.";
        toast.error(msg);
        return;
      }

      const msg = Array.isArray(detail)
        ? detail.map((e: any) => e.msg).join(", ")
        : typeof detail === "string"
        ? detail
        : "Login failed. Please check your credentials.";

      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-700">Login</h2>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <input
              type="text"
              placeholder="Username or Email"
              value={form.identifier}
              onChange={(e) => handleChange("identifier", e.target.value)}
              onBlur={() => handleBlur("identifier")}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.identifier ? "border-red-400 focus:ring-red-300" : "focus:ring-blue-400"
              }`}
            />
            {errors.identifier && (
              <p className="text-red-500 text-sm mt-1">{errors.identifier}</p>
            )}
          </div>

          <div>
            <div className="flex">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                onBlur={() => handleBlur("password")}
                className={`w-full px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 ${
                  errors.password ? "border-red-400 focus:ring-red-300" : "focus:ring-blue-400"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="px-3 border border-l-0 rounded-r-lg bg-gray-100 text-sm text-gray-600"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2"
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-60"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm mt-4 text-gray-600">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;