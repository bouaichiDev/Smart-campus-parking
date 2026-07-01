import React, { useState, useEffect } from "react";
import { Car, Calendar, Key, ShieldCheck, Trash2, Plus, CalendarClock, AlertCircle, RefreshCw } from "lucide-react";
import { Vehicle, ParkingSlot, Reservation } from "../types";

interface UserDashboardProps {
  token: string;
  user: { id: string; role: "USER" | "ADMIN" };
  setError: (msg: string) => void;
  setSuccess: (msg: string) => void;
}

export default function UserDashboard({ token, user, setError, setSuccess }: UserDashboardProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  // Forms states
  const [plateNumber, setPlateNumber] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");

  const [bookingVehicle, setBookingVehicle] = useState("");
  const [bookingSlot, setBookingSlot] = useState("");
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split("T")[0]);
  const [bookingStart, setBookingStart] = useState("09:00");
  const [bookingEnd, setBookingEnd] = useState("12:00");

  const loadData = async () => {
    setLoading(true);
    try {
      // Vehicles
      const vRes = await fetch("/api/vehicles", { headers: { Authorization: `Bearer ${token}` } });
      const vData = await vRes.json();
      setVehicles(vData);

      // Slots
      const sRes = await fetch("/api/slots", { headers: { Authorization: `Bearer ${token}` } });
      const sData = await sRes.json();
      setSlots(sData);

      // Reservations
      const rRes = await fetch("/api/reservations", { headers: { Authorization: `Bearer ${token}` } });
      const rData = await rRes.json();
      setReservations(rData);
    } catch (err: any) {
      setError("Failed to load user parking data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Vehicle Register submit
  const handleRegisterVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber || !brand || !model || !color) {
      setError("Please fill in all vehicle parameters.");
      return;
    }

    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plateNumber, brand, model, color }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Vehicle registration failed.");

      setSuccess(`Vehicle ${data.plateNumber} registered successfully.`);
      // Clear
      setPlateNumber("");
      setBrand("");
      setModel("");
      setColor("");
      loadData();
    } catch (err: any) {
      setError(err.message || "Error registering vehicle.");
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vehicle registration?")) return;

    try {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Deletion failed.");
      setSuccess("Vehicle registration deleted.");
      loadData();
    } catch (err: any) {
      setError(err.message || "Error deleting vehicle.");
    }
  };

  // Booking submit
  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingVehicle || !bookingSlot || !bookingDate || !bookingStart || !bookingEnd) {
      setError("Please complete all reservation fields.");
      return;
    }

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicleId: bookingVehicle,
          parkingSlotId: bookingSlot,
          reservationDate: bookingDate,
          startTime: bookingStart,
          endTime: bookingEnd,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Booking failed.");

      setSuccess("Parking slot reserved successfully! Your status is currently PENDING entry verification.");
      loadData();
    } catch (err: any) {
      setError(err.message || "Unable to book slot overlapping time.");
    }
  };

  const handleCancelReservation = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) return;

    try {
      const response = await fetch(`/api/reservations/${id}/cancel`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Cancellation failed.");
      setSuccess("Reservation cancelled.");
      loadData();
    } catch (err: any) {
      setError(err.message || "Error cancelling reservation.");
    }
  };

  if (loading && vehicles.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="user-dashboard-root">
      {/* Upper header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-slate-900">Reserve Parking Spot</h2>
          <p className="text-xs text-slate-500">Add personal vehicles and request active space bookings in seconds.</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh Lists
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reservation Widget Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-2xs">
            <h3 className="font-bold font-display text-sm text-slate-800 mb-4 flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-indigo-500" />
              Book Parking Space
            </h3>

            {vehicles.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">No Vehicles Registered:</span> You must register at least one vehicle using the <strong>"Register My Vehicle"</strong> form on the right side before placing a reservation.
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateReservation} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Select Your Vehicle</label>
                    <select
                      value={bookingVehicle}
                      onChange={(e) => setBookingVehicle(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-semibold cursor-pointer"
                    >
                      <option value="">-- Choose Vehicle --</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.plateNumber} - {v.brand} {v.model}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Select Space Slot</label>
                    <select
                      value={bookingSlot}
                      onChange={(e) => setBookingSlot(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-semibold font-mono cursor-pointer"
                    >
                      <option value="">-- Select Spot --</option>
                      {slots.map((s) => (
                        <option
                          key={s.id}
                          value={s.id}
                          disabled={s.status === "MAINTENANCE"}
                          className={s.status === "MAINTENANCE" ? "text-slate-300" : ""}
                        >
                          {s.slotNumber} ({s.zone} - {s.slotType}) [{s.status}]
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Reservation Date</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split("T")[0]}
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-semibold cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Start Time (HH:MM)</label>
                    <input
                      type="time"
                      required
                      value={bookingStart}
                      onChange={(e) => setBookingStart(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-mono font-semibold cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">End Time (HH:MM)</label>
                    <input
                      type="time"
                      required
                      value={bookingEnd}
                      onChange={(e) => setBookingEnd(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-mono font-semibold cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <Calendar className="h-4.5 w-4.5" />
                  Confirm Reservation Booking
                </button>
              </form>
            )}
          </div>

          {/* Slots visual interactive grid */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-2xs">
            <h3 className="font-bold font-display text-sm text-slate-800 mb-4 flex items-center justify-between">
              <span>Campus Interactive Parking Layout</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Live Slot Grid</span>
            </h3>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {slots.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    if (s.status !== "MAINTENANCE") {
                      setBookingSlot(s.id);
                      setSuccess(`Selected slot ${s.slotNumber}. Please fill vehicle and times to reserve.`);
                    } else {
                      setError(`Slot ${s.slotNumber} is under maintenance.`);
                    }
                  }}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-between cursor-pointer ${
                    bookingSlot === s.id
                      ? "ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/40"
                      : s.status === "MAINTENANCE"
                      ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                      : s.status === "OCCUPIED"
                      ? "bg-rose-50 border-rose-100 hover:bg-rose-100/40 text-rose-800"
                      : "bg-emerald-50 border-emerald-100 hover:bg-emerald-100/40 text-emerald-800"
                  }`}
                  id={`slot-box-${s.slotNumber}`}
                >
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.zone}</span>
                  <span className="block font-bold font-display text-xs my-1">{s.slotNumber}</span>
                  <span className="text-[8px] font-bold block uppercase tracking-tight truncate max-w-full">
                    {s.status}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex justify-center gap-4 mt-4 pt-3 border-t border-slate-50 text-[10px] font-semibold text-slate-400">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-xs bg-emerald-500 inline-block"></span> Available Spot
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-xs bg-rose-500 inline-block"></span> Occupied Spot
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-xs bg-slate-300 inline-block"></span> Maintenance Spot
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Vehicle Management (Register new Owned Vehicle) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-2xs">
            <h3 className="font-bold font-display text-sm text-slate-800 mb-4 flex items-center gap-2">
              <Car className="h-5 w-5 text-indigo-500" />
              Register My Vehicle
            </h3>

            <form onSubmit={handleRegisterVehicle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">License Plate</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 6XYZ89"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors uppercase font-mono font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Brand</label>
                  <input
                    type="text"
                    required
                    placeholder="Tesla"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Model</label>
                  <input
                    type="text"
                    required
                    placeholder="Model 3"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Vehicle Color</label>
                <input
                  type="text"
                  required
                  placeholder="Midnight Silver Metallic"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Register Vehicle
              </button>
            </form>
          </div>

          {/* Owned Vehicles list */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-2xs space-y-4">
            <h3 className="font-bold font-display text-sm text-slate-800">My Registered Vehicles</h3>

            {vehicles.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs italic">
                No registered vehicles. Please use the form above to register.
              </div>
            ) : (
              <div className="space-y-2">
                {vehicles.map((v) => (
                  <div key={v.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold font-mono">
                        {v.plateNumber.substring(0, 3)}
                      </div>
                      <div>
                        <span className="block font-bold text-slate-800">{v.plateNumber}</span>
                        <span className="block text-[10px] text-slate-400">
                          {v.brand} {v.model} ({v.color})
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteVehicle(v.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="Delete vehicle registration"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking History Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold font-display text-sm text-slate-800">My Parking Bookings & History</h3>
          <span className="text-xs text-slate-400 font-semibold">{reservations.length} total bookings</span>
        </div>

        {reservations.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs italic">
            You don't have any parking slot reservations yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-3">Reservation ID</th>
                  <th className="px-6 py-3">Vehicle / Plate</th>
                  <th className="px-6 py-3">Slot Number</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Window Time</th>
                  <th className="px-6 py-3">Gate Logs</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/40">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{r.id}</td>
                    <td className="px-6 py-4">
                      <span className="block font-mono text-xs font-semibold text-slate-800">
                        {r.vehicle ? r.vehicle.plateNumber : "N/A"}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {r.vehicle ? `${r.vehicle.brand} ${r.vehicle.model}` : "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {r.parkingSlot ? r.parkingSlot.slotNumber : "N/A"}{" "}
                      <span className="text-[10px] text-slate-400 font-normal">({r.parkingSlot ? r.parkingSlot.zone : "N/A"})</span>
                    </td>
                    <td className="px-6 py-4 font-semibold">{r.reservationDate}</td>
                    <td className="px-6 py-4 font-mono text-slate-500">
                      {r.startTime} - {r.endTime}
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                      <span className="block">In: {r.actualEntryTime || "--:--"}</span>
                      <span className="block">Out: {r.actualExitTime || "--:--"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-[9px] font-bold border rounded-full tracking-wider uppercase ${
                          r.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : r.status === "PENDING"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-100 animate-pulse"
                            : r.status === "COMPLETED"
                            ? "bg-slate-50 text-slate-500 border-slate-100"
                            : "bg-rose-50 text-rose-700 border-rose-100"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {r.status === "PENDING" && (
                        <button
                          onClick={() => handleCancelReservation(r.id)}
                          className="px-2 py-1 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-700 rounded-md font-bold text-[10px] transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
