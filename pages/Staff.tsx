import React, { useState } from 'react';
import { Plus, Mail, Phone, Shield, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StaffMember, Role, PagePermissions, Permission } from '../types';
import { INITIAL_STAFF } from '../services/mockData';
import { Button } from '../components/Button';

const INITIAL_PERMISSIONS: PagePermissions = {
  profiles: { view: false, edit: false, delete: false },
  projects: { view: true, edit: false, delete: false },
  dispatch: { view: false, edit: false, delete: false },
  settings: { view: false, edit: false, delete: false },
};

export const StaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>(INITIAL_STAFF);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState<Partial<StaffMember>>({
    role: Role.MOVER,
    permissions: INITIAL_PERMISSIONS
  });

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const staff: StaffMember = {
      id: Math.random().toString(36).substr(2, 9),
      name: newStaff.name || '',
      email: newStaff.email || '',
      phone: newStaff.phone || '',
      role: newStaff.role as Role,
      status: 'Active',
      permissions: newStaff.permissions as PagePermissions,
      avatarUrl: `https://picsum.photos/200?random=${Math.random()}`
    };
    setStaffList([...staffList, staff]);
    setIsModalOpen(false);
    setNewStaff({ role: Role.MOVER, permissions: INITIAL_PERMISSIONS });
  };

  const togglePermission = (page: keyof PagePermissions, type: 'view' | 'edit' | 'delete') => {
    if (!newStaff.permissions) return;
    setNewStaff({
      ...newStaff,
      permissions: {
        ...newStaff.permissions,
        [page]: {
          ...newStaff.permissions[page],
          [type]: !newStaff.permissions[page][type]
        }
      }
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage users, roles, and access permissions.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {staffList.map((staff) => (
          <motion.div 
            key={staff.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white overflow-hidden shadow rounded-lg border border-gray-200"
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12">
                  <img className="h-12 w-12 rounded-full" src={staff.avatarUrl || 'https://picsum.photos/200'} alt={`${staff.name} avatar`} />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{staff.name}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {staff.role}
                  </span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-500">
                  <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  <span className="truncate">{staff.email}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  <span>{staff.phone}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-end space-x-2">
              <button className="text-gray-400 hover:text-brand-600 transition-colors">
                <Edit2 className="h-5 w-5" />
              </button>
              <button className="text-gray-400 hover:text-red-600 transition-colors">
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Staff Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full"
              >
                <form onSubmit={handleCreateStaff}>
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Create New Staff Member</h3>
                        <div className="mt-4 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input 
                              type="text" 
                              required
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                              onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Email</label>
                              <input 
                                type="email" 
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                                onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Phone</label>
                              <input 
                                type="text" 
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                                onChange={e => setNewStaff({...newStaff, phone: e.target.value})}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Role</label>
                            <select 
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-md"
                              onChange={e => setNewStaff({...newStaff, role: e.target.value as Role})}
                            >
                              {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                          
                          {/* RBAC Matrix */}
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Permissions Matrix</label>
                            <div className="border rounded-md overflow-hidden">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">View</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Edit</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Delete</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {(Object.keys(newStaff.permissions || {}) as Array<keyof PagePermissions>).map((page) => (
                                    <tr key={page}>
                                      <td className="px-3 py-2 text-sm font-medium text-gray-900 capitalize">{page}</td>
                                      {['view', 'edit', 'delete'].map((type) => (
                                        <td key={type} className="px-3 py-2 text-center">
                                          <input
                                            type="checkbox"
                                            checked={newStaff.permissions?.[page][type as keyof Permission]}
                                            onChange={() => togglePermission(page, type as 'view' | 'edit' | 'delete')}
                                            className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                                          />
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <Button type="submit" className="w-full sm:ml-3 sm:w-auto">
                      Create Staff
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      className="mt-3 w-full sm:mt-0 sm:ml-3 sm:w-auto"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};