
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { Truck, Calendar, MapPin, CheckCircle2, FileText, Download, Phone, User, Clock, ArrowLeft } from 'lucide-react';
import { MoveStatus } from '../types';

export const ClientPortalPage: React.FC = () => {
  const { moveId } = useParams<{ moveId: string }>();
  const { moves, staff } = useStore();
  const { currentUser } = useAuth(); // Check if user is logged in as admin
  const navigate = useNavigate();
  
  const project = moves.find(m => m.id === moveId);
  const pm = staff.find(s => project?.assignedCrewIds.includes(s.id)); // Just picking one for demo

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
           <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-red-600" />
           </div>
           <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h1>
           <p className="text-gray-500">The secure link you used may be invalid or expired. Please contact your Move Manager.</p>
        </div>
      </div>
    );
  }

  const progressPercent = 
    project.status === MoveStatus.COMPLETED ? 100 :
    project.status === MoveStatus.IN_PROGRESS ? 65 :
    project.status === MoveStatus.BOOKED ? 25 : 10;

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
       {/* Client Header */}
       <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
             <div className="flex items-center">
                <div className="bg-brand-900 text-white p-2 rounded-lg mr-3">
                   <Truck className="w-6 h-6" />
                </div>
                <div>
                   <h1 className="text-xl font-bold text-gray-900 tracking-tight">MoveMax Portal</h1>
                   <p className="text-xs text-gray-500 uppercase tracking-wider">Secure Client Access</p>
                </div>
             </div>
             <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{project.customerName}</p>
                <p className="text-xs text-gray-500">ID: {project.id}</p>
             </div>
          </div>
       </header>

       <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Hero Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
             <div className="bg-brand-900 p-8 text-white">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                   <div>
                      <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-brand-200 text-xs font-bold uppercase mb-2 border border-white/20">
                         Current Status
                      </span>
                      <h2 className="text-3xl md:text-4xl font-bold">{project.status}</h2>
                   </div>
                   <div className="mt-4 md:mt-0 text-right">
                      <div className="flex items-center text-brand-200 mb-1 justify-end">
                         <Calendar className="w-4 h-4 mr-2" />
                         <span className="text-sm font-medium">Target Date</span>
                      </div>
                      <p className="text-2xl font-bold">{new Date(project.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                   </div>
                </div>

                {/* Progress Bar */}
                <div className="relative pt-1">
                   <div className="flex mb-2 items-center justify-between">
                      <div className="text-xs font-semibold inline-block text-brand-200 uppercase">
                         Overall Completion
                      </div>
                      <div className="text-right">
                         <span className="text-xs font-bold inline-block text-white">
                            {progressPercent}%
                         </span>
                      </div>
                   </div>
                   <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-brand-800">
                      <div style={{ width: `${progressPercent}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-accent-500 transition-all duration-1000 ease-out"></div>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                <div className="p-6 flex items-start">
                   <MapPin className="w-6 h-6 text-brand-400 mr-4 mt-1" />
                   <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Origin</p>
                      <p className="text-gray-900 font-medium">{project.origin}</p>
                   </div>
                </div>
                <div className="p-6 flex items-center justify-center">
                   <div className="bg-gray-100 rounded-full p-2">
                      <Truck className="w-6 h-6 text-gray-400" />
                   </div>
                </div>
                <div className="p-6 flex items-start">
                   <MapPin className="w-6 h-6 text-accent-500 mr-4 mt-1" />
                   <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Destination</p>
                      <p className="text-gray-900 font-medium">{project.destination}</p>
                   </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Left Column: Timeline */}
             <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                   <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-gray-400" /> Live Timeline
                   </h3>
                   
                   <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                      {project.phases?.map((phase, idx) => (
                         <div key={phase.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow ${
                               phase.status === 'Completed' ? 'bg-green-500 border-green-500 text-white' :
                               phase.status === 'In Progress' ? 'bg-white border-accent-500 text-accent-500' : 'bg-white border-gray-300 text-gray-300'
                            }`}>
                               {phase.status === 'Completed' ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                               <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-gray-900">{phase.name}</span>
                                  <span className="text-xs text-gray-500">{phase.date}</span>
                               </div>
                               <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  phase.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                  phase.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                               }`}>
                                  {phase.status}
                               </span>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* Right Column: Docs & Team */}
             <div className="space-y-8">
                {/* Documents */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                   <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-gray-400" /> Documents
                   </h3>
                   <div className="space-y-3">
                      {project.documents && project.documents.length > 0 ? project.documents.map(doc => (
                         <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-brand-200 transition-colors">
                            <div className="flex items-center min-w-0">
                               <div className="bg-white p-2 rounded border border-gray-200 mr-3">
                                  <FileText className="w-4 h-4 text-brand-500" />
                               </div>
                               <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                                  <p className="text-xs text-gray-500">{doc.size}</p>
                               </div>
                            </div>
                            <button className="text-gray-400 hover:text-accent-600">
                               <Download className="w-4 h-4" />
                            </button>
                         </div>
                      )) : (
                         <p className="text-sm text-gray-500 italic">No documents shared yet.</p>
                      )}
                   </div>
                </div>

                {/* Team Contact */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                   <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-gray-400" /> Move Manager
                   </h3>
                   <div className="flex items-center mb-6">
                      <img 
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                        alt="PM" 
                        className="w-12 h-12 rounded-full bg-gray-200 mr-4"
                      />
                      <div>
                         <p className="font-bold text-gray-900">Sarah Jenkins</p>
                         <p className="text-sm text-gray-500">Senior Project Lead</p>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                         <Phone className="w-4 h-4 mr-2" /> Call (555) 010-1010
                      </button>
                      <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700">
                         Email Support
                      </button>
                   </div>
                </div>
             </div>
          </div>
       </main>

       <footer className="bg-white border-t border-gray-200 py-8 mt-12">
          <div className="max-w-5xl mx-auto px-4 text-center">
             <p className="text-sm text-gray-400">&copy; 2025 MoveMax Logistics. All rights reserved.</p>
          </div>
       </footer>

       {/* Admin Return Button */}
       {currentUser && (
          <div className="fixed bottom-4 right-4 z-50">
             <button 
               onClick={() => navigate('/moves')}
               className="flex items-center bg-brand-900 text-white px-4 py-3 rounded-full shadow-lg hover:bg-brand-800 transition-colors font-bold text-sm"
             >
                <ArrowLeft className="w-4 h-4 mr-2" /> Return to Admin
             </button>
          </div>
       )}
    </div>
  );
};
