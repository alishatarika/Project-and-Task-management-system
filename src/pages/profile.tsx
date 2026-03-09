import React, { useState, useRef } from "react";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// ─── Read saved user from auth storage (same place saveAuth() writes to) ─────
function getStoredUser(): Record<string, any> | null {
  try {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getStoredToken(): string | null {
  return localStorage.getItem("token") || sessionStorage.getItem("token") || null;
}

// ─── Validation schemas — same rules as your other pages ─────────────────────
const profileSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z_]+$/, "Username can only contain letters and underscores"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z
      .string()
      .min(1, "New password is required")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/,
        "Password needs: uppercase, lowercase, number, special char (!@#$%^&*), min 8 chars"
      ),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type ProfileForm  = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type Tab          = "overview" | "edit" | "security";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
const ProfilePage: React.FC = () => {
  const navigate    = useNavigate();
  const storedUser  = getStoredUser();

  const [activeTab, setActiveTab] = useState<Tab>("overview");

  React.useEffect(() => {
    if (!storedUser) navigate("/login", { replace: true });
  }, []);

  if (!storedUser) return null;
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    storedUser?.avatar || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Edit profile ──────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    username: storedUser?.username || "",
    email:    storedUser?.email    || "",
  });
  const [displayName, setDisplayName]     = useState(storedUser?.username || "");
  const [profileErrors, setProfileErrors] = useState<Partial<ProfileForm>>({});
  const [profileTouched, setProfileTouched] = useState<Partial<Record<keyof ProfileForm, boolean>>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const validateProfileField = (field: keyof ProfileForm, val: string): string => {
    const r = profileSchema.pick({ [field]: true } as any).safeParse({ [field]: val });
    return r.success ? "" : (r as any).error?.issues?.[0]?.message ?? "";
  };

  const handleProfileChange = (field: keyof ProfileForm, val: string) => {
    setProfileForm((p) => ({ ...p, [field]: val }));
    if (profileTouched[field])
      setProfileErrors((p) => ({ ...p, [field]: validateProfileField(field, val) }));
  };

  const handleProfileBlur = (field: keyof ProfileForm) => {
    setProfileTouched((p) => ({ ...p, [field]: true }));
    setProfileErrors((p) => ({ ...p, [field]: validateProfileField(field, profileForm[field]) }));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileTouched({ username: true, email: true });

    const errs: Partial<ProfileForm> = {};
    (["username", "email"] as (keyof ProfileForm)[]).forEach((f) => {
      const err = validateProfileField(f, profileForm[f]);
      if (err) errs[f] = err;
    });
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }

    setIsSavingProfile(true);
    const updated = { ...storedUser, ...profileForm };
    const storage = localStorage.getItem("user") ? localStorage : sessionStorage;
    storage.setItem("user", JSON.stringify(updated));
    setDisplayName(profileForm.username);

    setTimeout(() => {
      setIsSavingProfile(false);
      toast.success("Profile updated!");
    }, 400);
  };

  // ── Change password ───────────────────────────────────────────────────────
  const [pwForm, setPwForm]       = useState<PasswordForm>({ current_password: "", new_password: "", confirm_password: "" });
  const [pwErrors, setPwErrors]   = useState<Partial<PasswordForm>>({});
  const [pwTouched, setPwTouched] = useState<Partial<Record<keyof PasswordForm, boolean>>>({});
  const [showPw, setShowPw]       = useState({ current: false, new: false, confirm: false });

  const validatePwField = (field: keyof PasswordForm, val: string): string => {
    const merged = { ...pwForm, [field]: val };
    const r = passwordSchema.safeParse(merged);
    if (r.success) return "";
    const issue = (r as any).error.issues.find((i: any) => i.path.includes(field));
    return issue?.message ?? "";
  };

  const handlePwChange = (field: keyof PasswordForm, val: string) => {
    setPwForm((p) => ({ ...p, [field]: val }));
    if (pwTouched[field]) setPwErrors((p) => ({ ...p, [field]: validatePwField(field, val) }));
  };

  const handlePwBlur = (field: keyof PasswordForm) => {
    setPwTouched((p) => ({ ...p, [field]: true }));
    setPwErrors((p) => ({ ...p, [field]: validatePwField(field, pwForm[field]) }));
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwTouched({ current_password: true, new_password: true, confirm_password: true });

    const r = passwordSchema.safeParse(pwForm);
    if (!r.success) {
      const errs: Partial<PasswordForm> = {};
      r.error.issues.forEach((i: any) => { errs[i.path[0] as keyof PasswordForm] = i.message; });
      setPwErrors(errs);
      return;
    }
    // TODO: wire to PUT /auth/change-password when ready
    toast("Password change API not connected yet.", { icon: "⚠️" });
  };

  // ── Avatar — stored as base64 in localStorage ─────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatarPreview(dataUrl);
      const updated = { ...storedUser, avatar: dataUrl };
      const storage = localStorage.getItem("user") ? localStorage : sessionStorage;
      storage.setItem("user", JSON.stringify(updated));
      toast.success("Avatar updated!");
    };
    reader.readAsDataURL(file);
  };

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "overview", label: "Overview",     icon: "👤" },
    { key: "edit",     label: "Edit Profile", icon: "✏️" },
    { key: "security", label: "Security",     icon: "🔒" },
  ];

  const PW_FIELDS = [
    { field: "current_password" as const, label: "Current Password",   key: "current" as const },
    { field: "new_password"     as const, label: "New Password",       key: "new"     as const },
    { field: "confirm_password" as const, label: "Confirm New Password", key: "confirm" as const },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Banner */}
      <div
        className="h-40 w-full relative"
        style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #0ea5e9 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,.3) 20px, rgba(255,255,255,.3) 21px)",
          }}
        />
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-16 pb-16">
        {/* Identity card */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 flex flex-col sm:flex-row items-center sm:items-end gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center text-white text-3xl font-bold shadow-lg cursor-pointer border-4 border-white"
              style={{ background: "linear-gradient(135deg, #1e3a5f, #2563eb)" }}
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                : getInitials(displayName)
              }
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs flex items-center justify-center shadow-md transition"
            >
              ✏
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Name & meta */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap justify-center sm:justify-start">
              <h1 className="text-2xl font-bold text-gray-800">{displayName}</h1>
              {storedUser.is_verified && (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-green-200">
                  ✓ Verified
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-1">{profileForm.email}</p>
            <p className="text-gray-400 text-xs mt-1">Member since {formatDate(storedUser.created_at)}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`w-2.5 h-2.5 rounded-full ${storedUser.status ? "bg-green-400" : "bg-gray-300"}`} />
            <span className="text-sm text-gray-500">{storedUser.status ? "Active" : "Inactive"}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                  activeTab === t.key
                    ? "border-blue-500 text-blue-600 bg-blue-50/50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* ── OVERVIEW ── */}
            {activeTab === "overview" && (
              <div className="space-y-5">
                <h2 className="text-base font-semibold text-gray-700">Account Details</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { label: "User ID",        value: storedUser.id ? `#${storedUser.id}` : "—" },
                    { label: "Username",       value: displayName },
                    { label: "Email",          value: profileForm.email },
                    { label: "Email Verified", value: storedUser.is_verified ? "✓ Yes" : "✗ No" },
                    { label: "Account Status", value: storedUser.status ? "Active" : "Inactive" },
                    { label: "Member Since",   value: formatDate(storedUser.created_at) },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
                      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{item.label}</span>
                      <span className="text-sm font-semibold text-gray-800">{item.value}</span>
                    </div>
                  ))}
                </div>

                {!storedUser.is_verified && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-amber-500 text-lg">⚠️</span>
                    <div>
                      <p className="text-sm font-semibold text-amber-700">Email not verified</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        Check your inbox and verify your email to unlock all features.
                      </p>
                    </div>
                  </div>
                )}

                {getStoredToken() && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Session Token</p>
                    <p className="text-xs text-gray-400 font-mono break-all">
                      {getStoredToken()!.slice(0, 40)}…
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── EDIT PROFILE ── */}
            {activeTab === "edit" && (
              <form onSubmit={handleSaveProfile} className="space-y-5 max-w-md" noValidate>
                <h2 className="text-base font-semibold text-gray-700">Edit Profile</h2>

                {(["username", "email"] as (keyof ProfileForm)[]).map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                      {field === "email" ? "Email Address" : "Username"}
                    </label>
                    <input
                      type="text"
                      value={profileForm[field]}
                      onChange={(e) => handleProfileChange(field, e.target.value)}
                      onBlur={() => handleProfileBlur(field)}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm ${
                        profileErrors[field]
                          ? "border-red-400 focus:ring-red-300"
                          : "focus:ring-blue-400 border-gray-200"
                      }`}
                    />
                    {profileErrors[field] && (
                      <p className="text-red-500 text-xs mt-1">{profileErrors[field]}</p>
                    )}
                  </div>
                ))}

                <p className="text-xs text-gray-400">
                  Changes are saved to your local session.{" "}
                  Connect a <code className="bg-gray-100 px-1 rounded">PUT /user/update-profile</code> endpoint to persist them server-side.
                </p>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-60"
                >
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </button>
              </form>
            )}

            {/* ── SECURITY ── */}
            {activeTab === "security" && (
              <form onSubmit={handleChangePassword} className="space-y-5 max-w-md" noValidate>
                <h2 className="text-base font-semibold text-gray-700">Change Password</h2>

                {PW_FIELDS.map(({ field, label, key }) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <div className="flex">
                      <input
                        type={showPw[key] ? "text" : "password"}
                        value={pwForm[field]}
                        onChange={(e) => handlePwChange(field, e.target.value)}
                        onBlur={() => handlePwBlur(field)}
                        className={`w-full px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 text-sm ${
                          pwErrors[field]
                            ? "border-red-400 focus:ring-red-300"
                            : "focus:ring-blue-400 border-gray-200"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((p) => ({ ...p, [key]: !p[key] }))}
                        className="px-3 border border-l-0 rounded-r-lg bg-gray-100 text-xs text-gray-600"
                      >
                        {showPw[key] ? "Hide" : "Show"}
                      </button>
                    </div>
                    {pwErrors[field] && (
                      <p className="text-red-500 text-xs mt-1">{pwErrors[field]}</p>
                    )}
                  </div>
                ))}

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
                  Password must be at least 8 characters with uppercase, lowercase, number, and special character (!@#$%^&*).
                </div>

                <p className="text-xs text-gray-400">
                  Wire to <code className="bg-gray-100 px-1 rounded">PUT /auth/change-password</code> when the endpoint is ready.
                </p>

                <button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition"
                >
                  Change Password
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;