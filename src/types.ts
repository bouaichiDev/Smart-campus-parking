export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "ADMIN" | "AGENT" | "USER";
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  color: string;
  ownerId: string;
}

export interface ParkingSlot {
  id: string;
  slotNumber: string;
  zone: string;
  slotType: "STANDARD" | "COMPACT" | "EV" | "HANDICAPPED";
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
}

export interface Reservation {
  id: string;
  userId: string;
  vehicleId: string;
  parkingSlotId: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  actualEntryTime?: string;
  actualExitTime?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  vehicle?: Vehicle | null;
  parkingSlot?: ParkingSlot | null;
}

export interface AnomalyReport {
  id: string;
  reporterId: string;
  plateNumber: string;
  slotNumber: string;
  type: "MISMATCH" | "OVERSTAY" | "ILLEGAL_PARKING" | "OTHER";
  description: string;
  reportedAt: string;
  status: "PENDING" | "RESOLVED";
}

export interface ZoneStats {
  zone: string;
  total: number;
  occupied: number;
  available: number;
  maintenance: number;
  occupancyRate: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalVehicles: number;
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  maintenanceSlots: number;
  reservationsToday: number;
  occupancyRate: number;
  typeBreakdown: {
    STANDARD: number;
    COMPACT: number;
    EV: number;
    HANDICAPPED: number;
  };
  zoneStats: ZoneStats[];
  recentReservations: Array<any>;
}
