import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { saveAuth, isLoggedIn } from "../utils/auth";
import { toast } from "react-hot-toast";

const REGISTER_API = "http://localhost:8000/auth/register";
const registerBaseSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z_]+$/, "Username can only contain letters and underscores"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/,
      "Password needs: uppercase, lowercase, number, special character (!@#$%^&*), min 8 chars"
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
});

const registerSchema = registerBaseSchema.refine(
  (data) => data.password === data.confirmPassword,
  { message: "Passwords do not match", path: ["confirmPassword"] }
);

type RegisterForm = z.infer<typeof registerBaseSchema>;
type FormErrors = Partial<Record<keyof RegisterForm, string>>;

const fieldSchema = {
  username: registerBaseSchema.pick({ username: true }),
  email:    registerBaseSchema.pick({ email: true }),
  password: registerBaseSchema.pick({ password: true }),
};

function validateField<K extends keyof RegisterForm>(
  field: K,
  value: string,
  allValues?: Partial<RegisterForm>
): string {
  if (field === "confirmPassword") {
    if (!value) return "Please confirm your password";
    if (value !== allValues?.password) return "Passwords do not match";
    return "";
  }
  const schema = (fieldSchema as any)[field];
  if (!schema) return "";
  const result = schema.safeParse({ [field]: value });
  if (!result.success) {
    return result.error?.issues?.[0]?.message ?? "";
  }
  return "";
}

const Register: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterForm>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof RegisterForm, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) navigate("/", { replace: true });
  }, [navigate]);

  const handleChange = useCallback(
    (field: keyof RegisterForm, value: string) => {
      const updated = { ...form, [field]: value };
      setForm(updated);

      if (touched[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: validateField(field, value, updated),
        }));
      }

      if (field === "password" && touched.confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: validateField("confirmPassword", updated.confirmPassword, updated),
        }));
      }
    },
    [form, touched]
  );

  const handleBlur = useCallback(
    (field: keyof RegisterForm) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      setErrors((prev) => ({
        ...prev,
        [field]: validateField(field, form[field], form),
      }));
    },
    [form]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, email: true, password: true, confirmPassword: true });
    const fieldErrors: FormErrors = {};
    (["username", "email", "password", "confirmPassword"] as (keyof RegisterForm)[]).forEach((field) => {
      const err = validateField(field, form[field], form);
      if (err) fieldErrors[field] = err;
    });

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(REGISTER_API, {
        username:         form.username,
        email:            form.email,
        password:         form.password,
        confirm_password: form.confirmPassword,
      });

      const { access_token, user } = res.data;
      if (access_token && user) {
        saveAuth(access_token, user);
      }

      toast.success("Account created! Please verify your email.");
      navigate("/verify-otp", { state: { email: form.email } });

    } catch (error: any) {
      const detail = error.response?.data?.detail;

      if (Array.isArray(detail)) {
        const msg = detail.map((err: any) => `${err.loc?.[err.loc.length - 1]}: ${err.msg}`).join(" | ");
        toast.error(msg || "Validation error.");
      } else {
        toast.error(detail || "Registration failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-700">Create Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <input
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={(e) => handleChange("username", e.target.value)}
              onBlur={() => handleBlur("username")}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.username ? "border-red-400 focus:ring-red-300" : "focus:ring-blue-400"
              }`}
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username}</p>
            )}
          </div>

          <div>
            <input
              type="text"
              placeholder="Email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.email ? "border-red-400 focus:ring-red-300" : "focus:ring-blue-400"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
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
          <div>
            <div className="flex">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                onBlur={() => handleBlur("confirmPassword")}
                className={`w-full px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 ${
                  errors.confirmPassword ? "border-red-400 focus:ring-red-300" : "focus:ring-blue-400"
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
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-60"
          >
            {isSubmitting ? "Signing Up..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;