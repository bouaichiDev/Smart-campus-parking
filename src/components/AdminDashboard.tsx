import React, { useEffect, useState } from "react";
import { Users, Car, ParkingSquare, CalendarClock, TrendingUp, AlertCircle, RefreshCw, BarChart2 } from "lucide-react";
import { DashboardStats } from "../types";

interface AdminDashboardProps {
  token: string;
  setError: (msg: string) => void;
  setSuccess: (msg: string) => void;
}

export default function AdminDashboard({ token, setError, setSuccess }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to load statistics.");
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Unable to fetch admin dashboard stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16" id="dashboard-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-center bg-white rounded-xl border border-slate-100" id="dashboard-error">
        <AlertCircle className="mx-auto h-12 w-12 text-slate-400 mb-2" />
        <h3 className="font-bold text-slate-800">No Statistics Available</h3>
        <p className="text-sm text-slate-500 mt-1">Please try refreshing the page.</p>
        <button onClick={fetchStats} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 cursor-pointer">
          Retry Load
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="admin-dashboard-root">
      {/* Top Banner & Refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-slate-900">Admin Command Center</h2>
          <p className="text-xs text-slate-500">Real-time occupancy rates, user demographics, and reservation metrics.</p>
        </div>
        <button
          onClick={() => {
            fetchStats();
            setSuccess("Dashboard stats updated successfully.");
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          id="btn-refresh-stats"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Stats
        </button>
      </div>

      {/* Grid of Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Total Users</span>
            <span className="block text-2xl font-bold font-display text-slate-900">{stats.totalUsers}</span>
          </div>
        </div>

        {/* Registered Vehicles */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Registered Vehicles</span>
            <span className="block text-2xl font-bold font-display text-slate-900">{stats.totalVehicles}</span>
          </div>
        </div>

        {/* Total Parking Slots */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <ParkingSquare className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Parking Slots</span>
            <span className="block text-2xl font-bold font-display text-slate-900">
              {stats.totalSlots} <span className="text-xs font-semibold text-slate-400">Total</span>
            </span>
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Occupancy Rate</span>
            <div className="flex items-baseline gap-1.5">
              <span className="block text-2xl font-bold font-display text-slate-900">{stats.occupancyRate}%</span>
              <span className="text-xs font-semibold text-emerald-600">{stats.occupiedSlots} Occupied</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-counters (Available / Occupied / Maintenance / Reservations Today) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-xl flex justify-between items-center">
          <div>
            <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Available Slots</span>
            <span className="text-xl font-bold text-slate-800">{stats.availableSlots}</span>
          </div>
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>

        <div className="bg-rose-50/60 border border-rose-100 p-4 rounded-xl flex justify-between items-center">
          <div>
            <span className="block text-[10px] font-bold text-rose-600 uppercase tracking-wider">Occupied Slots</span>
            <span className="text-xl font-bold text-slate-800">{stats.occupiedSlots}</span>
          </div>
          <div className="h-2.5 w-2.5 rounded-full bg-rose-500"></div>
        </div>

        <div className="bg-amber-50/60 border border-amber-100 p-4 rounded-xl flex justify-between items-center">
          <div>
            <span className="block text-[10px] font-bold text-amber-600 uppercase tracking-wider">Under Maintenance</span>
            <span className="text-xl font-bold text-slate-800">{stats.maintenanceSlots}</span>
          </div>
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500"></div>
        </div>

        <div className="bg-indigo-50/60 border border-indigo-100 p-4 rounded-xl flex justify-between items-center">
          <div>
            <span className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Reservations Today</span>
            <span className="text-xl font-bold text-slate-800">{stats.reservationsToday}</span>
          </div>
          <CalendarClock className="h-5 w-5 text-indigo-500" />
        </div>
      </div>

      {/* Graphic Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zone Occupancy Stats */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-2xs">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold font-display text-sm text-slate-800 flex items-center gap-2">
              <BarChart2 className="h-4.5 w-4.5 text-indigo-500" />
              Zone Capacity & Occupancy Rates
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Live Metrics</span>
          </div>

          <div className="space-y-4">
            {stats.zoneStats.map((z) => (
              <div key={z.zone} className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span className="font-bold">{z.zone}</span>
                  <div className="space-x-3">
                    <span className="text-slate-400">{z.occupied}/{z.total} Occupied</span>
                    <span className="text-indigo-600">{z.occupancyRate}% Rate</span>
                  </div>
                </div>

                {/* Vertical segment custom status bar */}
                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                  {/* Occupied Red segment */}
                  <div
                    style={{ width: `${(z.occupied / z.total) * 100}%` }}
                    className="h-full bg-rose-500 transition-all duration-500"
                    title={`${z.occupied} occupied`}
                  ></div>
                  {/* Maintenance Yellow segment */}
                  <div
                    style={{ width: `${(z.maintenance / z.total) * 100}%` }}
                    className="h-full bg-amber-400 transition-all duration-500"
                    title={`${z.maintenance} under maintenance`}
                  ></div>
                  {/* Available green segment */}
                  <div
                    style={{ width: `${(z.available / z.total) * 100}%` }}
                    className="h-full bg-emerald-400 transition-all duration-500"
                    title={`${z.available} available`}
                  ></div>
                </div>

                <div className="flex justify-between items-center mt-2 text-[10px] font-semibold text-slate-400">
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block"></span>
                      {z.available} Avail
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block"></span>
                      {z.occupied} Occ
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block"></span>
                      {z.maintenance} Maint
                    </span>
                  </div>
                  <span>Total slots: {z.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slot Types breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold font-display text-sm text-slate-800 mb-4">Slot Type Distributions</h3>
            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Standard Slots</span>
                  <span>{stats.typeBreakdown.STANDARD} slots</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full">
                  <div style={{ width: `${(stats.typeBreakdown.STANDARD / stats.totalSlots) * 100}%` }} className="h-full bg-indigo-500 rounded-full"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Compact / Eco Slots</span>
                  <span>{stats.typeBreakdown.COMPACT} slots</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full">
                  <div style={{ width: `${(stats.typeBreakdown.COMPACT / stats.totalSlots) * 100}%` }} className="h-full bg-sky-400 rounded-full"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>EV Charging Stations</span>
                  <span>{stats.typeBreakdown.EV} slots</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full">
                  <div style={{ width: `${(stats.typeBreakdown.EV / stats.totalSlots) * 100}%` }} className="h-full bg-emerald-500 rounded-full"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Handicapped Accessible</span>
                  <span>{stats.typeBreakdown.HANDICAPPED} slots</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full">
                  <div style={{ width: `${(stats.typeBreakdown.HANDICAPPED / stats.totalSlots) * 100}%` }} className="h-full bg-indigo-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-xs mt-4">
            <span className="block font-bold text-slate-700 mb-0.5">University Capacity Guideline</span>
            <p className="text-slate-400 leading-normal text-[11px]">
              Minimum 5% EV-ready slot target for current term. Active EV stations status count is currently{" "}
              <strong>{stats.typeBreakdown.EV}</strong> out of <strong>{stats.totalSlots}</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Reservations Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold font-display text-sm text-slate-800">Recent Campus Reservations</h3>
          <span className="text-xs text-slate-400 font-semibold">Updated 1m ago</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-3">Reservation ID</th>
                <th className="px-6 py-3">User Email / Owner</th>
                <th className="px-6 py-3">Vehicle / Plate</th>
                <th className="px-6 py-3">Slot Number</th>
                <th className="px-6 py-3">Date / Window</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {stats.recentReservations.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-6 py-4.5 font-mono text-xs text-slate-400">{r.id}</td>
                  <td className="px-6 py-4.5">
                    <span className="block font-semibold text-slate-800">{r.userName}</span>
                    <span className="block text-[10px] text-slate-400">{r.userId}</span>
                  </td>
                  <td className="px-6 py-4.5">
                    <span className="block font-mono text-xs font-semibold text-slate-800">{r.plateNumber}</span>
                  </td>
                  <td className="px-6 py-4.5 font-bold text-slate-800">{r.slotNumber}</td>
                  <td className="px-6 py-4.5">
                    <span className="block font-semibold">{r.reservationDate}</span>
                    <span className="block text-[10px] text-slate-400 font-mono">
                      {r.startTime} - {r.endTime}
                    </span>
                  </td>
                  <td className="px-6 py-4.5">
                    <span
                      className={`inline-block px-2.5 py-0.5 text-[9px] font-bold border rounded-full tracking-wider uppercase ${
                        r.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : r.status === "PENDING"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                          : r.status === "COMPLETED"
                          ? "bg-slate-50 text-slate-500 border-slate-100"
                          : "bg-rose-50 text-rose-700 border-rose-100"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
