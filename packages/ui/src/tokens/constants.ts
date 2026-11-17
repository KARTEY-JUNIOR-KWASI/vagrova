/**
 * Vagrova Design Tokens — Job Status
 *
 * One shared status list used by Customer App, Driver App and Admin.
 * The customer, driver and admin always see the same state.
 */

export const JOB_STATUS = {
  REQUESTED: 'requested',
  BEING_PRICED: 'being_priced',
  QUOTE_SENT: 'quote_sent',
  BOOKED: 'booked',
  OFFERED: 'offered',
  ASSIGNED: 'assigned',
  HEADING_TO_PICKUP: 'heading_to_pickup',
  LOADED: 'loaded',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  // Exit statuses
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  DISPUTED: 'disputed',
} as const;

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

/** Human-readable label for each status */
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  requested: 'Requested',
  being_priced: 'Being Priced',
  quote_sent: 'Quote Sent',
  booked: 'Booked',
  offered: 'Offered to Drivers',
  assigned: 'Driver Assigned',
  heading_to_pickup: 'Heading to Pickup',
  loaded: 'Loaded',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  expired: 'Quote Expired',
  disputed: 'Disputed',
};

/** Color token (left edge of status chip) for each status */
export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  requested: '#6B7075',       // gravelGrey — neutral/new
  being_priced: '#FFC600',    // safetyAmber — in progress
  quote_sent: '#FFC600',      // safetyAmber — awaiting customer action
  booked: '#2E7D4F',          // weighbridgeGreen — confirmed
  offered: '#FFC600',         // safetyAmber — awaiting driver action
  assigned: '#2E7D4F',        // weighbridgeGreen — confirmed
  heading_to_pickup: '#2E7D4F',
  loaded: '#2E7D4F',
  in_transit: '#2E7D4F',
  delivered: '#2E7D4F',
  completed: '#2E7D4F',
  cancelled: '#B3391B',       // rustRed
  expired: '#B3391B',
  disputed: '#B3391B',
};

// ─── Vehicle types ────────────────────────────────────────────────────────────

export const VEHICLE_TYPES = [
  'tipper',
  'flatbed',
  'lowbed',
  'container_carrier',
  'tanker',
  'crane_truck',
  'tow_recovery',
  'refrigerated',
] as const;

export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  tipper: 'Tipper',
  flatbed: 'Flatbed',
  lowbed: 'Lowbed',
  container_carrier: 'Container Carrier',
  tanker: 'Tanker',
  crane_truck: 'Crane Truck',
  tow_recovery: 'Tow / Recovery',
  refrigerated: 'Refrigerated',
};

export const VEHICLE_CAPACITY: Record<VehicleType, string> = {
  tipper: 'Up to 30 tonnes',
  flatbed: 'Up to 40 tonnes',
  lowbed: 'Up to 60 tonnes',
  container_carrier: '20ft & 40ft containers',
  tanker: 'Up to 30,000 litres',
  crane_truck: 'Up to 50 tonnes lift',
  tow_recovery: 'Up to 10 tonnes',
  refrigerated: 'Up to 20 tonnes',
};

export const VEHICLE_USE: Record<VehicleType, string> = {
  tipper: 'Sand, gravel, laterite, aggregate',
  flatbed: 'Machinery, steel, timber, general cargo',
  lowbed: 'Heavy plant, excavators, bulldozers',
  container_carrier: 'Shipping containers — port runs',
  tanker: 'Fuel, water, chemicals, edible liquids',
  crane_truck: 'Lifting heavy loads at site',
  tow_recovery: 'Broken-down vehicles',
  refrigerated: 'Perishable goods, frozen produce',
};

// ─── Document types ───────────────────────────────────────────────────────────

export const DOCUMENT_TYPES = [
  'drivers_licence',
  'vehicle_registration',
  'roadworthy_certificate',
  'insurance',
  'national_id',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  drivers_licence: "Driver's Licence",
  vehicle_registration: 'Vehicle Registration',
  roadworthy_certificate: 'Roadworthy Certificate',
  insurance: 'Insurance Certificate',
  national_id: 'National ID Card',
};

// ─── User roles ───────────────────────────────────────────────────────────────

export const USER_ROLES = [
  'customer',
  'owner',
  'driver',
  'agent',
  'dispatcher',
  'finance',
  'admin',
  'super_admin',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

