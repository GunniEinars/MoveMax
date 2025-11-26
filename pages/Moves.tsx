
import React, { useState, useRef, useMemo } from 'react';
import { 
  Calendar, MapPin, Box, Wand2, ArrowRight, Printer, QrCode,
  Loader2, Plus, Filter, Search, ChevronDown, Briefcase,
  Clock, CheckCircle2, Users, Truck, CheckSquare, Trash2, Edit2, Leaf, X,
  FileText, Scan, LayoutDashboard, ArrowLeftRight, Layers, DollarSign, History,
  ShieldAlert, Paperclip, Image as ImageIcon, ExternalLink, Recycle, ChevronRight as ChevronRightIcon, Package, Share2, Copy, Camera,
  Tag, LayoutTemplate, Grid, MoreVertical, Download, AlertTriangle, TrendingUp, AlertOctagon, Link as LinkIcon, List,
  PieChart as PieChartIcon, FileOutput, Maximize2, Sparkles, Building, ArrowRightCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Move, MoveStatus, StorageUnit, Task, ProjectPhase, InventoryItem, MoveDepartment, DestinationZone, MoveLoad, MoveDocument, Expense, MoveCrate, Incident } from '../types';
import { Button } from '../components/Button';
import { Input, Select, Toggle } from '../components/FormElements';
import { SlideOver } from '../components/SlideOver';
import { Modal } from '../components/Modal';
import { analyzeFloorplan, analyzeDestinationMap, generateMoveSummary } from '../services/geminiService';
import { useStore } from '../context/StoreContext';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { INITIAL_VEHICLES } from '../services/mockData';

const getStatusStyles = (status: string) => {
  switch (status) {
    case MoveStatus.COMPLETED:
    case 'Completed':
    case 'Done':
    case 'Resolved':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    case MoveStatus.IN_PROGRESS:
    case 'In Progress':
    case 'Loading':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case MoveStatus.BOOKED:
    case 'Booked':
      return 'bg-violet-100 text-violet-800 border border-violet-200';
    case MoveStatus.PENDING:
    case 'Pending':
    case 'Todo':
    case 'Planned':
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    case MoveStatus.CANCELLED:
    case 'Cancelled':
    case 'Critical':
      return 'bg-red-100 text-red-800 border border-red-200';
    case 'High':
       return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
};

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export const MovesPage: React.FC = () => {
  const { moves, addMove, updateMove, logs, resolveIncident, addExpense } = useStore();
  const { showToast } = useToast();
  const { hasPermission, currentUser } = useAuth();
  
  const canEdit = hasPermission('projects', 'edit');
  
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [projectForm, setProjectForm] = useState<Partial<Move>>({});

  const [activeModal, setActiveModal] = useState<'none' | 'inventory' | 'phase' | 'task' | 'department' | 'zone' | 'load' | 'expense' | 'crate' | 'share' | 'incident' | 'provision' | 'printLabels'>('none');
  
  const [tempDepartment, setTempDepartment] = useState<Partial<MoveDepartment>>({});
  const [tempZone, setTempZone] = useState<Partial<DestinationZone>>({});
  const [tempLoad, setTempLoad] = useState<Partial<MoveLoad>>({});
  const [tempExpense, setTempExpense] = useState<Partial<Expense>>({});
  const [tempIncident, setTempIncident] = useState<Partial<Incident>>({});
  const [tempPhase, setTempPhase] = useState<Partial<ProjectPhase>>({});
  const [manifestLoad, setManifestLoad] = useState<MoveLoad | null>(null);
  
  const [crateProvision, setCrateProvision] = useState({ count: 10, prefix: 'CRT-', start: 100 });

  const [activeTab, setActiveTab] = useState<'overview' | 'departments' | 'planning' | 'outputs' | 'timeline' | 'logistics' | 'disposition' | 'budget' | 'risks' | 'documents' | 'tasks' | 'activity'>('overview');
  
  // Planning Workflow: 3 Explicit Steps
  const [planningStep, setPlanningStep] = useState<'origin' | 'destination' | 'strategy'>('origin');
  
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [strategySourceType, setStrategySourceType] = useState<'assets' | 'crates'>('assets');
  const [strategySearch, setStrategySearch] = useState('');
  const [destinationView, setDestinationView] = useState<'list' | 'map'>('list');
  
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Computed directly from selectedMove to ensure sync
  const detectedUnits = selectedMove?.storagePlan?.identifiedUnits || [];
  
  const groupedUnits = useMemo(() => {
    const grouped: Record<string, StorageUnit[]> = {};
    detectedUnits
        .filter(u => u.name.toLowerCase().includes(strategySearch.toLowerCase()))
        .forEach(u => {
            const loc = u.location || 'Unknown Location';
            if (!grouped[loc]) grouped[loc] = [];
            grouped[loc].push(u);
        });
    return grouped;
  }, [detectedUnits, strategySearch]);

  const [selectedUnitForMap, setSelectedUnitForMap] = useState<string | null>(null);
  const [selectedZoneForMap, setSelectedZoneForMap] = useState<string | null>(null);
  const [selectedMappingSource, setSelectedMappingSource] = useState<string | null>(null);
  const [unitToEdit, setUnitToEdit] = useState<StorageUnit | null>(null);
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [labelConfig, setLabelConfig] = useState<{ type: 'crate'|'asset'|'room', start: number, count: number, prefix: string }>({ type: 'crate', start: 100, count: 20, prefix: 'CRT-' });
  const [shareUrl, setShareUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const destMapInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const destMapContainerRef = useRef<HTMLDivElement>(null);

  // -- Helpers --
  const updateUnits = (units: StorageUnit[]) => {
    if (selectedMove) {
         const existingPlan = selectedMove.storagePlan || { mappings: [], identifiedUnits: [] };
         const updatedMove = {
             ...selectedMove,
             storagePlan: {
                 ...existingPlan,
                 identifiedUnits: units
             }
         };
         updateMove(updatedMove);
         setSelectedMove(updatedMove);
    }
  };

  // -- Handlers --
  const handleOpenCreate = () => { setIsEditingProject(false); setProjectForm({ status: MoveStatus.PENDING, value: 0, date: new Date().toISOString().split('T')[0], retainAuditImages: false }); setIsSlideOverOpen(true); };
  const handleOpenEdit = () => { if (!selectedMove) return; setIsEditingProject(true); setProjectForm({ ...selectedMove }); setIsSlideOverOpen(true); };
  const handleSaveProject = () => {
      // Validate required fields
      if (!projectForm.customerName?.trim()) {
        showToast('Customer name is required', 'error');
        return;
      }
      if (!projectForm.origin?.trim()) {
        showToast('Origin address is required', 'error');
        return;
      }
      if (!projectForm.destination?.trim()) {
        showToast('Destination address is required', 'error');
        return;
      }
      if (!projectForm.date) {
        showToast('Move date is required', 'error');
        return;
      }
      if (projectForm.value && Number(projectForm.value) < 0) {
        showToast('Project value cannot be negative', 'error');
        return;
      }

      if (isEditingProject && projectForm.id) {
        updateMove(projectForm as Move); setSelectedMove(projectForm as Move); showToast('Project updated', 'success');
      } else {
        const project: Move = { id: `P-2024-${Math.floor(1000+Math.random()*9000)}`, customerName: projectForm.customerName, origin: projectForm.origin, destination: projectForm.destination, date: projectForm.date, status: projectForm.status as MoveStatus, value: Number(projectForm.value)||0, assignedCrewIds:[], inventory:[], tasks:[], phases:[], departments:[], destinationZones:[], loads:[], projectedSavings:{sqFt:0, recycledWeight:0}, retainAuditImages: projectForm.retainAuditImages||false };
        addMove(project); setSelectedMove(project); showToast('Project created', 'success');
      }
      setIsSlideOverOpen(false);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
     if (!mapContainerRef.current) return;
     const rect = mapContainerRef.current.getBoundingClientRect();
     const x = ((e.clientX - rect.left) / rect.width) * 100;
     const y = ((e.clientY - rect.top) / rect.height) * 100;
     if (isAddingMarker) {
        const newUnit: StorageUnit = { id: `manual-${Math.floor(Math.random()*1000000)}`, name: 'New Asset', type: 'Furniture', location: 'Unassigned', estimatedCrates: 1, subUnits: [], coordinates: { x, y }, detectedFromImage: false };
        updateUnits([...detectedUnits, newUnit]); setIsAddingMarker(false); setUnitToEdit(newUnit); showToast('Asset placed', 'success'); return;
     }
     if (selectedUnitForMap) {
         updateUnits(detectedUnits.map(u => u.id === selectedUnitForMap ? { ...u, coordinates: { x, y } } : u));
         setSelectedUnitForMap(null); showToast('Location updated', 'info');
     }
  };

  const handleDestMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
     if (!destMapContainerRef.current || !selectedMove) return;
     const rect = destMapContainerRef.current.getBoundingClientRect();
     const x = ((e.clientX - rect.left) / rect.width) * 100;
     const y = ((e.clientY - rect.top) / rect.height) * 100;

     if (selectedZoneForMap) {
         const updatedZones = (selectedMove.destinationZones || []).map(z =>
            z.id === selectedZoneForMap ? { ...z, coordinates: { x, y } } : z
         );
         const updatedMove = { ...selectedMove, destinationZones: updatedZones };
         updateMove(updatedMove);
         setSelectedMove(updatedMove);
         setSelectedZoneForMap(null);
         showToast('Zone repositioned', 'success');
     }
  };

  // FIXED DELETE HANDLER
  const handleDeleteUnit = (e: React.MouseEvent, unitId: string) => { 
      e.preventDefault(); 
      e.stopPropagation(); 
      
      if(window.confirm('Are you sure you want to delete this asset?')) { 
          // Access current state safely
          const currentUnits = detectedUnits;
          const updatedUnits = currentUnits.filter(u => u.id !== unitId);
          
          updateUnits(updatedUnits); 
          
          if(selectedUnitForMap === unitId) setSelectedUnitForMap(null); 
          showToast('Asset deleted', 'info'); 
      } 
  };

  const handleSaveEditedUnit = () => { 
      if(!unitToEdit) return; 
      updateUnits(detectedUnits.map(u => u.id === unitToEdit.id ? unitToEdit : u)); 
      setUnitToEdit(null); 
      showToast('Asset details updated', 'success'); 
  };
  
  const handleDiscoveryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(!file||!selectedMove) return;

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image must be under 5MB', 'error');
        e.target.value = ''; // Reset input
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file', 'error');
        e.target.value = '';
        return;
      }

      setAnalyzingImage(true);
      const reader = new FileReader();
      reader.onloadend=async()=>{
          const units = await analyzeFloorplan((reader.result as string).split(',')[1]);
          const existingPlan = selectedMove.storagePlan || { mappings: [], identifiedUnits: [] };
          const updatedMove = {
             ...selectedMove,
             storagePlan: {
                ...existingPlan,
                floorplanImage: reader.result as string,
                identifiedUnits: [...existingPlan.identifiedUnits, ...units.map(u=>({...u, coordinates:{x:Math.random()*80+10,y:Math.random()*80+10}}))]
             }
          };
          updateMove(updatedMove); setSelectedMove(updatedMove); setAnalyzingImage(false);
      };
      reader.readAsDataURL(file);
  };

  const handleDestinationMapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(!file||!selectedMove) return;

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

      setAnalyzingImage(true);
      const reader = new FileReader();
      reader.onloadend=async()=>{
          const zones = await analyzeDestinationMap((reader.result as string).split(',')[1]);

          // Distribute zones in a grid layout for better visual organization
          const existingCount = (selectedMove.destinationZones || []).length;
          const totalZones = existingCount + zones.length;
          const cols = Math.ceil(Math.sqrt(totalZones));
          const padding = 15; // 15% padding from edges
          const usableWidth = 100 - (padding * 2);
          const usableHeight = 100 - (padding * 2);

          const zonesWithCoords = zones.map((z, idx) => {
            const position = existingCount + idx;
            const row = Math.floor(position / cols);
            const col = position % cols;
            const rows = Math.ceil(totalZones / cols);

            // Calculate position with even distribution
            const x = padding + (col * (usableWidth / (cols - 1 || 1)));
            const y = padding + (row * (usableHeight / (rows - 1 || 1)));

            return {
              ...z,
              coordinates: {
                x: Math.min(100 - padding, Math.max(padding, x)),
                y: Math.min(100 - padding, Math.max(padding, y))
              }
            };
          });

          const updatedMove: Move = {
              ...selectedMove,
              destinationPlan: { floorplanImage: reader.result as string },
              destinationZones: [...(selectedMove.destinationZones || []), ...zonesWithCoords]
          };
          updateMove(updatedMove); setSelectedMove(updatedMove); setAnalyzingImage(false); setDestinationView('map');
      };
      reader.readAsDataURL(file);
  };

  const handleGenerateSummary = async () => {
      if (!selectedMove) return;
      setIsGeneratingSummary(true);
      const summary = await generateMoveSummary(selectedMove.inventory);
      setAiSummary(summary);
      setIsGeneratingSummary(false);
  };

  const handleSaveExpense = () => {
      if(!selectedMove) return;
      const expense: Expense = { id: `exp-${Date.now()}`, projectId: selectedMove.id, category: tempExpense.category||'Other', amount: Number(tempExpense.amount)||0, description: tempExpense.description||'', date: new Date().toISOString(), loggedBy: currentUser?.name||'Admin' };
      const updatedMove = { ...selectedMove, expenses: [...(selectedMove.expenses||[]), expense] };
      updateMove(updatedMove); setSelectedMove(updatedMove); setActiveModal('none'); showToast('Expense added', 'success');
  };

  const handleReportIncident = () => {
      if(!selectedMove || !tempIncident.description) return;
      const incident: Incident = { id: `inc-${Date.now()}`, projectId: selectedMove.id, type: tempIncident.type||'Other', description: tempIncident.description, severity: tempIncident.severity||'Low', status: 'Open', reportedBy: currentUser?.id||'Admin', reporterName: currentUser?.name, timestamp: new Date().toISOString(), aiAnalysis: tempIncident.aiAnalysis };
      const updatedMove = { ...selectedMove, incidents: [incident, ...(selectedMove.incidents||[])] };
      updateMove(updatedMove); setSelectedMove(updatedMove); setActiveModal('none'); showToast('Incident reported', 'error');
  };

  const handleResolveIncident = (id: string) => { resolveIncident(id, selectedMove!.id); setSelectedMove(moves.find(m => m.id === selectedMove!.id)||null); showToast('Incident resolved', 'success'); };
  
  const handleMapCrateToZone = (zoneId: string) => { 
      if (!selectedMove || !selectedMappingSource) return; 
      if (strategySourceType === 'crates' || selectedMappingSource.startsWith('crate-')) {
          const updatedCrates = (selectedMove.crates || []).map(c => c.id === selectedMappingSource ? { ...c, destinationZoneId: zoneId } : c);
          const updatedMove = { ...selectedMove, crates: updatedCrates };
          updateMove(updatedMove); setSelectedMove(updatedMove); showToast('Crate assigned to zone', 'success');
      } else {
          const updatedUnits = detectedUnits.map(u => u.id === selectedMappingSource ? { ...u, mappedTo: zoneId } : u);
          updateUnits(updatedUnits); showToast('Asset mapped', 'success'); 
      }
      setSelectedMappingSource(null); 
  };

  const handleBulkMapToZone = (zoneId: string) => {
      if (!selectedMove) return;
      const query = strategySearch.toLowerCase();
      
      if (strategySourceType === 'assets') {
          const updatedUnits = detectedUnits.map(u => {
              if (!u.mappedTo && (u.name.toLowerCase().includes(query) || u.location?.toLowerCase().includes(query))) {
                  return { ...u, mappedTo: zoneId };
              }
              return u;
          });
          updateUnits(updatedUnits);
          showToast('Bulk asset assignment complete', 'success');
      } else {
          const updatedCrates = (selectedMove.crates || []).map(c => {
              if (!c.destinationZoneId && (c.name.toLowerCase().includes(query) || c.barcode.toLowerCase().includes(query))) {
                  return { ...c, destinationZoneId: zoneId };
              }
              return c;
          });
          const updatedMove = { ...selectedMove, crates: updatedCrates };
          updateMove(updatedMove); setSelectedMove(updatedMove);
          showToast('Bulk crate assignment complete', 'success');
      }
  };

  const handleProvisionCrates = () => {
      if (!selectedMove) return;
      const newCrates: MoveCrate[] = Array.from({ length: crateProvision.count }).map((_, i) => ({
          id: `crate-${Date.now()}-${i}`,
          name: `${crateProvision.prefix}${(crateProvision.start + i).toString().padStart(3, '0')}`,
          barcode: `${crateProvision.prefix}${(crateProvision.start + i).toString().padStart(3, '0')}`,
          status: 'Pending'
      }));
      
      const updatedMove = { 
          ...selectedMove, 
          crates: [...(selectedMove.crates || []), ...newCrates] 
      };
      updateMove(updatedMove);
      setSelectedMove(updatedMove);
      setActiveModal('none');
      showToast(`${crateProvision.count} crates provisioned`, 'success');
  };

  const handleGenerateManifest = () => {
      if (!selectedMove) return;
      const manifestDoc: MoveDocument = {
          id: `man-${Date.now()}`,
          name: `Project_Manifest_${selectedMove.id}.pdf`,
          type: 'PDF',
          url: '#',
          uploadedBy: 'System',
          uploadedAt: new Date().toISOString(),
          size: '1.2 MB'
      };
      const updatedMove = { ...selectedMove, documents: [manifestDoc, ...(selectedMove.documents || [])] };
      updateMove(updatedMove);
      setSelectedMove(updatedMove);
      showToast('Manifest generated and saved to Documents', 'success');
  };

  const handleUpdateCrateEstimate = (unitId: string, val: number) => updateUnits(detectedUnits.map(u => u.id === unitId ? { ...u, estimatedCrates: val } : u));
  const handleShareProject = () => { if(!selectedMove)return; setShareUrl(`${window.location.href.split('#')[0]}#/portal/${selectedMove.id}`); setActiveModal('share'); };
  const handleSaveDepartment = () => { if (!selectedMove) return; const dept: MoveDepartment = { id: tempDepartment.id || `dept-${Date.now()}`, name: tempDepartment.name || 'New Dept', moveDate: tempDepartment.moveDate || selectedMove.date, status: 'Pending', contactName: tempDepartment.contactName, budget: 0, actualSpend: 0 }; const updatedDepartments = tempDepartment.id ? selectedMove.departments?.map(d => d.id === dept.id ? dept : d) : [...(selectedMove.departments || []), dept]; const updatedMove = { ...selectedMove, departments: updatedDepartments }; updateMove(updatedMove); setSelectedMove(updatedMove); setActiveModal('none'); setTempDepartment({ status: 'Pending' }); };
  const handleSavePhase = () => { if (!selectedMove) return; const phase: ProjectPhase = { id: tempPhase.id || `ph-${Date.now()}`, name: tempPhase.name || 'New Phase', date: tempPhase.date || selectedMove.date, status: (tempPhase.status as any) || 'Pending', assignedCrewCount: tempPhase.assignedCrewCount || 0 }; const updatedPhases = tempPhase.id ? (selectedMove.phases || []).map(p => p.id === phase.id ? phase : p) : [...(selectedMove.phases || []), phase]; const updatedMove = { ...selectedMove, phases: updatedPhases }; updateMove(updatedMove); setSelectedMove(updatedMove); setActiveModal('none'); setTempPhase({}); };
  
  const handleSaveZone = () => {
      if (!selectedMove) return;
      const zone: DestinationZone = { 
          id: tempZone.id || `zone-${Date.now()}`, 
          name: tempZone.name || 'New Zone', 
          floor: tempZone.floor || '1', 
          capacity: tempZone.capacity || 10 
      };
      
      const updatedZones = tempZone.id 
          ? (selectedMove.destinationZones || []).map(z => z.id === zone.id ? zone : z)
          : [...(selectedMove.destinationZones || []), zone];
      
      const updatedMove = { ...selectedMove, destinationZones: updatedZones };
      updateMove(updatedMove);
      setSelectedMove(updatedMove);
      setActiveModal('none');
      setTempZone({});
      showToast(tempZone.id ? 'Zone updated' : 'Zone added', 'success');
  };
  
  const handleDeleteZone = (zoneId: string) => {
     if (!selectedMove || !window.confirm('Delete this zone?')) return;
     const updatedZones = (selectedMove.destinationZones || []).filter(z => z.id !== zoneId);
     const updatedMove = { ...selectedMove, destinationZones: updatedZones };
     updateMove(updatedMove);
     setSelectedMove(updatedMove);
     showToast('Zone deleted', 'info');
  };

  const handleAddZone = () => { setActiveModal('zone'); setTempZone({}); }; // For button click

  const handleCreateLoad = () => { if (!selectedMove) return; const load: MoveLoad = { id: `load-${Date.now()}`, vehicleId: tempLoad.vehicleId || 'v1', name: tempLoad.name || 'New Load', status: 'Planned', itemsCount: 0, currentVolume: 0 }; const updatedMove = { ...selectedMove, loads: [...(selectedMove.loads || []), load] }; updateMove(updatedMove); setSelectedMove(updatedMove); setActiveModal('none'); setTempLoad({ status: 'Planned' }); };
  const handleAssignItemToLoad = (itemId: string, loadId: string) => { if (!selectedMove) return; const updatedInventory = selectedMove.inventory.map(i => i.id === itemId ? { ...i, loadId: loadId==='unassign'?undefined:loadId } : i); const updatedMove = { ...selectedMove, inventory: updatedInventory }; updateMove(updatedMove); setSelectedMove(updatedMove); };
  const handleGenerateTasks = () => { if (!selectedMove) return; const tasks: Task[] = [{ id: `t-${Date.now()}-1`, title: 'Send Welcome Packet', description: 'Email client', status: 'Todo', departmentId: '' }, { id: `t-${Date.now()}-2`, title: 'Order Crates', description: 'Based on estimate', status: 'Todo', departmentId: '' }]; const updatedMove = { ...selectedMove, tasks: [...(selectedMove.tasks || []), ...tasks] }; updateMove(updatedMove); setSelectedMove(updatedMove); };
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file || !selectedMove) return; if (file.size > 5 * 1024 * 1024) { showToast('File must be under 5MB', 'error'); e.target.value = ''; return; } const doc: MoveDocument = { id: `doc-${Date.now()}`, name: file.name, type: 'PDF', url: '#', uploadedBy: currentUser?.name || 'Admin', uploadedAt: new Date().toISOString(), size: '2 MB' }; const updatedMove = { ...selectedMove, documents: [...(selectedMove.documents || []), doc] }; updateMove(updatedMove); setSelectedMove(updatedMove); };
  const copyToClipboard = () => { navigator.clipboard.writeText(shareUrl); showToast('Copied', 'success'); };

  // -- Metrics --
  const dispositionMetrics = useMemo(() => {
     if (!selectedMove) return { digitizeVol: 0, recycleVol: 0, keepVol: 0, total: 0 };
     let digitizeVol = 0, recycleVol = 0, keepVol = 0;
     selectedMove.inventory.forEach(i => {
        const vol = i.volume * i.quantity;
        if (i.disposition === 'Digitize') digitizeVol += vol;
        else if (['Recycle', 'Trash', 'Donate'].includes(i.disposition || '')) recycleVol += vol;
        else keepVol += vol;
     });
     const total = digitizeVol + recycleVol + keepVol || 1;
     return { digitizeVol, recycleVol, keepVol, total };
  }, [selectedMove]);

  const financialMetrics = useMemo(() => {
      if (!selectedMove) return { labor: 0, expenses: 0, total: 0, margin: 0, pieData: [] };
      const labor = (selectedMove.timeEntries || []).reduce((acc, t) => acc + (t.cost || 0), 0);
      const expenses = (selectedMove.expenses || []).reduce((acc, e) => acc + e.amount, 0);
      const total = labor + expenses;
      const margin = Math.max(0, selectedMove.value - total);
      const pieData = [
          { name: 'Margin', value: margin },
          { name: 'Labor', value: labor },
          { name: 'Expenses', value: expenses }
      ].filter(d => d.value > 0);
      return { labor, expenses, total, margin, pieData };
  }, [selectedMove]);

  const filteredMoves = moves.filter(move => {
    const matchesQuery = move.customerName.toLowerCase().includes(filterQuery.toLowerCase()) || move.id.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || move.status === filterStatus;
    return matchesQuery && matchesStatus;
  });

  if (!selectedMove) {
     return (
       <div className="space-y-6">
         <div className="flex justify-between items-center">
           <div><h1 className="text-2xl font-bold text-gray-900">Projects</h1><p className="text-gray-500 text-sm mt-1">Manage active corporate relocations.</p></div>
           {canEdit && <Button onClick={handleOpenCreate}><Plus className="w-4 h-4 mr-2" /> Create Project</Button>}
         </div>
         <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex gap-4">
               <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search projects..." className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 bg-white text-gray-900 [color-scheme:light]" value={filterQuery} onChange={e => setFilterQuery(e.target.value)} /></div>
               <select className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white text-gray-900 [color-scheme:light]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}><option value="All">All Status</option>{Object.values(MoveStatus).map(s => <option key={s} value={s}>{s}</option>)}</select>
            </div>
         </div>
         <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
           {filteredMoves.map((move) => (
             <motion.div key={move.id} layoutId={move.id} onClick={() => setSelectedMove(move)} className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200 hover:shadow-md hover:border-brand-300 transition-all cursor-pointer group">
               <div className="px-6 py-6">
                 <div className="flex justify-between items-start mb-4"><div className="p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors"><Briefcase className="w-6 h-6 text-gray-600 group-hover:text-blue-600" /></div><span className={`text-xs font-medium px-2 py-0.5 rounded ${getStatusStyles(move.status)}`}>{move.status}</span></div>
                 <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{move.customerName}</h3>
                 <div className="space-y-2 mt-4"><p className="text-sm text-gray-600 flex"><MapPin className="w-4 h-4 mr-2 text-gray-400"/> {move.origin}</p></div>
               </div>
             </motion.div>
           ))}
         </div>
         <SlideOver isOpen={isSlideOverOpen} onClose={() => setIsSlideOverOpen(false)} title={isEditingProject ? "Edit Project" : "New Project"} footer={<><Button variant="secondary" onClick={() => setIsSlideOverOpen(false)} className="mr-3">Cancel</Button><Button onClick={handleSaveProject}>Save</Button></>}>
            <div className="space-y-4"><Input label="Client Name" value={projectForm.customerName} onChange={e => setProjectForm({...projectForm, customerName: e.target.value})} /><Input label="Value ($)" type="number" value={projectForm.value} onChange={e => setProjectForm({...projectForm, value: Number(e.target.value)})} /><div className="bg-blue-50 p-4 rounded-lg"><Toggle label="Retain Audit Photos" checked={projectForm.retainAuditImages || false} onChange={(val) => setProjectForm({...projectForm, retainAuditImages: val})} /></div></div>
         </SlideOver>
       </div>
     );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'departments', label: 'Departments', icon: Layers },
    { id: 'planning', label: 'Planning', icon: Wand2 },
    { id: 'outputs', label: 'Outputs', icon: Printer },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'logistics', label: 'Logistics', icon: Truck },
    { id: 'disposition', label: 'Disposition', icon: Recycle },
    { id: 'budget', label: 'Budget', icon: DollarSign },
    { id: 'risks', label: 'Risks', icon: ShieldAlert },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'activity', label: 'Audit Log', icon: History }
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <button onClick={() => setSelectedMove(null)} className="text-xs text-gray-500 hover:text-gray-700 flex items-center mb-1"><ArrowLeftRight className="w-3 h-3 mr-1" /> Back to Projects</button>
           <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{selectedMove.customerName}</h1>
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getStatusStyles(selectedMove.status)}`}>{selectedMove.status}</span>
           </div>
        </div>
        <div className="flex items-center space-x-2">
           {canEdit && <Button variant="secondary" onClick={handleOpenEdit} size="sm"><Edit2 className="w-4 h-4 mr-2" /> Edit</Button>}
           <Button variant="secondary" size="sm" onClick={handleShareProject}><Share2 className="w-4 h-4 mr-2" /> Open Portal</Button>
        </div>
      </div>

      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-6 min-w-max pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${activeTab === tab.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <Icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-brand-600' : 'text-gray-400'}`} /> {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-lg mb-4 flex items-center"><Briefcase className="w-5 h-5 mr-2 text-brand-500"/>Project Scope</h3>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="p-4 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 uppercase font-bold mb-1">Origin</p><p className="font-medium text-gray-900">{selectedMove.origin}</p></div>
                     <div className="p-4 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 uppercase font-bold mb-1">Destination</p><p className="font-medium text-gray-900">{selectedMove.destination}</p></div>
                     <div className="p-4 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Value</p><p className="font-medium text-green-700 text-xl">${selectedMove.value.toLocaleString()}</p></div>
                     <div className="p-4 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 uppercase font-bold mb-1">Target Date</p><p className="font-medium text-gray-900">{selectedMove.date}</p></div>
                  </div>
               </div>
               {/* AI Executive Summary */}
               <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl border border-purple-100 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                     <h3 className="font-bold text-lg flex items-center text-purple-900"><Sparkles className="w-5 h-5 mr-2 text-purple-500"/>AI Executive Summary</h3>
                     <Button size="xs" variant="secondary" onClick={handleGenerateSummary} isLoading={isGeneratingSummary}>Generate Report</Button>
                  </div>
                  <div className="bg-white/80 p-4 rounded-lg border border-purple-50 text-sm text-gray-700 leading-relaxed min-h-[80px]">
                     {aiSummary || "Click 'Generate Report' to analyze project status, risks, and inventory."}
                  </div>
               </div>
               <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg flex items-center"><Leaf className="w-5 h-5 mr-2 text-green-500"/>Sustainability Impact</h3></div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-green-50 p-5 rounded-xl border border-green-100"><p className="text-xs text-green-800 font-bold uppercase tracking-wider">Real Estate Saved</p><p className="text-3xl font-black text-green-900 mt-2">{selectedMove.projectedSavings?.sqFt.toLocaleString()} <span className="text-sm font-medium opacity-60">sq ft</span></p></div>
                     <div className="bg-blue-50 p-5 rounded-xl border border-blue-100"><p className="text-xs text-blue-800 font-bold uppercase tracking-wider">Recycled Assets</p><p className="text-3xl font-black text-blue-900 mt-2">{selectedMove.projectedSavings?.recycledWeight.toLocaleString()} <span className="text-sm font-medium opacity-60">lbs</span></p></div>
                  </div>
               </div>
            </div>
            <div><div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full"><h3 className="font-bold text-lg mb-4 flex items-center"><Users className="w-5 h-5 mr-2 text-purple-500"/>Key Contacts</h3><div className="space-y-4"><div className="flex items-center p-3 bg-gray-50 rounded-lg"><div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 mr-3">{selectedMove.contactName?.charAt(0) || 'C'}</div><div><p className="font-bold text-sm">{selectedMove.contactName || 'No Contact'}</p><p className="text-xs text-gray-500">Client Lead</p></div></div><div className="text-sm space-y-2 pl-2 border-l-2 border-gray-200"><p className="text-gray-600"><span className="font-bold">Email:</span> {selectedMove.contactEmail}</p><p className="text-gray-600"><span className="font-bold">Phone:</span> {selectedMove.contactPhone}</p></div></div></div></div>
         </div>
      )}

      {/* PLANNING - 3 STEP WORKFLOW (ORIGIN -> DESTINATION -> STRATEGY) */}
      {activeTab === 'planning' && (
         <div className="space-y-6">
            <div className="flex items-center justify-between mb-8 px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                {[{ id: 'origin', label: '1. Origin Setup', icon: MapPin }, { id: 'destination', label: '2. Destination Setup', icon: Building }, { id: 'strategy', label: '3. Logistics Strategy', icon: ArrowRight }].map((step) => (
                    <div key={step.id} onClick={() => setPlanningStep(step.id as any)} className={`flex items-center cursor-pointer px-4 py-2 rounded-lg transition-colors ${planningStep === step.id ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <step.icon className={`w-4 h-4 mr-2 ${planningStep === step.id ? 'text-brand-600' : 'text-gray-400'}`} />
                        <span className="font-bold text-sm">{step.label}</span>
                    </div>
                ))}
            </div>

            {/* STEP 1: ORIGIN SETUP */}
            {planningStep === 'origin' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm min-h-[500px]">
                            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">Interactive Floorplan (Origin)</h3><div className="flex space-x-2"><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleDiscoveryUpload} /><Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} isLoading={analyzingImage}>Scan Origin Plan</Button></div></div>
                            <div ref={mapContainerRef} className={`relative w-full h-[500px] bg-gray-100 rounded-lg border border-gray-300 overflow-hidden ${isAddingMarker ? 'cursor-crosshair' : ''}`} onClick={handleMapClick}>
                                {selectedMove.storagePlan?.floorplanImage && <img src={selectedMove.storagePlan.floorplanImage} className="absolute inset-0 w-full h-full object-contain opacity-50" />}
                                {detectedUnits.map((unit, idx) => (
                                    <div key={unit.id} className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all ${selectedUnitForMap === unit.id ? 'z-20 scale-110' : 'z-10'}`} style={{ left: `${unit.coordinates?.x || 50}%`, top: `${unit.coordinates?.y || 50}%` }} onClick={(e) => { e.stopPropagation(); setSelectedUnitForMap(unit.id); }}>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md border-2 ${selectedUnitForMap === unit.id ? 'bg-blue-600 border-white' : selectedMove.inventory.some(i => i.storageUnitId === unit.id) ? 'bg-green-600 border-white' : 'bg-gray-500 border-white'}`}>{unit.assetTag || (idx + 1)}</div>
                                        {selectedUnitForMap === unit.id && <div className="mt-1 px-2 py-1 bg-black/75 text-white text-xs rounded whitespace-nowrap">{unit.name}</div>}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 flex justify-center gap-4 text-xs text-gray-500"><span className="flex items-center"><div className="w-2 h-2 rounded-full bg-gray-500 mr-1"></div> Planned</span><span className="flex items-center"><div className="w-2 h-2 rounded-full bg-green-600 mr-1"></div> Audited (Synced)</span><span className="flex items-center"><div className="w-2 h-2 rounded-full bg-blue-600 mr-1"></div> Selected</span></div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button onClick={() => setPlanningStep('destination')} className="flex items-center">Continue to Destination Setup <ArrowRightCircle className="w-4 h-4 ml-2" /></Button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center"><h3 className="font-bold text-lg">Asset Manifest</h3><Button size="xs" variant={isAddingMarker ? 'primary' : 'secondary'} onClick={() => setIsAddingMarker(!isAddingMarker)}>{isAddingMarker ? 'Cancel' : 'Add'}</Button></div>
                        <div className="max-h-[500px] overflow-y-auto space-y-2">
                            {detectedUnits.map((unit, idx) => (
                                <div key={unit.id} onClick={() => setSelectedUnitForMap(unit.id)} className={`p-3 border rounded-lg cursor-pointer flex items-start gap-3 ${selectedUnitForMap === unit.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-white'}`}>
                                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 mt-0.5">{unit.assetTag || (idx + 1)}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 text-sm truncate">{unit.name}</p>
                                        <p className="text-xs text-gray-500">{unit.location}</p>
                                        {unit.assetTag && <span className="inline-block mt-1 bg-gray-800 text-white text-[10px] px-1.5 rounded font-mono">Tag: {unit.assetTag}</span>}
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center bg-blue-50 rounded border border-blue-100 px-1.5 py-0.5"><input type="number" className="w-8 bg-transparent text-[10px] text-blue-600 text-right font-bold" value={unit.estimatedCrates || 1} onChange={(e) => handleUpdateCrateEstimate(unit.id, parseInt(e.target.value)||1)} onClick={e => e.stopPropagation()} /></div>
                                        <div className="flex space-x-1"><button type="button" onClick={(e) => { e.stopPropagation(); setUnitToEdit(unit); }} className="p-1 text-gray-400 hover:text-blue-600"><Edit2 className="w-3 h-3" /></button><button type="button" onClick={(e) => handleDeleteUnit(e, unit.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: DESTINATION SETUP */}
            {planningStep === 'destination' && (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm min-h-[500px]">
                          <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">Destination Floorplan</h3><div className="flex space-x-2"><input type="file" ref={destMapInputRef} className="hidden" accept="image/*" onChange={handleDestinationMapUpload} /><Button size="sm" variant="secondary" onClick={() => destMapInputRef.current?.click()} isLoading={analyzingImage}>Scan Destination Plan</Button></div></div>
                          <div className="relative w-full h-[500px] bg-gray-100 rounded-lg border border-gray-300 overflow-hidden flex items-center justify-center">
                              {selectedMove.destinationPlan?.floorplanImage ? (
                                 <>
                                    <img src={selectedMove.destinationPlan.floorplanImage} className="absolute inset-0 w-full h-full object-contain opacity-70" />
                                    {selectedMove.destinationZones?.map((zone) => (
                                       <div key={zone.id} className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10`} style={{ left: `${zone.coordinates?.x || 50}%`, top: `${zone.coordinates?.y || 50}%` }}>
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md border-2 border-white bg-brand-600`}><MapPin className="w-4 h-4" /></div>
                                          <div className="mt-1 px-2 py-1 bg-black/75 text-white text-[10px] rounded whitespace-nowrap">{zone.name}</div>
                                       </div>
                                    ))}
                                 </>
                              ) : (
                                 <div className="text-center text-gray-400">
                                    <Building className="w-12 h-12 mx-auto mb-2 opacity-20"/>
                                    <p>No destination map uploaded.</p>
                                    <Button size="sm" variant="secondary" className="mt-4" onClick={() => destMapInputRef.current?.click()}>Upload Now</Button>
                                 </div>
                              )}
                          </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                         <Button onClick={() => setPlanningStep('strategy')} className="flex items-center">Finish Setup & Go to Strategy <ArrowRightCircle className="w-4 h-4 ml-2" /></Button>
                      </div>
                  </div>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center"><h3 className="font-bold text-lg">Destination Zones</h3><Button size="xs" variant="secondary" onClick={() => setActiveModal('zone')}><Plus className="w-4 h-4 mr-2"/> Add Zone</Button></div>
                     <div className="max-h-[500px] overflow-y-auto space-y-2">
                        {selectedMove.destinationZones?.map(zone => (
                           <div key={zone.id} className="p-3 border bg-white rounded-lg flex justify-between items-center">
                              <div><p className="font-bold text-sm">{zone.name}</p><p className="text-xs text-gray-500">Floor {zone.floor} • Cap: {zone.capacity}</p></div>
                              <div className="flex space-x-1">
                                 <button onClick={() => { setTempZone(zone); setActiveModal('zone'); }} className="p-1 text-gray-400 hover:text-blue-600"><Edit2 className="w-3 h-3"/></button>
                                 <button onClick={() => handleDeleteZone(zone.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-3 h-3"/></button>
                              </div>
                           </div>
                        ))}
                        {(!selectedMove.destinationZones || selectedMove.destinationZones.length === 0) && <p className="text-center text-gray-400 text-sm py-10">No zones defined.</p>}
                     </div>
                  </div>
               </div>
            )}

            {/* STEP 3: STRATEGY PHASE */}
            {planningStep === 'strategy' && (
               <div className="grid grid-cols-2 gap-6 h-[600px]">
                  {/* Source Column */}
                  <div className="bg-white rounded-xl border shadow-sm p-4 flex flex-col">
                     <div className="flex items-center justify-between mb-4">
                        <div><h3 className="font-bold flex items-center"><Box className="w-4 h-4 mr-2 text-brand-500"/> Inventory Source</h3><p className="text-xs text-gray-500 mt-1">Select items to map</p></div>
                        <div className="flex bg-gray-100 p-1 rounded-lg"><button onClick={() => setStrategySourceType('assets')} className={`px-3 py-1 text-xs font-bold rounded ${strategySourceType==='assets' ? 'bg-white shadow text-brand-700' : 'text-gray-500'}`}>Assets</button><button onClick={() => setStrategySourceType('crates')} className={`px-3 py-1 text-xs font-bold rounded ${strategySourceType==='crates' ? 'bg-white shadow text-brand-700' : 'text-gray-500'}`}>Crates</button></div>
                     </div>
                     <div className="mb-2"><input type="text" placeholder="Filter items..." className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none [color-scheme:light]" value={strategySearch} onChange={e => setStrategySearch(e.target.value)} /></div>
                     {strategySourceType === 'crates' && (<div className="mb-4 p-2 bg-purple-50 border border-purple-100 rounded text-center"><Button size="xs" variant="secondary" className="w-full" onClick={() => setActiveModal('provision')}><Plus className="w-3 h-3 mr-1"/> Provision New Crates</Button></div>)}
                     
                     <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                        {strategySourceType === 'assets' ? (
                           Object.keys(groupedUnits).length > 0 ? (
                              Object.entries(groupedUnits).map(([location, units]: [string, StorageUnit[]]) => (
                                 <div key={location}>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 sticky top-0 bg-white py-1 flex items-center"><MapPin className="w-3 h-3 mr-1"/> {location}</h4>
                                    <div className="space-y-2 pl-2 border-l-2 border-gray-100">
                                       {units.map(unit => (
                                          <div key={unit.id} onClick={() => setSelectedMappingSource(unit.id)} className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedMappingSource === unit.id ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-gray-50 border-gray-200'} flex justify-between items-center`}>
                                             <div>
                                                <p className="font-bold text-sm">
                                                   {unit.assetTag && <span className="inline-block bg-gray-800 text-white text-[10px] px-1 rounded font-mono mr-1.5">{unit.assetTag}</span>}
                                                   {unit.name}
                                                </p>
                                                <p className="text-xs text-gray-500">{unit.type}</p>
                                             </div>
                                             <div className="flex items-center gap-2">
                                                {unit.estimatedCrates && <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold">{unit.estimatedCrates} crates</span>}
                                                {unit.mappedTo ? <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold flex items-center"><CheckCircle2 className="w-3 h-3 mr-1"/> {unit.mappedTo}</span> : <ChevronRightIcon className="w-4 h-4 text-gray-300"/>}
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              ))
                           ) : <p className="text-center text-gray-400 text-sm py-10">No matching assets.</p>
                        ) : (
                           (selectedMove.crates || []).length > 0 ? 
                           (selectedMove.crates || []).filter(c => c.name.toLowerCase().includes(strategySearch.toLowerCase())).map(crate => (<div key={crate.id} onClick={() => setSelectedMappingSource(crate.id)} className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedMappingSource === crate.id ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500' : 'hover:bg-gray-50 border-gray-200'} flex justify-between items-center`}><div><p className="font-bold text-sm">{crate.name}</p><p className="text-xs text-gray-500 font-mono">{crate.barcode}</p></div>{crate.destinationZoneId ? <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold flex items-center"><CheckCircle2 className="w-3 h-3 mr-1"/> Mapped</span> : <ChevronRightIcon className="w-4 h-4 text-gray-300"/>}</div>))
                           : <p className="text-center text-gray-400 text-sm py-10">No crates provisioned.</p>
                        )}
                     </div>
                  </div>

                  {/* Destination Column - VISUAL MAP */}
                  <div className="bg-white rounded-xl border shadow-sm p-4 flex flex-col bg-gradient-to-b from-white to-gray-50/50">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold flex items-center"><MapPin className="w-4 h-4 mr-2 text-green-500"/> Destination Map</h3>
                        <div className="flex space-x-2 items-center">
                           {/* Scan Button in Header */}
                           <input type="file" ref={destMapInputRef} className="hidden" accept="image/*" onChange={handleDestinationMapUpload} />
                           <Button size="xs" variant="secondary" onClick={() => destMapInputRef.current?.click()} isLoading={analyzingImage} className="mr-2">
                              <Scan className="w-3 h-3 mr-1" /> Scan Plan
                           </Button>
                           <div className="h-4 w-px bg-gray-300 mx-1"></div>
                           <button onClick={() => setDestinationView('list')} className={`p-1.5 rounded ${destinationView === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><List className="w-4 h-4"/></button>
                           <button onClick={() => setDestinationView('map')} className={`p-1.5 rounded ${destinationView === 'map' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><Maximize2 className="w-4 h-4"/></button>
                        </div>
                     </div>
                     
                     {destinationView === 'list' ? (
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                           {selectedMove.destinationZones?.map(zone => (
                              <div key={zone.id} onClick={() => selectedMappingSource ? handleMapCrateToZone(zone.name) : handleBulkMapToZone(zone.name)} className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md group ${selectedMappingSource ? 'hover:border-green-500 hover:bg-green-50' : 'hover:border-brand-300'}`}>
                                 <div className="flex justify-between items-center">
                                    <div><p className="font-bold text-brand-900">{zone.name}</p><p className="text-xs text-gray-500">Floor {zone.floor} • Cap: {zone.capacity}</p></div>
                                    {selectedMappingSource ? (<LinkIcon className="w-5 h-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-110" />) : (<span className="text-[10px] font-bold text-brand-600 opacity-0 group-hover:opacity-100">Map All Visible</span>)}
                                 </div>
                              </div>
                           ))}
                           <Button size="sm" variant="secondary" className="w-full mt-4 border-dashed" onClick={() => setActiveModal('zone')}><Plus className="w-4 h-4 mr-2"/> Add New Zone</Button>
                        </div>
                     ) : (
                        <div
                           ref={destMapContainerRef}
                           className={`flex-1 min-h-0 relative bg-gray-100 rounded-lg border border-gray-300 overflow-hidden ${selectedZoneForMap ? 'cursor-crosshair' : ''}`}
                           onClick={handleDestMapClick}
                        >
                           {selectedMove.destinationPlan?.floorplanImage ? (
                              <>
                                 <img src={selectedMove.destinationPlan.floorplanImage} className="absolute inset-0 w-full h-full object-cover opacity-70" />
                                 {selectedMove.destinationZones?.map((zone) => (
                                    <div
                                       key={zone.id}
                                       className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer hover:scale-110 transition-all z-10 ${selectedZoneForMap === zone.id ? 'scale-125 z-20' : ''}`}
                                       style={{ left: `${zone.coordinates?.x || 50}%`, top: `${zone.coordinates?.y || 50}%` }}
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          if (selectedMappingSource) {
                                             handleMapCrateToZone(zone.name);
                                          } else {
                                             setSelectedZoneForMap(zone.id === selectedZoneForMap ? null : zone.id);
                                          }
                                       }}
                                    >
                                       <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md border-2 border-white ${selectedMappingSource ? 'bg-green-500 animate-pulse' : selectedZoneForMap === zone.id ? 'bg-orange-500 ring-4 ring-orange-300' : 'bg-brand-600'}`}>
                                          <MapPin className="w-4 h-4" />
                                       </div>
                                       <div className="mt-1 px-2 py-1 bg-black/75 text-white text-[10px] rounded whitespace-nowrap">{zone.name}</div>
                                    </div>
                                 ))}
                                 {selectedZoneForMap && (
                                    <div className="absolute top-2 left-2 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg flex items-center">
                                       <MapPin className="w-3 h-3 mr-1.5" />
                                       Click anywhere to reposition zone
                                    </div>
                                 )}
                              </>
                           ) : (
                              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                 <MapPin className="w-12 h-12 mb-2 opacity-20"/>
                                 <p className="text-sm mb-4">No destination map uploaded.</p>
                                 <Button size="sm" variant="secondary" onClick={() => destMapInputRef.current?.click()} isLoading={analyzingImage}>
                                    <Scan className="w-4 h-4 mr-2" /> Upload Floorplan
                                 </Button>
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               </div>
            )}
         </div>
      )}

      {/* ... (All other tabs preserved exactly as they were) */}
      {activeTab === 'budget' && (
         <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-xl border shadow-sm"><p className="text-xs font-bold text-gray-500 uppercase">Project Revenue</p><p className="text-2xl font-bold text-green-600">${selectedMove.value.toLocaleString()}</p></div>
                  <div className="bg-white p-5 rounded-xl border shadow-sm"><p className="text-xs font-bold text-gray-500 uppercase">Labor Cost</p><p className="text-2xl font-bold text-orange-600">${financialMetrics.labor.toLocaleString()}</p></div>
                  <div className="bg-white p-5 rounded-xl border shadow-sm"><p className="text-xs font-bold text-gray-500 uppercase">Expenses</p><p className="text-2xl font-bold text-red-600">${financialMetrics.expenses.toLocaleString()}</p></div>
                  <div className="bg-white p-5 rounded-xl border shadow-sm"><p className="text-xs font-bold text-gray-500 uppercase">Net Margin</p><p className={`text-2xl font-bold ${financialMetrics.margin > 0 ? 'text-brand-900' : 'text-red-600'}`}>${financialMetrics.margin.toLocaleString()}</p></div>
               </div>
               <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center">
                  <h4 className="text-sm font-bold text-gray-500 mb-2">Cost Breakdown</h4>
                  <div className="w-full h-40">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie data={financialMetrics.pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                              {financialMetrics.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                           </Pie>
                           <RechartsTooltip />
                           <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <div className="flex justify-between mb-4"><h3 className="font-bold">Expenses</h3><Button size="xs" onClick={() => setActiveModal('expense')}>Add Expense</Button></div>
                  <table className="w-full text-sm text-left"><thead className="bg-gray-50"><tr><th className="p-2">Category</th><th className="p-2">Desc</th><th className="p-2 text-right">Amount</th></tr></thead><tbody>{selectedMove.expenses?.map(e => <tr key={e.id} className="border-b"><td className="p-2">{e.category}</td><td className="p-2 text-gray-500">{e.description}</td><td className="p-2 text-right font-mono">${e.amount}</td></tr>)}</tbody></table>
               </div>
               <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <h3 className="font-bold mb-4">Labor Log</h3>
                  <table className="w-full text-sm text-left"><thead className="bg-gray-50"><tr><th className="p-2">Staff</th><th className="p-2">Hours</th><th className="p-2 text-right">Cost</th></tr></thead><tbody>{selectedMove.timeEntries?.map(t => <tr key={t.id} className="border-b"><td className="p-2 font-medium">{t.staffName}</td><td className="p-2 text-gray-500">{t.durationHours || 'Active'}</td><td className="p-2 text-right font-mono">${t.cost || '-'}</td></tr>)}</tbody></table>
               </div>
            </div>
         </div>
      )}

      {activeTab === 'risks' && (
         <div className="space-y-6">
            <div className="flex justify-between items-center">
               <div><h3 className="font-bold text-lg">Incident Management</h3><p className="text-sm text-gray-500">{selectedMove.incidents?.filter(i=>i.status!=='Resolved').length || 0} Active Issues</p></div>
               <Button variant="danger" onClick={() => { setTempIncident({ type: 'Damage', severity: 'Low' }); setActiveModal('incident'); }}><AlertTriangle className="w-4 h-4 mr-2"/> Report Issue</Button>
            </div>
            <div className="space-y-4">
               {selectedMove.incidents?.length === 0 && <div className="p-12 text-center text-gray-400 bg-white rounded-xl border border-dashed">No active incidents reported.</div>}
               {selectedMove.incidents?.map(inc => (
                  <div key={inc.id} className={`bg-white p-4 rounded-xl border shadow-sm flex justify-between items-start ${inc.severity==='Critical'?'border-red-200 bg-red-50':''}`}>
                     <div>
                        <div className="flex items-center gap-3 mb-2"><span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${getStatusStyles(inc.severity)}`}>{inc.severity}</span><span className="font-bold text-gray-900">{inc.type}</span><span className="text-xs text-gray-400">{new Date(inc.timestamp).toLocaleString()}</span></div>
                        <p className="text-sm text-gray-700">{inc.description}</p>
                        {inc.aiAnalysis && <div className="mt-2 p-2 bg-blue-50 text-blue-800 text-xs rounded border border-blue-100"><span className="font-bold">AI Analysis:</span> {inc.aiAnalysis}</div>}
                     </div>
                     {inc.status !== 'Resolved' && <Button size="sm" variant="secondary" onClick={() => handleResolveIncident(inc.id)}>Resolve</Button>}
                  </div>
               ))}
            </div>
         </div>
      )}

      {activeTab === 'departments' && <div className="space-y-6"><div className="flex justify-between items-center"><h3 className="font-bold text-lg text-gray-900">Departmental Phases</h3><Button onClick={() => setActiveModal('department')}><Plus className="w-4 h-4 mr-2"/> Add Department</Button></div><div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200"><tr><th className="p-4">Department Name</th><th className="p-4">Target Date</th><th className="p-4">Budget</th><th className="p-4">Headcount</th><th className="p-4">Status</th><th className="p-4"></th></tr></thead><tbody className="divide-y divide-gray-100">{selectedMove.departments?.map(dept => (<tr key={dept.id} className="hover:bg-gray-50"><td className="p-4 font-bold text-gray-900">{dept.name}</td><td className="p-4 text-gray-600">{dept.moveDate}</td><td className="p-4 text-gray-600 font-mono">${dept.budget?.toLocaleString()}</td><td className="p-4 text-gray-600">{dept.headCount || 0} Staff</td><td className="p-4"><span className={`px-2 py-1 text-xs rounded font-medium border ${getStatusStyles(dept.status)}`}>{dept.status}</span></td><td className="p-4 text-right"><Button size="xs" variant="secondary" onClick={() => { setTempDepartment(dept); setActiveModal('department'); }}>Edit</Button></td></tr>))}</tbody></table>{(!selectedMove.departments || selectedMove.departments.length === 0) && (<div className="p-8 text-center text-gray-500">No departments defined yet.</div>)}</div></div>}
      {activeTab === 'outputs' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center"><h3 className="font-bold text-gray-900 flex items-center"><QrCode className="w-5 h-5 mr-2 text-brand-600"/> Batch Label Generator</h3><Button size="sm" onClick={() => setActiveModal('printLabels')}><Printer className="w-4 h-4 mr-2"/> Print PDF</Button></div><div className="p-6 space-y-6"><div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 uppercase">Label Type</label><div className="flex mt-1 bg-gray-100 p-1 rounded-lg">{['crate', 'asset', 'room'].map(t => (<button key={t} onClick={() => setLabelConfig({...labelConfig, type: t as any})} className={`flex-1 text-xs font-bold py-1.5 rounded-md capitalize ${labelConfig.type === t ? 'bg-white shadow text-brand-700' : 'text-gray-500'}`}>{t}</button>))}</div></div><Input label="Starting Number" type="number" value={labelConfig.start} onChange={e => setLabelConfig({...labelConfig, start: parseInt(e.target.value)})} /><Input label="Count" type="number" value={labelConfig.count} onChange={e => setLabelConfig({...labelConfig, count: parseInt(e.target.value)})} /><Input label="Prefix" value={labelConfig.prefix} onChange={e => setLabelConfig({...labelConfig, prefix: e.target.value})} /></div><div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[300px]"><p className="text-xs text-gray-400 text-center mb-2">Preview (Avery 5160 Layout)</p><div className="grid grid-cols-3 gap-2 opacity-75">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="bg-white border border-gray-300 rounded p-2 text-center shadow-sm"><div className="w-8 h-8 bg-black mx-auto mb-1"></div><p className="text-xs font-bold text-black">{labelConfig.prefix}{(labelConfig.start + i).toString().padStart(3, '0')}</p><p className="text-[10px] text-gray-500 uppercase">{selectedMove.customerName}</p></div>))}<div className="flex items-center justify-center col-span-3 py-4 text-xs text-gray-400 italic">... {labelConfig.count - 6} more labels ...</div></div></div></div></div><div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><div className="bg-gray-50 px-6 py-4 border-b border-gray-200"><h3 className="font-bold text-gray-900 flex items-center"><LayoutTemplate className="w-5 h-5 mr-2 text-brand-600"/> Destination Signage</h3></div><div className="p-6">{selectedMove.destinationZones && selectedMove.destinationZones.length > 0 ? (<div className="space-y-4">{selectedMove.destinationZones.map(zone => { const itemCount = selectedMove.inventory.filter(i => i.room === zone.name || i.room === zone.id).length; return (<div key={zone.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:border-brand-300"><div><h4 className="font-bold text-lg text-brand-900">{zone.name}</h4><p className="text-sm text-gray-500">Floor {zone.floor} • Capacity: {zone.capacity}</p></div><div className="flex items-center space-x-4"><div className="text-right"><p className="text-xs text-gray-400 uppercase font-bold">Inbound</p><p className="font-bold">{itemCount} Items</p></div><Button size="sm" variant="secondary" onClick={() => showToast(`Printing placard for ${zone.name}`, 'success')}>Print Sign</Button></div></div>) })}</div>) : (<div className="text-center py-12 text-gray-400"><MapPin className="w-12 h-12 mx-auto mb-2 opacity-20"/><p>No destination zones defined.</p><Button size="sm" variant="secondary" className="mt-4" onClick={() => setActiveModal('zone')}>Add Zones</Button></div>)}</div></div></div>}
      {activeTab === 'documents' && (
         <div className="space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="font-bold text-lg text-gray-900">Project Files</h3>
               <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={handleGenerateManifest}><FileOutput className="w-4 h-4 mr-2"/> Generate Manifest</Button>
                  <div className="relative">
                     <input type="file" onChange={handleDocumentUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                     <Button><Plus className="w-4 h-4 mr-2"/> Upload Document</Button>
                  </div>
               </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {selectedMove.documents?.map(doc => (<div key={doc.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group"><div className="flex justify-between items-start mb-3"><div className="p-3 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors"><FileText className="w-6 h-6 text-gray-400 group-hover:text-blue-500" /></div><button className="text-gray-400 hover:text-gray-600"><MoreVertical className="w-4 h-4"/></button></div><h4 className="font-bold text-gray-900 text-sm truncate mb-1" title={doc.name}>{doc.name}</h4><p className="text-xs text-gray-500 flex justify-between"><span>{doc.size}</span><span>{new Date(doc.uploadedAt).toLocaleDateString()}</span></p><div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center"><div className="flex items-center text-xs text-gray-500"><div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold mr-2">{doc.uploadedBy.charAt(0)}</div>{doc.uploadedBy.split(' ')[0]}</div><button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"><Download className="w-4 h-4"/></button></div></div>))}
               {(!selectedMove.documents || selectedMove.documents.length === 0) && (<div className="col-span-3 p-10 border-2 border-dashed border-gray-300 rounded-xl text-center"><FileText className="w-12 h-12 text-gray-300 mx-auto mb-2"/><p className="text-gray-500">No documents uploaded yet.</p></div>)}
            </div>
         </div>
      )}
      {activeTab === 'timeline' && <div className="space-y-4"><div className="flex justify-between"><h3 className="font-bold">Project Schedule</h3><Button onClick={() => { setTempPhase({}); setActiveModal('phase'); }}>Add Phase</Button></div><div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">{selectedMove.phases?.map((phase, idx) => (<div key={phase.id} className="relative flex items-center mb-4 group"><div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 shrink-0 bg-white z-10 ${getStatusStyles(phase.status)}`}>{idx + 1}</div><div className="ml-6 bg-white p-4 rounded-lg border shadow-sm flex-1"><div className="flex justify-between"><h4 className="font-bold">{phase.name}</h4><span className="text-sm text-gray-500">{phase.date}</span></div><span className={`text-xs px-2 py-0.5 rounded border ${getStatusStyles(phase.status)}`}>{phase.status}</span></div></div>))}</div></div>}
      {activeTab === 'logistics' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="bg-white p-6 rounded-xl border shadow-sm"><h3 className="font-bold mb-4">Fleet Assignment</h3><div className="space-y-3">{selectedMove.loads?.map(load => (<div key={load.id} className="border p-3 rounded-lg flex justify-between items-center"><div><p className="font-bold">{load.name}</p><p className="text-xs text-gray-500">{load.status} • {Math.round(load.currentVolume)} cu ft</p></div><Button size="xs" variant="secondary" onClick={() => setManifestLoad(load)}>Manifest</Button></div>))}<Button variant="secondary" size="sm" onClick={() => { setTempLoad({}); setActiveModal('load'); }} className="w-full mt-2">Create Load</Button></div></div><div className="bg-white p-6 rounded-xl border shadow-sm"><h3 className="font-bold mb-4">Unassigned Inventory</h3><div className="max-h-[300px] overflow-y-auto space-y-2">{selectedMove.inventory.filter(i => !i.loadId).map(item => (<div key={item.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded"><span>{item.quantity}x {item.name}</span><select className="text-xs border-gray-200 rounded py-1 bg-white text-gray-900 [color-scheme:light]" onChange={(e) => handleAssignItemToLoad(item.id, e.target.value)} value="unassign"><option value="unassign">Assign...</option>{selectedMove.loads?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>))}</div></div></div>}
      {activeTab === 'tasks' && <div className="bg-white p-6 rounded-xl border"><div className="flex justify-between mb-4"><h3 className="font-bold">Tasks</h3><Button onClick={handleGenerateTasks}>Auto-Generate</Button></div><div className="space-y-2">{selectedMove.tasks?.map(t => <div key={t.id} className="p-3 border rounded flex justify-between"><span>{t.title}</span><span className={`px-2 text-xs rounded ${t.status==='Done'?'bg-green-100':'bg-yellow-100'}`}>{t.status}</span></div>)}</div></div>}
      {activeTab === 'activity' && <div className="bg-white p-6 rounded-xl border"><h3 className="font-bold mb-4">Log</h3>{logs.filter(l => l.projectId === selectedMove.id).map(l => <div key={l.id} className="text-sm py-2 border-b"><span className="font-bold">{l.userName}</span> {l.action} <span className="text-gray-400 text-xs">{new Date(l.timestamp).toLocaleTimeString()}</span></div>)}</div>}

      {/* Modals */}
      <Modal isOpen={!!unitToEdit} onClose={() => setUnitToEdit(null)} title="Edit Asset" footer={<Button onClick={handleSaveEditedUnit}>Save</Button>}>{unitToEdit && <div className="space-y-4"><Input label="Name" value={unitToEdit.name} onChange={e => setUnitToEdit({...unitToEdit, name: e.target.value})} /><Input label="Type" value={unitToEdit.type} onChange={e => setUnitToEdit({...unitToEdit, type: e.target.value})} /><Input label="Asset Tag (Sticker #)" value={unitToEdit.assetTag || ''} placeholder="e.g. 1055" onChange={e => setUnitToEdit({...unitToEdit, assetTag: e.target.value})} /></div>}</Modal>
      <Modal isOpen={activeModal === 'share'} onClose={() => setActiveModal('none')} title="Share Project" footer={<Button variant="secondary" onClick={() => setActiveModal('none')}>Close</Button>}><div className="space-y-4"><div className="p-4 bg-gray-50 rounded-lg border border-gray-200 break-all text-sm font-mono text-gray-600 select-all">{shareUrl}</div><div className="flex gap-2"><Button className="flex-1" onClick={copyToClipboard}><Copy className="w-4 h-4 mr-2"/> Copy Link</Button><Link to={`/portal/${selectedMove.id}`} target="_blank" className="flex-1"><Button variant="secondary" className="w-full"><ExternalLink className="w-4 h-4 mr-2"/> Open Preview</Button></Link></div></div></Modal>
      <Modal isOpen={activeModal === 'department'} onClose={() => setActiveModal('none')} title={tempDepartment.id ? "Edit Department" : "Add Department"} footer={<Button onClick={handleSaveDepartment}>Save</Button>}><div className="space-y-4"><Input label="Name" value={tempDepartment.name} onChange={e => setTempDepartment({...tempDepartment, name: e.target.value})} /><Input label="Contact Name" value={tempDepartment.contactName} onChange={e => setTempDepartment({...tempDepartment, contactName: e.target.value})} /></div></Modal>
      <Modal isOpen={activeModal === 'zone'} onClose={() => setActiveModal('none')} title={tempZone.id ? "Edit Zone" : "Add Zone"} footer={<Button onClick={handleSaveZone}>Save</Button>}><div className="space-y-4"><Input label="Name" value={tempZone.name} onChange={e => setTempZone({...tempZone, name: e.target.value})} /><Input label="Floor" value={tempZone.floor} onChange={e => setTempZone({...tempZone, floor: e.target.value})} /><Input label="Capacity" type="number" value={tempZone.capacity} onChange={e => setTempZone({...tempZone, capacity: parseInt(e.target.value)})} /></div></Modal>
      <Modal isOpen={activeModal === 'load'} onClose={() => setActiveModal('none')} title="Create Load" footer={<Button onClick={handleCreateLoad}>Create</Button>}><div className="space-y-4"><Input label="Name" value={tempLoad.name} onChange={e => setTempLoad({...tempLoad, name: e.target.value})} /><Select label="Vehicle" options={INITIAL_VEHICLES.map(v => ({ label: v.name, value: v.id }))} value={tempLoad.vehicleId} onChange={e => setTempLoad({...tempLoad, vehicleId: e.target.value})} /></div></Modal>
      <Modal isOpen={activeModal === 'expense'} onClose={() => setActiveModal('none')} title="Add Expense" footer={<Button onClick={handleSaveExpense}>Add</Button>}><div className="space-y-4"><Select label="Category" options={['Materials','Fuel','Parking','Food','Permits','Other'].map(c => ({ label: c, value: c }))} value={tempExpense.category} onChange={e => setTempExpense({...tempExpense, category: e.target.value as any})} /><Input label="Amount" type="number" value={tempExpense.amount} onChange={e => setTempExpense({...tempExpense, amount: Number(e.target.value)})} /><Input label="Description" value={tempExpense.description} onChange={e => setTempExpense({...tempExpense, description: e.target.value})} /></div></Modal>
      <Modal isOpen={activeModal === 'incident'} onClose={() => setActiveModal('none')} title="Report Incident" footer={<Button variant="danger" onClick={handleReportIncident}>Submit</Button>}><div className="space-y-4"><Select label="Type" options={['Damage','Access','Safety','Other'].map(t => ({ label: t, value: t }))} value={tempIncident.type} onChange={e => setTempIncident({...tempIncident, type: e.target.value})} /><Input label="Description" value={tempIncident.description} onChange={e => setTempIncident({...tempIncident, description: e.target.value})} /> <div className="bg-red-50 p-3 rounded text-xs text-red-800">Severity: {tempIncident.severity || 'Low'}</div></div></Modal>
      <Modal isOpen={!!manifestLoad} onClose={() => setManifestLoad(null)} title="Load Manifest" footer={<Button variant="secondary" onClick={() => setManifestLoad(null)}>Close</Button>}>{manifestLoad && (<div className="space-y-4"><div className="bg-gray-50 p-4 rounded-lg"><p className="font-bold">{manifestLoad.name}</p><p className="text-sm text-gray-500">Vehicle: {INITIAL_VEHICLES.find(v => v.id === manifestLoad.vehicleId)?.name || 'Unassigned'}</p></div><div><h4 className="font-bold text-sm mb-2">Items</h4><ul className="text-sm space-y-1">{selectedMove?.inventory.filter(i => i.loadId === manifestLoad.id).map(i => (<li key={i.id} className="flex justify-between border-b pb-1"><span>{i.quantity}x {i.name}</span><span className="text-gray-500">{i.volume * i.quantity} cu ft</span></li>))}{selectedMove?.inventory.filter(i => i.loadId === manifestLoad.id).length === 0 && <p className="text-gray-400 italic">No items assigned.</p>}</ul></div></div>)}</Modal>
      <Modal isOpen={activeModal === 'phase'} onClose={() => setActiveModal('none')} title={tempPhase.id ? "Edit Phase" : "Add Phase"} footer={<Button onClick={handleSavePhase}>Save</Button>}>
         <div className="space-y-4">
            <Input label="Phase Name" value={tempPhase.name} onChange={e => setTempPhase({...tempPhase, name: e.target.value})} />
            <Input label="Date" type="date" value={tempPhase.date} onChange={e => setTempPhase({...tempPhase, date: e.target.value})} />
            <Select label="Status" options={['Pending', 'In Progress', 'Completed'].map(s => ({ label: s, value: s }))} value={tempPhase.status} onChange={e => setTempPhase({...tempPhase, status: e.target.value as any})} />
         </div>
      </Modal>
      <Modal isOpen={activeModal === 'provision'} onClose={() => setActiveModal('none')} title="Provision New Crates" footer={<Button onClick={handleProvisionCrates}>Create Crates</Button>}>
         <div className="space-y-4">
            <p className="text-sm text-gray-500">Create empty crate records to be assigned to specific zones.</p>
            <Input label="Quantity" type="number" value={crateProvision.count} onChange={e => setCrateProvision({...crateProvision, count: parseInt(e.target.value)})} />
            <Input label="Label Prefix" value={crateProvision.prefix} onChange={e => setCrateProvision({...crateProvision, prefix: e.target.value})} />
            <Input label="Start Number" type="number" value={crateProvision.start} onChange={e => setCrateProvision({...crateProvision, start: parseInt(e.target.value)})} />
         </div>
      </Modal>
      <Modal isOpen={activeModal === 'printLabels'} onClose={() => setActiveModal('none')} title="Print Preview" footer={<div className="flex justify-between w-full"><Button variant="secondary" onClick={() => setActiveModal('none')}>Close</Button><Button onClick={() => window.print()}>Send to Printer</Button></div>}>
         <div className="bg-gray-200 p-4 overflow-auto max-h-[60vh]">
            <div className="bg-white shadow-lg mx-auto p-8 grid grid-cols-3 gap-4" style={{ width: '210mm', minHeight: '297mm' }}>
               {Array.from({ length: labelConfig.count }).map((_, i) => (
                  <div key={i} className="border border-gray-300 rounded-lg p-2 flex flex-col items-center justify-center text-center h-24 page-break-inside-avoid">
                     <div className="w-12 h-12 bg-black mb-1"></div>
                     <p className="text-sm font-bold text-black leading-none">{labelConfig.prefix}{(labelConfig.start + i).toString().padStart(3, '0')}</p>
                     <p className="text-[8px] text-gray-500 uppercase mt-1">{selectedMove.customerName}</p>
                  </div>
               ))}
            </div>
         </div>
      </Modal>
    </div>
  );
};
