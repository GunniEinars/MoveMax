import React, { createContext, useContext, useState, useEffect } from 'react';
import { Move, StaffMember, ActivityLogEntry, Incident, AppSettings, Expense, TimeEntry } from '../types';
import { INITIAL_MOVES, INITIAL_STAFF } from '../services/mockData';

interface StoreContextType {
  moves: Move[];
  staff: StaffMember[];
  logs: ActivityLogEntry[];
  settings: AppSettings;
  updateMove: (updatedMove: Move) => void;
  addMove: (newMove: Move) => void;
  deleteMove: (moveId: string) => void;
  updateStaff: (updatedStaff: StaffMember) => void;
  addStaff: (newStaff: StaffMember) => void;
  deleteStaff: (staffId: string) => void;
  logActivity: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void;
  reportIncident: (incident: Incident) => void;
  resolveIncident: (incidentId: string, projectId: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetStore: () => void;
  addExpense: (expense: Expense) => void;
  clockIn: (staffId: string, projectId: string) => void;
  clockOut: (staffId: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};

const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'MoveMax Logistics',
  supportEmail: 'support@movemax.com',
  weightUnit: 'lbs',
  distanceUnit: 'mi',
  currency: 'USD',
  integrations: {
    slack: false,
    googleCalendar: true,
    quickbooks: false
  },
  notifications: {
    emailDailyDigest: true,
    emailIncidents: true,
    smsCritical: true
  }
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [moves, setMoves] = useState<Move[]>(INITIAL_MOVES);
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const storedMoves = localStorage.getItem('movemax_moves');
    const storedStaff = localStorage.getItem('movemax_staff');
    const storedLogs = localStorage.getItem('movemax_logs');
    const storedSettings = localStorage.getItem('movemax_settings');

    if (storedMoves) setMoves(JSON.parse(storedMoves));
    if (storedStaff) setStaff(JSON.parse(storedStaff));
    if (storedLogs) setLogs(JSON.parse(storedLogs));
    if (storedSettings) setSettings(JSON.parse(storedSettings));
    
    setIsInitialized(true);
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('movemax_moves', JSON.stringify(moves));
    localStorage.setItem('movemax_staff', JSON.stringify(staff));
    localStorage.setItem('movemax_logs', JSON.stringify(logs));
    localStorage.setItem('movemax_settings', JSON.stringify(settings));
  }, [moves, staff, logs, settings, isInitialized]);

  const updateMove = (updatedMove: Move) => {
    setMoves((prev) => prev.map((m) => (m.id === updatedMove.id ? updatedMove : m)));
  };

  const addMove = (newMove: Move) => {
    setMoves((prev) => [newMove, ...prev]);
  };

  const deleteMove = (moveId: string) => {
    setMoves((prev) => prev.filter((m) => m.id !== moveId));
  };

  const updateStaff = (updatedStaff: StaffMember) => {
    setStaff((prev) => prev.map((s) => (s.id === updatedStaff.id ? updatedStaff : s)));
  };

  const addStaff = (newStaff: StaffMember) => {
    setStaff((prev) => [...prev, newStaff]);
  };

  const deleteStaff = (staffId: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== staffId));
  };

  const logActivity = (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => {
    const newLog: ActivityLogEntry = {
      ...entry,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const reportIncident = (incident: Incident) => {
    setMoves((prev) => prev.map(m => {
       if (m.id === incident.projectId) {
         return {
           ...m,
           incidents: [incident, ...(m.incidents || [])]
         };
       }
       return m;
    }));
  };

  const resolveIncident = (incidentId: string, projectId: string) => {
    setMoves((prev) => prev.map(m => {
       if (m.id === projectId) {
         return {
           ...m,
           incidents: (m.incidents || []).map(inc => 
             inc.id === incidentId ? { ...inc, status: 'Resolved' } : inc
           )
         };
       }
       return m;
    }));
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const addExpense = (expense: Expense) => {
     setMoves(prev => prev.map(m => {
        if (m.id === expense.projectId) {
           return { ...m, expenses: [expense, ...(m.expenses || [])] };
        }
        return m;
     }));
  };

  const clockIn = (staffId: string, projectId: string) => {
     const staffMember = staff.find(s => s.id === staffId);
     const newEntry: TimeEntry = {
        id: `te-${Date.now()}`,
        staffId,
        staffName: staffMember?.name || 'Unknown',
        projectId,
        startTime: new Date().toISOString(),
     };
     
     setMoves(prev => prev.map(m => {
        if (m.id === projectId) {
           return { ...m, timeEntries: [newEntry, ...(m.timeEntries || [])] };
        }
        return m;
     }));
  };

  const clockOut = (staffId: string) => {
     const staffMember = staff.find(s => s.id === staffId);
     const hourlyRate = staffMember?.hourlyRate || 0;
     const now = new Date();

     // Find ALL active entries for this staff member
     const activeEntries = moves.flatMap(m =>
       (m.timeEntries || [])
         .filter(te => te.staffId === staffId && !te.endTime)
         .map(te => ({ moveId: m.id, entry: te }))
     );

     if (activeEntries.length === 0) {
       // No active entries found
       return;
     }

     // Clock out from the MOST RECENT entry (by start time)
     const mostRecent = activeEntries.sort((a, b) =>
       new Date(b.entry.startTime).getTime() - new Date(a.entry.startTime).getTime()
     )[0];

     setMoves(prev => prev.map(m => {
        if (m.id !== mostRecent.moveId) return m;

        const activeEntryIndex = (m.timeEntries || []).findIndex(
          te => te.id === mostRecent.entry.id
        );

        if (activeEntryIndex > -1 && m.timeEntries) {
           const entry = m.timeEntries[activeEntryIndex];
           const startTime = new Date(entry.startTime);
           const durationHours = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
           const cost = durationHours * hourlyRate;

           const updatedEntries = [...m.timeEntries];
           updatedEntries[activeEntryIndex] = {
              ...entry,
              endTime: now.toISOString(),
              durationHours: Number(durationHours.toFixed(2)),
              cost: Number(cost.toFixed(2))
           };

           return { ...m, timeEntries: updatedEntries };
        }
        return m;
     }));
  };

  const resetStore = () => {
    setMoves(INITIAL_MOVES);
    setStaff(INITIAL_STAFF);
    setLogs([]);
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('movemax_moves');
    localStorage.removeItem('movemax_staff');
    localStorage.removeItem('movemax_logs');
    localStorage.removeItem('movemax_settings');
    window.location.reload();
  };

  return (
    <StoreContext.Provider value={{ 
      moves, staff, logs, settings, 
      updateMove, addMove, deleteMove, 
      updateStaff, addStaff, deleteStaff, 
      logActivity, reportIncident, resolveIncident,
      updateSettings, resetStore,
      addExpense, clockIn, clockOut
    }}>
      {children}
    </StoreContext.Provider>
  );
};
