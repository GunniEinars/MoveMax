
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Truck, Shield, Users, HardHat, ArrowRight } from 'lucide-react';
import { Role } from '../types';

export const LoginPage: React.FC = () => {
  const { login, availableUsers } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (userId: string, role: Role) => {
    login(userId);
    // Smart Redirect based on Role
    if (role === Role.MOVER) {
      navigate('/my-tasks');
    } else if (role === Role.SITE_SUPERVISOR) {
        navigate('/my-tasks'); // Supervisors likely start in field mode too
    } else {
      navigate('/moves');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left: Brand Section */}
      <div className="md:w-1/2 bg-brand-900 text-white p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-accent-600 p-2 rounded-lg">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">MoveMax</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            The Operating System for Corporate Relocation.
          </h1>
          <p className="text-brand-200 text-lg max-w-md">
            From AI-powered floorplan audits to fleet logistics and final delivery. Manage every square foot with precision.
          </p>
        </div>
        
        <div className="relative z-10 mt-12">
           <div className="flex items-center gap-4 text-sm text-brand-400">
              <span>© 2025 MoveMax Systems</span>
              <span>•</span>
              <span>v2.4.0 Enterprise</span>
           </div>
        </div>

        {/* Background Decoration */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-accent-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      {/* Right: Login Form */}
      <div className="md:w-1/2 p-12 flex items-center justify-center bg-slate-50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 mt-2">Select a persona to access the demo environment.</p>
          </div>

          <div className="space-y-4">
            {availableUsers.map((user) => {
               let Icon = Users;
               let description = "Standard Access";
               if (user.role === Role.ADMIN) { Icon = Shield; description = "Full System Configuration"; }
               if (user.role === Role.PROJECT_MANAGER) { Icon = Users; description = "Planning & Budgeting"; }
               if (user.role === Role.SITE_SUPERVISOR) { Icon = HardHat; description = "Fleet & Crew Management"; }
               if (user.role === Role.MOVER) { Icon = Truck; description = "Mobile Task Execution"; }

               return (
                <button
                  key={user.id}
                  onClick={() => handleLogin(user.id, user.role)}
                  className="w-full group flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-brand-500 hover:shadow-md hover:ring-1 hover:ring-brand-500 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${
                        user.role === Role.ADMIN ? 'bg-purple-100 text-purple-600' :
                        user.role === Role.PROJECT_MANAGER ? 'bg-blue-100 text-blue-600' :
                        user.role === Role.SITE_SUPERVISOR ? 'bg-orange-100 text-orange-600' :
                        'bg-green-100 text-green-600'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{user.name}</h3>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{user.role}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-brand-600 transform group-hover:translate-x-1 transition-all" />
                </button>
               );
            })}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-50 text-gray-500">Or sign in with email</span>
            </div>
          </div>

          <form className="space-y-4 opacity-50 pointer-events-none" aria-disabled="true">
             <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <input type="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border" value="demo@movemax.com" readOnly />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input type="password" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border" value="password" readOnly />
             </div>
             <button type="button" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none">
               Sign in
             </button>
          </form>
        </div>
      </div>
    </div>
  );
};
