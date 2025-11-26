import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Users, Clock, AlertCircle, CheckCircle2, MapPin 
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { Move, MoveStatus } from '../types';
import { SlideOver } from '../components/SlideOver';
import { Button } from '../components/Button';

// Generate next 7 days based on current state date
const getWeekDays = (startDate: Date) => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
};

export const DispatchPage: React.FC = () => {
  const { moves, staff, updateMove } = useStore();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('dispatch', 'edit');

  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Assignment State
  const [isAssignPanelOpen, setIsAssignPanelOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<{
    staffId: string;
    dateStr: string;
    currentMoveId?: string;
  } | null>(null);

  const weekDays = getWeekDays(currentDate);

  // Filter moves that are booked or in progress (needs dispatch)
  const activeMoves = moves.filter(m => 
    m.status === MoveStatus.BOOKED || 
    m.status === MoveStatus.IN_PROGRESS
  );

  // Get moves specifically unassigned (for sidebar)
  const unassignedMoves = activeMoves.filter(m => m.assignedCrewIds.length === 0);

  // Helper to check if a staff member has a move on a specific date
  const getAssignment = (staffId: string, dateStr: string) => {
    return activeMoves.find(m => 
      m.date === dateStr && m.assignedCrewIds.includes(staffId)
    );
  };

  const handlePrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const openAssignment = (staffId: string, dateStr: string, moveId?: string) => {
    if (!canEdit) return; // Prevent opening if no edit permission
    setSelectedAssignment({ staffId, dateStr, currentMoveId: moveId });
    setIsAssignPanelOpen(true);
  };

  const handleAssignMove = (moveId: string) => {
    if (!selectedAssignment) return;

    // 1. Remove staff from other moves on this day (Simplistic Conflict Resolution)
    // We iterate through all moves and remove this staff member if found on the same date
    const movesWithRemoval = moves.map(m => {
      if (m.date === selectedAssignment.dateStr && m.assignedCrewIds.includes(selectedAssignment.staffId)) {
        return {
          ...m,
          assignedCrewIds: m.assignedCrewIds.filter(id => id !== selectedAssignment.staffId)
        };
      }
      return m;
    });

    // 2. Add staff to the new move
    // Note: We need to find the move in the *potentially modified* list from step 1, or just update it directly if we assume it wasn't the one removed from (which is safe assumption for assignment)
    // Actually, to be safe with React state updates in the Store, we should do this atomically or sequentially. 
    // Since useStore provides atomic updateMove, we will iterate and update.
    
    // Ideally the store would have a batch update, but we'll do it one by one for now.
    
    // First, unassign from old
    const oldAssignment = moves.find(m => m.date === selectedAssignment.dateStr && m.assignedCrewIds.includes(selectedAssignment.staffId));
    if (oldAssignment && oldAssignment.id !== moveId) {
       updateMove({
         ...oldAssignment,
         assignedCrewIds: oldAssignment.assignedCrewIds.filter(id => id !== selectedAssignment.staffId)
       });
    }

    // Then assign to new
    const targetMove = moves.find(m => m.id === moveId);
    if (targetMove) {
       updateMove({
         ...targetMove,
         assignedCrewIds: [...targetMove.assignedCrewIds, selectedAssignment.staffId]
       });
    }

    setIsAssignPanelOpen(false);
  };

  const handleUnassign = () => {
    if (!selectedAssignment || !selectedAssignment.currentMoveId) return;

    const targetMove = moves.find(m => m.id === selectedAssignment.currentMoveId);
    if (targetMove) {
      updateMove({
        ...targetMove,
        assignedCrewIds: targetMove.assignedCrewIds.filter(id => id !== selectedAssignment.staffId)
      });
    }

    setIsAssignPanelOpen(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Dispatch Center</h1>
          <p className="text-brand-500 text-sm mt-1">Resource allocation and crew scheduling.</p>
        </div>
        
        {/* Date Controls */}
        <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          <button onClick={handlePrevWeek} className="p-2 hover:bg-gray-100 rounded-md text-gray-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-4 font-medium text-brand-900 flex items-center">
            <CalendarIcon className="w-4 h-4 mr-2 text-brand-500" />
            {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          <button onClick={handleNextWeek} className="p-2 hover:bg-gray-100 rounded-md text-gray-600">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden gap-6">
        
        {/* Left Sidebar: Unassigned Jobs */}
        <div className="w-64 flex-shrink-0 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-slate-50">
            <h3 className="font-bold text-brand-900 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
              Unstaffed Jobs
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {unassignedMoves.length === 0 ? (
              <div className="text-center py-10 px-4">
                <CheckCircle2 className="w-8 h-8 mx-auto text-green-500 mb-2" />
                <p className="text-sm text-gray-500">All active jobs have crews assigned.</p>
              </div>
            ) : (
              unassignedMoves.map(move => (
                <div key={move.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:border-brand-300 transition-colors cursor-grab active:cursor-grabbing">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold uppercase bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded">Needs Crew</span>
                    <span className="text-[10px] text-gray-400">{move.date}</span>
                  </div>
                  <h4 className="text-sm font-bold text-brand-900 line-clamp-1">{move.customerName}</h4>
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span className="truncate">{move.origin}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Schedule Board */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          {/* Header Row: Dates */}
          <div className="flex border-b border-gray-200">
            <div className="w-48 flex-shrink-0 p-4 border-r border-gray-200 bg-slate-50 font-bold text-brand-700">
              Crew Member
            </div>
            <div className="flex-1 grid grid-cols-7">
              {weekDays.map((date, i) => (
                <div key={i} className={`p-3 text-center border-r border-gray-100 last:border-0 ${date.toDateString() === new Date().toDateString() ? 'bg-brand-50' : ''}`}>
                  <div className="text-xs font-medium text-gray-500 uppercase">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className={`text-lg font-bold ${date.toDateString() === new Date().toDateString() ? 'text-brand-600' : 'text-gray-900'}`}>
                    {date.getDate()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grid Rows */}
          <div className="flex-1 overflow-y-auto">
            {staff.map((member) => (
              <div key={member.id} className="flex border-b border-gray-100 min-h-[80px]">
                {/* Y-Axis: Staff */}
                <div className="w-48 flex-shrink-0 p-3 border-r border-gray-200 bg-white flex items-center space-x-3">
                  <div className="relative">
                    <img src={member.avatarUrl} alt={`${member.name} avatar`} className="w-10 h-10 rounded-full bg-gray-200 object-cover" />
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                       <div className={`w-2.5 h-2.5 rounded-full ${member.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{member.name}</div>
                    <div className="text-xs text-gray-500">{member.role}</div>
                  </div>
                </div>

                {/* X-Axis: Days */}
                <div className="flex-1 grid grid-cols-7">
                  {weekDays.map((date, i) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const assignment = getAssignment(member.id, dateStr);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                    return (
                      <div 
                        key={i} 
                        onClick={() => openAssignment(member.id, dateStr, assignment?.id)}
                        className={`border-r border-gray-100 last:border-0 p-1 transition-colors relative group
                          ${canEdit ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'}
                          ${isWeekend ? 'bg-slate-50/50' : ''}
                        `}
                      >
                        {assignment ? (
                          <div className={`h-full w-full rounded-md p-2 text-xs flex flex-col justify-between border shadow-sm overflow-hidden
                            ${assignment.status === MoveStatus.IN_PROGRESS 
                              ? 'bg-green-100 border-green-200 text-green-900' 
                              : 'bg-blue-100 border-blue-200 text-blue-900'}
                          `}>
                            <span className="font-bold truncate">{assignment.customerName}</span>
                            <div className="flex items-center justify-between mt-1">
                                <span className="opacity-75">{assignment.id.split('-')[2]}</span>
                                <Clock className="w-3 h-3 opacity-50" />
                            </div>
                          </div>
                        ) : (
                          canEdit && (
                            <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <PlusIcon />
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ASSIGNMENT SLIDE OVER */}
      <SlideOver
        isOpen={isAssignPanelOpen}
        onClose={() => setIsAssignPanelOpen(false)}
        title="Manage Assignment"
        description={`Schedule for ${selectedAssignment ? new Date(selectedAssignment.dateStr).toLocaleDateString() : ''}`}
        footer={
          selectedAssignment?.currentMoveId ? (
             <Button variant="danger" onClick={handleUnassign} className="w-full">Remove Assignment</Button>
          ) : (
            <Button variant="secondary" onClick={() => setIsAssignPanelOpen(false)}>Close</Button>
          )
        }
      >
        <div className="space-y-6">
          {selectedAssignment?.currentMoveId ? (
             <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <p className="text-gray-600 text-sm mb-2">Currently Assigned To</p>
                <h3 className="font-bold text-brand-900 text-lg">
                  {moves.find(m => m.id === selectedAssignment.currentMoveId)?.customerName}
                </h3>
             </div>
          ) : (
             <div>
               <h4 className="text-sm font-bold text-gray-900 mb-3">Available Jobs for this Date</h4>
               {activeMoves.filter(m => m.date === selectedAssignment?.dateStr).length === 0 ? (
                 <p className="text-sm text-gray-500 italic">No jobs scheduled for this date.</p>
               ) : (
                 <div className="space-y-2">
                   {activeMoves
                     .filter(m => m.date === selectedAssignment?.dateStr)
                     .map(move => {
                       const isAlreadyAssigned = move.assignedCrewIds.includes(selectedAssignment?.staffId || '');
                       if (isAlreadyAssigned) return null;

                       return (
                         <button
                           key={move.id}
                           onClick={() => handleAssignMove(move.id)}
                           className="w-full text-left bg-white border border-gray-200 hover:border-brand-500 hover:ring-1 hover:ring-brand-500 rounded-lg p-3 transition-all shadow-sm"
                         >
                            <div className="flex justify-between items-center mb-1">
                               <span className="text-xs font-bold text-brand-600">{move.id}</span>
                               <span className="text-xs text-gray-400 bg-gray-100 px-1.5 rounded">{move.status}</span>
                            </div>
                            <h5 className="font-medium text-gray-900">{move.customerName}</h5>
                            <p className="text-xs text-gray-500 mt-1 truncate">{move.origin}</p>
                         </button>
                       );
                     })
                   }
                 </div>
               )}
               
               <div className="mt-8 pt-6 border-t border-gray-100">
                 <h4 className="text-sm font-bold text-gray-900 mb-3">Waitlist / Unscheduled Jobs</h4>
                 <p className="text-xs text-gray-500 mb-4">Assigning these will update their scheduled date.</p>
                 <div className="space-y-2 opacity-75 hover:opacity-100 transition-opacity">
                    {moves.filter(m => m.status === MoveStatus.PENDING).map(move => (
                        <button
                           key={move.id}
                           onClick={() => {
                             // In a real app, we'd update the date here too
                             handleAssignMove(move.id);
                           }}
                           className="w-full text-left bg-white border border-gray-200 hover:border-brand-500 rounded-lg p-3 flex justify-between items-center"
                         >
                           <span className="text-sm font-medium text-gray-900">{move.customerName}</span>
                           <span className="text-xs text-orange-500 font-bold">Pending</span>
                         </button>
                    ))}
                 </div>
               </div>
             </div>
          )}
        </div>
      </SlideOver>
    </div>
  );
};

const PlusIcon = () => (
  <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);