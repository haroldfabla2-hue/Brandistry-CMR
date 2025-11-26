
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Users, CheckCircle, AlertCircle, DollarSign, Briefcase, ListTodo, Calendar, Sparkles, User as UserIcon, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { Project, User, UserRole, Task, Asset, AssetStatus, TaskStatus } from '../types';
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
    return <AdminDashboard projects={projects} tasks={tasks} assets={assets} users={useStore().users} />;
  }
  
  if (user.role === UserRole.WORKER) {
    return <WorkerDashboard user={user} projects={filteredProjects} tasks={filteredTasks} />;
  }

  return <ClientDashboard user={user} projects={filteredProjects} assets={assets} />;
};

// --- Sub-Dashboards ---

const AdminDashboard = ({ projects, tasks, assets, users }: { projects: Project[], tasks: Task[], assets: Asset[], users: User[] }) => {
  const { userPreferences } = useStore();
  const [showGemAI, setShowGemAI] = useState(false);
  
  // --- REAL-TIME CALCULATIONS ---

  // 1. Financial Metrics
  const financials = useMemo(() => {
    const totalBudget = projects.reduce((acc, curr) => acc + curr.budget, 0);
    const totalSpent = projects.reduce((acc, curr) => acc + curr.spent, 0);
    const remaining = totalBudget - totalSpent;
    const burnRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    // Revenue by Client (Top 4)
    const clientRevenue: Record<string, number> = {};
    projects.forEach(p => {
       clientRevenue[p.clientId] = (clientRevenue[p.clientId] || 0) + p.budget;
    });
    const pieData = Object.entries(clientRevenue).map(([name, value], idx) => ({
       name: `Client ${name.substring(0,4)}...`, 
       value
    })).sort((a,b) => b.value - a.value).slice(0, 5);

    return { totalBudget, totalSpent, remaining, burnRate, pieData };
  }, [projects]);

  // 2. Team Performance Metrics
  const teamStats = useMemo(() => {
     const workers = users.filter(u => u.role === UserRole.WORKER);
     
     return workers.map(worker => {
        const workerTasks = tasks.filter(t => t.assignee === worker.id);
        const completed = workerTasks.filter(t => t.status === TaskStatus.DONE).length;
        const total = workerTasks.length;
        const efficiency = total > 0 ? Math.round((completed / total) * 100) : 0;
        const highPriority = workerTasks.filter(t => t.priority === 'HIGH' && t.status !== TaskStatus.DONE).length;

        return {
           name: worker.name,
           active: total - completed,
           completed,
           efficiency,
           highPriority,
           avatar: worker.avatar
        };
     }).sort((a,b) => b.active - a.active); 
  }, [users, tasks]);

  // 3. Operational Metrics
  const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
  const totalAssetsDelivered = assets.filter(a => a.status === AssetStatus.DELIVERED).length;

  const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
         <div>
            <h2 className="text-2xl font-bold text-slate-800">Executive Overview</h2>
            <p className="text-slate-500 text-sm">Real-time financial and operational intelligence.</p>
         </div>
         <button 
           onClick={() => setShowGemAI(true)}
           className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all font-medium"
         >
            <Sparkles size={16} className="text-yellow-300" />
            Gem Photo AI
         </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {userPreferences.dashboardWidgets.revenue && (
           <StatCard 
             title="Total Budget Volume" 
             value={`$${financials.totalBudget.toLocaleString()}`} 
             subtitle={`${financials.burnRate.toFixed(1)}% utilized`}
             icon={<Wallet className="text-emerald-500" size={24} />} 
             trend="up"
           />
        )}
        {userPreferences.dashboardWidgets.activeProjects && (
           <StatCard 
             title="Active Projects" 
             value={activeProjects.toString()} 
             subtitle={`${projects.length} Total in pipeline`}
             icon={<Briefcase className="text-brand-500" size={24} />} 
             trend="neutral"
           />
        )}
        <StatCard 
          title="Deliverables Shipped" 
          value={totalAssetsDelivered.toString()} 
          subtitle="Assets marked delivered"
          icon={<CheckCircle className="text-blue-500" size={24} />} 
          trend="up"
        />
        <StatCard 
          title="Pending Actions" 
          value={tasks.filter(t => t.status !== 'DONE').length.toString()} 
          subtitle="Tasks requiring attention"
          icon={<ListTodo className="text-orange-500" size={24} />} 
          trend="down"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TEAM PERFORMANCE (POWER BI STYLE) */}
        {userPreferences.dashboardWidgets.teamProductivity && (
           <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <div>
                   <h3 className="text-lg font-bold text-slate-800">Workforce Analytics</h3>
                   <p className="text-xs text-slate-500">Real-time workload distribution & efficiency.</p>
                </div>
                <div className="flex gap-2 text-xs">
                   <div className="flex items-center gap-1"><div className="w-2 h-2 bg-brand-500 rounded-full"/> Active Tasks</div>
                   <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-400 rounded-full"/> Completed</div>
                </div>
             </div>
             
             {/* CRITICAL FIX: Explicit Height for Recharts */}
             <div className="h-[400px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamStats} layout="vertical" margin={{ left: 40, right: 20 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: 600 }} />
                     <RechartsTooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                     />
                     <Bar dataKey="active" name="Active Load" stackId="a" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                     <Bar dataKey="completed" name="Completed" stackId="a" fill="#34d399" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
               </ResponsiveContainer>
             </div>

             {/* Mini Leaderboard */}
             <div className="grid grid-cols-3 gap-4 mt-6 border-t border-slate-100 pt-4">
                {teamStats.slice(0,3).map((worker, i) => (
                   <div key={i} className="flex items-center gap-3">
                      <img src={worker.avatar} className="w-8 h-8 rounded-full border border-slate-200" alt={worker.name}/>
                      <div>
                         <p className="text-xs font-bold text-slate-700">{worker.name}</p>
                         <p className="text-[10px] text-slate-500">{worker.efficiency}% Efficiency</p>
                      </div>
                   </div>
                ))}
             </div>
           </div>
        )}
        
        {/* FINANCIAL HEALTH */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
           <h3 className="text-lg font-bold text-slate-800 mb-2">Financial Health</h3>
           <p className="text-xs text-slate-500 mb-6">Budget allocation vs. Actual spend.</p>

           {/* Budget Bars */}
           <div className="space-y-6 mb-8">
              <div>
                 <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Total Budget</span>
                    <span className="font-bold text-slate-800">${financials.totalBudget.toLocaleString()}</span>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-brand-500 h-2 rounded-full" style={{width: '100%'}}></div>
                 </div>
              </div>
              
              <div>
                 <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Actual Spent</span>
                    <span className={`font-bold ${financials.burnRate > 90 ? 'text-red-600' : 'text-slate-800'}`}>
                       ${financials.totalSpent.toLocaleString()} ({financials.burnRate.toFixed(0)}%)
                    </span>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-1000 ${financials.burnRate > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                      style={{width: `${Math.min(financials.burnRate, 100)}%`}}
                    ></div>
                 </div>
              </div>
           </div>

           {/* Client Distribution Pie */}
           {/* CRITICAL FIX: Explicit Height for Recharts */}
           <div className="h-[300px] w-full relative">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Revenue by Client</h4>
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={financials.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {financials.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                 </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none pt-6">
                 <div className="text-center">
                    <span className="block text-xl font-bold text-slate-700">{projects.length}</span>
                    <span className="text-[10px] text-slate-400 uppercase">Projects</span>
                 </div>
              </div>
           </div>
        </div>

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

const StatCard = ({ title, value, subtitle, trend, icon }: { title: string, value: string, subtitle: string, trend: 'up' | 'down' | 'neutral', icon: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-default">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
      </div>
      <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
    </div>
    <div className="mt-4 flex items-center text-xs">
      {trend === 'up' && <ArrowUpRight className="text-emerald-500 mr-1" size={14} />}
      {trend === 'down' && <ArrowDownRight className="text-red-500 mr-1" size={14} />}
      <span className="text-slate-400">{subtitle}</span>
    </div>
  </div>
);
