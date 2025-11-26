import React, { useState } from 'react';
import { Users, Sliders, Shield, Plus, Edit2, Trash2, Mail, Phone, CheckCircle, CreditCard, AlertTriangle, Building, Globe, Zap, Link, Bell, Calendar, DollarSign } from 'lucide-react';
import { Button } from '../components/Button';
import { Input, Select, Toggle } from '../components/FormElements';
import { SlideOver } from '../components/SlideOver';
import { StaffMember, Role, PagePermissions, Permission, AppSettings } from '../types';
import { useStore } from '../context/StoreContext';
import { useToast } from '../components/Toast';

const INITIAL_PERMISSIONS: PagePermissions = {
  profiles: { view: false, edit: false, delete: false },
  projects: { view: true, edit: false, delete: false },
  dispatch: { view: false, edit: false, delete: false },
  settings: { view: false, edit: false, delete: false },
};

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'billing' | 'integrations' | 'notifications'>('general');
  const { staff, addStaff, updateStaff, deleteStaff, settings, updateSettings, resetStore } = useStore();
  const { showToast } = useToast();
  
  // -- General Settings State --
  const [generalForm, setGeneralForm] = useState<AppSettings>(settings);

  // -- User Management Logic --
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<Partial<StaffMember>>({
    role: Role.MOVER,
    permissions: INITIAL_PERMISSIONS
  });

  const handleOpenUserPanel = (member?: StaffMember) => {
    if (member) {
      setEditingUser(member.id);
      setUserForm({ ...member });
    } else {
      setEditingUser(null);
      setUserForm({ role: Role.MOVER, permissions: INITIAL_PERMISSIONS });
    }
    setIsUserPanelOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      updateStaff({ ...userForm, id: editingUser } as StaffMember);
      showToast('User profile updated successfully', 'success');
    } else {
      const newUser: StaffMember = {
        id: Math.random().toString(36).substr(2, 9),
        name: userForm.name || 'New User',
        email: userForm.email || '',
        phone: userForm.phone || '',
        role: userForm.role as Role,
        status: 'Active',
        permissions: userForm.permissions as PagePermissions,
        avatarUrl: `https://picsum.photos/200?random=${Math.random()}`
      };
      addStaff(newUser);
      showToast('New team member added', 'success');
    }
    setIsUserPanelOpen(false);
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('Are you sure you want to remove this user? This action cannot be undone.')) {
      deleteStaff(id);
      showToast('User removed', 'info');
    }
  };

  const togglePermission = (page: keyof PagePermissions, type: 'view' | 'edit' | 'delete') => {
    if (!userForm.permissions) return;
    const currentPerms = userForm.permissions[page];
    const updatedPerms = {
      ...userForm.permissions,
      [page]: { ...currentPerms, [type]: !currentPerms[type as keyof Permission] }
    };
    setUserForm({ ...userForm, permissions: updatedPerms });
  };

  const handleSaveGeneral = () => {
    updateSettings(generalForm);
    showToast('System configuration saved', 'success');
  };

  const handleResetSystem = () => {
    if (confirm("WARNING: This will wipe all current projects, tasks, and changes, restoring the original demo data. Continue?")) {
      resetStore();
    }
  };

  const handleIntegrationToggle = (key: keyof AppSettings['integrations']) => {
    const newState = !generalForm.integrations?.[key];
    setGeneralForm({
       ...generalForm,
       integrations: { ...generalForm.integrations, [key]: newState }
    });
    // Auto-save for UX
    updateSettings({ integrations: { ...settings.integrations, [key]: newState }});
    showToast(`${key} integration ${newState ? 'enabled' : 'disabled'}`, 'info');
  };

  const handleNotificationToggle = (key: keyof AppSettings['notifications']) => {
    const newState = !generalForm.notifications?.[key];
    setGeneralForm({
       ...generalForm,
       notifications: { ...generalForm.notifications, [key]: newState }
    });
    updateSettings({ notifications: { ...settings.notifications, [key]: newState }});
    showToast('Notification preference saved', 'info');
  };

  // -- Render Helpers --
  const tabs = [
    { id: 'general', label: 'General', icon: Sliders },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
    { id: 'integrations', label: 'Integrations', icon: Link },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-900">System Settings</h1>
        <p className="text-brand-500 text-sm mt-1">Configure system preferences and manage administrative access.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col md:flex-row">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-gray-200 p-4">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-white text-brand-700 shadow-sm ring-1 ring-black/5' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`flex-shrink-0 mr-3 h-5 w-5 ${isActive ? 'text-accent-600' : 'text-gray-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto max-h-[calc(100vh-200px)]">
          
          {/* GENERAL SETTINGS */}
          {activeTab === 'general' && (
             <div className="space-y-8 max-w-2xl">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                     <Building className="w-5 h-5 mr-2 text-gray-400"/> Company Profile
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                     <Input 
                        label="Organization Name" 
                        value={generalForm.companyName} 
                        onChange={(e) => setGeneralForm({...generalForm, companyName: e.target.value})}
                     />
                     <Input 
                        label="Support Email" 
                        value={generalForm.supportEmail} 
                        onChange={(e) => setGeneralForm({...generalForm, supportEmail: e.target.value})}
                     />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                     <Globe className="w-5 h-5 mr-2 text-gray-400"/> Localization & Standards
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                     <Select 
                        label="Currency"
                        value={generalForm.currency}
                        onChange={(e) => setGeneralForm({...generalForm, currency: e.target.value as any})}
                        options={[{label: 'USD ($)', value: 'USD'}, {label: 'EUR (€)', value: 'EUR'}, {label: 'GBP (£)', value: 'GBP'}]}
                     />
                     <div className="grid grid-cols-2 gap-2">
                        <Select 
                           label="Weight Unit"
                           value={generalForm.weightUnit}
                           onChange={(e) => setGeneralForm({...generalForm, weightUnit: e.target.value as any})}
                           options={[{label: 'Pounds (lbs)', value: 'lbs'}, {label: 'Kilograms (kg)', value: 'kg'}]}
                        />
                         <Select 
                           label="Distance"
                           value={generalForm.distanceUnit}
                           onChange={(e) => setGeneralForm({...generalForm, distanceUnit: e.target.value as any})}
                           options={[{label: 'Miles (mi)', value: 'mi'}, {label: 'Kilometers (km)', value: 'km'}]}
                        />
                     </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                   <Button onClick={handleSaveGeneral}>Save Configuration</Button>
                </div>

                <div className="border-t border-gray-100 pt-8 mt-4">
                  <h3 className="text-lg font-bold text-red-600 flex items-center mb-2">
                     <AlertTriangle className="w-5 h-5 mr-2"/> Danger Zone
                  </h3>
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex justify-between items-center">
                     <div>
                        <p className="text-sm font-bold text-red-900">Reset System Data</p>
                        <p className="text-xs text-red-700 mt-1">Permanently deletes all projects, tasks, and users created in this session. Restores mock data.</p>
                     </div>
                     <Button variant="danger" size="sm" onClick={handleResetSystem}>Reset Data</Button>
                  </div>
                </div>
             </div>
          )}

          {/* BILLING SETTINGS */}
          {activeTab === 'billing' && (
             <div className="space-y-6 max-w-2xl">
                <div className="bg-brand-900 text-white rounded-xl p-6 shadow-lg relative overflow-hidden">
                   <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                         <div>
                            <p className="text-brand-300 text-sm font-semibold uppercase tracking-wider">Current Plan</p>
                            <h2 className="text-3xl font-bold mt-1">Enterprise</h2>
                         </div>
                         <span className="bg-accent-500 text-white px-3 py-1 rounded-full text-xs font-bold">ACTIVE</span>
                      </div>
                      <div className="grid grid-cols-2 gap-8 mt-6">
                         <div>
                            <p className="text-brand-300 text-xs uppercase mb-1">Renewal Date</p>
                            <p className="font-mono">Oct 14, 2025</p>
                         </div>
                         <div>
                            <p className="text-brand-300 text-xs uppercase mb-1">Payment Method</p>
                            <p className="font-mono">•••• 4242</p>
                         </div>
                      </div>
                   </div>
                   <Zap className="absolute right-0 bottom-0 text-brand-800 opacity-20 w-48 h-48 -mr-10 -mb-10" />
                </div>

                <div>
                   <h3 className="text-lg font-bold text-gray-900 mb-4">Usage & Limits</h3>
                   <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                      <div>
                         <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700">User Seats</span>
                            <span className="text-gray-500">{staff.length} / 20</span>
                         </div>
                         <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-brand-600 h-2 rounded-full" style={{ width: `${(staff.length / 20) * 100}%` }}></div>
                         </div>
                      </div>
                      <div>
                         <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700">Storage (Media)</span>
                            <span className="text-gray-500">1.2 GB / 10 GB</span>
                         </div>
                         <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-accent-500 h-2 rounded-full" style={{ width: '12%' }}></div>
                         </div>
                      </div>
                   </div>
                </div>
                
                <div className="pt-4 text-center">
                   <Button variant="secondary" className="w-full">Manage Subscription</Button>
                </div>
             </div>
          )}

          {/* INTEGRATIONS SETTINGS */}
          {activeTab === 'integrations' && (
             <div className="space-y-6 max-w-2xl">
                <div className="mb-6">
                   <h3 className="text-lg font-bold text-gray-900">Connected Apps</h3>
                   <p className="text-sm text-gray-500">Sync data seamlessly with your existing tool stack.</p>
                </div>
                
                <div className="space-y-4">
                   <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center">
                         <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                             <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.52 2.52 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.527 2.527 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>
                         </div>
                         <div>
                            <h4 className="font-bold text-gray-900">Slack</h4>
                            <p className="text-xs text-gray-500">Receive incident alerts and task updates in channels.</p>
                         </div>
                      </div>
                      <Toggle label="" checked={generalForm.integrations?.slack || false} onChange={() => handleIntegrationToggle('slack')} />
                   </div>

                   <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center">
                         <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                            <Calendar className="w-6 h-6 text-blue-600" />
                         </div>
                         <div>
                            <h4 className="font-bold text-gray-900">Google Calendar</h4>
                            <p className="text-xs text-gray-500">Sync project phases and move dates to corporate calendar.</p>
                         </div>
                      </div>
                      <Toggle label="" checked={generalForm.integrations?.googleCalendar || false} onChange={() => handleIntegrationToggle('googleCalendar')} />
                   </div>

                   <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center">
                         <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                            <DollarSign className="w-6 h-6 text-green-600" />
                         </div>
                         <div>
                            <h4 className="font-bold text-gray-900">QuickBooks Online</h4>
                            <p className="text-xs text-gray-500">Auto-sync project values and department budgets.</p>
                         </div>
                      </div>
                      <Toggle label="" checked={generalForm.integrations?.quickbooks || false} onChange={() => handleIntegrationToggle('quickbooks')} />
                   </div>
                </div>
             </div>
          )}
          
          {/* NOTIFICATIONS SETTINGS */}
          {activeTab === 'notifications' && (
             <div className="space-y-6 max-w-2xl">
                 <div className="mb-6">
                   <h3 className="text-lg font-bold text-gray-900">Alert Preferences</h3>
                   <p className="text-sm text-gray-500">Customize how and when you receive system updates.</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                   <div className="p-4">
                      <Toggle 
                        label="Daily Digest Email" 
                        description="Receive a summary of all project activity at 8:00 AM."
                        checked={generalForm.notifications?.emailDailyDigest || false}
                        onChange={() => handleNotificationToggle('emailDailyDigest')}
                      />
                   </div>
                   <div className="p-4">
                      <Toggle 
                        label="Incident Alerts (Email)" 
                        description="Immediate email when High/Critical incidents are reported."
                        checked={generalForm.notifications?.emailIncidents || false}
                        onChange={() => handleNotificationToggle('emailIncidents')}
                      />
                   </div>
                   <div className="p-4">
                      <Toggle 
                        label="Critical SMS Alerts" 
                        description="Send text messages to admins for urgent safety issues."
                        checked={generalForm.notifications?.smsCritical || false}
                        onChange={() => handleNotificationToggle('smsCritical')}
                      />
                   </div>
                </div>
             </div>
          )}

          {/* USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Team Members</h2>
                  <p className="text-sm text-gray-500">Manage access and permissions for the team.</p>
                </div>
                <Button onClick={() => handleOpenUserPanel()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {staff.map((member) => (
                    <li key={member.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                      <div className="flex items-center min-w-0 gap-4">
                        <img className="h-10 w-10 rounded-full bg-gray-300" src={member.avatarUrl} alt={`${member.name} avatar`} />
                        <div className="min-w-0">
                           <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                           <p className="text-xs text-gray-500 truncate">{member.email}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            member.role === Role.ADMIN ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {member.role}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handleOpenUserPanel(member)} className="p-2 text-gray-400 hover:text-brand-600 rounded-full hover:bg-white">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteUser(member.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-white">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* USER CREATE/EDIT DRAWER */}
      <SlideOver
        isOpen={isUserPanelOpen}
        onClose={() => setIsUserPanelOpen(false)}
        title={editingUser ? "Edit User Profile" : "New Team Member"}
        description="Configure personal details and role-based access permissions."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsUserPanelOpen(false)} className="mr-3">Cancel</Button>
            <Button onClick={handleSaveUser}>{editingUser ? 'Save Changes' : 'Create Account'}</Button>
          </>
        }
      >
        <form className="space-y-6" id="user-form">
          <div className="space-y-4">
            <div className="flex justify-center mb-6">
               <div className="relative">
                 <img src={userForm.avatarUrl || `https://picsum.photos/200`} alt={`${userForm.name || 'User'} profile picture`} className="w-20 h-20 rounded-full ring-4 ring-slate-50" />
                 <button type="button" className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow border border-gray-200 text-xs font-bold text-brand-600">Edit</button>
               </div>
            </div>

            <Input 
              label="Full Name" 
              placeholder="e.g. Jane Doe"
              value={userForm.name || ''}
              onChange={e => setUserForm({...userForm, name: e.target.value})}
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
               <Input 
                 label="Email Address" 
                 type="email"
                 placeholder="jane@movemax.com"
                 value={userForm.email || ''}
                 onChange={e => setUserForm({...userForm, email: e.target.value})}
                 required
               />
               <Input 
                 label="Phone Number" 
                 placeholder="(555) 123-4567"
                 value={userForm.phone || ''}
                 onChange={e => setUserForm({...userForm, phone: e.target.value})}
               />
            </div>

            <Select
              label="System Role"
              options={Object.values(Role).map(r => ({ label: r, value: r }))}
              value={userForm.role}
              onChange={e => setUserForm({...userForm, role: e.target.value as Role})}
            />
          </div>

          <div className="pt-6 border-t border-gray-100">
             <h4 className="text-sm font-bold text-gray-900 mb-3">Permissions Matrix</h4>
             <div className="space-y-3">
               {(Object.keys(userForm.permissions || {}) as Array<keyof PagePermissions>).map((page) => (
                 <div key={page} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm font-medium capitalize text-gray-700">{page}</span>
                    <div className="flex space-x-1">
                       {['view', 'edit', 'delete'].map((type) => {
                         const isChecked = userForm.permissions?.[page][type as keyof Permission];
                         return (
                           <button
                             key={type}
                             type="button"
                             onClick={() => togglePermission(page, type as any)}
                             className={`px-2 py-1 text-xs rounded border transition-all ${
                               isChecked 
                               ? 'bg-brand-100 border-brand-200 text-brand-700 font-semibold' 
                               : 'bg-white border-gray-200 text-gray-400'
                             }`}
                           >
                             {type}
                           </button>
                         );
                       })}
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </form>
      </SlideOver>
    </div>
  );
};