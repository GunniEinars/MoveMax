
import React from 'react';

export enum MoveStatus {
  PENDING = 'Pending',
  QUOTED = 'Quoted',
  BOOKED = 'Booked',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export interface DestinationZone {
  id: string;
  name: string; // e.g. "Room 305", "Conf Room A"
  floor?: string;
  capacity?: number; // Max people or volume
  coordinates?: { x: number; y: number }; // % position on destination floorplan
}

export interface MoveDepartment {
  id: string;
  name: string; // e.g. "Legal Dept", "IT Infrastructure"
  moveDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  headCount?: number; // Number of employees in this dept
  budget?: number;
  actualSpend?: number;
  // Contact Info
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export type DispositionStatus = 'Keep' | 'Resell' | 'Donate' | 'Recycle' | 'Trash' | 'Digitize';
export type AssetCondition = 'New' | 'Good' | 'Fair' | 'Poor' | 'Damaged';
export type ProcessStatus = 'Pending' | 'Packed' | 'Moved' | 'Unpacked';

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  volume: number; // cubic feet
  isFragile: boolean;
  room: string;
  departmentId?: string; // Linked to a specific sub-project
  loadId?: string; // Assigned to a specific truck load
  crateId?: string; // Assigned to a specific physical crate/box
  status?: 'Pending' | 'Packed' | 'Loaded' | 'Delivered';
  
  // Hierarchical Links
  storageUnitId?: string; // Parent Cabinet
  storageSubUnitId?: string; // Parent Drawer/Shelf

  // Disposition & Audit Fields
  disposition?: DispositionStatus;
  condition?: AssetCondition;
  resaleValue?: number; // Estimated value per unit
  disposalCost?: number; // Cost to trash/recycle per unit
  contentType?: 'Files' | 'Supplies' | 'Tech' | 'Personal' | 'Furniture' | 'Other';
  auditImageUrl?: string; // Optional: Only populated if retention is enabled
}

export interface MoveCrate {
  id: string;
  name: string; // e.g. "Crate #1001"
  barcode: string;
  sourceUnitId?: string;
  sourceSubUnitId?: string;
  destinationZoneId?: string;
  destinationUnitId?: string; // If mapping to a specific new cabinet
  destinationSubUnitId?: string; // If mapping to a specific new drawer
  status: ProcessStatus;
}

export interface StorageSubUnit {
  id: string;
  type: 'drawer' | 'shelf' | 'cabinet_space';
  label: string; // e.g., "Top Drawer", "Bottom Shelf"
}

export interface DetectedItem {
  type: string;
  count: number;
  suggestedDisposition?: DispositionStatus;
}

export interface ContainerScanResult {
  id: string;
  timestamp: string;
  items: DetectedItem[];
  confidence: number;
}

export interface StorageUnit {
  id: string;
  name: string; // e.g., "Master Bedroom Dresser"
  type: string; // e.g., "Dresser", "Wardrobe"
  subUnits: StorageSubUnit[];
  detectedFromImage?: boolean;
  estimatedCrates?: number;
  scans?: ContainerScanResult[];
  location?: string; // Origin Room/Zone e.g. "Room 102"
  mappedTo?: string; // Destination Room/Zone e.g. "Room 305"
  status?: 'Pending' | 'In Transit' | 'Delivered'; // Execution status
  departmentId?: string;
  coordinates?: { x: number; y: number }; // % position on floorplan (0-100)
  assetTag?: string; // The physical sticker number (e.g. "1005")
}

export interface ContentMapping {
  sourceId: string; // ID of the StorageSubUnit
  sourceLabel: string;
  destinationLabel: string; // Predicted destination
  status: 'planned' | 'packed' | 'moved';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo?: string; // ID of staff
  status: 'Todo' | 'In Progress' | 'Done';
  isAiGenerated?: boolean;
  proofOfWork?: string; // URL to photo
  departmentId?: string;
}

export interface ProjectPhase {
  id: string;
  name: string; // e.g. "Crate Delivery", "Packing", "Move Day"
  date: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  assignedCrewCount?: number;
  departmentId?: string;
}

export interface ActivityLogEntry {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  action: string; // e.g. "Moved Asset", "Completed Task"
  timestamp: string;
  details?: string;
}

export type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type IncidentStatus = 'Open' | 'Investigating' | 'Resolved';

export interface Incident {
  id: string;
  projectId: string;
  type: string; // 'Damage', 'Access', 'Safety', 'Other'
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedBy: string; // UserId
  reporterName?: string;
  timestamp: string;
  photoUrl?: string; // In a real app, this is a URL. We might simulate with base64 for demo
  aiAnalysis?: string;
}

export interface Vehicle {
  id: string;
  name: string; // e.g. "Truck 101"
  type: '26ft Box' | '53ft Trailer' | 'Van';
  volumeCapacity: number; // cu ft
  licensePlate?: string;
}

export interface MoveLoad {
  id: string;
  vehicleId: string;
  name: string; // e.g. "Load 1 - IT Equipment"
  sealNumber?: string;
  driverName?: string;
  status: 'Planned' | 'Loading' | 'In Transit' | 'Unloading' | 'Complete';
  itemsCount: number;
  currentVolume: number;
  signature?: string; // Base64
  signedAt?: string;
}

export interface MoveDocument {
  id: string;
  name: string;
  type: 'PDF' | 'Image' | 'Spreadsheet' | 'Contract' | 'Other';
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  size: string;
}

export interface TimeEntry {
  id: string;
  staffId: string;
  staffName: string;
  projectId: string;
  startTime: string; // ISO
  endTime?: string; // ISO
  durationHours?: number; // Calculated on close
  cost?: number; // Calculated based on rate at time of entry
}

export interface Expense {
  id: string;
  projectId: string;
  category: 'Fuel' | 'Materials' | 'Parking' | 'Food' | 'Permits' | 'Other';
  amount: number;
  description: string;
  date: string;
  loggedBy: string;
}

export interface Move {
  id: string;
  customerName: string; // Corporate Client Name
  origin: string;
  destination: string;
  date: string; // Main program start date
  status: MoveStatus;
  value: number;
  inventory: InventoryItem[];
  assignedCrewIds: string[];
  notes?: string;
  departments?: MoveDepartment[]; // Sub-projects
  destinationZones?: DestinationZone[]; // Valid drop-off locations
  storagePlan?: {
    identifiedUnits: StorageUnit[];
    mappings: ContentMapping[];
    floorplanImage?: string; // Base64 image of the floorplan
  };
  destinationPlan?: {
    floorplanImage?: string; // Base64 image of destination layout
  };
  crates?: MoveCrate[]; // Planning crates
  tasks?: Task[];
  phases?: ProjectPhase[];
  incidents?: Incident[]; // Risks and Issues
  loads?: MoveLoad[]; // Logistics
  documents?: MoveDocument[]; // Contracts, COIs, etc.
  expenses?: Expense[];
  timeEntries?: TimeEntry[];
  projectedSavings?: {
    sqFt: number;
    recycledWeight: number; // in lbs or units
  };
  liquidationTotal?: number; // Total value recovered from resale
  
  // Project Contact
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;

  // Configuration
  retainAuditImages?: boolean; // Billable feature
}

export enum Role {
  ADMIN = 'Admin',
  PROJECT_MANAGER = 'Project Manager',
  SITE_SUPERVISOR = 'Site Supervisor',
  MOVER = 'Mover'
}

export interface Permission {
  view: boolean;
  edit: boolean;
  delete: boolean;
}

export interface PagePermissions {
  profiles: Permission;
  projects: Permission;
  dispatch: Permission;
  settings: Permission;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatarUrl?: string;
  permissions: PagePermissions;
  status: 'Active' | 'Inactive';
  hourlyRate?: number;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
}

export interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export interface AppSettings {
  companyName: string;
  supportEmail: string;
  weightUnit: 'lbs' | 'kg';
  distanceUnit: 'mi' | 'km';
  currency: 'USD' | 'EUR' | 'GBP';
  integrations: {
    slack: boolean;
    googleCalendar: boolean;
    quickbooks: boolean;
  };
  notifications: {
    emailDailyDigest: boolean;
    emailIncidents: boolean;
    smsCritical: boolean;
  };
}

export interface WarehouseVault {
  id: string;
  status: 'Occupied' | 'Empty';
  locationCode: string;
  projectId?: string;
  clientName?: string;
  contentsDescription?: string;
  updatedAt: string;
}

export interface LabelTemplate {
  type: 'Crate' | 'Asset' | 'Room';
  size: '4x6' | 'Letter';
  includeQr: boolean;
  includeDestination: boolean;
}