
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useToast } from '../components/Toast';
import { ChevronRight, ChevronLeft, Camera, Box, Layers, Home, Scan, LogOut, CheckCircle2, Plus, Trash2, Image as ImageIcon, Shield, MapPin, List } from 'lucide-react';
import { StorageUnit, StorageSubUnit, InventoryItem, DispositionStatus, DetectedItem } from '../types';
import { Button } from '../components/Button';
import { analyzeDrawerContents } from '../services/geminiService';
import { motion } from 'framer-motion';

export const AuditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { moves, updateMove } = useStore();
  const { showToast } = useToast();
  
  const [selectedMoveId, setSelectedMoveId] = useState<string>('');
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [currentUnit, setCurrentUnit] = useState<StorageUnit | null>(null);
  const [currentSubUnit, setCurrentSubUnit] = useState<StorageSubUnit | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [scanPreview, setScanPreview] = useState<{ image: string; detectedItems: DetectedItem[]; } | null>(null);

  // Navigation View State: 'list' or 'map'
  const [navView, setNavView] = useState<'list' | 'map'>('map');

  const selectedMove = moves.find(m => m.id === selectedMoveId);
  const itemsInSubUnit = selectedMove?.inventory.filter(i => i.storageUnitId === currentUnit?.id && i.storageSubUnitId === currentSubUnit?.id) || [];

  // --- Handlers ---
  const handleSelectMove = (moveId: string) => { 
      setSelectedMoveId(moveId); 
      setCurrentRoom(null); 
      setCurrentUnit(null); 
      setCurrentSubUnit(null); 
  };
  
  const goBack = () => { 
      if (scanPreview) { setScanPreview(null); return; }
      if (currentSubUnit) setCurrentSubUnit(null); 
      else if (currentUnit) setCurrentUnit(null); 
      else if (currentRoom) setCurrentRoom(null); 
      else setSelectedMoveId(''); 
  };
  
  const getBreadcrumbTitle = () => {
      if (currentSubUnit) return currentSubUnit.label;
      if (currentUnit) return currentUnit.name;
      if (currentRoom) return currentRoom;
      if (selectedMove) return selectedMove.customerName;
      return 'Auditor Mode';
  };

  const handleAddSubUnit = () => {
    if (!currentUnit || !selectedMove) return;
    const newSub: StorageSubUnit = { id: `sub-${Date.now()}`, type: 'shelf', label: `Shelf/Drawer ${currentUnit.subUnits.length + 1}` };
    
    // Safe access to identifiedUnits
    const currentIdentifiedUnits = selectedMove.storagePlan?.identifiedUnits || [];
    const updatedUnits = currentIdentifiedUnits.map(u => u.id === currentUnit.id ? { ...u, subUnits: [...u.subUnits, newSub] } : u);
    
    const updatedMove = { 
        ...selectedMove, 
        storagePlan: { 
            mappings: [], 
            ...selectedMove.storagePlan, 
            identifiedUnits: updatedUnits 
        } 
    };
    updateMove(updatedMove);
    setCurrentUnit({ ...currentUnit, subUnits: [...currentUnit.subUnits, newSub] });
    showToast('Structure updated', 'success');
  };

  // Update Physical Asset Tag
  const handleUpdateAssetTag = (newTag: string) => {
      if (!currentUnit || !selectedMove) return;
      
      const currentIdentifiedUnits = selectedMove.storagePlan?.identifiedUnits || [];
      const updatedUnits = currentIdentifiedUnits.map(u => u.id === currentUnit.id ? { ...u, assetTag: newTag } : u);
      
      const updatedMove = { 
          ...selectedMove, 
          storagePlan: { 
              mappings: [], 
              ...selectedMove.storagePlan, 
              identifiedUnits: updatedUnits 
          } 
      };
      updateMove(updatedMove);
      // Update local state
      setCurrentUnit({ ...currentUnit, assetTag: newTag });
  };

  const handleAuditScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file || !currentUnit || !currentSubUnit || !selectedMove) return;

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

     setIsAnalyzing(true);
     const reader = new FileReader();
     reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const scanResult = await analyzeDrawerContents(base64);
        setScanPreview({ image: base64, detectedItems: scanResult.items });
        setIsAnalyzing(false);
     };
     reader.readAsDataURL(file);
  };

  const handleConfirmScan = () => {
     if (!scanPreview || !selectedMove || !currentUnit || !currentSubUnit) return;
     const newItems: InventoryItem[] = scanPreview.detectedItems.map((item, idx) => ({
         id: `audit-${Date.now()}-${idx}`, name: item.type, quantity: item.count, volume: item.count * 0.1, isFragile: false, room: currentUnit.location||'Unknown', storageUnitId: currentUnit.id, storageSubUnitId: currentSubUnit.id, departmentId: currentUnit.departmentId, disposition: item.suggestedDisposition as DispositionStatus || 'Keep',
         auditImageUrl: selectedMove.retainAuditImages ? `data:image/jpeg;base64,${scanPreview.image.substring(0, 100)}...` : undefined
     }));
     updateMove({ ...selectedMove, inventory: [...selectedMove.inventory, ...newItems] });
     setScanPreview(null); showToast('Saved', 'success');
  };

  const handleUnitClick = (unit: StorageUnit) => {
      setCurrentRoom(unit.location || 'Unknown');
      setCurrentUnit(unit);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Persistent Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 px-4 py-3 flex justify-between items-center">
         <div className="flex items-center">
            {selectedMoveId && <button onClick={goBack} className="mr-3 p-2 rounded-full bg-white border text-gray-600 hover:bg-gray-50"><ChevronLeft className="w-5 h-5" /></button>}
            <span className="font-bold text-gray-900 truncate max-w-[200px]">{getBreadcrumbTitle()}</span>
         </div>
         <div className="flex space-x-2">
            {selectedMoveId && <button onClick={() => setSelectedMoveId('')} className="p-2 text-gray-500 hover:text-brand-600"><Home className="w-5 h-5" /></button>}
            <button onClick={() => navigate('/moves')} className="flex items-center text-xs font-bold bg-white px-3 py-2 rounded-lg border text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors shadow-sm"><LogOut className="w-3 h-3 mr-2" /> Exit</button>
         </div>
      </div>

      <div className="max-w-lg mx-auto p-4">
        {/* 1. PROJECT SELECT */}
        {!selectedMoveId && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Select Project</h2>
            {moves.filter(m => m.status !== 'Completed').map(move => (
              <motion.div key={move.id} whileTap={{ scale: 0.98 }} onClick={() => handleSelectMove(move.id)} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm active:border-brand-500 cursor-pointer">
                <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-gray-900">{move.customerName}</h3><span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">{move.id}</span></div>
                <p className="text-xs text-gray-500 mb-3">{move.origin}</p>
                <div className="flex gap-2 text-xs text-gray-400"><span className="flex items-center"><Layers className="w-3 h-3 mr-1"/> {move.storagePlan?.identifiedUnits.length || 0} Assets</span></div>
              </motion.div>
            ))}
          </div>
        )}

        {/* 2. VISUAL NAVIGATION (Map or List) */}
        {selectedMove && !currentUnit && (
           <div className="space-y-4 h-[calc(100vh-140px)] flex flex-col">
              <div className="flex bg-gray-200 p-1 rounded-lg flex-shrink-0">
                 <button onClick={() => setNavView('map')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${navView === 'map' ? 'bg-white shadow text-brand-700' : 'text-gray-500'}`}><MapPin className="w-3 h-3 inline mr-1"/>Map View</button>
                 <button onClick={() => setNavView('list')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${navView === 'list' ? 'bg-white shadow text-brand-700' : 'text-gray-500'}`}><List className="w-3 h-3 inline mr-1"/>List View</button>
              </div>

              {navView === 'map' ? (
                 selectedMove.storagePlan?.floorplanImage ? (
                    <div className="flex-1 relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-inner">
                        <img src={selectedMove.storagePlan.floorplanImage} className="absolute inset-0 w-full h-full object-contain opacity-60" />
                        {(selectedMove.storagePlan?.identifiedUnits || []).map((unit, idx) => {
                           const isAudited = selectedMove.inventory.some(i => i.storageUnitId === unit.id);
                           return (
                              <div 
                                 key={unit.id} 
                                 className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all z-10`} 
                                 style={{ left: `${unit.coordinates?.x || 50}%`, top: `${unit.coordinates?.y || 50}%` }} 
                                 onClick={() => handleUnitClick(unit)}
                              >
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md border-2 border-white ${isAudited ? 'bg-green-600' : 'bg-blue-600'}`}>
                                    {unit.assetTag || (idx + 1)}
                                 </div>
                                 <div className="mt-1 px-2 py-0.5 bg-black/80 text-white text-[8px] rounded whitespace-nowrap backdrop-blur-sm">{unit.name}</div>
                              </div>
                           );
                        })}
                    </div>
                 ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                       <MapPin className="w-12 h-12 mb-2 opacity-20"/>
                       <p className="text-sm">No floorplan available.</p>
                       <Button size="sm" variant="secondary" className="mt-4" onClick={() => setNavView('list')}>Switch to List</Button>
                    </div>
                 )
              ) : (
                 <div className="flex-1 overflow-y-auto space-y-2">
                    {(selectedMove.storagePlan?.identifiedUnits || []).map((unit, idx) => (
                       <div key={unit.id} onClick={() => handleUnitClick(unit)} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm active:bg-gray-50 flex justify-between items-center">
                          <div>
                             <p className="font-bold text-gray-900">{unit.name}</p>
                             <p className="text-xs text-gray-500">{unit.location}</p>
                          </div>
                          <div className="text-right">
                             <span className="block text-xs font-bold text-gray-400 mb-1">Tag: {unit.assetTag || `#${idx + 1}`}</span>
                             {selectedMove.inventory.some(i => i.storageUnitId === unit.id) ? <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto"/> : <ChevronRight className="w-5 h-5 text-gray-300 ml-auto"/>}
                          </div>
                       </div>
                    ))}
                    {(selectedMove.storagePlan?.identifiedUnits || []).length === 0 && (
                        <p className="text-center text-gray-400 text-sm py-10">No assets defined yet.</p>
                    )}
                 </div>
              )}
           </div>
        )}

        {/* 3. UNIT DETAILS (The actual audit) */}
        {currentUnit && !currentSubUnit && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                  <div>
                     <p className="text-xs text-gray-500 uppercase font-bold">Location</p>
                     <p className="font-medium text-gray-900">{currentUnit.location}</p>
                  </div>
                  <div>
                     <p className="text-xs text-gray-500 uppercase font-bold text-right">Asset Type</p>
                     <p className="font-medium text-gray-900 text-right">{currentUnit.type}</p>
                  </div>
               </div>
               {/* PHYSICAL TAG INPUT */}
               <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <label className="block text-xs font-bold text-blue-800 mb-1">Physical Asset Tag</label>
                  <div className="flex gap-2">
                     <input 
                        type="text" 
                        placeholder="Scan/Type Tag #..." 
                        className="flex-1 border border-blue-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={currentUnit.assetTag || ''}
                        onChange={(e) => handleUpdateAssetTag(e.target.value)}
                     />
                     <Button size="xs" disabled>Scan</Button>
                  </div>
                  <p className="text-[10px] text-blue-600 mt-1">Updates digital map pin instantly.</p>
               </div>
            </div>

            <div className="flex justify-between items-center mt-6 mb-2">
               <h3 className="font-bold text-gray-900">Storage Zones</h3>
               <Button size="xs" variant="secondary" onClick={handleAddSubUnit}><Plus className="w-3 h-3 mr-1"/> Add Shelf/Drawer</Button>
            </div>
            
            <div className="space-y-2">
               {currentUnit.subUnits.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                     <p className="text-sm text-gray-500">No drawers/shelves defined.</p>
                     <Button size="sm" className="mt-2" onClick={handleAddSubUnit}>Add First Drawer</Button>
                  </div>
               )}
               {currentUnit.subUnits.map((sub, idx) => {
                  const items = selectedMove?.inventory.filter(i => i.storageUnitId === currentUnit.id && i.storageSubUnitId === sub.id);
                  const hasItems = items && items.length > 0;
                  
                  return (
                    <motion.div key={sub.id} whileTap={{ scale: 0.98 }} onClick={() => setCurrentSubUnit(sub)} className={`p-4 rounded-xl border shadow-sm flex justify-between items-center ${hasItems ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                       <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${hasItems ? 'bg-green-200 text-green-800' : 'bg-gray-100 text-gray-500'}`}>{idx + 1}</div>
                          <div>
                             <p className="font-bold text-gray-900">{sub.label}</p>
                             <p className="text-xs text-gray-500">{hasItems ? `${items.length} Items Logged` : 'Empty / Pending'}</p>
                          </div>
                       </div>
                       <ChevronRight className={`w-5 h-5 ${hasItems ? 'text-green-400' : 'text-gray-300'}`} />
                    </motion.div>
                  );
               })}
            </div>
          </div>
        )}

        {/* 4. DRAWER SCANNER */}
        {currentSubUnit && (
           <div className="space-y-6">
              {!scanPreview ? (
                 <div className="space-y-6">
                    <div className="aspect-video bg-gray-900 rounded-xl flex flex-col items-center justify-center text-white relative overflow-hidden shadow-lg">
                        <Camera className="w-16 h-16 mb-4 opacity-80" />
                        <p className="font-medium text-lg">Tap to Capture</p>
                        <p className="text-sm text-gray-400 mt-1"> Ensure contents are visible</p>
                        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleAuditScan} />
                        {isAnalyzing && (
                           <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                              <p className="animate-pulse">AI Analyzing...</p>
                           </div>
                        )}
                    </div>
                    
                    {/* Status Bar */}
                    <div className="flex items-center justify-between text-xs bg-white p-3 rounded-lg border shadow-sm">
                        <span className="text-gray-500 font-bold uppercase">Retention Policy</span>
                        <span className={`flex items-center font-bold ${selectedMove?.retainAuditImages ? 'text-green-600' : 'text-brand-600'}`}>
                           {selectedMove?.retainAuditImages ? <ImageIcon className="w-3 h-3 mr-1"/> : <Shield className="w-3 h-3 mr-1"/>}
                           {selectedMove?.retainAuditImages ? 'Photo Saved' : 'Privacy Mode (Photo Deleted)'}
                        </span>
                    </div>

                    {itemsInSubUnit.length > 0 && (
                       <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-bold text-sm text-gray-700">Existing Items</div>
                          {itemsInSubUnit.map(item => (
                             <div key={item.id} className="p-3 border-b last:border-0 text-sm flex justify-between">
                                <span>{item.quantity}x {item.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${item.disposition==='Digitize'?'bg-blue-100 text-blue-800':'bg-gray-100'}`}>{item.disposition}</span>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              ) : (
                 <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                       <img src={`data:image/jpeg;base64,${scanPreview.image}`} className="w-full h-48 object-cover" />
                       <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-white text-xs text-center">
                          {selectedMove?.retainAuditImages ? 'Image will be saved to record.' : 'Image will be discarded after save.'}
                       </div>
                    </div>
                    
                    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                       <div className="bg-green-50 px-4 py-3 border-b border-green-100 flex justify-between items-center">
                          <h3 className="font-bold text-green-900 flex items-center"><CheckCircle2 className="w-4 h-4 mr-2"/> AI Analysis Complete</h3>
                       </div>
                       <div className="p-4 space-y-3">
                          {scanPreview.detectedItems.map((item, idx) => (
                             <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-3">
                                   <div className="bg-white border border-gray-200 w-10 h-10 flex items-center justify-center rounded-lg font-bold text-lg shadow-sm">{item.count}</div>
                                   <div><p className="font-bold text-gray-900">{item.type}</p><p className="text-xs text-gray-500">Suggested: {item.suggestedDisposition}</p></div>
                                </div>
                                <div className="flex flex-col gap-1">
                                   <button className="p-1 bg-white border rounded hover:bg-gray-50"><Plus className="w-3 h-3 text-gray-500"/></button>
                                   <button className="p-1 bg-white border rounded hover:bg-gray-50"><Trash2 className="w-3 h-3 text-red-400"/></button>
                                </div>
                             </div>
                          ))}
                       </div>
                       <div className="p-4 bg-gray-50 border-t border-gray-200 grid grid-cols-2 gap-3">
                          <Button variant="secondary" onClick={() => setScanPreview(null)}>Retake</Button>
                          <Button onClick={handleConfirmScan}>Confirm & Save</Button>
                       </div>
                    </div>
                 </div>
              )}
           </div>
        )}
      </div>
    </div>
  );
};
