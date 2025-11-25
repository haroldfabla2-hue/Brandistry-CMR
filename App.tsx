
import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, FolderKanban, CheckSquare, MessageSquare, 
  Settings, FileText, Bell, Search, LogOut, Menu, X, Cloud, Calendar,
  Layers, ChevronDown
} from 'lucide-react';

import { TaskStatus, UserRole } from './types';
import { Dashboard } from './components/Dashboard';
import { IrisAI } from './components/IrisAI';
import { KanbanBoard } from './components/KanbanBoard';
import { AssetManager } from './components/AssetManager';
import { SettingsView } from './components/SettingsView';
import { ClientView } from './components/ClientView';
import { useStore } from './context/StoreContext';

enum View {
  DASHBOARD = 'DASHBOARD',
  PROJECTS = 'PROJECTS',
  TASKS = 'TASKS',
  CLIENTS = 'CLIENTS',
  IRIS = 'IRIS',
  FILES = 'FILES',
  ASSETS = 'ASSETS',
  SETTINGS = 'SETTINGS'
}

const App: React.FC = () => {
  const { user, users, switchUserRole, notifications, markNotificationRead, tasks, projects, clients, updateTaskStatus } = useStore();
  const [activeView, setActiveView] = useState<View>(View.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Filter Nav Items based on Role
  const navItems = [
    { id: View.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: View.CLIENTS, label: 'Clients & Portfolios', icon: Users, hidden: user.role === UserRole.CLIENT || user.role === UserRole.WORKER },
    { id: View.PROJECTS, label: 'Projects', icon: FolderKanban },
    { id: View.TASKS, label: 'Tasks', icon: CheckSquare, hidden: user.role === UserRole.CLIENT },
    { id: View.ASSETS, label: 'Assets & Review', icon: Layers },
    { id: View.IRIS, label: 'Orchestrator AI', icon: MessageSquare, highlight: true, hidden: user.role !== UserRole.ADMIN },
    { id: View.FILES, label: 'Files & Drive', icon: FileText, hidden: user.role === UserRole.CLIENT },
    { id: View.SETTINGS, label: 'Settings', icon: Settings, hidden: false, bottom: true }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 text-white transition-all duration-300 flex flex-col z-30 shadow-xl`}
      >
        <div className="h-16 flex items-center px-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-brand-500 to-indigo-500 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-brand-500/30">
              B
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-lg tracking-tight">Brandistry</span>
            )}
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 flex flex-col">
          {navItems.filter(item => !item.hidden && !item.bottom).map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                activeView === item.id 
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} className={item.highlight ? 'text-brand-400 group-hover:text-white' : ''} />
              {isSidebarOpen && <span>{item.label}</span>}
              {item.highlight && isSidebarOpen && (
                <span className="ml-auto w-2 h-2 bg-brand-400 rounded-full animate-pulse"></span>
              )}
            </button>
          ))}
          
          <div className="mt-auto">
             {navItems.filter(item => item.bottom).map(item => (
               <button
                 key={item.id}
                 onClick={() => setActiveView(item.id)}
                 className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                   activeView === item.id 
                     ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/50' 
                     : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                 }`}
               >
                 <item.icon size={20} />
                 {isSidebarOpen && <span>{item.label}</span>}
               </button>
             ))}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          {isSidebarOpen ? (
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-xs font-medium text-slate-300">System Online</span>
              </div>
              <div className="text-[10px] text-slate-500">v2.5.0 • Enterprise</div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Cloud size={18} className="text-slate-500" />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-20 shadow-sm relative">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="relative hidden md:block w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search projects, clients, or assets..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </button>
              
              {showNotifMenu && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                   <div className="p-3 border-b border-slate-100 font-semibold text-slate-700 text-sm flex justify-between items-center bg-slate-50">
                     <span>Notifications</span>
                     <span className="text-xs bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                   </div>
                   <div className="max-h-80 overflow-y-auto custom-scroll">
                     {notifications.length === 0 && <div className="p-4 text-center text-xs text-slate-400">No new notifications</div>}
                     {notifications.map(n => (
                       <div key={n.id} className={`p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/50' : ''}`} onClick={() => markNotificationRead(n.id)}>
                          <div className="flex justify-between items-start mb-1">
                             <div className="flex items-center gap-2">
                               {n.priority === 'CRITICAL' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                               <span className={`text-xs font-bold ${
                                 n.type === 'success' ? 'text-emerald-600' : 
                                 n.type === 'error' ? 'text-red-600' : 'text-blue-600'
                               }`}>{n.title}</span>
                             </div>
                             <span className="text-[10px] text-slate-400">{new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>

            {/* Role Switcher (Simulation) */}
            <div className="relative">
              <button 
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-3 pl-4 border-l border-slate-200 hover:bg-slate-50 p-2 rounded-lg transition-colors"
              >
                <div className="text-right hidden md:block">
                  <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">{user.role}</p>
                </div>
                <img src={user.avatar} alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                <ChevronDown size={14} className="text-slate-400"/>
              </button>
              
              {showRoleMenu && (
                 <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Switch Account (Demo)</div>
                    {users.map(u => (
                       <button
                         key={u.id}
                         onClick={() => { switchUserRole(u.id); setShowRoleMenu(false); }}
                         className={`w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors ${u.id === user.id ? 'bg-brand-50' : ''}`}
                       >
                          <img src={u.avatar} className="w-6 h-6 rounded-full" alt={u.name}/>
                          <div>
                             <div className="text-xs font-bold text-slate-700">{u.name}</div>
                             <div className="text-[10px] text-slate-500">{u.role}</div>
                          </div>
                       </button>
                    ))}
                 </div>
              )}
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-auto p-6 relative z-10 custom-scroll">
          <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-brand-50/50 to-transparent pointer-events-none -z-10" />

          {activeView === View.DASHBOARD && (
             <>
               <div className="flex justify-between items-center mb-6">
                 <div>
                   <h1 className="text-2xl font-bold text-slate-800 animate-in slide-in-from-left duration-500">
                      {user.role === UserRole.CLIENT ? 'Project Overview' : 'Dashboard'}
                   </h1>
                   <p className="text-slate-500 animate-in slide-in-from-left duration-700 delay-100">Welcome back, {user.name}.</p>
                 </div>
               </div>
               <Dashboard user={user} projects={projects} tasks={tasks} assets={useStore().assets} />
             </>
          )}

          {activeView === View.IRIS && user.role === UserRole.ADMIN && (
            <div className="h-full flex flex-col animate-in fade-in duration-500">
               <div className="mb-4">
                 <h1 className="text-2xl font-bold text-slate-800">Orchestrator AI</h1>
                 <p className="text-slate-500">Plan projects and delegate tasks to your autonomous workforce.</p>
               </div>
               <div className="flex-1 min-h-0">
                  <IrisAI />
               </div>
            </div>
          )}
          
          {activeView === View.CLIENTS && user.role === UserRole.ADMIN && (
             <ClientView />
          )}

          {activeView === View.TASKS && user.role !== UserRole.CLIENT && (
            <div className="h-full flex flex-col animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-6">
                 <div>
                   <h1 className="text-2xl font-bold text-slate-800">Task Board</h1>
                   <p className="text-slate-500">Kanban view of project deliverables.</p>
                 </div>
              </div>
              <KanbanBoard tasks={user.role === UserRole.ADMIN ? tasks : tasks.filter(t => t.assignee === user.id)} onUpdateTaskStatus={updateTaskStatus} />
            </div>
          )}

          {activeView === View.ASSETS && (
            <div className="h-full flex flex-col animate-in fade-in duration-500">
              <AssetManager />
            </div>
          )}

          {activeView === View.SETTINGS && (
            <div className="h-full flex flex-col animate-in fade-in duration-500">
               <div className="mb-6">
                 <h1 className="text-2xl font-bold text-slate-800">Settings & Preferences</h1>
                 <p className="text-slate-500">Manage your profile, API keys, and system configuration.</p>
               </div>
               <SettingsView />
            </div>
          )}

          {activeView === View.PROJECTS && (
             <div className="space-y-6 animate-in fade-in duration-500">
               <h1 className="text-2xl font-bold text-slate-800">Projects Directory</h1>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {(user.role === UserRole.ADMIN ? projects : projects.filter(p => user.assignedProjectIds?.includes(p.id))).map(project => (
                   <div key={project.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          project.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 
                          project.status === 'PLANNING' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                        }`}>{project.status}</span>
                        {user.role === UserRole.ADMIN && <div className="text-slate-400 hover:text-slate-600 cursor-pointer"><Settings size={16} /></div>}
                      </div>
                      <h3 className="font-bold text-lg text-slate-800 group-hover:text-brand-600 transition-colors">{project.name}</h3>
                      <p className="text-slate-500 text-sm mb-4 line-clamp-1">{project.description}</p>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500">Progress</span>
                            <span className="font-medium text-slate-700">{project.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div className="bg-brand-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${project.progress}%` }}></div>
                          </div>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
             </div>
          )}
          
          {activeView === View.FILES && (
             <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-in fade-in duration-500">
                <FileText size={48} className="mb-4 text-slate-300"/>
                <h2 className="text-xl font-bold text-slate-600">Google Drive Integration</h2>
                <p className="mt-2 text-sm max-w-md text-center">Files view is synchronized with the project folder in Google Drive. (Simulation)</p>
             </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
