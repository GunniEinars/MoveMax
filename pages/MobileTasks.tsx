
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { CheckCircle2, Circle, Camera, MapPin, Calendar, Briefcase, QrCode, Search, ArrowRight, Truck, Box, AlertTriangle, AlertOctagon, Clock, StopCircle, PlayCircle, Package, ClipboardCheck, UserCheck } from 'lucide-react';
import { Task, Move, StorageUnit, Incident, MoveCrate } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/Button';
import { Input, Select } from '../components/FormElements';
import { analyzeDamage } from '../services/geminiService';
import { SignaturePad } from '../components/SignaturePad';

// Unified type for scan results
type ScanResult = {
   type: 'asset' | 'crate';
   id: string;
   name: string;
   originLabel: string;
   destLabel: string;
   status: string;
   description?: string;
   move: Move;
   originalObject: StorageUnit | MoveCrate;
};

export const MobileTasksPage: React.FC = () => {
  const { moves, updateMove, logActivity, reportIncident, clockIn, clockOut } = useStore();
  const { currentUser, hasPermission } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'tasks' | 'scanner' | 'report' | 'fleet'>('tasks');
  const [loadingTask, setLoadingTask] = useState<string | null>(null);
  
  // Scanner State
  const [scanQuery, setScanQuery] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Incident State
  const [incidentForm, setIncidentForm] = useState<Partial<Incident>>({ type: 'Damage', severity: 'Low' });
  const [incidentProject, setIncidentProject] = useState<string>('');
  const [isAnalyzingDamage, setIsAnalyzingDamage] = useState(false);
  const incidentPhotoRef = useRef<HTMLInputElement>(null);

  // Fleet/Load State
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  // Time Clock State
  const [clockProject, setClockProject] = useState('');
  
  // Check permissions for Supervisor Fleet View
  const isSupervisor = currentUser?.role === 'Site Supervisor' || currentUser?.role === 'Admin';

  // Find active shift
  const activeShift = moves.flatMap(m => (m.timeEntries || []).map(t => ({ ...t, project: m })))
     .find(t => t.staffId === currentUser?.id && !t.endTime);

  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  useEffect(() => {
     if (!activeShift) return;
     const interval = setInterval(() => {
        const start = new Date(activeShift.startTime).getTime();
        const now = new Date().getTime();
        const diff = now - start;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setElapsedTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
     }, 1000);
     return () => clearInterval(interval);
  }, [activeShift]);

  if (!currentUser) return <div>Please log in</div>;

  // Flatten tasks from all projects to find assignments for current user
  const myTasks = moves.flatMap(move => 
    (move.tasks || [])
      .filter(task => task.assignedTo === currentUser.id)
      .map(task => ({ ...task, project: move }))
  );

  const pendingTasks = myTasks.filter(t => t.status !== 'Done');
  const completedTasks = myTasks.filter(t => t.status === 'Done');

  // Get all active loads across projects for Fleet view
  const activeLoads = isSupervisor ? moves.flatMap(m => (m.loads || []).map(l => ({ ...l, project: m }))) : [];

  const handleToggleTask = (task: Task & { project: Move }) => {
    setLoadingTask(task.id);
    
    // Simulate network delay
    setTimeout(() => {
        const newStatus = task.status === 'Done' ? 'Todo' : 'Done';
        const updatedTasks = task.project.tasks?.map(t => 
            t.id === task.id ? { ...t, status: newStatus as any } : t
        );
        
        const updatedMove = { ...task.project, tasks: updatedTasks };
        updateMove(updatedMove);
        
        logActivity({
          projectId: task.project.id,
          userId: currentUser.id,
          userName: currentUser.name,
          action: newStatus === 'Done' ? 'Completed Task' : 'Reopened Task',
          details: `Task: ${task.title}`
        });

        setLoadingTask(null);
        showToast(newStatus === 'Done' ? 'Task completed!' : 'Task reopened', 'success');
    }, 600);
  };

  const handleUploadProof = (taskId: string) => {
    showToast('Opening Camera...', 'info');
    setTimeout(() => {
        showToast('Photo uploaded successfully', 'success');
    }, 1500);
  };

  const handleScanSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setScanResult(null);
    if (!scanQuery) return;

    const q = scanQuery.toLowerCase();

    for (const move of moves) {
      const crate = move.crates?.find(c => 
         c.id.toLowerCase().includes(q) || 
         c.barcode.toLowerCase().includes(q) ||
         c.name.toLowerCase().includes(q)
      );

      if (crate) {
         const sourceUnit = move.storagePlan?.identifiedUnits.find(u => u.id === crate.sourceUnitId);
         const destZone = move.destinationZones?.find(z => z.id === crate.destinationZoneId);
         
         setScanResult({
            type: 'crate',
            id: crate.id,
            name: crate.name,
            originLabel: sourceUnit ? `${sourceUnit.name} (${sourceUnit.location})` : 'Unknown Origin',
            destLabel: destZone ? `${destZone.name} (Flr ${destZone.floor})` : 'Unassigned',
            status: crate.status,
            description: `Barcode: ${crate.barcode}`,
            move: move,
            originalObject: crate
         });
         return;
      }

      const unit = move.storagePlan?.identifiedUnits?.find(u => 
        u.id.toLowerCase().includes(q) || 
        u.name.toLowerCase().includes(q)
      );
      
      if (unit) {
        setScanResult({
           type: 'asset',
           id: unit.id,
           name: unit.name,
           originLabel: unit.location || 'Unknown',
           destLabel: unit.mappedTo || 'Unassigned',
           status: unit.status || 'Pending',
           description: unit.type,
           move: move,
           originalObject: unit
        });
        return;
      }
    }
    showToast('Item not found in system', 'error');
  };

  const handleUpdateStatus = (newStatus: string) => {
    if (!scanResult) return;
    const { move, originalObject, type } = scanResult;

    let updatedMove = { ...move };

    if (type === 'asset') {
       const updatedUnits = move.storagePlan?.identifiedUnits.map(u => 
          u.id === originalObject.id ? { ...u, status: newStatus as any } : u
       ) || [];
       updatedMove = { ...move, storagePlan: { ...move.storagePlan!, identifiedUnits: updatedUnits } };
    } else {
       const updatedCrates = move.crates?.map(c => 
          c.id === originalObject.id ? { ...c, status: newStatus as any } : c
       ) || [];
       updatedMove = { ...move, crates: updatedCrates };
    }

    updateMove(updatedMove);
    setScanResult(prev => prev ? ({ ...prev, status: newStatus }) : null);
    logActivity({ projectId: move.id, userId: currentUser.id, userName: currentUser.name, action: 'Field Status Update', details: `${scanResult.name} marked as ${newStatus}` });
    showToast(`Status updated to ${newStatus}`, 'success');
  };

  const handleDamagePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB', 'error');
      e.target.value = '';
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error');
      e.target.value = '';
      return;
    }

    setIsAnalyzingDamage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
       const base64 = (reader.result as string).split(',')[1];
       const analysis = await analyzeDamage(base64);
       setIncidentForm(prev => ({ ...prev, description: analysis.description, severity: analysis.severity, aiAnalysis: "Analyzed by Gemini Vision" }));
       setIsAnalyzingDamage(false);
       showToast('AI Assessment Complete', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitIncident = () => {
    if (!incidentProject || !incidentForm.description) { showToast('Please select project and describe issue', 'error'); return; }
    const newIncident: Incident = { id: `inc-${Date.now()}`, projectId: incidentProject, type: incidentForm.type || 'Damage', description: incidentForm.description, severity: incidentForm.severity || 'Low', status: 'Open', reportedBy: currentUser.id, reporterName: currentUser.name, timestamp: new Date().toISOString(), aiAnalysis: incidentForm.aiAnalysis };
    reportIncident(newIncident);
    logActivity({ projectId: incidentProject, userId: currentUser.id, userName: currentUser.name, action: 'Reported Incident', details: `${newIncident.type} - ${newIncident.severity}` });
    showToast('Incident Reported Successfully', 'success');
    setIncidentForm({ type: 'Damage', severity: 'Low', description: '' }); setIncidentProject(''); setActiveTab('tasks');
  };

  const handleClockIn = () => {
     if (!clockProject) { showToast('Select a project first', 'error'); return; }
     clockIn(currentUser.id, clockProject); showToast('Clocked In', 'success');
  };

  const handleClockOut = () => { clockOut(currentUser.id); showToast('Clocked Out', 'success'); };

  // Fleet / Load Logic
  const handleLoadSignOff = (signatureData: string) => {
     if (!selectedLoadId) return;
     const loadWithProject = activeLoads.find(l => l.id === selectedLoadId);
     if (!loadWithProject) return;

     const updatedLoads = (loadWithProject.project.loads || []).map(l => 
        l.id === selectedLoadId ? { ...l, status: 'In Transit', signature: signatureData, signedAt: new Date().toISOString() } : l
     );
     
     // Need to cast status to correct type because we are mapping generic string to specific union type, assuming valid
     const updatedMove = { ...loadWithProject.project, loads: updatedLoads as any };
     updateMove(updatedMove);
     
     logActivity({ projectId: loadWithProject.project.id, userId: currentUser.id, userName: currentUser.name, action: 'Load Sign-off', details: `Released ${loadWithProject.name}` });
     
     setIsSigning(false);
     setSelectedLoadId(null);
     showToast('Load Signed & Released', 'success');
  };

  return (
    <div className="max-w-lg mx-auto pb-20">
      {/* Mobile Header */}
      <div className="mb-6 flex justify-between items-end">
        <div>
           <h1 className="text-2xl font-bold text-brand-900">Field Mode</h1>
           <p className="text-brand-500 text-sm">{currentUser.name}</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg space-x-1">
           <button onClick={() => setActiveTab('tasks')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'tasks' ? 'bg-white shadow text-brand-700' : 'text-gray-500'}`}>Tasks</button>
           <button onClick={() => setActiveTab('scanner')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'scanner' ? 'bg-white shadow text-brand-700' : 'text-gray-500'}`}>Scanner</button>
           <button onClick={() => setActiveTab('report')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'report' ? 'bg-red-50 text-red-600 shadow border border-red-100' : 'text-gray-500 hover:text-red-500'}`}><AlertTriangle className="w-4 h-4" /></button>
           {isSupervisor && (
              <button onClick={() => setActiveTab('fleet')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'fleet' ? 'bg-blue-50 text-blue-600 shadow border border-blue-100' : 'text-gray-500 hover:text-blue-500'}`}><Truck className="w-4 h-4" /></button>
           )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'tasks' && (
          <motion.div key="tasks" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
             <div className="bg-brand-900 rounded-xl p-4 text-white shadow-lg border border-brand-800">
                <div className="flex justify-between items-center mb-4">
                   <div className="flex items-center"><Clock className="w-5 h-5 mr-2 text-accent-500" /><h3 className="font-bold">Shift Clock</h3></div>
                   {activeShift && <span className="text-2xl font-mono text-accent-400 font-bold tracking-wider">{elapsedTime}</span>}
                </div>
                {activeShift ? (
                   <div><p className="text-xs text-brand-300 mb-3">Working on: <span className="text-white font-semibold">{activeShift.project.customerName}</span></p><Button variant="danger" className="w-full" onClick={handleClockOut}><StopCircle className="w-4 h-4 mr-2" /> End Shift</Button></div>
                ) : (
                   <div className="space-y-3">
                      <select className="w-full bg-brand-800 border-brand-700 text-white text-sm rounded-md" value={clockProject} onChange={e => setClockProject(e.target.value)}><option value="">Select Project...</option>{moves.filter(m => m.status === 'In Progress' || m.status === 'Booked').map(m => (<option key={m.id} value={m.id}>{m.customerName}</option>))}</select>
                      <Button variant="primary" className="w-full bg-green-600 hover:bg-green-700" onClick={handleClockIn}><PlayCircle className="w-4 h-4 mr-2" /> Start Shift</Button>
                   </div>
                )}
             </div>
            <div>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">To Do ({pendingTasks.length})</h2>
                <div className="space-y-3">{pendingTasks.length === 0 ? (<div className="bg-white p-6 rounded-xl border border-dashed border-gray-300 text-center"><CheckCircle2 className="w-10 h-10 text-green-200 mx-auto mb-2" /><p className="text-gray-500 text-sm">All caught up!</p></div>) : (pendingTasks.map(task => <TaskCard key={task.id} task={task} onToggle={() => handleToggleTask(task)} onUpload={() => handleUploadProof(task.id)} isLoading={loadingTask === task.id}/>))}</div>
            </div>
            {completedTasks.length > 0 && (<div className="opacity-75"><h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Completed ({completedTasks.length})</h2><div className="space-y-3">{completedTasks.map(task => <TaskCard key={task.id} task={task} onToggle={() => handleToggleTask(task)} isLoading={loadingTask === task.id}/>)}</div></div>)}
          </motion.div>
        )}

        {activeTab === 'scanner' && (
          <motion.div key="scanner" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
             <div className="bg-brand-900 rounded-xl p-6 text-white text-center shadow-lg">
                <QrCode className="w-12 h-12 mx-auto mb-4 text-brand-400" /><h3 className="text-lg font-bold mb-2">Unified Scanner</h3><p className="text-brand-200 text-sm mb-4">Scan Crate Label or Asset Tag for routing.</p>
                <form onSubmit={handleScanSearch} className="flex gap-2"><input type="text" placeholder="Scan ID..." value={scanQuery} onChange={(e) => setScanQuery(e.target.value)} className="flex-1 rounded-lg border-transparent text-gray-900 px-3 py-2 text-sm focus:ring-2 focus:ring-accent-500" /><Button type="submit" size="sm" variant="primary"><Search className="w-4 h-4" /></Button></form>
             </div>
             {scanResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                   <div className="flex justify-between items-start mb-4"><div><span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${scanResult.type === 'crate' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{scanResult.type === 'crate' ? <Package className="w-3 h-3 mr-1"/> : <Box className="w-3 h-3 mr-1"/>}{scanResult.type}</span><h2 className="text-xl font-bold text-gray-900">{scanResult.name}</h2><p className="text-xs text-gray-500">{scanResult.description}</p></div><span className={`px-2 py-0.5 rounded text-xs font-bold uppercase bg-gray-100 text-gray-500`}>{scanResult.status}</span></div>
                   <div className="flex items-center gap-4 mb-6"><div className="flex-1 p-3 bg-gray-50 rounded-lg"><p className="text-[10px] uppercase text-gray-400 font-bold">From</p><p className="font-bold text-gray-800 text-sm">{scanResult.originLabel}</p></div><ArrowRight className="text-gray-300" /><div className="flex-1 p-3 bg-green-50 rounded-lg"><p className="text-[10px] uppercase text-green-600 font-bold">To</p><p className="font-bold text-green-900 text-sm">{scanResult.destLabel}</p></div></div>
                   <div className="grid grid-cols-2 gap-3"><Button variant="secondary" onClick={() => handleUpdateStatus(scanResult.type === 'crate' ? 'Moved' : 'In Transit')} disabled={['Moved', 'In Transit', 'Delivered', 'Unpacked'].includes(scanResult.status)}><Truck className="w-4 h-4 mr-2" /> Load</Button><Button onClick={() => handleUpdateStatus(scanResult.type === 'crate' ? 'Unpacked' : 'Delivered')} disabled={['Delivered', 'Unpacked'].includes(scanResult.status)}><CheckCircle2 className="w-4 h-4 mr-2" /> Complete</Button></div>
                </motion.div>
             )}
          </motion.div>
        )}

        {activeTab === 'report' && (
          <motion.div key="report" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6">
             <div className="bg-red-50 border border-red-100 rounded-xl p-6">
                <div className="flex items-center mb-4"><AlertOctagon className="w-6 h-6 text-red-600 mr-2" /><h2 className="text-xl font-bold text-red-900">Report Incident</h2></div>
                <div className="space-y-4">
                   <div><label className="block text-sm font-medium text-gray-700 mb-1">Select Project</label><select className="block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm sm:text-sm" value={incidentProject} onChange={e => setIncidentProject(e.target.value)}><option value="">-- Select Project --</option>{moves.filter(m => m.status === 'In Progress' || m.status === 'Booked').map(m => (<option key={m.id} value={m.id}>{m.customerName}</option>))}</select></div>
                   <div><label className="block text-sm font-medium text-gray-700 mb-1">Issue Type</label><select className="block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm sm:text-sm" value={incidentForm.type} onChange={e => setIncidentForm({...incidentForm, type: e.target.value})}><option value="Damage">Damaged Item</option><option value="Access">Access Issue</option><option value="Safety">Safety Hazard</option><option value="Other">Other</option></select></div>
                   <div className="bg-white p-4 rounded-lg border border-red-100 text-center"><p className="text-sm font-medium text-gray-600 mb-3">AI Damage Assessment</p><input type="file" ref={incidentPhotoRef} className="hidden" accept="image/*" onChange={handleDamagePhotoUpload} /><Button variant="secondary" size="sm" className="w-full" onClick={() => incidentPhotoRef.current?.click()} isLoading={isAnalyzingDamage}><Camera className="w-4 h-4 mr-2" /> Take Photo</Button>{incidentForm.aiAnalysis && (<div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded">{incidentForm.aiAnalysis}</div>)}</div>
                   <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" rows={3} value={incidentForm.description || ''} onChange={e => setIncidentForm({...incidentForm, description: e.target.value})} placeholder="Describe the issue..." /></div>
                   <div><label className="block text-sm font-medium text-gray-700 mb-1">Severity</label><div className="flex gap-2">{['Low', 'Medium', 'High', 'Critical'].map(sev => (<button key={sev} type="button" onClick={() => setIncidentForm({...incidentForm, severity: sev as any})} className={`flex-1 py-2 text-xs font-bold rounded border ${incidentForm.severity === sev ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-500 border-gray-200'}`}>{sev}</button>))}</div></div>
                   <Button variant="danger" className="w-full mt-4" onClick={handleSubmitIncident}>Submit Report</Button>
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'fleet' && isSupervisor && (
           <motion.div key="fleet" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              {isSigning ? (
                 <div className="fixed inset-0 z-50 bg-gray-900/90 flex items-center justify-center p-4">
                    <SignaturePad onSave={handleLoadSignOff} onCancel={() => setIsSigning(false)} />
                 </div>
              ) : (
                 <>
                    <div className="bg-blue-600 rounded-xl p-4 text-white shadow-lg">
                       <h3 className="font-bold text-lg flex items-center"><Truck className="w-5 h-5 mr-2" /> Active Loads</h3>
                       <p className="text-blue-100 text-sm">Verify and sign off truck manifests.</p>
                    </div>
                    
                    <div className="space-y-3">
                       {activeLoads.map(load => (
                          <div key={load.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                             <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-brand-900">{load.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${load.status === 'In Transit' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{load.status}</span>
                             </div>
                             <p className="text-xs text-gray-500 mb-3">{load.project.customerName} • {load.vehicleId}</p>
                             <div className="bg-gray-50 p-3 rounded-lg mb-3 text-xs space-y-1 border border-gray-100">
                                <div className="flex justify-between"><span className="text-gray-500">Items</span><span className="font-bold">{load.itemsCount}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Volume</span><span className="font-bold">{load.currentVolume} cu ft</span></div>
                             </div>
                             {load.status !== 'In Transit' && load.status !== 'Complete' ? (
                                <Button className="w-full" onClick={() => { setSelectedLoadId(load.id); setIsSigning(true); }}>
                                   <UserCheck className="w-4 h-4 mr-2" /> Sign & Release
                                </Button>
                             ) : (
                                <div className="flex items-center justify-center text-green-600 text-xs font-bold bg-green-50 py-2 rounded border border-green-100">
                                   <CheckCircle2 className="w-4 h-4 mr-1" /> Signed Off
                                </div>
                             )}
                          </div>
                       ))}
                       {activeLoads.length === 0 && <p className="text-center text-gray-400 py-10">No active loads found.</p>}
                    </div>
                 </>
              )}
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TaskCard: React.FC<{ 
    task: Task & { project: Move }, 
    onToggle: () => void, 
    onUpload?: () => void,
    isLoading: boolean 
}> = ({ task, onToggle, onUpload, isLoading }) => {
    return (
        <motion.div layout initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`bg-white p-4 rounded-xl border shadow-sm transition-all ${task.status === 'Done' ? 'border-green-100 bg-green-50/30' : 'border-gray-200'}`}>
            <div className="flex items-start gap-4">
                <button onClick={onToggle} disabled={isLoading} className={`flex-shrink-0 mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'Done' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 text-transparent hover:border-brand-500'}`}><CheckCircle2 className="w-4 h-4" /></button>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start"><h3 className={`font-bold text-gray-900 ${task.status === 'Done' ? 'line-through text-gray-500' : ''}`}>{task.title}</h3><span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{task.project.id.split('-')[2]}</span></div>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                        <div className="flex items-center bg-brand-50 px-2 py-1 rounded text-brand-700"><Briefcase className="w-3 h-3 mr-1" /><span className="truncate max-w-[120px]">{task.project.customerName}</span></div>
                        <div className="flex items-center bg-gray-50 px-2 py-1 rounded"><MapPin className="w-3 h-3 mr-1" /><span className="truncate max-w-[100px]">{task.project.origin}</span></div>
                        <div className="flex items-center bg-gray-50 px-2 py-1 rounded"><Calendar className="w-3 h-3 mr-1" /><span>{task.project.date}</span></div>
                    </div>
                    {task.status !== 'Done' && onUpload && (<button onClick={onUpload} className="mt-4 w-full flex items-center justify-center py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"><Camera className="w-4 h-4 mr-2" /> Upload Photo Proof</button>)}
                </div>
            </div>
        </motion.div>
    );
}
