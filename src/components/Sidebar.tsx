import { LayoutDashboard, Users, Car, ParkingSquare, CalendarClock, ShieldAlert, LogOut, CircleUser, BookOpen } from "lucide-react";

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: "ADMIN" | "AGENT" | "USER";
  };
  onLogout: () => void;
}

export default function Sidebar({ currentTab, setTab, user, onLogout }: SidebarProps) {
  const getRoleColor = (role: string) => {
    if (role === "ADMIN") return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    if (role === "AGENT") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "AGENT", "USER"] },
    { id: "reservations", label: "Reservations", icon: CalendarClock, roles: ["ADMIN", "USER"] },
    { id: "vehicles", label: "My Vehicles", icon: Car, roles: ["ADMIN", "USER"] },
    { id: "slots", label: "Parking Slots", icon: ParkingSquare, roles: ["ADMIN", "AGENT"] },
    { id: "users", label: "User Accounts", icon: Users, roles: ["ADMIN"] },
    { id: "anomalies", label: "Anomalies Logs", icon: ShieldAlert, roles: ["ADMIN", "AGENT"] },
  ];

  return (
    <aside className="w-64 bg-slate-900 flex flex-col justify-between h-screen sticky top-0 border-r border-slate-800 shrink-0" id="sidebar-container">
      {/* Upper Brand Info */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center text-white font-bold font-display">
              P
            </div>
            <div>
              <h1 className="text-white font-semibold tracking-tight text-sm font-display">SmartCampus</h1>
              <span className="block text-[9px] text-slate-500 font-bold tracking-widest uppercase">Parking Hub</span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 py-6 space-y-1 px-3">
          <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Main Management
          </div>

          {navItems
            .filter((item) => item.roles.includes(user.role))
            .map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white border-r-4 border-indigo-500"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                  id={`nav-item-${item.id}`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}

          <div className="pt-4 mt-4 border-t border-slate-800/40">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              API Documentation
            </div>
            <a
              href="/swagger-ui.html"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg text-emerald-400 hover:bg-slate-800 hover:text-white transition-colors border border-emerald-500/20 bg-emerald-500/5"
              id="nav-item-swagger"
            >
              <BookOpen className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
              <span className="truncate">Interactive Swagger UI</span>
            </a>
          </div>
        </nav>
      </div>

      {/* User Card & Logout at Bottom */}
      <div className="bg-slate-950 p-4 border-t border-slate-800/60">
        {/* User Card info */}
        <div className="flex items-center gap-3 mb-4 p-2.5 bg-slate-900/40 rounded-xl border border-slate-800/30">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 font-display">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs text-white font-medium truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[10px] text-slate-500 truncate mb-1">{user.email}</p>
            <span className={`inline-block px-1.5 py-0.5 text-[8px] font-bold border rounded-full uppercase tracking-wider ${getRoleColor(user.role)}`}>
              {user.role}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => setTab("profile")}
            className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              currentTab === "profile" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
            id="nav-item-profile"
          >
            <CircleUser className="h-4.5 w-4.5 text-slate-500" />
            <span className="truncate">My Profile</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
            id="nav-item-logout"
          >
            <LogOut className="h-4.5 w-4.5 text-rose-400" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
