import React, { useState } from "react";
import { LogIn, UserPlus, Key, Mail, Phone, User as UserIcon, ShieldAlert } from "lucide-react";

interface LoginRegisterProps {
  onLoginSuccess: (token: string, user: any) => void;
  setError: (msg: string) => void;
  setSuccess: (msg: string) => void;
}

export default function LoginRegister({ onLoginSuccess, setError, setSuccess }: LoginRegisterProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"USER" | "AGENT" | "ADMIN">("USER");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      setSuccess(`Welcome back, ${data.user.firstName}!`);
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName || !phone) {
      setError("All fields are required for registration.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password, phone, role }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      setSuccess("Account created successfully! Please log in.");
      setIsRegistering(false);
      // Auto-populate email for login convenience
      setPassword("");
    } catch (err: any) {
      setError(err.message || "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to quick login as a seed user
  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    // Submit login quickly via fake event or calling endpoint directly
    setLoading(true);
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: demoEmail, password: demoPass }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message);
        setSuccess(`Demo Sign-In Success: ${data.user.firstName} is logged in!`);
        onLoginSuccess(data.token, data.user);
      })
      .catch((err) => setError(err.message || "Quick login failed"))
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-indigo-500 flex items-center justify-center text-white mb-4">
            <ShieldAlert className="h-6 w-6" id="logo-icon" />
          </div>
          <h2 className="text-3xl font-bold font-display tracking-tight text-slate-900" id="login-title">
            SmartPark Campus
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {isRegistering
              ? "Create a campus parking portal account"
              : "Sign in to reserve slots and manage vehicle entries"}
          </p>
        </div>

        {isRegistering ? (
          // Register Form
          <form className="mt-8 space-y-4" onSubmit={handleRegister} id="register-form">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">First Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <UserIcon className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@campus.edu"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Key className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Select System Role</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {(["USER", "AGENT", "ADMIN"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                      role === r
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-slate-400 italic">
                {role === "ADMIN" && "Admin: Full statistics dashboard, manages all users, slots, and vehicles."}
                {role === "AGENT" && "Agent: Security officer validations, real-time plate checking, and logs."}
                {role === "USER" && "User: Personal profile, manages vehicles, checks availability & books parking slots."}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer"
              id="submit-register"
            >
              <UserPlus className="h-4 w-4" />
              {loading ? "Registering..." : "Create Account"}
            </button>

            <p className="text-center text-xs text-slate-500 mt-4">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setIsRegistering(false)}
                className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                id="switch-to-login"
              >
                Sign In
              </button>
            </p>
          </form>
        ) : (
          // Login Form
          <form className="mt-8 space-y-4" onSubmit={handleLogin} id="login-form">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@campus.edu"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Key className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer"
              id="submit-login"
            >
              <LogIn className="h-4 w-4" />
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="text-center text-xs text-slate-500 mt-4">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setIsRegistering(true)}
                className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                id="switch-to-register"
              >
                Create Account
              </button>
            </p>

            {/* Quick Demo Logins Container */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <span className="block text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Quick Demo Accounts (Pre-Seeded)
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <button
                  type="button"
                  onClick={() => handleQuickLogin("admin@campus.edu", "admin123")}
                  className="px-2 py-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-indigo-700 transition-all shadow-2xs cursor-pointer"
                >
                  <span className="block text-indigo-600 font-bold mb-0.5">ADMIN</span>
                  Sarah (Admin)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("agent1@campus.edu", "agent123")}
                  className="px-2 py-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-emerald-700 transition-all shadow-2xs cursor-pointer"
                >
                  <span className="block text-emerald-600 font-bold mb-0.5">AGENT</span>
                  Davis (Officer)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("user1@campus.edu", "user123")}
                  className="px-2 py-2.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-amber-700 transition-all shadow-2xs cursor-pointer"
                >
                  <span className="block text-amber-600 font-bold mb-0.5">USER</span>
                  Alex (Student)
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
