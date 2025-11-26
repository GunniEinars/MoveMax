
import { Move, MoveStatus, Role, StaffMember, Vehicle, WarehouseVault } from '../types';

// Helper to get date relative to today
const getRelativeDate = (daysOffset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

export const INITIAL_VEHICLES: Vehicle[] = [
  { id: 'v1', name: 'Truck 101', type: '26ft Box', volumeCapacity: 1700, licensePlate: 'MV-8821' },
  { id: 'v2', name: 'Truck 102', type: '26ft Box', volumeCapacity: 1700, licensePlate: 'MV-8822' },
  { id: 'v3', name: 'Trailer 500', type: '53ft Trailer', volumeCapacity: 3800, licensePlate: 'TR-9901' },
  { id: 'v4', name: 'Van 05', type: 'Van', volumeCapacity: 400, licensePlate: 'VN-4432' },
];

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    email: 'sarah@movemax.com',
    phone: '555-0101',
    role: Role.ADMIN,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    status: 'Active',
    hourlyRate: 65,
    permissions: {
      profiles: { view: true, edit: true, delete: true },
      projects: { view: true, edit: true, delete: true },
      dispatch: { view: true, edit: true, delete: true },
      settings: { view: true, edit: true, delete: true },
    }
  },
  {
    id: '2',
    name: 'David Chen',
    email: 'david@movemax.com',
    phone: '555-0102',
    role: Role.PROJECT_MANAGER,
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    status: 'Active',
    hourlyRate: 50,
    permissions: {
      profiles: { view: true, edit: true, delete: false },
      projects: { view: true, edit: true, delete: true },
      dispatch: { view: true, edit: true, delete: false },
      settings: { view: false, edit: false, delete: false },
    }
  },
  {
    id: '3',
    name: 'Mike Ross',
    email: 'mike@movemax.com',
    phone: '555-0103',
    role: Role.SITE_SUPERVISOR,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    status: 'Active',
    hourlyRate: 35,
    permissions: {
      profiles: { view: true, edit: false, delete: false },
      projects: { view: true, edit: true, delete: false },
      dispatch: { view: true, edit: false, delete: false },
      settings: { view: false, edit: false, delete: false },
    }
  },
  {
    id: '4',
    name: 'Marcus Johnson',
    email: 'marcus@movemax.com',
    phone: '555-0104',
    role: Role.MOVER,
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    status: 'Active',
    hourlyRate: 25,
    permissions: {
      profiles: { view: true, edit: false, delete: false },
      projects: { view: true, edit: true, delete: false },
      dispatch: { view: true, edit: false, delete: false },
      settings: { view: false, edit: false, delete: false },
    }
  }
];

export const INITIAL_MOVES: Move[] = [
  {
    id: 'P-2024-001',
    customerName: 'TechCorp HQ Relocation',
    origin: '500 Innovation Dr, San Francisco, CA',
    destination: '100 Future Blvd, Austin, TX',
    date: getRelativeDate(0), // Program Start
    status: MoveStatus.IN_PROGRESS,
    value: 145000.00,
    assignedCrewIds: ['2', '3'],
    contactName: 'Jennifer Wu',
    contactEmail: 'j.wu@techcorp.com',
    contactPhone: '(415) 555-9090',
    projectedSavings: { sqFt: 5200, recycledWeight: 12500 },
    retainAuditImages: false,
    departments: [
      { 
          id: 'dept-1', name: 'Executive Wing', moveDate: getRelativeDate(-2), status: 'Completed', 
          headCount: 15, budget: 25000, actualSpend: 22400,
          contactName: 'James Sterling', contactEmail: 'j.sterling@techcorp.com', contactPhone: '(415) 555-9001'
      },
      { 
          id: 'dept-2', name: 'IT Infrastructure', moveDate: getRelativeDate(0), status: 'In Progress', 
          headCount: 8, budget: 45000, actualSpend: 12000,
          contactName: 'Ravi Patel', contactEmail: 'r.patel@techcorp.com', contactPhone: '(415) 555-9002'
      },
      { 
          id: 'dept-3', name: 'Open Office (Sales)', moveDate: getRelativeDate(14), status: 'Pending', 
          headCount: 120, budget: 75000, actualSpend: 0,
          contactName: 'Lisa Monroe', contactEmail: 'l.monroe@techcorp.com', contactPhone: '(415) 555-9003'
      }
    ],
    destinationZones: [
      { id: 'z1', name: 'Exec Suite 301', floor: '3', capacity: 1, coordinates: { x: 80, y: 20 } },
      { id: 'z2', name: 'Server Room B', floor: '1', capacity: 0, coordinates: { x: 15, y: 80 } },
      { id: 'z3', name: 'Open Sales Floor', floor: '2', capacity: 120, coordinates: { x: 50, y: 50 } },
      { id: 'z4', name: 'Conf Room Alpha', floor: '2', capacity: 12, coordinates: { x: 25, y: 25 } }
    ],
    inventory: [
      { 
        id: 'i1', name: 'Exec Desk (Mahogany)', quantity: 4, volume: 120, isFragile: true, room: 'Executive Wing', departmentId: 'dept-1',
        disposition: 'Resell', condition: 'Good', resaleValue: 850, disposalCost: 0
      },
      { 
        id: 'i2', name: 'Herman Miller Chairs', quantity: 120, volume: 600, isFragile: false, room: 'Open Office', departmentId: 'dept-3',
        disposition: 'Keep', condition: 'Good', resaleValue: 0, disposalCost: 0
      },
      { 
        id: 'i3', name: 'Server Racks (42U)', quantity: 8, volume: 320, isFragile: true, room: 'Server Room', departmentId: 'dept-2', loadId: 'load-1',
        disposition: 'Keep', condition: 'Good', resaleValue: 0, disposalCost: 0
      },
      { 
        id: 'i4', name: 'Workstations (Dual Monitor)', quantity: 120, volume: 1200, isFragile: true, room: 'Open Office', departmentId: 'dept-3',
        disposition: 'Recycle', condition: 'Poor', resaleValue: 50, disposalCost: 15
      },
      {
        id: 'i5', name: 'Conf Table (Glass)', quantity: 1, volume: 100, isFragile: true, room: 'Boardroom', departmentId: 'dept-1',
        disposition: 'Donate', condition: 'Fair', resaleValue: 0, disposalCost: 50
      }
    ],
    crates: [
        { 
            id: 'crate-101', name: 'Crate #101', barcode: 'C-101', 
            sourceUnitId: 'mock-1', sourceSubUnitId: 's1', 
            destinationZoneId: 'z1', status: 'Packed' 
        }
    ],
    tasks: [
      { id: 't1', title: 'Disconnect Server Room Power', description: 'Coordinate with IT Director', status: 'Done', assignedTo: '2', departmentId: 'dept-2' },
      { id: 't2', title: 'Pack Executive Art', description: 'Use crate #44', status: 'Done', assignedTo: '3', departmentId: 'dept-1' },
      { id: 't3', title: 'Label Sales Monitors', description: 'Color code Red', status: 'Todo', departmentId: 'dept-3' }
    ],
    phases: [
      { id: 'ph1', name: 'Exec: Crate Delivery', date: getRelativeDate(-4), status: 'Completed', assignedCrewCount: 2, departmentId: 'dept-1' },
      { id: 'ph2', name: 'Exec: Move Day', date: getRelativeDate(-2), status: 'Completed', assignedCrewCount: 4, departmentId: 'dept-1' },
      { id: 'ph3', name: 'IT: Server Decom', date: getRelativeDate(-1), status: 'Completed', assignedCrewCount: 4, departmentId: 'dept-2' },
      { id: 'ph4', name: 'IT: Transport & Install', date: getRelativeDate(0), status: 'In Progress', assignedCrewCount: 8, departmentId: 'dept-2' },
      { id: 'ph5', name: 'Sales: Packing Material Drop', date: getRelativeDate(10), status: 'Pending', assignedCrewCount: 2, departmentId: 'dept-3' },
      { id: 'ph6', name: 'Sales: Main Move', date: getRelativeDate(14), status: 'Pending', assignedCrewCount: 20, departmentId: 'dept-3' },
    ],
    incidents: [
      { 
        id: 'inc-1', 
        projectId: 'P-2024-001', 
        type: 'Damage', 
        description: 'Scuff on hallway wall during server rack transport.', 
        severity: 'Low', 
        status: 'Open', 
        reportedBy: '3',
        reporterName: 'Mike Ross', 
        timestamp: getRelativeDate(0)
      }
    ],
    loads: [
      { id: 'load-1', vehicleId: 'v1', name: 'Load 1 - Server Equip', status: 'Loading', itemsCount: 8, currentVolume: 320 }
    ],
    storagePlan: {
      identifiedUnits: [
          {
            id: 'mock-1',
            name: 'Lateral File Cabinet',
            type: 'Cabinet',
            location: 'Room 102',
            mappedTo: 'Exec Suite 301',
            estimatedCrates: 4,
            coordinates: { x: 20, y: 35 },
            subUnits: [
              { id: 's1', type: 'drawer', label: 'Drawer 1' },
              { id: 's2', type: 'drawer', label: 'Drawer 2' }
            ]
          },
          {
            id: 'mock-2',
            name: 'Reception Desk',
            type: 'Desk',
            location: 'Lobby',
            mappedTo: 'Main Entry',
            estimatedCrates: 2,
            coordinates: { x: 65, y: 70 },
            subUnits: []
          }
      ],
      mappings: []
    },
    destinationPlan: {
        floorplanImage: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBzdHlsZT0iYmFja2dyb3VuZC1jb2xvcjogI2Y4ZmFmYzsiPgogIDwhLS0gV2FsbHMgLS0+CiAgPHJlY3QgeD0iNTAiIHk9IjUwIiB3aWR0aD0iNzAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzM0MTU1IiBzdHJva2Utd2lkdGg9IjQiIC8+CiAgPGxpbmUgeDE9IjQwMCIgeTE9IjUwIiB4Mj0iNDAwIiB5Mj0iNTUwIiBzdHJva2U9IiMzMzQxNTUiIHN0cm9rZS13aWR0aD0iNCIgLz4KICA8bGluZSB4MT0iNTAiIHkxPSIyNTAiIHgyPSI0MDAiIHkyPSIyNTAiIHN0cm9rZT0iIzMzNDE1NSIgc3Ryb2tlLXdpZHRoPSI0IiAvPgogIDwhLS0gRG9vcnMgLS0+CiAgPHJlY3QgeD0iMzg1IiB5PSIyNDAiIHdpZHRoPSIzMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjMzM0MTU1IiAvPgogIDxyZWN0IHg9IjM4NSIgeT0iNTMwIiB3aWR0aD0iMzAiIGhlaWdodD0iMjAiIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzMzNDE1NSIgLz4KICA8IS0tIFJvb20gTGFiZWxzIC0tPgogIDx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzk0YTNiOCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q29uZmVyZW5jZSBBPC90ZXh0PgogIDx0ZXh0IHg9IjIwMCIgeT0iNDAwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzk0YTNiOCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U2VydmVyIFJvb208L3RleHQ+CiAgPHRleHQgeD0iNjAwIiB5PSIzMDAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjOTRhM2I4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5PcGVuIFNhbGVzIEZsb29yPC90ZXh0Pgo8L3N2Zz4='
    },
    documents: [
      { id: 'doc-1', name: 'Master Service Agreement.pdf', type: 'Contract', url: '#', uploadedBy: 'Sarah Jenkins', uploadedAt: getRelativeDate(-10), size: '2.4 MB' },
      { id: 'doc-2', name: 'Certificate of Insurance.pdf', type: 'PDF', url: '#', uploadedBy: 'Sarah Jenkins', uploadedAt: getRelativeDate(-10), size: '1.1 MB' },
      { id: 'doc-3', name: 'New Office Blueprint.png', type: 'Image', url: '#', uploadedBy: 'David Chen', uploadedAt: getRelativeDate(-5), size: '8.5 MB' }
    ],
    expenses: [
      { id: 'exp-1', projectId: 'P-2024-001', category: 'Materials', amount: 1250.50, description: '100x Eco Crates', date: getRelativeDate(-5), loggedBy: 'Sarah Jenkins' },
      { id: 'exp-2', projectId: 'P-2024-001', category: 'Fuel', amount: 185.00, description: 'Diesel for Truck 101', date: getRelativeDate(0), loggedBy: 'Mike Ross' }
    ],
    timeEntries: [
       { id: 'te-1', staffId: '3', staffName: 'Mike Ross', projectId: 'P-2024-001', startTime: getRelativeDate(-2) + 'T08:00:00', endTime: getRelativeDate(-2) + 'T16:00:00', durationHours: 8, cost: 280 },
       { id: 'te-2', staffId: '4', staffName: 'Marcus Johnson', projectId: 'P-2024-001', startTime: getRelativeDate(-2) + 'T08:00:00', endTime: getRelativeDate(-2) + 'T16:00:00', durationHours: 8, cost: 200 }
    ]
  },
  {
    id: 'P-2024-002',
    customerName: 'Law Firm Partners',
    origin: '12 Wall St, NY',
    destination: '88 Madison Ave, NY',
    date: getRelativeDate(1),
    status: MoveStatus.BOOKED,
    value: 12500.00,
    contactName: 'Robert Pearson',
    contactEmail: 'r.pearson@lfp.law',
    contactPhone: '(212) 555-0011',
    assignedCrewIds: ['3'],
    projectedSavings: { sqFt: 0, recycledWeight: 0 },
    retainAuditImages: true,
    departments: [
      { 
          id: 'd1', name: 'Main Office', moveDate: getRelativeDate(1), status: 'Pending', budget: 12000, actualSpend: 500,
          contactName: 'Admin Desk', contactEmail: 'admin@lfp.law'
      }
    ],
    inventory: [
      { id: 'i4', name: 'File Cabinets (Lateral)', quantity: 12, volume: 200, isFragile: false, room: 'Archives', departmentId: 'd1', disposition: 'Recycle', condition: 'Poor' },
    ],
    tasks: [
      { id: 't3', title: 'Secure Parking Permit', description: 'Need 40ft spot', status: 'Todo', departmentId: 'd1' }
    ],
    phases: [
      { id: 'ph1', name: 'File Packing', date: getRelativeDate(0), status: 'Pending', assignedCrewCount: 4, departmentId: 'd1' },
      { id: 'ph2', name: 'Furniture Move', date: getRelativeDate(1), status: 'Pending', assignedCrewCount: 6, departmentId: 'd1' },
    ],
    incidents: [],
    documents: [],
    expenses: [],
    timeEntries: []
  },
  {
    id: 'P-2024-003',
    customerName: 'StartUp Inc.',
    origin: 'WeWork, Seattle',
    destination: 'Private Office, Seattle',
    date: getRelativeDate(3),
    status: MoveStatus.PENDING,
    value: 5200.00,
    assignedCrewIds: [],
    inventory: [],
    tasks: [],
    phases: [],
    projectedSavings: { sqFt: 0, recycledWeight: 0 },
    retainAuditImages: false,
    incidents: [],
    documents: [],
    expenses: [],
    timeEntries: []
  },
  {
    id: 'P-2024-004',
    customerName: 'Global Logistics Branch',
    origin: 'Warehouse A',
    destination: 'Warehouse B',
    date: getRelativeDate(1),
    status: MoveStatus.BOOKED,
    value: 8500.00,
    assignedCrewIds: [],
    inventory: [],
    tasks: [],
    phases: [],
    projectedSavings: { sqFt: 0, recycledWeight: 0 },
    retainAuditImages: false,
    incidents: [],
    documents: [],
    expenses: [],
    timeEntries: []
  }
];

export const INITIAL_WAREHOUSE: WarehouseVault[] = (() => {
  const vaults: WarehouseVault[] = [];
  for (let i = 1; i <= 60; i++) {
    const isOccupied = Math.random() > 0.6;
    vaults.push({
      id: `V-${100 + i}`,
      status: isOccupied ? 'Occupied' : 'Empty',
      locationCode: `Row ${Math.ceil(i/10)}-${i%10 || 10}`,
      projectId: isOccupied ? 'P-2024-001' : undefined,
      clientName: isOccupied ? 'TechCorp HQ Relocation' : undefined,
      contentsDescription: isOccupied ? 'Office Furniture Storage' : undefined,
      updatedAt: getRelativeDate(isOccupied ? -5 : -20)
    });
  }
  return vaults;
})();
