import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Building, Recycle, Activity, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { MoveStatus } from '../types';

export const DashboardPage: React.FC = () => {
  const { moves } = useStore();

  const metrics = useMemo(() => {
    const totalSqFt = moves.reduce((acc, m) => acc + (m.projectedSavings?.sqFt || 0), 0);
    const totalRecycled = moves.reduce((acc, m) => acc + (m.projectedSavings?.recycledWeight || 0), 0);
    const activeProjects = moves.filter(m => m.status === MoveStatus.IN_PROGRESS || m.status === MoveStatus.BOOKED).length;
    const totalRevenue = moves.reduce((acc, m) => acc + m.value, 0);

    // Calculate chart data (Revenue by Month based on project dates)
    const months: Record<string, { moves: number; revenue: number }> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize last 6 months
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = monthNames[d.getMonth()];
      months[key] = { moves: 0, revenue: 0 };
    }

    moves.forEach(move => {
      const d = new Date(move.date);
      const key = monthNames[d.getMonth()];
      if (months[key]) {
        months[key].moves += 1;
        months[key].revenue += move.value;
      }
    });

    const chartData = Object.entries(months).map(([name, data]) => ({
      name,
      moves: data.moves,
      revenue: data.revenue
    }));

    return { totalSqFt, totalRecycled, activeProjects, chartData, totalRevenue };
  }, [moves]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-brand-900">Performance Reports</h1>
            <p className="text-brand-500 text-sm mt-1">Operational metrics and sustainability impact.</p>
        </div>
        <div className="bg-brand-200 text-brand-800 px-3 py-1 rounded-full text-xs font-semibold">
            Live Data
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
         {/* KPI Cards */}
         <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-brand-200 hover:shadow-md transition-shadow">
           <div className="px-4 py-5 sm:p-6">
             <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                    <Building className="h-5 w-5 text-green-600" />
                </div>
                <dt className="ml-3 text-sm font-medium text-gray-500 truncate">Real Estate Reclaimed</dt>
             </div>
             <dd className="mt-4 text-3xl font-bold text-brand-900">{metrics.totalSqFt.toLocaleString()} <span className="text-sm font-medium text-gray-400">sq ft</span></dd>
             <p className="text-xs text-green-600 mt-1 font-medium">Est. ${Math.round(metrics.totalSqFt * 3.5).toLocaleString()} savings</p>
           </div>
         </div>

         <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-brand-200 hover:shadow-md transition-shadow">
           <div className="px-4 py-5 sm:p-6">
             <div className="flex items-center">
                <div className="p-2 bg-accent-100 rounded-lg">
                    <Activity className="h-5 w-5 text-accent-600" />
                </div>
                <dt className="ml-3 text-sm font-medium text-gray-500 truncate">Active Projects</dt>
             </div>
             <dd className="mt-4 text-3xl font-bold text-brand-900">{metrics.activeProjects}</dd>
             <p className="text-xs text-gray-500 mt-1">Total Pipeline Value: ${(metrics.totalRevenue / 1000).toFixed(1)}k</p>
           </div>
         </div>

         <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-brand-200 hover:shadow-md transition-shadow">
           <div className="px-4 py-5 sm:p-6">
             <div className="flex items-center">
                <div className="p-2 bg-teal-100 rounded-lg">
                    <Recycle className="h-5 w-5 text-teal-600" />
                </div>
                <dt className="ml-3 text-sm font-medium text-gray-500 truncate">Assets Recycled</dt>
             </div>
             <dd className="mt-4 text-3xl font-bold text-brand-900">{metrics.totalRecycled.toLocaleString()} <span className="text-sm font-medium text-gray-400">lbs</span></dd>
             <p className="text-xs text-teal-600 mt-1 font-medium">Diverted from landfill</p>
           </div>
         </div>

         <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-brand-200 hover:shadow-md transition-shadow">
           <div className="px-4 py-5 sm:p-6">
             <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                    <Truck className="h-5 w-5 text-purple-600" />
                </div>
                <dt className="ml-3 text-sm font-medium text-gray-500 truncate">Crew Utilization</dt>
             </div>
             <dd className="mt-4 text-3xl font-bold text-brand-900">87%</dd>
             <p className="text-xs text-gray-500 mt-1">Optimal capacity</p>
           </div>
         </div>
      </div>

      {/* Charts */}
      <div className="bg-white shadow-sm border border-brand-200 rounded-xl p-6">
        <h3 className="text-lg leading-6 font-bold text-brand-900 mb-1">Monthly Project Volume</h3>
        <p className="text-sm text-gray-500 mb-6">Tracking completed relocations across all regions.</p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={metrics.chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
              <Tooltip 
                cursor={{fill: '#f1f5f9'}}
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: '#1e293b', color: '#fff'}}
                itemStyle={{color: '#fff'}}
              />
              <Bar dataKey="moves" radius={[4, 4, 0, 0]}>
                {metrics.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#334155' : '#475569'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};