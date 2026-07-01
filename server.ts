import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "parking_db.json");

app.use(express.json());

// --- Database Structures & Initial Seeding ---
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "ADMIN" | "AGENT" | "USER";
  passwordHash: string;
}

interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  color: string;
  ownerId: string;
}

interface ParkingSlot {
  id: string;
  slotNumber: string;
  zone: string;
  slotType: "STANDARD" | "COMPACT" | "EV" | "HANDICAPPED";
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
}

interface Reservation {
  id: string;
  userId: string;
  vehicleId: string;
  parkingSlotId: string;
  reservationDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  actualEntryTime?: string;
  actualExitTime?: string;
}

interface AnomalyReport {
  id: string;
  reporterId: string;
  plateNumber: string;
  slotNumber: string;
  type: "MISMATCH" | "OVERSTAY" | "ILLEGAL_PARKING" | "OTHER";
  description: string;
  reportedAt: string;
  status: "PENDING" | "RESOLVED";
}

interface DBState {
  users: User[];
  vehicles: Vehicle[];
  slots: ParkingSlot[];
  reservations: Reservation[];
  anomalies: AnomalyReport[];
}

// Initial Mock Seed Data
const defaultDB: DBState = {
  users: [
    {
      id: "usr-admin",
      firstName: "Sarah",
      lastName: "Jenkins",
      email: "admin@campus.edu",
      phone: "+1 (555) 100-2000",
      role: "ADMIN",
      passwordHash: "admin123", // Simple plain or basic hash for demo, we'll verify directly
    },
    {
      id: "usr-agent1",
      firstName: "Officer",
      lastName: "Davis",
      email: "agent1@campus.edu",
      phone: "+1 (555) 300-4000",
      role: "AGENT",
      passwordHash: "agent123",
    },
    {
      id: "usr-user1",
      firstName: "Alex",
      lastName: "Rivera",
      email: "user1@campus.edu",
      phone: "+1 (555) 500-6000",
      role: "USER",
      passwordHash: "user123",
    },
    {
      id: "usr-user2",
      firstName: "Emily",
      lastName: "Chen",
      email: "user2@campus.edu",
      phone: "+1 (555) 700-8000",
      role: "USER",
      passwordHash: "user123",
    },
  ],
  vehicles: [
    {
      id: "veh-1",
      plateNumber: "6XYZ89",
      brand: "Tesla",
      model: "Model 3",
      color: "Deep Blue",
      ownerId: "usr-user1",
    },
    {
      id: "veh-2",
      plateNumber: "7ABC12",
      brand: "Honda",
      model: "Civic",
      color: "Alabaster Silver",
      ownerId: "usr-user1",
    },
    {
      id: "veh-3",
      plateNumber: "8EFG34",
      brand: "Toyota",
      model: "RAV4",
      color: "Ruby Flare Red",
      ownerId: "usr-user2",
    },
  ],
  slots: [
    // Zone A (Premium/Core)
    { id: "slot-a1", slotNumber: "A-101", zone: "Zone A", slotType: "STANDARD", status: "AVAILABLE" },
    { id: "slot-a2", slotNumber: "A-102", zone: "Zone A", slotType: "EV", status: "AVAILABLE" },
    { id: "slot-a3", slotNumber: "A-103", zone: "Zone A", slotType: "HANDICAPPED", status: "AVAILABLE" },
    { id: "slot-a4", slotNumber: "A-104", zone: "Zone A", slotType: "COMPACT", status: "MAINTENANCE" },
    { id: "slot-a5", slotNumber: "A-105", zone: "Zone A", slotType: "STANDARD", status: "OCCUPIED" },

    // Zone B (North Campus)
    { id: "slot-b1", slotNumber: "B-201", zone: "Zone B", slotType: "STANDARD", status: "AVAILABLE" },
    { id: "slot-b2", slotNumber: "B-202", zone: "Zone B", slotType: "STANDARD", status: "AVAILABLE" },
    { id: "slot-b3", slotNumber: "B-203", zone: "Zone B", slotType: "EV", status: "AVAILABLE" },
    { id: "slot-b4", slotNumber: "B-204", zone: "Zone B", slotType: "COMPACT", status: "OCCUPIED" },

    // Zone C (Science Hill)
    { id: "slot-c1", slotNumber: "C-301", zone: "Zone C", slotType: "STANDARD", status: "AVAILABLE" },
    { id: "slot-c2", slotNumber: "C-302", zone: "Zone C", slotType: "STANDARD", status: "AVAILABLE" },
    { id: "slot-c3", slotNumber: "C-303", zone: "Zone C", slotType: "HANDICAPPED", status: "MAINTENANCE" },
  ],
  reservations: [
    {
      id: "res-1",
      userId: "usr-user1",
      vehicleId: "veh-1",
      parkingSlotId: "slot-a5",
      reservationDate: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "12:00",
      status: "COMPLETED",
      actualEntryTime: "09:05",
      actualExitTime: "11:55",
    },
    {
      id: "res-2",
      userId: "usr-user1",
      vehicleId: "veh-2",
      parkingSlotId: "slot-b4",
      reservationDate: new Date().toISOString().split("T")[0],
      startTime: "13:00",
      endTime: "17:00",
      status: "ACTIVE",
      actualEntryTime: "13:12",
    },
    {
      id: "res-3",
      userId: "usr-user2",
      vehicleId: "veh-3",
      parkingSlotId: "slot-a2",
      reservationDate: new Date().toISOString().split("T")[0],
      startTime: "15:00",
      endTime: "19:00",
      status: "PENDING",
    },
  ],
  anomalies: [
    {
      id: "anom-1",
      reporterId: "usr-agent1",
      plateNumber: "UNKNOWN1",
      slotNumber: "A-104",
      type: "ILLEGAL_PARKING",
      description: "Vehicle parked in a maintenance slot without any valid reservation.",
      reportedAt: new Date(Date.now() - 3600000).toISOString(),
      status: "PENDING",
    },
  ],
};

// Database Read/Write Utilities
function loadDB(): DBState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    } else {
      saveDB(defaultDB);
      return defaultDB;
    }
  } catch (err) {
    console.error("Error reading db file, falling back to in-memory:", err);
    return defaultDB;
  }
}

function saveDB(data: DBState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing db file:", err);
  }
}

// Ensure database is initialized
loadDB();

// --- API Middlewares ---
// Simple mock Token authorization helper
function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const db = loadDB();
  // We'll use the user ID directly as the token for this prototype to simplify things
  const user = db.users.find((u) => u.id === token);
  if (!user) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }

  (req as any).user = user;
  next();
}

function requireRole(roles: string[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: "Access forbidden: Insufficient privileges." });
    }
    next();
  };
}

// --- REST ENDPOINTS ---

// 1. Authentication
app.post("/api/auth/register", (req, res) => {
  const { firstName, lastName, email, password, phone, role } = req.body;

  if (!firstName || !lastName || !email || !password || !phone) {
    return res.status(400).json({ message: "All registration fields are required." });
  }

  const db = loadDB();
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ message: "Email is already registered." });
  }

  const newUser: User = {
    id: `usr-${Math.random().toString(36).substring(2, 9)}`,
    firstName,
    lastName,
    email,
    phone,
    role: role && ["ADMIN", "AGENT", "USER"].includes(role) ? role : "USER",
    passwordHash: password, // Store password directly for simplified demo login
  };

  db.users.push(newUser);
  saveDB(db);

  res.status(201).json({
    message: "Registration successful!",
    user: {
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
    },
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const db = loadDB();
  const user = db.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  // Token is user ID for simple persistent auth
  res.status(200).json({
    token: user.id,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
});

// 2. User Profile / Details
app.get("/api/auth/me", authenticateToken, (req, res) => {
  const user = (req as any).user;
  res.json({ user });
});

// 3. User Management (ADMIN Only)
app.get("/api/users", authenticateToken, requireRole(["ADMIN"]), (req, res) => {
  const db = loadDB();
  res.json(db.users);
});

app.post("/api/users", authenticateToken, requireRole(["ADMIN"]), (req, res) => {
  const { firstName, lastName, email, phone, role, password } = req.body;
  if (!firstName || !lastName || !email || !phone || !role || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const db = loadDB();
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ message: "Email already exists." });
  }

  const newUser: User = {
    id: `usr-${Math.random().toString(36).substring(2, 9)}`,
    firstName,
    lastName,
    email,
    phone,
    role,
    passwordHash: password,
  };

  db.users.push(newUser);
  saveDB(db);
  res.status(201).json(newUser);
});

app.put("/api/users/:id", authenticateToken, requireRole(["ADMIN"]), (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, phone, role } = req.body;

  const db = loadDB();
  const userIndex = db.users.findIndex((u) => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found." });
  }

  db.users[userIndex] = {
    ...db.users[userIndex],
    firstName: firstName || db.users[userIndex].firstName,
    lastName: lastName || db.users[userIndex].lastName,
    email: email || db.users[userIndex].email,
    phone: phone || db.users[userIndex].phone,
    role: role || db.users[userIndex].role,
  };

  saveDB(db);
  res.json(db.users[userIndex]);
});

app.delete("/api/users/:id", authenticateToken, requireRole(["ADMIN"]), (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const userIndex = db.users.findIndex((u) => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found." });
  }

  // Prevent self deletion
  if (id === (req as any).user.id) {
    return res.status(400).json({ message: "You cannot delete your own admin account!" });
  }

  db.users.splice(userIndex, 1);
  saveDB(db);
  res.json({ success: true, message: "User successfully deleted." });
});


// 4. Vehicle Management (CRUD)
app.get("/api/vehicles", authenticateToken, (req, res) => {
  const db = loadDB();
  const user = (req as any).user;

  if (user.role === "ADMIN" || user.role === "AGENT") {
    // Return all vehicles for Admin/Agent
    res.json(db.vehicles);
  } else {
    // Return only own vehicles
    res.json(db.vehicles.filter((v) => v.ownerId === user.id));
  }
});

app.post("/api/vehicles", authenticateToken, (req, res) => {
  const { plateNumber, brand, model, color, ownerId } = req.body;
  const user = (req as any).user;

  if (!plateNumber || !brand || !model || !color) {
    return res.status(400).json({ message: "All vehicle fields are required." });
  }

  const db = loadDB();
  if (db.vehicles.some((v) => v.plateNumber.toUpperCase() === plateNumber.toUpperCase())) {
    return res.status(400).json({ message: "A vehicle with this plate number already exists." });
  }

  const newVehicle: Vehicle = {
    id: `veh-${Math.random().toString(36).substring(2, 9)}`,
    plateNumber: plateNumber.toUpperCase(),
    brand,
    model,
    color,
    ownerId: user.role === "ADMIN" && ownerId ? ownerId : user.id,
  };

  db.vehicles.push(newVehicle);
  saveDB(db);
  res.status(201).json(newVehicle);
});

app.put("/api/vehicles/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { plateNumber, brand, model, color } = req.body;
  const user = (req as any).user;

  const db = loadDB();
  const vehicleIndex = db.vehicles.findIndex((v) => v.id === id);
  if (vehicleIndex === -1) {
    return res.status(404).json({ message: "Vehicle not found." });
  }

  // Ensure user owns vehicle or is Admin
  if (db.vehicles[vehicleIndex].ownerId !== user.id && user.role !== "ADMIN") {
    return res.status(403).json({ message: "Permission denied." });
  }

  db.vehicles[vehicleIndex] = {
    ...db.vehicles[vehicleIndex],
    plateNumber: plateNumber ? plateNumber.toUpperCase() : db.vehicles[vehicleIndex].plateNumber,
    brand: brand || db.vehicles[vehicleIndex].brand,
    model: model || db.vehicles[vehicleIndex].model,
    color: color || db.vehicles[vehicleIndex].color,
  };

  saveDB(db);
  res.json(db.vehicles[vehicleIndex]);
});

app.delete("/api/vehicles/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;

  const db = loadDB();
  const vehicleIndex = db.vehicles.findIndex((v) => v.id === id);
  if (vehicleIndex === -1) {
    return res.status(404).json({ message: "Vehicle not found." });
  }

  if (db.vehicles[vehicleIndex].ownerId !== user.id && user.role !== "ADMIN") {
    return res.status(403).json({ message: "Permission denied." });
  }

  db.vehicles.splice(vehicleIndex, 1);
  saveDB(db);
  res.json({ success: true, message: "Vehicle deleted successfully." });
});


// 5. Parking Slot Management (ADMIN/AGENT can read/write, users can read AVAILABLE)
app.get("/api/slots", authenticateToken, (req, res) => {
  const db = loadDB();
  res.json(db.slots);
});

app.post("/api/slots", authenticateToken, requireRole(["ADMIN"]), (req, res) => {
  const { slotNumber, zone, slotType, status } = req.body;
  if (!slotNumber || !zone || !slotType || !status) {
    return res.status(400).json({ message: "All slot fields are required." });
  }

  const db = loadDB();
  if (db.slots.some((s) => s.slotNumber.toUpperCase() === slotNumber.toUpperCase())) {
    return res.status(400).json({ message: "Slot number already exists." });
  }

  const newSlot: ParkingSlot = {
    id: `slot-${Math.random().toString(36).substring(2, 9)}`,
    slotNumber: slotNumber.toUpperCase(),
    zone,
    slotType,
    status,
  };

  db.slots.push(newSlot);
  saveDB(db);
  res.status(201).json(newSlot);
});

app.put("/api/slots/:id", authenticateToken, requireRole(["ADMIN", "AGENT"]), (req, res) => {
  const { id } = req.params;
  const { slotNumber, zone, slotType, status } = req.body;

  const db = loadDB();
  const slotIndex = db.slots.findIndex((s) => s.id === id);
  if (slotIndex === -1) {
    return res.status(404).json({ message: "Parking slot not found." });
  }

  db.slots[slotIndex] = {
    ...db.slots[slotIndex],
    slotNumber: slotNumber ? slotNumber.toUpperCase() : db.slots[slotIndex].slotNumber,
    zone: zone || db.slots[slotIndex].zone,
    slotType: slotType || db.slots[slotIndex].slotType,
    status: status || db.slots[slotIndex].status,
  };

  saveDB(db);
  res.json(db.slots[slotIndex]);
});

app.delete("/api/slots/:id", authenticateToken, requireRole(["ADMIN"]), (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const slotIndex = db.slots.findIndex((s) => s.id === id);
  if (slotIndex === -1) {
    return res.status(404).json({ message: "Parking slot not found." });
  }

  db.slots.splice(slotIndex, 1);
  saveDB(db);
  res.json({ success: true, message: "Parking slot deleted successfully." });
});


// 6. Reservation Management (With strict business rules)
app.get("/api/reservations", authenticateToken, (req, res) => {
  const db = loadDB();
  const user = (req as any).user;

  let list = db.reservations;
  if (user.role === "USER") {
    list = db.reservations.filter((r) => r.userId === user.id);
  }

  // Hydrate user, vehicle, and slot details
  const hydrated = list.map((res) => {
    const rUser = db.users.find((u) => u.id === res.userId);
    const rVehicle = db.vehicles.find((v) => v.id === res.vehicleId);
    const rSlot = db.slots.find((s) => s.id === res.parkingSlotId);
    return {
      ...res,
      user: rUser ? { id: rUser.id, name: `${rUser.firstName} ${rUser.lastName}`, email: rUser.email, phone: rUser.phone } : null,
      vehicle: rVehicle || null,
      parkingSlot: rSlot || null,
    };
  });

  res.json(hydrated);
});

app.post("/api/reservations", authenticateToken, (req, res) => {
  const { vehicleId, parkingSlotId, reservationDate, startTime, endTime } = req.body;
  const user = (req as any).user;

  if (!vehicleId || !parkingSlotId || !reservationDate || !startTime || !endTime) {
    return res.status(400).json({ message: "All reservation parameters are required." });
  }

  const db = loadDB();

  // Rule 1: Validate Vehicle ownership (unless ADMIN)
  const vehicle = db.vehicles.find((v) => v.id === vehicleId);
  if (!vehicle) {
    return res.status(404).json({ message: "Vehicle not found." });
  }
  if (vehicle.ownerId !== user.id && user.role !== "ADMIN") {
    return res.status(403).json({ message: "You can only reserve slots for your own vehicles." });
  }

  // Rule 2: Validate slot status
  const slot = db.slots.find((s) => s.id === parkingSlotId);
  if (!slot) {
    return res.status(404).json({ message: "Parking slot not found." });
  }
  if (slot.status === "MAINTENANCE") {
    return res.status(400).json({ message: "This slot is under maintenance and cannot be reserved." });
  }

  // Rule 3: No double booking check
  // Verify if there is any active, pending, or completed reservation on the same slot at overlapping times
  const parsedStart = parseInt(startTime.replace(":", ""), 10);
  const parsedEnd = parseInt(endTime.replace(":", ""), 10);

  const overlaps = db.reservations.some((r) => {
    if (r.parkingSlotId !== parkingSlotId || r.reservationDate !== reservationDate) {
      return false;
    }
    if (["CANCELLED", "COMPLETED"].includes(r.status)) {
      return false;
    }

    const rStart = parseInt(r.startTime.replace(":", ""), 10);
    const rEnd = parseInt(r.endTime.replace(":", ""), 10);

    // Overlap condition: startA < endB && startB < endA
    return parsedStart < rEnd && rStart < parsedEnd;
  });

  if (overlaps) {
    return res.status(400).json({ message: "Overlapping reservation exists! This slot is already booked for this time." });
  }

  // All good, create reservation
  const newReservation: Reservation = {
    id: `res-${Math.random().toString(36).substring(2, 9)}`,
    userId: user.role === "ADMIN" && req.body.userId ? req.body.userId : user.id,
    vehicleId,
    parkingSlotId,
    reservationDate,
    startTime,
    endTime,
    status: "PENDING",
  };

  db.reservations.push(newReservation);
  saveDB(db);

  res.status(201).json(newReservation);
});

app.put("/api/reservations/:id/cancel", authenticateToken, (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;

  const db = loadDB();
  const resIndex = db.reservations.findIndex((r) => r.id === id);
  if (resIndex === -1) {
    return res.status(404).json({ message: "Reservation not found." });
  }

  const reservation = db.reservations[resIndex];
  if (reservation.userId !== user.id && user.role !== "ADMIN" && user.role !== "AGENT") {
    return res.status(403).json({ message: "Permission denied." });
  }

  if (reservation.status !== "PENDING") {
    return res.status(400).json({ message: "Only PENDING reservations can be cancelled." });
  }

  db.reservations[resIndex].status = "CANCELLED";
  saveDB(db);
  res.json(db.reservations[resIndex]);
});


// 7. Agent Operations (Verify, Entry, Exit validations)
app.post("/api/agent/validate-entry", authenticateToken, requireRole(["AGENT", "ADMIN"]), (req, res) => {
  const { plateNumber } = req.body;
  if (!plateNumber) {
    return res.status(400).json({ message: "Plate number is required." });
  }

  const db = loadDB();
  // Find vehicle
  const vehicle = db.vehicles.find((v) => v.plateNumber.toUpperCase() === plateNumber.toUpperCase());
  if (!vehicle) {
    return res.status(404).json({ message: `No registered vehicle found with plate ${plateNumber}.` });
  }

  // Find active or pending reservation for this vehicle today
  const today = new Date().toISOString().split("T")[0];
  const reservation = db.reservations.find(
    (r) => r.vehicleId === vehicle.id && r.reservationDate === today && r.status === "PENDING"
  );

  if (!reservation) {
    return res.status(400).json({ message: "No active or pending reservation found for this plate number today." });
  }

  // Update reservation status to ACTIVE and log entry time
  reservation.status = "ACTIVE";
  reservation.actualEntryTime = new Date().toTimeString().split(" ")[0].substring(0, 5);

  // Update associated slot to OCCUPIED
  const slot = db.slots.find((s) => s.id === reservation.parkingSlotId);
  if (slot) {
    slot.status = "OCCUPIED";
  }

  saveDB(db);
  res.json({
    message: "Vehicle entry validated successfully!",
    reservation,
    vehicle,
    slot,
  });
});

app.post("/api/agent/validate-exit", authenticateToken, requireRole(["AGENT", "ADMIN"]), (req, res) => {
  const { plateNumber } = req.body;
  if (!plateNumber) {
    return res.status(400).json({ message: "Plate number is required." });
  }

  const db = loadDB();
  const vehicle = db.vehicles.find((v) => v.plateNumber.toUpperCase() === plateNumber.toUpperCase());
  if (!vehicle) {
    return res.status(404).json({ message: `No registered vehicle found with plate ${plateNumber}.` });
  }

  const today = new Date().toISOString().split("T")[0];
  const reservation = db.reservations.find(
    (r) => r.vehicleId === vehicle.id && r.reservationDate === today && r.status === "ACTIVE"
  );

  if (!reservation) {
    return res.status(400).json({ message: "No currently ACTIVE reservation found for this vehicle." });
  }

  // Set status to COMPLETED and set exit time
  reservation.status = "COMPLETED";
  reservation.actualExitTime = new Date().toTimeString().split(" ")[0].substring(0, 5);

  // Set slot back to AVAILABLE
  const slot = db.slots.find((s) => s.id === reservation.parkingSlotId);
  if (slot) {
    slot.status = "AVAILABLE";
  }

  saveDB(db);
  res.json({
    message: "Vehicle exit validated successfully!",
    reservation,
    vehicle,
    slot,
  });
});

// Search Reservation by plate (Agent use-case)
app.get("/api/agent/search-plate", authenticateToken, requireRole(["AGENT", "ADMIN"]), (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ message: "Search term query is required." });
  }

  const db = loadDB();
  const searchTerm = String(q).toUpperCase();

  // Find matching vehicles
  const matchingVehicles = db.vehicles.filter(
    (v) => v.plateNumber.includes(searchTerm) || v.brand.toUpperCase().includes(searchTerm) || v.model.toUpperCase().includes(searchTerm)
  );

  const vehicleIds = matchingVehicles.map((v) => v.id);

  // Find reservations for these vehicles
  const list = db.reservations.filter((r) => vehicleIds.includes(r.vehicleId));

  const hydrated = list.map((res) => {
    const rUser = db.users.find((u) => u.id === res.userId);
    const rVehicle = db.vehicles.find((v) => v.id === res.vehicleId);
    const rSlot = db.slots.find((s) => s.id === res.parkingSlotId);
    return {
      ...res,
      user: rUser ? { id: rUser.id, name: `${rUser.firstName} ${rUser.lastName}`, email: rUser.email, phone: rUser.phone } : null,
      vehicle: rVehicle || null,
      parkingSlot: rSlot || null,
    };
  });

  res.json({
    query: q,
    vehicles: matchingVehicles,
    reservations: hydrated,
  });
});

// Anomaly Reporting CRUD
app.get("/api/anomalies", authenticateToken, (req, res) => {
  const db = loadDB();
  res.json(db.anomalies);
});

app.post("/api/anomalies", authenticateToken, requireRole(["AGENT", "ADMIN"]), (req, res) => {
  const { plateNumber, slotNumber, type, description } = req.body;
  const user = (req as any).user;

  if (!slotNumber || !type || !description) {
    return res.status(400).json({ message: "Slot number, type, and description are required." });
  }

  const db = loadDB();
  const newAnomaly: AnomalyReport = {
    id: `anom-${Math.random().toString(36).substring(2, 9)}`,
    reporterId: user.id,
    plateNumber: plateNumber ? plateNumber.toUpperCase() : "UNKNOWN",
    slotNumber: slotNumber.toUpperCase(),
    type,
    description,
    reportedAt: new Date().toISOString(),
    status: "PENDING",
  };

  db.anomalies.push(newAnomaly);
  saveDB(db);
  res.status(201).json(newAnomaly);
});

app.put("/api/anomalies/:id/resolve", authenticateToken, requireRole(["ADMIN", "AGENT"]), (req, res) => {
  const { id } = req.params;
  const db = loadDB();

  const anomaly = db.anomalies.find((a) => a.id === id);
  if (!anomaly) {
    return res.status(404).json({ message: "Anomaly report not found." });
  }

  anomaly.status = "RESOLVED";
  saveDB(db);
  res.json(anomaly);
});


// 8. Admin Dashboard Statistics API
app.get("/api/dashboard/stats", authenticateToken, (req, res) => {
  const db = loadDB();

  const totalUsers = db.users.length;
  const totalVehicles = db.vehicles.length;
  const totalSlots = db.slots.length;

  const availableSlots = db.slots.filter((s) => s.status === "AVAILABLE").length;
  const occupiedSlots = db.slots.filter((s) => s.status === "OCCUPIED").length;
  const maintenanceSlots = db.slots.filter((s) => s.status === "MAINTENANCE").length;

  const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

  const todayStr = new Date().toISOString().split("T")[0];
  const reservationsToday = db.reservations.filter((r) => r.reservationDate === todayStr).length;

  // Breakdown by slots type
  const typeBreakdown = {
    STANDARD: db.slots.filter((s) => s.slotType === "STANDARD").length,
    COMPACT: db.slots.filter((s) => s.slotType === "COMPACT").length,
    EV: db.slots.filter((s) => s.slotType === "EV").length,
    HANDICAPPED: db.slots.filter((s) => s.slotType === "HANDICAPPED").length,
  };

  // Occupancy per zone
  const zones = Array.from(new Set(db.slots.map((s) => s.zone)));
  const zoneStats = zones.map((zone) => {
    const zoneSlots = db.slots.filter((s) => s.zone === zone);
    const occ = zoneSlots.filter((s) => s.status === "OCCUPIED").length;
    const avail = zoneSlots.filter((s) => s.status === "AVAILABLE").length;
    const maint = zoneSlots.filter((s) => s.status === "MAINTENANCE").length;
    return {
      zone,
      total: zoneSlots.length,
      occupied: occ,
      available: avail,
      maintenance: maint,
      occupancyRate: zoneSlots.length > 0 ? Math.round((occ / zoneSlots.length) * 100) : 0,
    };
  });

  // Recent 5 Reservations
  const recentReservations = db.reservations
    .slice(-5)
    .reverse()
    .map((res) => {
      const rUser = db.users.find((u) => u.id === res.userId);
      const rVehicle = db.vehicles.find((v) => v.id === res.vehicleId);
      const rSlot = db.slots.find((s) => s.id === res.parkingSlotId);
      return {
        ...res,
        userName: rUser ? `${rUser.firstName} ${rUser.lastName}` : "Unknown User",
        plateNumber: rVehicle ? rVehicle.plateNumber : "Unknown Plate",
        slotNumber: rSlot ? rSlot.slotNumber : "N/A",
      };
    });

  res.json({
    totalUsers,
    totalVehicles,
    totalSlots,
    availableSlots,
    occupiedSlots,
    maintenanceSlots,
    reservationsToday,
    occupancyRate,
    typeBreakdown,
    zoneStats,
    recentReservations,
  });
});


// --- OPENAPI SWAGGER ENDPOINTS ---
app.get("/v3/api-docs", (req, res) => {
  res.json({
    openapi: "3.0.0",
    info: {
      title: "Smart Campus Parking API Docs",
      description: "Live, interactive REST API document covering the Smart Campus Parking Node.js sandbox server on port 3000.",
      version: "1.0.0"
    },
    servers: [
      {
        url: "/",
        description: "Sandbox Environment Server"
      }
    ],
    components: {
      securitySchemes: {
        TokenAuth: {
          type: "apiKey",
          in: "header",
          name: "Authorization",
          description: "Enter your user session ID token value. Example pre-seeded user ID tokens:\n- Admin: `usr-admin` (full permissions)\n- Guard Officer: `usr-agent1` (validation operations)\n- Student/Faculty: `usr-user1` or `usr-user2` (self booking operations)\n(Input format: `Bearer <token>` or simply the user ID token itself)."
        }
      }
    },
    security: [
      {
        TokenAuth: []
      }
    ],
    paths: {
      "/api/auth/register": {
        "post": {
          "tags": ["Authentication"],
          "summary": "Register a new student/faculty or staff user account",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": ["firstName", "lastName", "email", "password", "phone"],
                  "properties": {
                    "firstName": { "type": "string", "example": "Sarah" },
                    "lastName": { "type": "string", "example": "Jenkins" },
                    "email": { "type": "string", "example": "sarah.j@campus.edu" },
                    "password": { "type": "string", "example": "password123" },
                    "phone": { "type": "string", "example": "+1 (555) 100-2000" },
                    "role": { "type": "string", "enum": ["ADMIN", "AGENT", "USER"], "default": "USER" }
                  }
                }
              }
            }
          },
          "responses": {
            "201": { "description": "Successfully registered new account" },
            "400": { "description": "Missing inputs or email already exists" }
          }
        }
      },
      "/api/auth/login": {
        "post": {
          "tags": ["Authentication"],
          "summary": "Authenticate with email and password",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": ["email", "password"],
                  "properties": {
                    "email": { "type": "string", "example": "admin@campus.edu" },
                    "password": { "type": "string", "example": "admin123" }
                  }
                }
              }
            }
          },
          "responses": {
            "200": { "description": "Login successful, returns authorization token" },
            "401": { "description": "Invalid credentials" }
          }
        }
      },
      "/api/auth/me": {
        "get": {
          "tags": ["Authentication"],
          "summary": "Get authenticated user profile details",
          "responses": {
            "200": { "description": "Current user profile data" },
            "401": { "description": "Unauthorized" }
          }
        }
      },
      "/api/users": {
        "get": {
          "tags": ["User Accounts"],
          "summary": "List all active campus accounts [ADMIN ONLY]",
          "responses": {
            "200": { "description": "Success" }
          }
        },
        "post": {
          "tags": ["User Accounts"],
          "summary": "Provision new student, staff, or guard account [ADMIN ONLY]",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": ["firstName", "lastName", "email", "phone", "role", "password"],
                  "properties": {
                    "firstName": { "type": "string" },
                    "lastName": { "type": "string" },
                    "email": { "type": "string" },
                    "phone": { "type": "string" },
                    "role": { "type": "string", "enum": ["ADMIN", "AGENT", "USER"] },
                    "password": { "type": "string" }
                  }
                }
              }
            }
          },
          "responses": {
            "201": { "description": "Successfully provisioned account" }
          }
        }
      },
      "/api/users/{id}": {
        "put": {
          "tags": ["User Accounts"],
          "summary": "Update specific campus account details [ADMIN ONLY]",
          "parameters": [
            { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "firstName": { "type": "string" },
                    "lastName": { "type": "string" },
                    "email": { "type": "string" },
                    "phone": { "type": "string" },
                    "role": { "type": "string", "enum": ["ADMIN", "AGENT", "USER"] }
                  }
                }
              }
            }
          },
          "responses": {
            "200": { "description": "Account updated" }
          }
        },
        "delete": {
          "tags": ["User Accounts"],
          "summary": "Delete specific campus account [ADMIN ONLY]",
          "parameters": [
            { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
          ],
          "responses": {
            "200": { "description": "Account deleted" }
          }
        }
      },
      "/api/vehicles": {
        "get": {
          "tags": ["Vehicles"],
          "summary": "List registered vehicles (Users see own, Admin/Officer see all)",
          "responses": {
            "200": { "description": "Success" }
          }
        },
        "post": {
          "tags": ["Vehicles"],
          "summary": "Register a new campus vehicle",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": ["plateNumber", "brand", "model", "color"],
                  "properties": {
                    "plateNumber": { "type": "string", "example": "8EFG34" },
                    "brand": { "type": "string", "example": "Toyota" },
                    "model": { "type": "string", "example": "RAV4" },
                    "color": { "type": "string", "example": "Ruby Flare Red" },
                    "ownerId": { "type": "string", "description": "Optional: Specific owner user ID [ADMIN ONLY]" }
                  }
                }
              }
            }
          },
          "responses": {
            "201": { "description": "Vehicle registered successfully" }
          }
        }
      },
      "/api/vehicles/{id}": {
        "put": {
          "tags": ["Vehicles"],
          "summary": "Update vehicle information",
          "parameters": [
            { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "plateNumber": { "type": "string" },
                    "brand": { "type": "string" },
                    "model": { "type": "string" },
                    "color": { "type": "string" }
                  }
                }
              }
            }
          },
          "responses": {
            "200": { "description": "Vehicle updated" }
          }
        },
        "delete": {
          "tags": ["Vehicles"],
          "summary": "Delete specific vehicle from campus registry",
          "parameters": [
            { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
          ],
          "responses": {
            "200": { "description": "Vehicle deleted" }
          }
        }
      },
      "/api/slots": {
        "get": {
          "tags": ["Parking Slots"],
          "summary": "List all physical university parking lots/spots",
          "responses": {
            "200": { "description": "Success" }
          }
        },
        "post": {
          "tags": ["Parking Slots"],
          "summary": "Create new physical parking slot [ADMIN ONLY]",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": ["slotNumber", "zone", "slotType", "status"],
                  "properties": {
                    "slotNumber": { "type": "string", "example": "A-106" },
                    "zone": { "type": "string", "example": "Zone A" },
                    "slotType": { "type": "string", "enum": ["STANDARD", "COMPACT", "EV", "HANDICAPPED"] },
                    "status": { "type": "string", "enum": ["AVAILABLE", "OCCUPIED", "MAINTENANCE"] }
                  }
                }
              }
            }
          },
          "responses": {
            "201": { "description": "Parking slot created successfully" }
          }
        }
      },
      "/api/slots/{id}": {
        "put": {
          "tags": ["Parking Slots"],
          "summary": "Update parking slot details [ADMIN/OFFICER ONLY]",
          "parameters": [
            { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "slotNumber": { "type": "string" },
                    "zone": { "type": "string" },
                    "slotType": { "type": "string", "enum": ["STANDARD", "COMPACT", "EV", "HANDICAPPED"] },
                    "status": { "type": "string", "enum": ["AVAILABLE", "OCCUPIED", "MAINTENANCE"] }
                  }
                }
              }
            }
          },
          "responses": {
            "200": { "description": "Slot updated" }
          }
        },
        "delete": {
          "tags": ["Parking Slots"],
          "summary": "Delete specific parking slot from campus [ADMIN ONLY]",
          "parameters": [
            { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
          ],
          "responses": {
            "200": { "description": "Slot deleted" }
          }
        }
      },
      "/api/reservations": {
        "get": {
          "tags": ["Reservations"],
          "summary": "List reservations (Users see own, Admin/Officer see all)",
          "responses": {
            "200": { "description": "Success" }
          }
        },
        "post": {
          "tags": ["Reservations"],
          "summary": "Book a campus parking spot",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": ["vehicleId", "parkingSlotId", "reservationDate", "startTime", "endTime"],
                  "properties": {
                    "vehicleId": { "type": "string", "example": "veh-1" },
                    "parkingSlotId": { "type": "string", "example": "slot-a1" },
                    "reservationDate": { "type": "string", "example": "2026-06-29" },
                    "startTime": { "type": "string", "example": "09:00" },
                    "endTime": { "type": "string", "example": "12:00" },
                    "userId": { "type": "string", "description": "Optional: Target user ID [ADMIN ONLY]" }
                  }
                }
              }
            }
          },
          "responses": {
            "201": { "description": "Reservation created successfully" },
            "400": { "description": "Overlapping reservation or slot under maintenance" }
          }
        }
      },
      "/api/reservations/{id}/cancel": {
        "put": {
          "tags": ["Reservations"],
          "summary": "Cancel a pending parking reservation",
          "parameters": [
            { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
          ],
          "responses": {
            "200": { "description": "Reservation cancelled" }
          }
        }
      },
      "/api/agent/validate-entry": {
        "post": {
          "tags": ["Security Guard / Officer Operations"],
          "summary": "Scan & validate vehicle entry at guard gate [OFFICER/ADMIN ONLY]",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": ["plateNumber"],
                  "properties": {
                    "plateNumber": { "type": "string", "example": "8EFG34" }
                  }
                }
              }
            }
          },
          "responses": {
            "200": { "description": "Entry successfully logged" },
            "400": { "description": "No pending reservation found" },
            "404": { "description": "Vehicle not registered" }
          }
        }
      },
      "/api/agent/validate-exit": {
        "post": {
          "tags": ["Security Guard / Officer Operations"],
          "summary": "Scan & validate vehicle exit at guard gate [OFFICER/ADMIN ONLY]",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": ["plateNumber"],
                  "properties": {
                    "plateNumber": { "type": "string", "example": "7ABC12" }
                  }
                }
              }
            }
          },
          "responses": {
            "200": { "description": "Exit successfully logged" },
            "400": { "description": "No active reservation found" }
          }
        }
      },
      "/api/agent/search-plate": {
        "get": {
          "tags": ["Security Guard / Officer Operations"],
          "summary": "Search vehicle plate history & reservation status [OFFICER/ADMIN ONLY]",
          "parameters": [
            { "name": "q", "in": "query", "required": true, "schema": { "type": "string" }, "example": "6XYZ" }
          ],
          "responses": {
            "200": { "description": "Search matching vehicles and reservations list" }
          }
        }
      },
      "/api/anomalies": {
        "get": {
          "tags": ["Security Anomalies / Reports"],
          "summary": "List all logged parking violations & anomalies [OFFICER/ADMIN ONLY]",
          "responses": {
            "200": { "description": "Success" }
          }
        },
        "post": {
          "tags": ["Security Anomalies / Reports"],
          "summary": "Submit a new parking security incident [OFFICER/ADMIN ONLY]",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": ["slotNumber", "type", "description"],
                  "properties": {
                    "plateNumber": { "type": "string", "example": "UNKNOWN1" },
                    "slotNumber": { "type": "string", "example": "A-104" },
                    "type": { "type": "string", "enum": ["ILLEGAL_PARKING", "MISMATCH", "OVERSTAY", "OTHER"] },
                    "description": { "type": "string", "example": "Vehicle parked in a maintenance slot without any valid reservation." }
                  }
                }
              }
            }
          },
          "responses": {
            "201": { "description": "Security report successfully created" }
          }
        }
      },
      "/api/anomalies/{id}/resolve": {
        "put": {
          "tags": ["Security Anomalies / Reports"],
          "summary": "Mark specific anomaly report as RESOLVED [OFFICER/ADMIN ONLY]",
          "parameters": [
            { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
          ],
          "responses": {
            "200": { "description": "Security report updated to resolved" }
          }
        }
      },
      "/api/dashboard/stats": {
        "get": {
          "tags": ["Admin Dashboard & Statistics"],
          "summary": "Retrieve real-time metrics, capacity stats, and graphs data [ADMIN/OFFICER ONLY]",
          "responses": {
            "200": { "description": "Real-time statistics metadata" }
          }
        }
      }
    }
  });
});

app.get("/swagger-ui.html", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Smart Campus Parking - API Documentation Explorer</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
    <style>
      html { box-sizing: border-box; overflow-y: scroll; }
      *, *:before, *:after { box-sizing: inherit; }
      body { margin: 0; background: #fafafa; font-family: sans-serif; }
      .topbar { background: #111827; padding: 12px 24px; color: white; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
      .topbar h1 { margin: 0; font-size: 1.15rem; font-weight: 600; display: flex; align-items: center; gap: 10px; }
      .topbar .logo { background: #4f46e5; color: white; width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; }
      .topbar .badge { background: #10b981; color: white; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="topbar">
      <h1><div class="logo">P</div> Smart Campus Parking System API <span style="font-size: 11px; font-weight: normal; opacity: 0.75; margin-left: 5px;">(Live Express Sandbox Mode)</span></h1>
      <span class="badge">OpenAPI 3.0</span>
    </div>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js" charset="UTF-8"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
    <script>
      window.onload = function() {
        const ui = SwaggerUIBundle({
          url: "/v3/api-docs",
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          plugins: [
            SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: "BaseLayout",
          persistAuthorization: true
        });
        window.ui = ui;
      };
    </script>
  </body>
</html>`);
});


// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
