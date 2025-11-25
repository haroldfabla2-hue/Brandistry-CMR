
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Client, Project, ProjectStatus, AssetStatus } from '../types';
import { 
  Users, Briefcase, CheckCircle, Clock, Search, ChevronRight, 
  ArrowLeft, Building, Mail, Phone, PieChart as PieIcon, BarChart3 
} from 'lucide-react';
import { ProjectDetail } from './ProjectDetail';

export const ClientView: React.FC = () => {
  const { clients, projects, assets, user } = useStore();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedProject) {
    return (
      <ProjectDetail 
        project={selectedProject} 
        onBack={() => setSelectedProject(null)} 
      />
    );
  }

  if (selectedClient) {
    const clientProjects = projects.filter(p => p.clientId === selectedClient.id);
    const clientAssets = assets.filter(a => a.clientId === selectedClient.id);
    const deliveredAssets = clientAssets.filter(a => a.status === AssetStatus.DELIVERED).length;
    const pendingAssets = clientAssets.filter(a => a.status !== AssetStatus.DELIVERED && a.status !== AssetStatus.REJECTED).length;

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => setSelectedClient(null)} 
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600"/>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{selectedClient.company}</h1>
            <p className="text-slate-500 text-sm">Client Profile & Portfolio</p>
          </div>
        </div>

        {/* Client Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">Total Budget</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">${selectedClient.budgetAllocated.toLocaleString()}</h3>
           </div>
           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">Assets Delivered</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{deliveredAssets}</h3>
           </div>
           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">Active Projects</p>
              <h3 className="text-2xl font-bold text-brand-600 mt-1">{clientProjects.filter(p => p.status === ProjectStatus.ACTIVE).length}</h3>
           </div>
           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">Pending Deliverables</p>
              <h3 className="text-2xl font-bold text-amber-500 mt-1">{pendingAssets}</h3>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Info Sidebar */}
           <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Contact Details</h3>
                 <div className="space-y-4">
                    <div className="flex items-start gap-3">
                       <Users className="text-slate-400 mt-1" size={18}/>
                       <div>
                          <p className="text-sm font-medium text-slate-800">{selectedClient.name}</p>
                          <p className="text-xs text-slate-500">Primary Contact</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-3">
                       <Mail className="text-slate-400 mt-1" size={18}/>
                       <div>
                          <p className="text-sm font-medium text-slate-800">{selectedClient.email}</p>
                          <p className="text-xs text-slate-500">Email Address</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-3">
                       <Phone className="text-slate-400 mt-1" size={18}/>
                       <div>
                          <p className="text-sm font-medium text-slate-800">{selectedClient.phone || 'N/A'}</p>
                          <p className="text-xs text-slate-500">Phone Number</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-3">
                       <Building className="text-slate-400 mt-1" size={18}/>
                       <div>
                          <p className="text-sm font-medium text-slate-800">{selectedClient.industry}</p>
                          <p className="text-xs text-slate-500">Industry</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Projects List */}
           <div className="lg:col-span-2">
              <h3 className="font-bold text-slate-800 mb-4">Projects Portfolio</h3>
              <div className="grid grid-cols-1 gap-4">
                 {clientProjects.map(project => {
                    const projectAssets = assets.filter(a => a.projectId === project.id);
                    const delivered = projectAssets.filter(a => a.status === AssetStatus.DELIVERED).length;
                    
                    return (
                      <div 
                        key={project.id}
                        onClick={() => setSelectedProject(project)}
                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                      >
                         <div className="flex justify-between items-start mb-3">
                            <div>
                               <h4 className="font-bold text-lg text-slate-800 group-hover:text-brand-600 transition-colors">{project.name}</h4>
                               <p className="text-sm text-slate-500 line-clamp-1">{project.description}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                               project.status === ProjectStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700' :
                               project.status === ProjectStatus.REVIEW ? 'bg-amber-100 text-amber-700' :
                               'bg-slate-100 text-slate-600'
                            }`}>
                               {project.status}
                            </span>
                         </div>
                         
                         <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-50">
                            <div>
                               <p className="text-xs text-slate-400">Budget Spent</p>
                               <p className="text-sm font-medium text-slate-700">
                                  ${project.spent.toLocaleString()} <span className="text-slate-400">/ ${project.budget.toLocaleString()}</span>
                               </p>
                            </div>
                            <div>
                               <p className="text-xs text-slate-400">Deliverables</p>
                               <p className="text-sm font-medium text-slate-700">
                                  {delivered} <span className="text-slate-400">/ {project.deliverables?.length || 0}</span>
                               </p>
                            </div>
                            <div>
                               <p className="text-xs text-slate-400">Deadline</p>
                               <p className="text-sm font-medium text-slate-700">{new Date(project.endDate).toLocaleDateString()}</p>
                            </div>
                         </div>
                      </div>
                    );
                 })}
              </div>
           </div>
        </div>
      </div>
    );
  }

  // DEFAULT VIEW: CLIENT DIRECTORY
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
         <div>
           <h1 className="text-2xl font-bold text-slate-800">Client Directory</h1>
           <p className="text-slate-500">Manage client relationships and portfolios.</p>
         </div>
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search clients..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredClients.map(client => (
            <div 
               key={client.id} 
               onClick={() => setSelectedClient(client)}
               className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-xl group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                     {client.company.charAt(0)}
                  </div>
                  <div>
                     <h3 className="font-bold text-lg text-slate-800">{client.company}</h3>
                     <p className="text-sm text-slate-500">{client.industry}</p>
                  </div>
               </div>
               
               <div className="space-y-3">
                  <div className="flex justify-between text-sm border-b border-slate-50 pb-2">
                     <span className="text-slate-500">Projects</span>
                     <span className="font-medium text-slate-700">{client.totalProjects}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-slate-50 pb-2">
                     <span className="text-slate-500">Assets Delivered</span>
                     <span className="font-medium text-emerald-600">{client.assetsDelivered}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span className="text-slate-500">Allocated Budget</span>
                     <span className="font-medium text-slate-700">${client.budgetAllocated.toLocaleString()}</span>
                  </div>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};
