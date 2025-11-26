import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { WarehouseVault, Move } from '../types';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Select } from '../components/FormElements';
import { Box, Search, Layers, Grid, List as ListIcon, Maximize2, ScanLine } from 'lucide-react';
import { INITIAL_WAREHOUSE } from '../services/mockData';
import { useToast } from '../components/Toast';

export const WarehousePage: React.FC = () => {
  const { moves } = useStore();
  const { showToast } = useToast();
  
  const [vaults, setVaults] = useState<WarehouseVault[]>(INITIAL_WAREHOUSE);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedVault, setSelectedVault] = useState<WarehouseVault | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Stats
  const totalVaults = vaults.length;
  const occupiedVaults = vaults.filter(v => v.status === 'Occupied').length;
  const utilization = Math.round((occupiedVaults / totalVaults) * 100);

  const filteredVaults = vaults.filter(v => 
    v.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.locationCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenVault = (vault: WarehouseVault) => {
    setSelectedVault(vault);
    setIsEditModalOpen(true);
  };

  const handleAssignVault = (projectId: string) => {
    if (!selectedVault) return;
    
    const project = moves.find(m => m.id === projectId);
    const updatedVault: WarehouseVault = {
      ...selectedVault,
      status: 'Occupied',
      projectId,
      clientName: project?.customerName || 'Unknown Client',
      contentsDescription: 'Assigned Project Storage',
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setVaults(vaults.map(v => v.id === selectedVault.id ? updatedVault : v));
    setIsEditModalOpen(false);
    showToast(`Vault ${selectedVault.id} assigned to ${project?.customerName}`, 'success');
  };

  const handleVacateVault = () => {
    if (!selectedVault) return;
    
    const updatedVault: WarehouseVault = {
      ...selectedVault,
      status: 'Empty',
      projectId: undefined,
      clientName: undefined,
      contentsDescription: undefined,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setVaults(vaults.map(v => v.id === selectedVault.id ? updatedVault : v));
    setIsEditModalOpen(false);
    showToast(`Vault ${selectedVault.id} vacated`, 'info');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Warehouse Management</h1>
          <p className="text-brand-500 text-sm">Vault allocation and facility capacity.</p>
        </div>
        
        {/* Mobile-Friendly Search & Scan */}
        <div className="flex gap-2 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search vaults..." 
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-accent-500"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
           </div>
           <Button variant="secondary" className="md:hidden" onClick={() => showToast('Scanner Active', 'info')}>
              <ScanLine className="w-5 h-5" />
           </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase">Utilization</p>
            <p className={`text-2xl font-black ${utilization > 80 ? 'text-orange-500' : 'text-green-600'}`}>{utilization}%</p>
         </div>
         <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase">Available</p>
            <p className="text-2xl font-black text-brand-900">{totalVaults - occupiedVaults}</p>
         </div>
         <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hidden md:block">
             <p className="text-xs font-bold text-gray-500 uppercase">Total Capacity</p>
             <p className="text-2xl font-black text-gray-700">{totalVaults}</p>
         </div>
      </div>

      {/* View Controls */}
      <div className="flex justify-end space-x-2">
         <button 
           onClick={() => setViewMode('grid')}
           className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-brand-100 text-brand-700' : 'text-gray-400 hover:text-gray-600'}`}
         >
            <Grid className="w-5 h-5" />
         </button>
         <button 
           onClick={() => setViewMode('list')}
           className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-brand-100 text-brand-700' : 'text-gray-400 hover:text-gray-600'}`}
         >
            <ListIcon className="w-5 h-5" />
         </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px] p-4">
         {viewMode === 'grid' ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
               {filteredVaults.map(vault => (
                  <button 
                    key={vault.id}
                    onClick={() => handleOpenVault(vault)}
                    className={`
                      aspect-square rounded-md flex flex-col items-center justify-center p-1 transition-all
                      border-2 
                      ${vault.status === 'Occupied' 
                        ? 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100' 
                        : 'bg-green-50 border-green-200 text-green-900 hover:bg-green-100'}
                    `}
                  >
                     <span className="text-[10px] font-bold opacity-60">{vault.id.replace('V-', '')}</span>
                     {vault.status === 'Occupied' ? <Box className="w-5 h-5" /> : <Maximize2 className="w-4 h-4 opacity-30" />}
                  </button>
               ))}
            </div>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                     <tr>
                        <th className="p-3">ID</th>
                        <th className="p-3">Location</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Client</th>
                        <th className="p-3">Updated</th>
                        <th className="p-3"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {filteredVaults.map(vault => (
                        <tr key={vault.id} className="hover:bg-gray-50">
                           <td className="p-3 font-bold text-gray-900">{vault.id}</td>
                           <td className="p-3 text-gray-500">{vault.locationCode}</td>
                           <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                 vault.status === 'Occupied' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                              }`}>
                                 {vault.status}
                              </span>
                           </td>
                           <td className="p-3 text-gray-900">{vault.clientName || '-'}</td>
                           <td className="p-3 text-gray-500">{vault.updatedAt}</td>
                           <td className="p-3 text-right">
                              <Button size="xs" variant="secondary" onClick={() => handleOpenVault(vault)}>Manage</Button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>

      {/* Management Modal */}
      <Modal
         isOpen={isEditModalOpen}
         onClose={() => setIsEditModalOpen(false)}
         title={`Vault Details: ${selectedVault?.id}`}
         footer={
            <div className="flex justify-between w-full">
               <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Close</Button>
               {selectedVault?.status === 'Occupied' ? (
                  <Button variant="danger" onClick={handleVacateVault}>Vacate Vault</Button>
               ) : (
                  <Button disabled={true}>Select Project to Assign (See below)</Button> 
               )}
            </div>
         }
      >
         {selectedVault && (
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                     <p className="text-xs text-gray-500 uppercase font-bold">Location</p>
                     <p className="font-medium text-gray-900">{selectedVault.locationCode}</p>
                  </div>
                  <div>
                     <p className="text-xs text-gray-500 uppercase font-bold">Status</p>
                     <p className={`font-medium ${selectedVault.status === 'Occupied' ? 'text-blue-600' : 'text-green-600'}`}>{selectedVault.status}</p>
                  </div>
               </div>

               {selectedVault.status === 'Empty' ? (
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Active Project</label>
                     <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                        {moves.filter(m => m.status !== 'Completed').map(move => (
                           <button 
                             key={move.id}
                             onClick={() => handleAssignVault(move.id)}
                             className="w-full text-left p-2 hover:bg-gray-50 border-b border-gray-50 last:border-0 flex justify-between items-center"
                           >
                              <span className="text-sm font-medium">{move.customerName}</span>
                              <span className="text-xs text-gray-400">{move.id}</span>
                           </button>
                        ))}
                     </div>
                  </div>
               ) : (
                  <div className="space-y-3">
                     <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Client</p>
                        <p className="text-lg font-bold text-gray-900">{selectedVault.clientName}</p>
                     </div>
                     <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Contents</p>
                        <p className="text-sm text-gray-700">{selectedVault.contentsDescription}</p>
                     </div>
                     <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Stored Since</p>
                        <p className="text-sm text-gray-700">{selectedVault.updatedAt}</p>
                     </div>
                  </div>
               )}
            </div>
         )}
      </Modal>
    </div>
  );
};
