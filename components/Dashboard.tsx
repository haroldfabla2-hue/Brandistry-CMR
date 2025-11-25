
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { TrendingUp, Users, CheckCircle, AlertCircle, DollarSign, Briefcase, ListTodo, Calendar, Sparkles } from 'lucide-react';
import { Project, User, UserRole, Task, Asset, AssetStatus } from '../types';
import { GemPhotoAI } from './GemPhotoAI';
import { useStore } from '../context/StoreContext';

interface DashboardProps {
  user: User;
  projects: Project[];
  tasks: Task[];
  assets: Asset[];
}

export const Dashboard: React.FC<DashboardProps> = ({ user, projects, tasks, assets }) => {
  const filteredProjects = user.role === UserRole.ADMIN ? projects : projects.filter(p => user.assignedProjectIds?.includes(p.id));
  const filteredTasks = user.role === UserRole.ADMIN ? tasks : tasks.filter(t => t.assignee === user.id);
  
  if (user.role === UserRole.ADMIN) {
    return <AdminDashboard projects={projects} tasks={tasks} assets={assets} />;
  }
  
  if (user.role === UserRole.WORKER) {
    return <WorkerDashboard user={user} projects={filteredProjects} tasks={filteredTasks} />;
  }

  return <ClientDashboard user={user} projects={filteredProjects} assets={assets} />;
};

// --- Sub-Dashboards ---

const AdminDashboard = ({ projects, tasks, assets }: { projects: Project[], tasks: Task[], assets: Asset[] }) => {
  const { userPreferences } = useStore();
  const [showGemAI, setShowGemAI] = useState(false);
  
  const totalRevenue = projects.reduce((acc, curr) => acc + curr.budget, 0);
  const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
  const totalAssetsDelivered = assets.filter(a => a.status === AssetStatus.DELIVERED).length;
  
  const data = [
      { name: 'Mon', tasks: 12 }, { name: 'Tue', tasks: 19 }, { name: 'Wed', tasks: 15 },
      { name: 'Thu', tasks: 22 }, { name: 'Fri', tasks: 30 }, { name: 'Sat', tasks: 10 }, { name: 'Sun', tasks: 5 }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
         <div>
            <h2 className="text-lg font-bold text-slate-700">Agency Overview</h2>
            <p className="text-slate-500 text-sm">Real-time metrics for Brandistry operations.</p>
         </div>
         <button 
           onClick={() => setShowGemAI(true)}
           className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all font-medium"
         >
            <Sparkles size={16} className="text-yellow-300" />
            Launch Gem Photo AI
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {userPreferences.dashboardWidgets.revenue && (
           <StatCard title="Total Allocated Budget" value={`$${totalRevenue.toLocaleString()}`} trend="+12.5%" icon={<DollarSign className="text-emerald-500" size={24} />} />
        )}
        {userPreferences.dashboardWidgets.activeProjects && (
           <StatCard title="Active Projects" value={activeProjects.toString()} trend="+2" icon={<Briefcase className="text-brand-500" size={24} />} />
        )}
        <StatCard title="Assets Delivered" value={totalAssetsDelivered.toString()} trend="+5 this week" icon={<CheckCircle className="text-blue-500" size={24} />} />
        <StatCard title="Team Tasks" value={tasks.filter(t => t.status !== 'DONE').length.toString()} trend="Pending" icon={<ListTodo className="text-orange-500" size={24} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {userPreferences.dashboardWidgets.teamProductivity && (
           <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="text-lg font-semibold text-slate-800 mb-4">Weekly Task Completion</h3>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} />
                     <YAxis axisLine={false} tickLine={false} />
                     <Bar dataKey="tasks" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
             </div>
           </div>
        )}
        
        {userPreferences.dashboardWidgets.systemHealth && (
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">System Status</h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                       <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                       <span className="text-sm font-medium">StoreContext (DB)</span>
                    </div>
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Active</span>
                 </div>
                 <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                       <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                       <span className="text-sm font-medium">Gemini Pro API</span>
                    </div>
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Connected</span>
                 </div>
                 <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                       <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                       <span className="text-sm font-medium">Client Portals</span>
                    </div>
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Synced</span>
                 </div>
              </div>
           </div>
        )}
      </div>

      {showGemAI && <GemPhotoAI onClose={() => setShowGemAI(false)} />}
    </div>
  );
};

const WorkerDashboard = ({ user, projects, tasks }: { user: User, projects: Project[], tasks: Task[] }) => {
  const pendingTasks = tasks.filter(t => t.status !== 'DONE');
  const highPriority = pendingTasks.filter(t => t.priority === 'HIGH').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
         <h2 className="text-3xl font-bold mb-2">Hello, {user.name}</h2>
         <p className="opacity-90">You have {pendingTasks.length} tasks pending today. {highPriority} are high priority.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
           <h3 className="font-bold text-slate-700 text-lg">My Active Projects</h3>
           {projects.map(p => (
             <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center hover:shadow-md transition-all cursor-pointer">
                <div>
                   <h4 className="font-bold text-slate-800">{p.name}</h4>
                   <p className="text-sm text-slate-500">{p.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                   <span className="text-2xl font-bold text-brand-600">{p.progress}%</span>
                   <span className="text-xs text-slate-400">Completion</span>
                </div>
             </div>
           ))}
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
           <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Calendar size={18}/> Upcoming Deadlines</h3>
           <div className="space-y-3">
             {pendingTasks.slice(0, 5).map(t => (
               <div key={t.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className={`w-1 h-full min-h-[40px] rounded-full ${t.priority === 'HIGH' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 line-clamp-1">{t.title}</p>
                    <p className="text-xs text-slate-500">{new Date(t.dueDate).toLocaleDateString()}</p>
                  </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

const ClientDashboard = ({ user, projects, assets }: { user: User, projects: Project[], assets: Asset[] }) => {
  // Client only sees assets that are DELIVERED
  const approvedAssets = assets.filter(a => 
      projects.some(p => p.id === a.projectId) && 
      a.status === AssetStatus.DELIVERED
  );

  const totalAssets = approvedAssets.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
          <div className="flex items-center gap-4">
             <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full">
                <CheckCircle size={32} />
             </div>
             <div>
                <h2 className="text-2xl font-bold text-slate-800">{totalAssets} Total Assets Delivered</h2>
                <p className="text-slate-500">Across all your active projects with Brandistry.</p>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-slate-800 mb-1">Project Status</h3>
             <p className="text-sm text-slate-500 mb-6">Real-time progress of your active engagements.</p>
             <div className="space-y-6">
                {projects.map(p => (
                   <div key={p.id}>
                      <div className="flex justify-between mb-2">
                         <span className="font-medium text-slate-700">{p.name}</span>
                         <span className="font-bold text-brand-600">{p.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3">
                         <div className="bg-brand-500 h-3 rounded-full transition-all duration-1000" style={{width: `${p.progress}%`}}></div>
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-slate-400">
                         <span>Started: {new Date(p.startDate).toLocaleDateString()}</span>
                         <span>Deadline: {new Date(p.endDate).toLocaleDateString()}</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-slate-800 mb-1">Recent Deliverables</h3>
             <p className="text-sm text-slate-500 mb-6">Assets approved and ready for download.</p>
             <div className="space-y-3">
                {approvedAssets.slice(0, 3).map(asset => (
                   <div key={asset.id} className="flex items-center gap-4 p-3 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded flex items-center justify-center">
                         <CheckCircle size={20}/>
                      </div>
                      <div className="flex-1">
                         <h4 className="text-sm font-medium text-slate-800">{asset.title}</h4>
                         <p className="text-xs text-slate-500">v{asset.version} • Delivered</p>
                      </div>
                   </div>
                ))}
                {approvedAssets.length === 0 && <p className="text-sm text-slate-400 italic">No assets delivered yet.</p>}
             </div>
          </div>
       </div>
    </div>
  );
};

const StatCard = ({ title, value, trend, icon }: { title: string, value: string, trend: string, icon: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-default">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
      </div>
      <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
    </div>
    <div className="mt-4 flex items-center text-xs">
      <span className="text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">{trend}</span>
      <span className="text-slate-400 ml-2">vs last month</span>
    </div>
  </div>
);
