
import React, { useState, Suspense } from 'react';
import { 
  LayoutDashboard, Users, FolderKanban, CheckSquare, MessageSquare, 
  Settings, FileText, Bell, Search, LogOut, Menu, X, Layers, 
  ChevronDown, ShieldCheck, EyeOff, Loader2, UserPlus
} from 'lucide-react';

import { UserRole, Project } from './types';
import { useStore } from './context/StoreContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Components
import { Dashboard } from './components/Dashboard';
import { ChatView } from './components/ChatView';
import { IrisFloat } from './components/IrisFloat';
import { KanbanBoard } from './components/KanbanBoard';
import { AssetManager } from './components/AssetManager';
import { SettingsView } from './components/SettingsView';
import { ClientView } from './components/ClientView';
import { FilesView } from './components/FilesView';
import { ProjectDetail } from './components/ProjectDetail';
import { LoginScreen } from './components/LoginScreen';
import { UserManagement } from './components/UserManagement';

enum View {
  DASHBOARD = 'DASHBOARD',
  PROJECTS = 'PROJECTS',
  TASKS = 'TASKS',
  CLIENTS = 'CLIENTS',
  USERS = 'USERS',
  MESSAGES = 'MESSAGES',
  FILES = 'FILES',
  ASSETS = 'ASSETS',
  SETTINGS = 'SETTINGS',
  PROJECT_DETAIL = 'PROJECT_DETAIL'
}

const App: React.FC = () => {
  const { user, realUser, isImpersonating, stopImpersonation, resolveAccessRequest, logout, notifications, markNotificationRead, tasks, projects, updateTaskStatus, setSearchQuery, isAuthenticated } = useStore();
  const [activeView, setActiveView] = useState<View>(View.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  if (!isAuthenticated) return <LoginScreen />;

  const navItems = [
    { id: View.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: View.MESSAGES, label: 'Messages', icon: MessageSquare },
    { id: View.CLIENTS, label: 'Clients & Portfolios', icon: Users, hidden: user.role === UserRole.CLIENT || user.role === UserRole.WORKER },
    { id: View.USERS, label: 'Team & Users', icon: UserPlus, hidden: user.role !== UserRole.ADMIN },
    { id: View.PROJECTS, label: 'Projects', icon: FolderKanban },
    { id: View.TASKS, label: 'Tasks', icon: CheckSquare, hidden: user.role === UserRole.CLIENT },
    { id: View.ASSETS, label: 'Assets & Review', icon: Layers },
    { id: View.FILES, label: 'Files & Drive', icon: FileText, hidden: user.role === UserRole.CLIENT },
    { id: View.SETTINGS, label: 'Settings', icon: Settings, hidden: false, bottom: true }
  ];

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setActiveView(View.PROJECT_DETAIL);
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const pendingRequests = user.accessRequests?.filter(r => r.status === 'PENDING') || [];

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
        <IrisFloat />
        
        {isImpersonating && realUser && (
          <div className="absolute top-0 left-0 right-0 h-8 bg-amber-400 text-amber-950 font-medium text-xs flex items-center justify-center gap-4 z-50 shadow-md">
             <span className="flex items-center gap-2"><EyeOff size={14}/> Viewing as {user.name} ({user.role})</span>
             <button onClick={() => stopImpersonation()} className="px-3 py-0.5 bg-amber-900 text-white rounded text-[10px] hover:bg-amber-800 uppercase font-bold tracking-wide">Exit View</button>
          </div>
        )}

        {pendingRequests.length > 0 && !isImpersonating && (
          <div className="fixed bottom-6 left-24 z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
             <div className="bg-white rounded-xl shadow-2xl border border-brand-100 p-4 w-80">
                <div className="flex items-center gap-3 mb-3">
                   <div className="p-2 bg-brand-100 text-brand-600 rounded-lg"><ShieldCheck size={20}/></div>
                   <div><h4 className="font-bold text-slate-800 text-sm">Admin Request</h4><p className="text-xs text-slate-500">Access required</p></div>
                </div>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed"><span className="font-bold">{pendingRequests[0].requesterName}</span> is requesting access.</p>
                <div className="flex gap-2">
                   <button onClick={() => resolveAccessRequest(pendingRequests[0].requesterId, 'REJECTED')} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50">Deny</button>
                   <button onClick={() => resolveAccessRequest(pendingRequests[0].requesterId, 'APPROVED')} className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-xs font-bold hover:bg-brand-700">Approve</button>
                </div>
             </div>
          </div>
        )}

        <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col z-30 shadow-xl ${isImpersonating ? 'pt-8' : ''}`}>
          <div className="h-16 flex items-center px-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-tr from-brand-500 to-indigo-500 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-brand-500/30">B</div>
              {isSidebarOpen && <span className="font-bold text-lg tracking-tight">Brandistry</span>}
            </div>
          </div>
          <nav className="flex-1 py-6 px-3 space-y-1 flex flex-col">
            {navItems.filter(item => !item.hidden && !item.bottom).map(item => (
              <button key={item.id} onClick={() => setActiveView(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${activeView === item.id ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <item.icon size={20} />{isSidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
            <div className="mt-auto">
               {navItems.filter(item => item.bottom).map(item => (
                 <button key={item.id} onClick={() => setActiveView(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${activeView === item.id ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                   <item.icon size={20} />{isSidebarOpen && <span>{item.label}</span>}
                 </button>
               ))}
               <button onClick={() => logout()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-slate-800 hover:text-red-300 transition-all duration-200 mt-2">
                   <LogOut size={20} />{isSidebarOpen && <span>Sign Out</span>}
               </button>
            </div>
          </nav>
        </aside>

        <main className={`flex-1 flex flex-col min-w-0 ${isImpersonating ? 'pt-8' : ''}`}>
          <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-20 shadow-sm relative">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">{isSidebarOpen ? <X size={20} /> : <Menu size={20} />}</button>
              <div className="relative hidden md:block w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Global Search..." onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"/>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button onClick={() => setShowNotifMenu(!showNotifMenu)} className="relative p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                  <Bell size={20} />{unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
                </button>
                {showNotifMenu && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                     <div className="p-3 border-b border-slate-100 font-semibold text-slate-700 text-sm flex justify-between items-center bg-slate-50"><span>Notifications</span><span className="text-xs bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full">{unreadCount} New</span></div>
                     <div className="max-h-80 overflow-y-auto custom-scroll">
                       {notifications.map(n => (
                         <div key={n.id} className={`p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer ${!n.read ? 'bg-blue-50/50' : ''}`} onClick={() => markNotificationRead(n.id)}>
                            <div className="flex justify-between items-start mb-1"><span className="text-xs font-bold text-blue-600">{n.title}</span><span className="text-[10px] text-slate-400">{new Date(n.timestamp).toLocaleTimeString()}</span></div>
                            <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                         </div>
                       ))}
                     </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <button onClick={() => setShowRoleMenu(!showRoleMenu)} className="flex items-center gap-3 pl-4 border-l border-slate-200 hover:bg-slate-50 p-2 rounded-lg transition-colors">
                  <div className="text-right hidden md:block"><p className="text-sm font-semibold text-slate-800">{user.name}</p><p className="text-xs text-slate-500 uppercase tracking-wide">{user.role}</p></div>
                  <img src={user.avatar} alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                  <ChevronDown size={14} className="text-slate-400"/>
                </button>
                {showRoleMenu && <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden"><button onClick={() => logout()} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-red-600"><LogOut size={16}/><span className="text-sm font-medium">Sign Out</span></button></div>}
              </div>
            </div>
          </header>

          <div className={`flex-1 relative z-10 custom-scroll ${
            (activeView === View.MESSAGES || activeView === View.FILES) 
              ? 'overflow-hidden p-0' 
              : 'overflow-auto p-6'
          }`}>
            <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-brand-600" size={40}/></div>}>
              {activeView === View.DASHBOARD && <Dashboard user={user} projects={projects} tasks={tasks} assets={useStore().assets} />}
              {activeView === View.MESSAGES && <ChatView />}
              {activeView === View.CLIENTS && user.role === UserRole.ADMIN && <ClientView />}
              {activeView === View.USERS && user.role === UserRole.ADMIN && <UserManagement />}
              {activeView === View.TASKS && user.role !== UserRole.CLIENT && <KanbanBoard tasks={user.role === UserRole.ADMIN ? tasks : tasks.filter(t => t.assignee === user.id)} onUpdateTaskStatus={updateTaskStatus} />}
              {activeView === View.ASSETS && <AssetManager />}
              {activeView === View.SETTINGS && <SettingsView />}
              {activeView === View.PROJECT_DETAIL && selectedProject && <ProjectDetail project={selectedProject} onBack={() => setActiveView(View.PROJECTS)} />}
              {activeView === View.PROJECTS && (
                 <div className="space-y-6 animate-in fade-in duration-500">
                   <h1 className="text-2xl font-bold text-slate-800">Projects Directory</h1>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {(user.role === UserRole.ADMIN ? projects : projects.filter(p => user.assignedProjectIds?.includes(p.id))).map(project => (
                       <div key={project.id} onClick={() => handleProjectClick(project)} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                          <div className="flex justify-between items-start mb-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${project.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{project.status}</span>
                          </div>
                          <h3 className="font-bold text-lg text-slate-800 group-hover:text-brand-600 transition-colors">{project.name}</h3>
                          <p className="text-slate-500 text-sm mb-4 line-clamp-1">{project.description}</p>
                          <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${project.progress}%` }}></div></div>
                       </div>
                     ))}
                   </div>
                 </div>
              )}
              {activeView === View.FILES && <FilesView />}
            </Suspense>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;
