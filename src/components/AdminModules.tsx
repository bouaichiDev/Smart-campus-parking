import React, { useState, useEffect } from "react";
import { Users, ParkingSquare, Plus, Trash2, ShieldCheck, Mail, Phone, MapPin, BadgeCheck, Save } from "lucide-react";
import { User, ParkingSlot } from "../types";

interface AdminModulesProps {
  token: string;
  activeModule: "users" | "slots" | "profile";
  currentUser: any;
  setCurrentUser: (user: any) => void;
  setError: (msg: string) => void;
  setSuccess: (msg: string) => void;
}

export default function AdminModules({
  token,
  activeModule,
  currentUser,
  setCurrentUser,
  setError,
  setSuccess,
}: AdminModulesProps) {
  // Shared data states
  const [usersList, setUsersList] = useState<User[]>([]);
  const [slotsList, setSlotsList] = useState<ParkingSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Forms states - User
  const [uFirst, setUFirst] = useState("");
  const [uLast, setULast] = useState("");
  const [uEmail, setUEmail] = useState("");
  const [uPhone, setUPhone] = useState("");
  const [uRole, setURole] = useState<"ADMIN" | "AGENT" | "USER">("USER");
  const [uPassword, setUPassword] = useState("");

  // Forms states - Slot
  const [sNumber, setSNumber] = useState("");
  const [sZone, setSZone] = useState("Zone A");
  const [sType, setSType] = useState<"STANDARD" | "COMPACT" | "EV" | "HANDICAPPED">("STANDARD");
  const [sStatus, setSStatus] = useState<"AVAILABLE" | "OCCUPIED" | "MAINTENANCE">("AVAILABLE");

  // Profile forms
  const [profPhone, setProfPhone] = useState(currentUser?.phone || "");
  const [profFirst, setProfFirst] = useState(currentUser?.firstName || "");
  const [profLast, setProfLast] = useState(currentUser?.lastName || "");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/slots", { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setSlotsList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeModule === "users" && currentUser.role === "ADMIN") {
      loadUsers();
    } else if (activeModule === "slots") {
      loadSlots();
    }
  }, [activeModule, token]);

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uFirst || !uLast || !uEmail || !uPhone || !uPassword) {
      setError("Please fill in all user account fields.");
      return;
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: uFirst,
          lastName: uLast,
          email: uEmail,
          phone: uPhone,
          role: uRole,
          password: uPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create user.");

      setSuccess(`Account for ${data.firstName} created successfully!`);
      // Reset
      setUFirst("");
      setULast("");
      setUEmail("");
      setUPhone("");
      setUPassword("");
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Error creating user account.");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === currentUser.id) {
      setError("You cannot delete your own administrative session.");
      return;
    }
    if (!confirm("Are you sure you want to permanently delete this user account?")) return;

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Deletion failed.");
      setSuccess("User account deleted successfully.");
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Error deleting user.");
    }
  };

  // Handle Create Slot
  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sNumber || !sZone) {
      setError("Please complete slot number and zone attributes.");
      return;
    }

    try {
      const response = await fetch("/api/slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slotNumber: sNumber,
          zone: sZone,
          slotType: sType,
          status: sStatus,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Slot creation failed.");

      setSuccess(`Parking Space ${data.slotNumber} created in ${data.zone}.`);
      setSNumber("");
      loadSlots();
    } catch (err: any) {
      setError(err.message || "Error adding parking slot.");
    }
  };

  const handleUpdateSlotStatus = async (id: string, newStatus: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE") => {
    try {
      const response = await fetch(`/api/slots/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Status update failed.");
      setSuccess("Slot status updated.");
      loadSlots();
    } catch (err: any) {
      setError(err.message || "Error updating slot status.");
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm("Delete this parking slot permanently from systems?")) return;

    try {
      const response = await fetch(`/api/slots/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Deletion failed.");
      setSuccess("Parking slot removed successfully.");
      loadSlots();
    } catch (err: any) {
      setError(err.message || "Error deleting slot.");
    }
  };

  // Profile Save
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser = {
      ...currentUser,
      firstName: profFirst,
      lastName: profLast,
      phone: profPhone,
    };
    // Sync locally
    setCurrentUser(updatedUser);
    setSuccess("Personal profile updated successfully inside cached session.");
  };

  if (loading && usersList.length === 0 && slotsList.length === 0) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="modules-root">
      {/* 1. USERS LIST MODULE */}
      {activeModule === "users" && currentUser.role === "ADMIN" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="module-users-container">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold font-display text-sm text-slate-800 flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-indigo-500" />
                Active Campus Accounts ({usersList.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-3">User Details</th>
                    <th className="px-6 py-3">Contact</th>
                    <th className="px-6 py-3">System Role</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/40">
                      <td className="px-6 py-4">
                        <span className="block font-bold text-slate-800">
                          {u.firstName} {u.lastName}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono">ID: {u.id}</span>
                      </td>
                      <td className="px-6 py-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Mail className="h-3 w-3" />
                          <span>{u.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Phone className="h-3 w-3" />
                          <span>{u.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[9px] font-bold border rounded-full uppercase tracking-wider ${
                            u.role === "ADMIN"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : u.role === "AGENT"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete user account"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create User Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-2xs">
            <h3 className="font-bold font-display text-sm text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-500" />
              Provision New Account
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Sarah"
                    value={uFirst}
                    onChange={(e) => setUFirst(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Jenkins"
                    value={uLast}
                    onChange={(e) => setULast(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@campus.edu"
                  value={uEmail}
                  onChange={(e) => setUEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (555) 101-2022"
                  value={uPhone}
                  onChange={(e) => setUPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={uPassword}
                  onChange={(e) => setUPassword(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">System Role</label>
                <select
                  value={uRole}
                  onChange={(e) => setURole(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-semibold cursor-pointer"
                >
                  <option value="USER">USER (Student / Faculty)</option>
                  <option value="AGENT">AGENT (Security Officer)</option>
                  <option value="ADMIN">ADMIN (System Manager)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-all cursor-pointer"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. SLOTS MODULE */}
      {activeModule === "slots" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="module-slots-container">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold font-display text-sm text-slate-800 flex items-center gap-2">
                <ParkingSquare className="h-4.5 w-4.5 text-indigo-500" />
                University Parking Lots ({slotsList.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-3">Slot Number</th>
                    <th className="px-6 py-3">Zone / Location</th>
                    <th className="px-6 py-3">Space Type</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Action Gate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {slotsList.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/40">
                      <td className="px-6 py-4 font-mono font-bold text-slate-800">{s.slotNumber}</td>
                      <td className="px-6 py-4 text-slate-500">{s.zone}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200">
                          {s.slotType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[9px] font-bold border rounded-full tracking-wider uppercase ${
                            s.status === "AVAILABLE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : s.status === "OCCUPIED"
                              ? "bg-rose-50 text-rose-700 border-rose-100"
                              : "bg-amber-50 text-amber-700 border-amber-100 animate-pulse"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        {currentUser.role === "ADMIN" || currentUser.role === "AGENT" ? (
                          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 gap-0.5">
                            {(["AVAILABLE", "MAINTENANCE"] as const).map((stat) => (
                              <button
                                key={stat}
                                onClick={() => handleUpdateSlotStatus(s.id, stat)}
                                className={`px-2 py-0.5 rounded text-[9px] font-bold border-0 transition-all ${
                                  s.status === stat
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {stat === "AVAILABLE" ? "AV" : "MT"}
                              </button>
                            ))}
                          </div>
                        ) : null}

                        {currentUser.role === "ADMIN" && (
                          <button
                            onClick={() => handleDeleteSlot(s.id)}
                            className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all inline-block align-middle ml-2"
                            title="Remove Slot"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create Parking Slot Card (ADMIN ONLY) */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-2xs">
            <h3 className="font-bold font-display text-sm text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-500" />
              Add Parking Slot
            </h3>

            {currentUser.role === "ADMIN" ? (
              <form onSubmit={handleCreateSlot} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Slot Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A-101"
                    value={sNumber}
                    onChange={(e) => setSNumber(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-semibold uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Zone Designation</label>
                  <select
                    value={sZone}
                    onChange={(e) => setSZone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-semibold cursor-pointer"
                  >
                    <option value="Zone A">Zone A (Premium Core)</option>
                    <option value="Zone B">Zone B (North Campus)</option>
                    <option value="Zone C">Zone C (Science Hill)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Slot Type</label>
                  <select
                    value={sType}
                    onChange={(e) => setSType(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-semibold cursor-pointer"
                  >
                    <option value="STANDARD">Standard Vehicle</option>
                    <option value="COMPACT">Compact / Eco Eco</option>
                    <option value="EV">Electric Vehicle (EV Charging)</option>
                    <option value="HANDICAPPED">Handicapped Accessible</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Initial Status</label>
                  <select
                    value={sStatus}
                    onChange={(e) => setSStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="MAINTENANCE">Under Maintenance</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-all cursor-pointer"
                >
                  Create Parking Spot
                </button>
              </form>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-500 italic">
                Only ADMIN users are authorized to register or configure new physical parking slots.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. PROFILE MODULE */}
      {activeModule === "profile" && (
        <div className="max-w-2xl bg-white p-8 rounded-xl border border-slate-100 shadow-2xs" id="module-profile-container">
          <h3 className="text-xl font-bold font-display text-slate-900 mb-6 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-indigo-600" />
            My Campus Profile Settings
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={profFirst}
                  onChange={(e) => setProfFirst(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={profLast}
                  onChange={(e) => setProfLast(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email Address (Read Only)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full pl-9 pr-3 py-2 bg-slate-100/60 border border-slate-200 rounded-lg text-xs text-slate-400 font-mono focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Mobile Contact Phone</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="tel"
                  required
                  value={profPhone}
                  onChange={(e) => setProfPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
              <span className="block font-bold text-slate-700">Role Status: {currentUser.role}</span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                You are registered as a valid member of the university parking portal. Your current authorization privileges grant you full system access corresponding to the standard guidelines of role <strong>{currentUser.role}</strong>.
              </p>
            </div>

            <button
              type="submit"
              className="flex items-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Save className="h-4 w-4" />
              Save Settings Changes
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
