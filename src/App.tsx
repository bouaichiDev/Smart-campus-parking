import React, { useState, useEffect } from "react";
import LoginRegister from "./components/LoginRegister";
import Sidebar from "./components/Sidebar";
import AdminDashboard from "./components/AdminDashboard";
import AgentDashboard from "./components/AgentDashboard";
import UserDashboard from "./components/UserDashboard";
import AdminModules from "./components/AdminModules";
import { AlertCircle, CheckCircle2, ShieldAlert, X } from "lucide-react";

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [currentTab, setTab] = useState("dashboard");

  // Notifications state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto load token from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("parking_token");
    const savedUser = localStorage.getItem("parking_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLoginSuccess = (userToken: string, userData: any) => {
    setToken(userToken);
    setUser(userData);
    localStorage.setItem("parking_token", userToken);
    localStorage.setItem("parking_user", JSON.stringify(userData));

    // Default tabs depending on role
    if (userData.role === "AGENT") {
      setTab("dashboard");
    } else {
      setTab("dashboard");
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("parking_token");
    localStorage.removeItem("parking_user");
    setTab("dashboard");
    setSuccessMsg("Logged out successfully.");
  };

  // Toast auto dismiss helpers
  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => {
      setErrorMsg((prev) => (prev === msg ? null : prev));
    }, 6000);
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="app-viewport">
      {/* Toast Alert Notifications */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md space-y-2 px-4" id="toasts-wrapper">
        {errorMsg && (
          <div className="bg-red-600 text-white px-4 py-3.5 rounded-xl shadow-lg flex items-center justify-between border border-red-500 animate-bounce" id="toast-error">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="text-xs font-semibold">{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="p-1 hover:bg-white/15 rounded-lg">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between border border-slate-800 animate-fade-in" id="toast-success">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
              <span className="text-xs font-medium">{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="p-1 hover:bg-white/15 rounded-lg">
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        )}
      </div>

      {!token ? (
        // Render Login and Sign up portal
        <div className="flex-1 flex flex-col justify-center py-10">
          <LoginRegister
            onLoginSuccess={handleLoginSuccess}
            setError={triggerError}
            setSuccess={triggerSuccess}
          />
        </div>
      ) : (
        // Full Dashboard Layout with Sidebar Navigation
        <div className="flex flex-1" id="main-portal-container">
          <Sidebar currentTab={currentTab} setTab={setTab} user={user} onLogout={handleLogout} />

          {/* Core Screen content area */}
          <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full" id="core-content-area">
            {/* Dashboard Tab Router */}
            {currentTab === "dashboard" && (
              <>
                {user.role === "ADMIN" && (
                  <AdminDashboard token={token} setError={triggerError} setSuccess={triggerSuccess} />
                )}
                {user.role === "AGENT" && (
                  <AgentDashboard token={token} setError={triggerError} setSuccess={triggerSuccess} />
                )}
                {user.role === "USER" && (
                  <UserDashboard token={token} user={user} setError={triggerError} setSuccess={triggerSuccess} />
                )}
              </>
            )}

            {currentTab === "reservations" && (user.role === "USER" || user.role === "ADMIN") && (
              <UserDashboard token={token} user={user} setError={triggerError} setSuccess={triggerSuccess} />
            )}

            {currentTab === "vehicles" && (user.role === "USER" || user.role === "ADMIN") && (
              <UserDashboard token={token} user={user} setError={triggerError} setSuccess={triggerSuccess} />
            )}

            {(currentTab === "slots" || currentTab === "users" || currentTab === "profile") && (
              <AdminModules
                token={token}
                activeModule={currentTab as any}
                currentUser={user}
                setCurrentUser={setUser}
                setError={triggerError}
                setSuccess={triggerSuccess}
              />
            )}

            {currentTab === "anomalies" && (user.role === "ADMIN" || user.role === "AGENT") && (
              <AgentDashboard token={token} setError={triggerError} setSuccess={triggerSuccess} />
            )}
          </main>
        </div>
      )}
    </div>
  );
}
