
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { useStore } from '../context/StoreContext';
import { AssetStatus, AssetType } from '../types';
import { Download, Filter, TrendingUp, CheckCircle, Clock } from 'lucide-react';

export const AssetAnalytics: React.FC = () => {
  const { assets, projects } = useStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  const filteredAssets = useMemo(() => {
    return selectedProjectId === 'all' 
      ? assets 
      : assets.filter(a => a.projectId === selectedProjectId);
  }, [assets, selectedProjectId]);

  // --- STATISTICS ---
  const totalAssets = filteredAssets.length;
  const approvedCount = filteredAssets.filter(a => a.status === AssetStatus.APPROVED).length;
  const approvalRate = totalAssets > 0 ? Math.round((approvedCount / totalAssets) * 100) : 0;
  
  // --- DATA PREPARATION ---

  // 1. Status Breakdown
  const statusData = [
    { name: 'Approved', value: filteredAssets.filter(a => a.status === AssetStatus.APPROVED).length, color: '#10b981' },
    { name: 'Review', value: filteredAssets.filter(a => a.status === AssetStatus.PENDING_REVIEW).length, color: '#f59e0b' },
    { name: 'Changes', value: filteredAssets.filter(a => a.status === AssetStatus.CHANGES_REQUESTED).length, color: '#ef4444' },
    { name: 'Drafts', value: filteredAssets.filter(a => a.status === AssetStatus.DRAFT).length, color: '#94a3b8' },
  ];

  // 2. Asset Type Distribution
  const typeData = [
    { name: 'Images', value: filteredAssets.filter(a => a.type === AssetType.IMAGE).length, color: '#8b5cf6' },
    { name: 'Documents', value: filteredAssets.filter(a => a.type === AssetType.DOCUMENT).length, color: '#3b82f6' },
    { name: 'Videos', value: filteredAssets.filter(a => a.type === AssetType.VIDEO).length, color: '#ec4899' },
  ];

  // 3. Fake Timeline Data (Since mock data has static dates, we generate a trend)
  const timelineData = [
    { name: 'Week 1', uploads: 2, approved: 1 },
    { name: 'Week 2', uploads: 5, approved: 3 },
    { name: 'Week 3', uploads: 8, approved: 6 },
    { name: 'Week 4', uploads: 12, approved: 8 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header & Filter */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
         <div>
            <h2 className="text-lg font-bold text-slate-800">Asset Analytics</h2>
            <p className="text-xs text-slate-500">Performance metrics and deliverable tracking.</p>
         </div>
         <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400"/>
            <select 
               className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-brand-500"
               value={selectedProjectId}
               onChange={(e) => setSelectedProjectId(e.target.value)}
            >
               <option value="all">All Projects</option>
               {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
         </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Assets</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalAssets}</h3>
           </div>
           <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Download size={20}/>
           </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Approval Rate</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{approvalRate}%</h3>
           </div>
           <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <CheckCircle size={20}/>
           </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Avg Review Time</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">1.2 Days</h3>
           </div>
           <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <Clock size={20}/>
           </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[300px]">
           <h3 className="text-sm font-bold text-slate-700 mb-4">Upload Velocity</h3>
           <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                 <defs>
                    <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                       <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}}/>
                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}}/>
                 <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                 <Area type="monotone" dataKey="uploads" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorUploads)" />
              </AreaChart>
           </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[300px]">
           <h3 className="text-sm font-bold text-slate-700 mb-4">Status Distribution</h3>
           <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical">
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0"/>
                 <XAxis type="number" hide/>
                 <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}}/>
                 <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none'}}/>
                 <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {statusData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                 </Bar>
              </BarChart>
           </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[250px] flex flex-col">
            <h3 className="text-sm font-bold text-slate-700 mb-2">Format Breakdown</h3>
            <div className="flex-1">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie 
                        data={typeData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60} 
                        outerRadius={80} 
                        paddingAngle={5} 
                        dataKey="value"
                     >
                        {typeData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Pie>
                     <Tooltip contentStyle={{borderRadius: '8px', border: 'none'}}/>
                  </PieChart>
               </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-xs text-slate-500">
               {typeData.map((t, i) => (
                  <div key={i} className="flex items-center gap-1">
                     <div className="w-2 h-2 rounded-full" style={{backgroundColor: t.color}}></div>
                     {t.name}
                  </div>
               ))}
            </div>
         </div>
         
         <div className="col-span-2 bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-xl text-white flex flex-col justify-center">
            <h3 className="text-xl font-bold mb-2">AI Insights</h3>
            <p className="text-slate-300 text-sm mb-4">Based on your asset velocity, you are projected to complete all pending deliverables by Friday.</p>
            <div className="flex gap-4">
               <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-xs text-slate-400 uppercase">Bottleneck</p>
                  <p className="font-semibold text-amber-400">Review Phase</p>
               </div>
               <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-xs text-slate-400 uppercase">Top Performer</p>
                  <p className="font-semibold text-emerald-400">Marketing Team</p>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
};
