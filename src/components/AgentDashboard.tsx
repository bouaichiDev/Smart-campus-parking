import React, { useState, useEffect } from "react";
import { ShieldCheck, Search, Car, HelpCircle, AlertTriangle, ShieldAlert, CheckCircle, RefreshCw } from "lucide-react";
import { AnomalyReport, Reservation } from "../types";

interface AgentDashboardProps {
  token: string;
  setError: (msg: string) => void;
  setSuccess: (msg: string) => void;
}

export default function AgentDashboard({ token, setError, setSuccess }: AgentDashboardProps) {
  const [plateQuery, setPlateQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ vehicles: any[]; reservations: Reservation[] } | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyReport[]>([]);
  const [loading, setLoading] = useState(false);

  // Anomaly reporting form states
  const [reportPlate, setReportPlate] = useState("");
  const [reportSlot, setReportSlot] = useState("");
  const [reportType, setReportType] = useState<"MISMATCH" | "OVERSTAY" | "ILLEGAL_PARKING" | "OTHER">("ILLEGAL_PARKING");
  const [reportDesc, setReportDesc] = useState("");

  const fetchAnomalies = async () => {
    try {
      const response = await fetch("/api/anomalies", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAnomalies(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, [token]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateQuery.trim()) {
      setError("Please specify a plate number or search keyword.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/agent/search-plate?q=${plateQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to search plate.");

      setSearchResults(data);
      if (data.vehicles.length === 0) {
        setSuccess("Search completed: No registered vehicles found.");
      } else {
        setSuccess(`Found ${data.vehicles.length} vehicle matching "${plateQuery}".`);
      }
    } catch (err: any) {
      setError(err.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEntryValidation = async (plateNum: string) => {
    try {
      const response = await fetch("/api/agent/validate-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plateNumber: plateNum }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Entry validation failed.");

      setSuccess(`Entry validated successfully! Slot ${data.slot.slotNumber} is now OCCUPIED.`);
      // Refresh search
      if (plateQuery) {
        const refreshRes = await fetch(`/api/agent/search-plate?q=${plateQuery}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const refreshData = await refreshRes.json();
        setSearchResults(refreshData);
      }
    } catch (err: any) {
      setError(err.message || "Failed to validate entry.");
    }
  };

  const handleExitValidation = async (plateNum: string) => {
    try {
      const response = await fetch("/api/agent/validate-exit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plateNumber: plateNum }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Exit validation failed.");

      setSuccess(`Exit validated successfully! Slot ${data.slot.slotNumber} is now AVAILABLE.`);
      // Refresh search
      if (plateQuery) {
        const refreshRes = await fetch(`/api/agent/search-plate?q=${plateQuery}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const refreshData = await refreshRes.json();
        setSearchResults(refreshData);
      }
    } catch (err: any) {
      setError(err.message || "Failed to validate exit.");
    }
  };

  const handleReportAnomaly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportSlot || !reportDesc) {
      setError("Please fill in the slot number and anomaly description.");
      return;
    }

    try {
      const response = await fetch("/api/anomalies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plateNumber: reportPlate,
          slotNumber: reportSlot,
          type: reportType,
          description: reportDesc,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to report anomaly.");

      setSuccess("Anomaly reported successfully!");
      // Reset form
      setReportPlate("");
      setReportSlot("");
      setReportDesc("");
      fetchAnomalies();
    } catch (err: any) {
      setError(err.message || "Failed to submit anomaly report.");
    }
  };

  const handleResolveAnomaly = async (id: string) => {
    try {
      const response = await fetch(`/api/anomalies/${id}/resolve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to resolve anomaly.");
      setSuccess("Anomaly resolved successfully.");
      fetchAnomalies();
    } catch (err: any) {
      setError(err.message || "Error resolving anomaly.");
    }
  };

  return (
    <div className="space-y-6" id="agent-dashboard-root">
      <div>
        <h2 className="text-2xl font-bold font-display tracking-tight text-slate-900">Security Guard Operations</h2>
        <p className="text-xs text-slate-500">Search reservation details, scan plate numbers, and validate entry/exit logs at campus parking barriers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Scanner and Search API */}
        <div className="lg:col-span-2 space-y-6">
          {/* Plate scanner simulator card */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-2xs">
            <h3 className="font-bold font-display text-sm text-slate-800 mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              Plate Scanning & Reservation Validator
            </h3>

            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search className="h-4.5 w-4.5" />
                </span>
                <input
                  type="text"
                  placeholder="Scan or type license plate (e.g. 6XYZ89, 7ABC12)..."
                  value={plateQuery}
                  onChange={(e) => setPlateQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors uppercase font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
              >
                {loading ? "Scanning..." : "Search / Scan"}
              </button>
            </form>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800 flex items-start gap-2">
              <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Officer Tip:</span> Typing license plates exactly allows quick reservation checks. Use "6XYZ89" or "7ABC12" for pre-seeded reservation tests.
              </div>
            </div>
          </div>

          {/* Search Results / Action Portal */}
          {searchResults && (
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-2xs space-y-4">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Search Match Details</h4>

              {/* Match vehicle information */}
              {searchResults.vehicles.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No matching registered vehicle or active booking found.
                </div>
              ) : (
                searchResults.vehicles.map((veh) => {
                  const associatedReservations = searchResults.reservations.filter((r) => r.vehicleId === veh.id);

                  return (
                    <div key={veh.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-4">
                      {/* Vehicle Details header */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600 font-bold font-mono text-sm">
                            {veh.plateNumber}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-800 text-sm">
                              {veh.brand} {veh.model}
                            </span>
                            <span className="block text-[11px] text-slate-400">Color: {veh.color}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">Owner ID: {veh.ownerId}</span>
                      </div>

                      {/* Associated Reservations list */}
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Reservations Today
                        </span>

                        {associatedReservations.length === 0 ? (
                          <div className="text-xs text-slate-400 italic">No reservation records listed for today.</div>
                        ) : (
                          <div className="space-y-2">
                            {associatedReservations.map((res) => (
                              <div key={res.id} className="bg-white p-3 border border-slate-100 rounded-lg flex justify-between items-center text-xs">
                                <div>
                                  <div className="font-bold text-slate-800">
                                    Slot: {res.parkingSlot ? res.parkingSlot.slotNumber : "N/A"}{" "}
                                    <span className="text-slate-400 font-normal">({res.parkingSlot ? res.parkingSlot.zone : "N/A"})</span>
                                  </div>
                                  <div className="text-slate-400 text-[11px]">
                                    Reservation Window: {res.startTime} - {res.endTime}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {res.status === "PENDING" && (
                                    <button
                                      onClick={() => handleEntryValidation(veh.plateNumber)}
                                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                                    >
                                      Validate Entry
                                    </button>
                                  )}
                                  {res.status === "ACTIVE" && (
                                    <button
                                      onClick={() => handleExitValidation(veh.plateNumber)}
                                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                                    >
                                      Validate Exit
                                    </button>
                                  )}
                                  <span
                                    className={`inline-block px-2 py-0.5 text-[9px] font-bold border rounded-full tracking-wider uppercase ${
                                      res.status === "ACTIVE"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                        : res.status === "PENDING"
                                        ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                                        : res.status === "COMPLETED"
                                        ? "bg-slate-50 text-slate-500 border-slate-100"
                                        : "bg-rose-50 text-rose-700 border-rose-100"
                                    }`}
                                  >
                                    {res.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right Side: Report Anomaly */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-2xs">
            <h3 className="font-bold font-display text-sm text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Report Security Anomaly
            </h3>

            <form onSubmit={handleReportAnomaly} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">License Plate (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. UNKNOWN1"
                  value={reportPlate}
                  onChange={(e) => setReportPlate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Slot Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A-101"
                  value={reportSlot}
                  onChange={(e) => setReportSlot(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Anomaly Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="ILLEGAL_PARKING">Illegal Parking</option>
                  <option value="MISMATCH">Vehicle / Plate Mismatch</option>
                  <option value="OVERSTAY">Overstay Limit Exceeded</option>
                  <option value="OTHER">Other Issues</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Brief Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe details (color, brand, or incident description)..."
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <ShieldAlert className="h-4 w-4" />
                Submit Security Report
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Anomalies Log list */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold font-display text-sm text-slate-800">Recent Reported Anomalies</h3>
          <button onClick={fetchAnomalies} className="text-slate-400 hover:text-slate-600">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-3">Reported Time</th>
                <th className="px-6 py-3">Slot #</th>
                <th className="px-6 py-3">Vehicle Plate</th>
                <th className="px-6 py-3">Anomaly Type</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {anomalies.map((an) => (
                <tr key={an.id} className="hover:bg-slate-50/40">
                  <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                    {new Date(an.reportedAt).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">{an.slotNumber}</td>
                  <td className="px-6 py-4 font-mono text-slate-500">{an.plateNumber}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-200">
                      {an.type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={an.description}>
                    {an.description}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2 py-0.5 text-[9px] font-bold border rounded-full uppercase tracking-wider ${
                        an.status === "RESOLVED"
                          ? "bg-slate-50 text-slate-400 border-slate-100"
                          : "bg-red-50 text-red-700 border-red-100 animate-pulse"
                      }`}
                    >
                      {an.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {an.status === "PENDING" ? (
                      <button
                        onClick={() => handleResolveAnomaly(an.id)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 border border-slate-200 text-slate-600 rounded-md font-bold text-[10px]"
                      >
                        Resolve
                      </button>
                    ) : (
                      <span className="text-slate-300 italic flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-emerald-500" /> Resolved
                      </span>
                    )}
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
