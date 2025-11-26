
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Users, Truck, Map, BarChart, Settings,
  Menu, X, Bell, Briefcase, LogOut, ChevronDown, CheckSquare, Search, Box, ChevronRight, FileText, Package, Scan, Warehouse, UserCog
} from 'lucide-react';
import { NavItem, PagePermissions } from '../types';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

// Map NavItems to permission keys
const NAV_CONFIG: { item: NavItem; permissionKey: keyof PagePermissions }[] = [
  { item: { id: 'reports', label: 'Dashboard', path: '/reports', icon: BarChart }, permissionKey: 'projects' },
  { item: { id: 'moves', label: 'Projects', path: '/moves', icon: Briefcase }, permissionKey: 'projects' },
  { item: { id: 'audit', label: 'Auditor', path: '/audit', icon: Scan }, permissionKey: 'projects' }, // New Audit Link
  { item: { id: 'warehouse', label: 'Warehouse', path: '/warehouse', icon: Warehouse }, permissionKey: 'projects' },
  { item: { id: 'mytasks', label: 'My Tasks', path: '/my-tasks', icon: CheckSquare }, permissionKey: 'projects' },
  { item: { id: 'profiles', label: 'Profiles', path: '/profiles', icon: Users }, permissionKey: 'profiles' },
  { item: { id: 'staff', label: 'Staff', path: '/staff', icon: UserCog }, permissionKey: 'profiles' },
  { item: { id: 'dispatch', label: 'Dispatch', path: '/dispatch', icon: Map }, permissionKey: 'dispatch' },
  { item: { id: 'settings', label: 'Settings', path: '/settings', icon: Settings }, permissionKey: 'settings' },
];

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notifications
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, login, logout, availableUsers, hasPermission } = useAuth();
  const { moves, staff, logs, resetStore } = useStore();

  // Protected Route Check
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Filter Nav Items based on View Permissions
  const visibleNavItems = NAV_CONFIG.filter(config => 
    hasPermission(config.permissionKey, 'view')
  ).map(config => config.item);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search Logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = [];

    // Search Projects
    moves.forEach(m => {
      if (m.customerName.toLowerCase().includes(query) || m.id.toLowerCase().includes(query)) {
        results.push({ type: 'Project', title: m.customerName, subtitle: m.id, link: '/moves', id: m.id });
      }
      // Search Inventory
      m.inventory.forEach(i => {
        if (i.name.toLowerCase().includes(query) || i.id.toLowerCase().includes(query)) {
          results.push({ type: 'Asset', title: i.name, subtitle: `${m.customerName} • ${i.room}`, link: '/moves', id: m.id }); // Link to project
        }
      });
    });

    // Search Staff
    staff.forEach(s => {
      if (s.name.toLowerCase().includes(query) || s.email.toLowerCase().includes(query)) {
        results.push({ type: 'Staff', title: s.name, subtitle: s.role, link: '/profiles', id: s.id });
      }
    });

    setSearchResults(results.slice(0, 6)); // Limit results
    setIsSearchOpen(true);
  }, [searchQuery, moves, staff]);

  const handleSearchResultClick = (result: any) => {
    navigate(result.link);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Notifications Logic
  const recentLogs = logs.slice(0, 5);
  const hasUnread = recentLogs.length > 0; 

  if (!currentUser) return null; // Will redirect via useEffect

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Top Navigation Bar - Dark Theme */}
      <header className="bg-brand-900 border-b border-brand-800 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo & Desktop Nav */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/')}>
                <div className="h-9 w-9 bg-accent-600 rounded-lg flex items-center justify-center mr-3 shadow-md border border-accent-500">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="block font-bold text-lg text-white tracking-tight leading-none">MoveMax</span>
                  <span className="block text-[10px] uppercase tracking-widest text-brand-400 font-semibold">Enterprise</span>
                </div>
              </div>
              
              <div className="hidden md:ml-10 md:flex md:space-x-1 h-full">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      className={`inline-flex items-center px-4 pt-1 border-b-2 text-sm font-medium transition-all duration-200 h-full
                        ${isActive 
                          ? 'border-accent-500 text-white bg-brand-800' 
                          : 'border-transparent text-brand-300 hover:border-brand-600 hover:text-white'
                        }`}
                    >
                      <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-accent-500' : 'text-brand-400'}`} />
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>

            {/* Center Search Bar */}
            <div className="hidden lg:flex flex-1 items-center justify-center px-8" ref={searchRef}>
              <div className="w-full max-w-md relative">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-brand-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-brand-700 rounded-md leading-5 bg-brand-800 text-brand-100 placeholder-brand-400 focus:outline-none focus:bg-brand-700 focus:ring-1 focus:ring-accent-500 focus:border-accent-500 sm:text-sm transition-colors"
                    placeholder="Search projects, assets, staff..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery && setIsSearchOpen(true)}
                  />
                </div>
                {/* Search Dropdown */}
                {isSearchOpen && searchResults.length > 0 && (
                  <div className="absolute mt-1 w-full bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    {searchResults.map((result, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSearchResultClick(result)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center group"
                      >
                        <div className={`p-2 rounded-md mr-3 ${
                          result.type === 'Project' ? 'bg-blue-50 text-blue-600' :
                          result.type === 'Staff' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                          {result.type === 'Project' ? <Briefcase className="w-4 h-4"/> : 
                           result.type === 'Staff' ? <Users className="w-4 h-4"/> : <Box className="w-4 h-4"/>}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 group-hover:text-accent-600">{result.title}</p>
                          <p className="text-xs text-gray-500">{result.type} • {result.subtitle}</p>
                        </div>
                        <ChevronRight className="ml-auto w-4 h-4 text-gray-300 group-hover:text-accent-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Actions & Mobile Menu Button */}
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <div className="relative">
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2 rounded-full text-brand-400 hover:text-white hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 focus:ring-offset-brand-900"
                >
                  <span className="sr-only">View notifications</span>
                  <Bell className="h-5 w-5" />
                  {hasUnread && <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-brand-900"></span>}
                </button>
                {/* Notification Dropdown */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200 ring-1 ring-black ring-opacity-5">
                     <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-700">Activity Log</span>
                        <button onClick={() => setIsNotifOpen(false)} className="text-gray-400 hover:text-gray-500"><X className="w-4 h-4"/></button>
                     </div>
                     <div className="max-h-96 overflow-y-auto">
                        {recentLogs.length === 0 ? (
                           <div className="px-4 py-6 text-center text-sm text-gray-500">No recent activity</div>
                        ) : (
                           recentLogs.map(log => (
                              <div key={log.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                                 <p className="text-sm text-gray-900">
                                    <span className="font-semibold">{log.userName}</span> {log.action}
                                 </p>
                                 <p className="text-xs text-gray-500 mt-1">{log.details}</p>
                                 <p className="text-[10px] text-gray-400 mt-1">{new Date(log.timestamp).toLocaleTimeString()}</p>
                              </div>
                           ))
                        )}
                     </div>
                     <div className="px-4 py-2 bg-gray-50 text-center border-t border-gray-100">
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/moves'); setIsNotifOpen(false); }} className="text-xs font-bold text-accent-600 hover:text-accent-700">View All Activity</a>
                     </div>
                  </div>
                )}
              </div>
              
              {/* User Menu Dropdown */}
              <div className="relative hidden md:flex items-center pl-4 border-l border-brand-700">
                 <button 
                   onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                   className="flex items-center focus:outline-none"
                 >
                   <div className="flex flex-col items-end mr-3">
                      <span className="text-sm font-medium text-white">{currentUser.name}</span>
                      <span className="text-xs text-brand-400">{currentUser.role}</span>
                   </div>
                   <img 
                     className="h-9 w-9 rounded-full bg-brand-700 border-2 border-brand-600 shadow-sm object-cover" 
                     src={currentUser.avatarUrl} 
                     alt="User Avatar" 
                   />
                   <ChevronDown className="w-4 h-4 text-brand-400 ml-2" />
                 </button>

                 {isUserMenuOpen && (
                   <div className="absolute right-0 top-14 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 focus:outline-none z-50">
                     <div className="px-4 py-2 border-b border-gray-100">
                       <p className="text-xs text-gray-500 uppercase font-bold">Session Options</p>
                     </div>
                     <button onClick={resetStore} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                         Reset Demo Data
                     </button>
                     <div className="border-t border-gray-100 mt-1 pt-1">
                       <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                         Log Out
                       </button>
                     </div>
                   </div>
                 )}
              </div>

              <div className="-mr-2 flex items-center md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-brand-400 hover:text-white hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent-500"
                >
                  <span className="sr-only">Open main menu</span>
                  {isMobileMenuOpen ? (
                    <X className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Menu className="block h-6 w-6" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-brand-900 border-b border-brand-800 shadow-lg absolute w-full z-40">
            <div className="pt-2 pb-3 space-y-1 px-2">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-3 rounded-md text-base font-medium
                      ${isActive 
                        ? 'bg-brand-800 text-white border-l-4 border-accent-500' 
                        : 'text-brand-300 hover:bg-brand-800 hover:text-white'
                      }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
             <div className="pt-4 pb-4 border-t border-brand-800 px-4">
               <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-xs p-2 rounded border border-brand-700 text-brand-300 w-full text-center hover:text-white hover:border-brand-600"
                >
                  Log Out
                </button>
             </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};
