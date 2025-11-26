import React from 'react';
import { Mail, Phone, Shield } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Role } from '../types';

export const ProfilesPage: React.FC = () => {
  const { staff: staffList } = useStore();

  const getRoleColor = (role: Role) => {
    switch (role) {
      case Role.ADMIN: return 'bg-purple-100 text-purple-800 border-purple-200';
      case Role.PROJECT_MANAGER: return 'bg-blue-100 text-blue-800 border-blue-200';
      case Role.SITE_SUPERVISOR: return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Team Directory</h1>
          <p className="text-brand-500 text-sm mt-1">Contact information for all active personnel.</p>
        </div>
        {/* Note: Create/Edit actions moved to Settings as requested */}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {staffList.map((staff) => (
          <div 
            key={staff.id}
            className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-200 group"
          >
            <div className="px-6 py-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                    <div className="relative">
                         <img className="h-16 w-16 rounded-full object-cover ring-4 ring-slate-50" src={staff.avatarUrl || 'https://picsum.photos/200'} alt={`${staff.name} avatar`} />
                         <div className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${staff.status === 'Active' ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                    </div>
                    <div className="ml-4">
                        <h3 className="text-lg font-bold text-gray-900">{staff.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(staff.role)}`}>
                            {staff.role}
                        </span>
                    </div>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-1 gap-2">
                 <a href={`mailto:${staff.email}`} className="flex items-center p-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-brand-50 hover:text-brand-700 transition-colors">
                    <div className="p-1.5 bg-white rounded-md shadow-sm mr-3 text-gray-400">
                        <Mail className="w-4 h-4" />
                    </div>
                    {staff.email}
                 </a>
                 <a href={`tel:${staff.phone}`} className="flex items-center p-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-brand-50 hover:text-brand-700 transition-colors">
                    <div className="p-1.5 bg-white rounded-md shadow-sm mr-3 text-gray-400">
                        <Phone className="w-4 h-4" />
                    </div>
                    {staff.phone}
                 </a>
              </div>
            </div>
            
            {/* Footer decorative line */}
            <div className={`h-1 w-full ${
                 staff.role === Role.ADMIN ? 'bg-purple-500' : 
                 staff.role === Role.PROJECT_MANAGER ? 'bg-blue-500' : 'bg-slate-300'
            }`}></div>
          </div>
        ))}
      </div>
    </div>
  );
};
