
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend, LineChart, Line, ComposedChart, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { 
  TrendingUp, Users, CheckCircle, AlertCircle, DollarSign, Briefcase, ListTodo, 
  Calendar, Sparkles, User as UserIcon, ArrowUpRight, ArrowDownRight, Wallet,
  Maximize2, Minimize2, Filter, RefreshCw, Search, Zap, X, Activity, Clock, Download, BrainCircuit
} from 'lucide-react';
import { Project, User, UserRole, Task, Asset, AssetStatus, TaskStatus, ProjectStatus, PredictiveInsight } from '../types';
import { GemPhotoAI } from './GemPhotoAI';
import { useStore } from '../context/StoreContext';
import { geminiService } from '../services/geminiService';

interface DashboardProps {
  user: User;
  projects: Project[];
  tasks: Task[];
  assets: Asset[];
}

// --- TYPES ---
type DashboardFilter = {
  projectId?: string;
  assigneeId?: string;
  status?: string;
  priority?: string;
  query?: string;
};

export const Dashboard: React.FC<DashboardProps> = ({ user, projects, tasks, assets }) => {
  const filteredProjects = user.role === UserRole.ADMIN ? projects : projects.filter(p => user.assignedProjectIds?.includes(p.id));
  const filteredTasks = user.role === UserRole.ADMIN ? tasks : tasks.filter(t => t.assignee === user.id);
  
  if (user.role === UserRole.ADMIN) {
    return <InfiniteHorizonDashboard projects={projects} tasks={tasks} assets={assets} users={useStore().users} />;
  }
  
  if (user.role === UserRole.WORKER) {
    return <WorkerDashboard user={user} projects={filteredProjects} tasks={filteredTasks} />;
  }

  return <ClientDashboard user={user} projects={filteredProjects} assets={assets} />;
};

// --- INFINITE HORIZON DASHBOARD (ADMIN - REAL DATA ONLY) ---

const InfiniteHorizonDashboard = ({ projects, tasks, assets, users }: { projects: Project[], tasks: Task[], assets: Asset[], users: User[] }) => {
  const [showGemAI, setShowGemAI] = useState(false);
  const [filters, setFilters] = useState<DashboardFilter>({});
  const [zoomedTile, setZoomedTile] = useState<string | null>(null);
  const [nlQuery, setNlQuery] = useState('');
  const [viewMode, setViewMode] = useState<'visual' | 'report'>('visual');
  const [insight, setInsight] = useState<PredictiveInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- 1. REAL ANALYTICS ENGINE (Deterministic) ---
  const analytics = useMemo(() => {
    // Filter Data
    let activeP = projects;
    let activeT = tasks;

    if (nlQuery) {
       const lowerQ = nlQuery.toLowerCase();
       activeP = activeP.filter(p => p.name.toLowerCase().includes(lowerQ) || p.description.toLowerCase().includes(lowerQ));
       activeT = activeT.filter(t => t.title.toLowerCase().includes(lowerQ) || t.assignee.includes(lowerQ));
    }
    if (filters.assigneeId) activeT = activeT.filter(t => t.assignee === filters.assigneeId);
    if (filters.projectId) {
        activeP = activeP.filter(p => p.id === filters.projectId);
        activeT = activeT.filter(t => t.projectId === filters.projectId);
    }

    // KPIs
    const totalBudget = activeP.reduce((acc, p) => acc + p.budget, 0);
    const totalSpent = activeP.reduce((acc, p) => acc + p.spent, 0);
    const globalMargin = totalBudget > 0 ? ((totalBudget - totalSpent) / totalBudget) * 100 : 0;
    
    const activeLoad = activeT.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const reviewQueue = assets.filter(a => a.status === AssetStatus.PENDING_REVIEW).length;
    
    // Team Performance
    const teamStats = users
        .filter(u => u.role === UserRole.WORKER)
        .map(u => {
            const userTasks = activeT.filter(t => t.assignee === u.id);
            const completed = userTasks.filter(t => t.status === TaskStatus.DONE).length;
            const inProgress = userTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
            const efficiency = userTasks.length > 0 ? Math.round((completed / userTasks.length) * 100) : 0;
            return {
                id: u.id,
                name: u.name,
                avatar: u.avatar,
                total: userTasks.length,
                completed,
                inProgress,
                efficiency,
                workload: inProgress 
            };
        })
        .sort((a,b) => b.efficiency - a.efficiency);

    // Risk Matrix
    const riskMatrix = activeP.map(p => {
        const startDate = new Date(p.startDate).getTime();
        const endDate = new Date(p.endDate).getTime();
        const now = new Date().getTime();
        const totalDuration = endDate - startDate;
        const elapsed = Math.max(0, Math.min(1, (now - startDate) / totalDuration));
        const burn = p.budget > 0 ? p.spent / p.budget : 0;
        
        return {
            id: p.id,
            name: p.name,
            x: Math.round(elapsed * 100),
            y: Math.round(burn * 100),
            z: p.budget,
            status: p.status
        };
    });

    // Live Operations Feed
    const liveOps = activeT
        .filter(t => t.status === TaskStatus.IN_PROGRESS)
        .map(t => ({
            id: t.id,
            title: t.title,
            assignee: users.find(u => u.id === t.assignee),
            project: projects.find(p => p.id === t.projectId),
            dueDate: t.dueDate
        }));

    return { 
        totalBudget, totalSpent, globalMargin, activeLoad, reviewQueue, 
        teamStats, riskMatrix, liveOps 
    };
  }, [projects, tasks, assets, users, nlQuery, filters]);

  // --- AI PREDICTION HANDLER ---
  const runPrediction = async () => {
     setIsAnalyzing(true);
     // Prepare lightweight context
     const context = `
        Projects: ${projects.map(p => `${p.name} (Budget: ${p.budget}, Spent: ${p.spent}, Progress: ${p.progress}%)`).join('; ')}
        Tasks: ${tasks.length} total, ${analytics.activeLoad} in progress.
        Team: ${analytics.teamStats.map(t => `${t.name} (${t.efficiency}% eff)`).join(', ')}.
     `;
     
     const result = await geminiService.generatePredictiveAnalysis(context);
     setInsight(result);
     setIsAnalyzing(false);
  };

  // --- HELPERS ---
  const toggleFilter = (key: keyof DashboardFilter, value: string | undefined) => {
     setFilters(prev => ({ ...prev, [key]: prev[key] === value ? undefined : value }));
  };

  const clearFilters = () => {
     setFilters({});
     setNlQuery('');
  };

  const exportReport = () => {
     const content = `
# Brandistry Executive Summary
Generated: ${new Date().toLocaleString()}

## Financial Health
- Total Active Budget: $${analytics.totalBudget.toLocaleString()}
- Total Spent: $${analytics.totalSpent.toLocaleString()}
- Global Margin: ${analytics.globalMargin.toFixed(1)}%

## AI Predictive Analysis
- Risk Level: ${insight?.riskLevel || 'N/A'}
- Prediction: ${insight?.prediction || 'Not run'}
- Recommendation: ${insight?.recommendation || 'N/A'}

## Operational Velocity
- Active Tasks (Load): ${analytics.activeLoad}
- Assets in Review: ${analytics.reviewQueue}
     `;
     
     const blob = new Blob([content], { type: 'text/markdown' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `Brandistry_Report_${new Date().toISOString().split('T')[0]}.md`;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
  };

  return (
    <div className={`space-y-6 animate-in fade-in duration-500 relative ${zoomedTile ? 'overflow-hidden' : ''}`}>
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
         <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"/>
               Command Center
            </h2>
            <p className="text-slate-500 text-sm">Real-Time Analytics • {Object.keys(filters).length > 0 ? 'Filtered View' : 'Agency Overview'}</p>
         </div>
         
         <div className="flex-1 w-full md:max-w-xl">
            <div className="relative group">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
               </div>
               <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent shadow-sm transition-all"
                  placeholder="Filter by project, person, or status..."
                  value={nlQuery}
                  onChange={(e) => setNlQuery(e.target.value)}
               />
               {(nlQuery || Object.keys(filters).length > 0) && (
                  <button onClick={clearFilters} className="absolute right-2 top-2 p-1 bg-slate-100 rounded-md text-slate-500 hover:text-red-500">
                     <X size={14}/>
                  </button>
               )}
            </div>
         </div>

         <div className="flex gap-2">
            <div className="bg-slate-100 rounded-lg p-1 flex">
                <button onClick={() => setViewMode('visual')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'visual' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>Visual</button>
                <button onClick={() => setViewMode('report')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'report' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>Report</button>
            </div>
            <button 
               onClick={() => setShowGemAI(true)}
               className="px-4 py-2 bg-slate-900 text-white rounded-lg shadow-lg hover:bg-slate-800 transition-all font-medium flex items-center gap-2"
            >
               <Sparkles size={16} className="text-yellow-300" /> Gem Photo AI
            </button>
         </div>
      </div>

      {viewMode === 'report' ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm max-w-4xl mx-auto">
              <div className="flex justify-between items-start mb-8 border-b pb-4">
                 <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Executive Summary</h1>
                    <p className="text-slate-500">Generated {new Date().toLocaleDateString()} • Real-Time Snapshot</p>
                 </div>
                 <button onClick={exportReport} className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 font-medium text-sm transition-colors">
                    <Download size={16}/> Export
                 </button>
              </div>
              
              {/* AI PREDICTIVE INSIGHTS */}
              <div className="bg-slate-900 rounded-xl p-6 text-white mb-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                 <div className="flex justify-between items-start relative z-10">
                    <div>
                       <h3 className="text-lg font-bold flex items-center gap-2"><BrainCircuit size={20} className="text-brand-400"/> AI Predictive Intelligence</h3>
                       <p className="text-slate-400 text-sm mt-1">Powered by Gemini 1.5 Pro Analysis</p>
                    </div>
                    <button 
                       onClick={runPrediction} 
                       disabled={isAnalyzing}
                       className="px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                       {isAnalyzing ? <RefreshCw className="animate-spin" size={14}/> : <Sparkles size={14}/>}
                       {isAnalyzing ? 'Analyzing...' : 'Run Prediction'}
                    </button>
                 </div>
                 
                 {insight && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
                       <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                          <p className="text-xs font-bold text-slate-400 uppercase">Risk Level</p>
                          <p className={`text-2xl font-bold mt-1 ${
                             insight.riskLevel === 'CRITICAL' ? 'text-red-400' : 
                             insight.riskLevel === 'HIGH' ? 'text-orange-400' : 
                             'text-emerald-400'
                          }`}>{insight.riskLevel}</p>
                       </div>
                       <div className="md:col-span-2 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                          <p className="text-xs font-bold text-slate-400 uppercase">Strategic Insight</p>
                          <p className="text-sm mt-1 leading-relaxed text-slate-200">{insight.prediction}</p>
                          <p className="text-xs text-brand-300 mt-2 font-medium">Rec: {insight.recommendation}</p>
                       </div>
                    </div>
                 )}
              </div>

              <div className="space-y-8">
                  <section>
                      <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2"><Activity size={18}/> Operational Velocity</h3>
                      <p className="text-slate-600 leading-relaxed">
                          The agency currently has <span className="font-bold">{analytics.activeLoad} tasks in active development</span> across {projects.filter(p=>p.status===ProjectStatus.ACTIVE).length} projects. 
                          The review queue contains <span className="font-bold">{analytics.reviewQueue} assets</span> waiting for approval. 
                          Overall team efficiency is averaging <span className="font-bold">{Math.round(analytics.teamStats.reduce((a,b)=>a+b.efficiency,0)/Math.max(1, analytics.teamStats.length))}%</span>.
                      </p>
                  </section>
                  <section>
                      <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2"><Wallet size={18}/> Financial Health</h3>
                      <p className="text-slate-600 leading-relaxed">
                          Total allocated budget for active engagements is <span className="font-bold">${analytics.totalBudget.toLocaleString()}</span>, with <span className="font-bold">${analytics.totalSpent.toLocaleString()}</span> spent to date. 
                          The global operating margin sits at <span className={`font-bold ${analytics.globalMargin < 20 ? 'text-red-600' : 'text-emerald-600'}`}>{analytics.globalMargin.toFixed(1)}%</span>.
                      </p>
                  </section>
              </div>
          </div>
      ) : (
        <>
            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricTile 
                    title="Revenue Flow" 
                    value={`$${analytics.totalBudget.toLocaleString()}`} 
                    delta="Total Budget" 
                    icon={<Wallet className="text-emerald-500"/>}
                    color="emerald"
                />
                <MetricTile 
                    title="Active Load" 
                    value={analytics.activeLoad.toString()} 
                    delta="In Progress" 
                    icon={<Zap className="text-blue-500"/>}
                    color="blue"
                />
                <MetricTile 
                    title="Review Queue" 
                    value={analytics.reviewQueue.toString()} 
                    delta="Pending Approval" 
                    icon={<CheckCircle className="text-amber-500"/>}
                    color="amber"
                />
                <MetricTile 
                    title="Global Margin" 
                    value={`${analytics.globalMargin.toFixed(1)}%`} 
                    delta="Health" 
                    icon={<Activity className={`${analytics.globalMargin < 20 ? 'text-red-500' : 'text-purple-500'}`}/>}
                    color={analytics.globalMargin < 20 ? 'red' : 'purple'}
                />
            </div>

            {/* MAIN CANVAS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[600px]">
                
                {/* 1. RISK MATRIX */}
                <div className={`col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col transition-all duration-500 ${zoomedTile === 'risk' ? 'fixed inset-4 z-50 h-auto' : 'relative h-[400px] lg:h-full'}`}>
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Project Risk Matrix</h3>
                            <p className="text-xs text-slate-500">Time Elapsed (X) vs. Budget Burn (Y). Top Right = High Risk.</p>
                        </div>
                        <button onClick={() => setZoomedTile(zoomedTile === 'risk' ? null : 'risk')} className="text-slate-400 hover:text-brand-600">
                            {zoomedTile === 'risk' ? <Minimize2/> : <Maximize2/>}
                        </button>
                    </div>
                    <div className="flex-1 p-4 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{top: 20, right: 20, bottom: 20, left: 20}}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                                <XAxis type="number" dataKey="x" name="Time" unit="%" label={{ value: 'Time Elapsed (%)', position: 'insideBottomRight', offset: 0, fontSize: 12 }} />
                                <YAxis type="number" dataKey="y" name="Budget" unit="%" label={{ value: 'Budget Spent (%)', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                                <ZAxis type="number" dataKey="z" range={[100, 1000]} name="Budget Volume" />
                                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}}/>
                                <Legend />
                                <Scatter name="Projects" data={analytics.riskMatrix} fill="#8b5cf6" shape="circle">
                                    {analytics.riskMatrix.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.y > entry.x ? '#ef4444' : '#10b981'} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. LIVE OPERATIONS FEED */}
                <div className="col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px] lg:h-full">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${analytics.activeLoad > 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}/>
                            Live Operations
                        </h3>
                        <p className="text-xs text-slate-500">Tasks currently in progress.</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-0 custom-scroll">
                        {analytics.liveOps.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <ListTodo size={32} className="mb-2 opacity-20"/>
                                <p className="text-sm">No active tasks at this moment.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {analytics.liveOps.map(op => (
                                    <div key={op.id} className="p-4 hover:bg-slate-50 transition-colors group">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-sm font-bold text-slate-700 line-clamp-1 group-hover:text-brand-600">{op.title}</h4>
                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">WIP</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <img src={op.assignee?.avatar} alt={op.assignee?.name} className="w-5 h-5 rounded-full border border-white shadow-sm"/>
                                            <span className="text-xs text-slate-500">{op.assignee?.name}</span>
                                            <span className="text-[10px] text-slate-300">•</span>
                                            <span className="text-xs text-slate-400 truncate max-w-[100px]">{op.project?.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. WORKFORCE EFFICIENCY */}
                <div className="col-span-1 lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm h-[300px] flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Workforce Efficiency</h3>
                            <p className="text-xs text-slate-500">Task Completion Rate vs. Active Load</p>
                        </div>
                    </div>
                    <div className="flex-1 p-4 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.teamStats} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:12, fill:'#64748b'}}/>
                                <YAxis hide/>
                                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}/>
                                <Bar dataKey="efficiency" name="Efficiency %" fill="#8b5cf6" radius={[4,4,0,0]} />
                                <Bar dataKey="workload" name="Active Tasks" fill="#cbd5e1" radius={[4,4,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </>
      )}

      {showGemAI && <GemPhotoAI onClose={() => setShowGemAI(false)} />}
      {zoomedTile && <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40" onClick={() => setZoomedTile(null)} />}
    </div>
  );
};

interface MetricTileProps {
  title: string;
  value: string;
  delta: string;
  icon: React.ReactNode;
  color: string;
}

const MetricTile = ({ title, value, delta, icon, color }: MetricTileProps) => {
    const colorStyles = {
        emerald: 'text-emerald-600 bg-emerald-50',
        blue: 'text-blue-600 bg-blue-50',
        amber: 'text-amber-600 bg-amber-50',
        purple: 'text-purple-600 bg-purple-50',
        red: 'text-red-600 bg-red-50',
    }[color as string] || 'text-slate-600 bg-slate-50';

    return (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-1">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${colorStyles.replace('text', 'bg').replace('bg', 'text').replace('50', '100')}`}>
                    {icon}
                </div>
            </div>
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded w-fit ${colorStyles}`}>
                {delta}
            </div>
        </div>
    );
};

// --- WORKER DASHBOARD ---
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
                  <div className={`w-1 h-full min-h-[40px] rounded-full ${t.priority === 'HIGH' ? 'bg-red-50' : 'bg-blue-500'}`}></div>
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

// --- CLIENT DASHBOARD ---
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
