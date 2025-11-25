
import React, { useState } from 'react';
import { Project, UserRole, ProjectStatus, AssetStatus } from '../types';
import { useStore } from '../context/StoreContext';
import { 
  ArrowLeft, Calendar, DollarSign, Users, Briefcase, 
  Settings, Save, CheckCircle, PieChart, Layers 
} from 'lucide-react';
import { AssetManager } from './AssetManager';
import { AssetAnalytics } from './AssetAnalytics';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack }) => {
  const { updateProject, user, assets } = useStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'settings'>('overview');
  const [config, setConfig] = useState(project);

  const handleSaveConfig = () => {
    updateProject(project.id, config);
  };
  
  const projectAssets = assets.filter(a => a.projectId === project.id);
  const deliveredCount = projectAssets.filter(a => a.status === AssetStatus.DELIVERED).length;

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
           <button 
             onClick={onBack} 
             className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
           >
             <ArrowLeft size={20} className="text-slate-600"/>
           </button>
           <div className="flex-1">
             <div className="flex items-center gap-3">
               <h1 className="text-2xl font-bold text-slate-800">{project.name}</h1>
               <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                  project.status === ProjectStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
               }`}>
                 {project.status}
               </span>
             </div>
             <p className="text-slate-500 text-sm mt-1">{project.description}</p>
           </div>
           
           <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('assets')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'assets' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Assets
              </button>
              {user.role === UserRole.ADMIN && (
                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Settings
                </button>
              )}
           </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-6 pt-6 border-t border-slate-100">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Briefcase size={20}/></div>
              <div>
                 <p className="text-xs text-slate-500 uppercase font-bold">Type</p>
                 <p className="text-sm font-medium text-slate-800">{project.type.replace('_', ' ')}</p>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle size={20}/></div>
              <div>
                 <p className="text-xs text-slate-500 uppercase font-bold">Delivered</p>
                 <p className="text-sm font-medium text-slate-800">{deliveredCount} Assets</p>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><DollarSign size={20}/></div>
              <div>
                 <p className="text-xs text-slate-500 uppercase font-bold">Budget</p>
                 <p className="text-sm font-medium text-slate-800">${project.spent.toLocaleString()} / ${project.budget.toLocaleString()}</p>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Calendar size={20}/></div>
              <div>
                 <p className="text-xs text-slate-500 uppercase font-bold">Due Date</p>
                 <p className="text-sm font-medium text-slate-800">{new Date(project.endDate).toLocaleDateString()}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
        
        {activeTab === 'overview' && (
           <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Deliverables Checklist</h3>
              <div className="space-y-3">
                 {project.deliverables?.map((del, idx) => {
                    // Check if we have a matching asset that is delivered
                    const isDelivered = projectAssets.some(a => a.title.includes(del) && a.status === AssetStatus.DELIVERED);
                    return (
                      <div key={idx} className={`p-4 border rounded-lg flex items-center justify-between ${isDelivered ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-200'}`}>
                         <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isDelivered ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'}`}>
                               {isDelivered && <CheckCircle size={12}/>}
                            </div>
                            <span className={`text-sm font-medium ${isDelivered ? 'text-emerald-800 line-through opacity-70' : 'text-slate-700'}`}>{del}</span>
                         </div>
                         {isDelivered && <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">DELIVERED</span>}
                      </div>
                    );
                 })}
              </div>
              
              <div className="mt-8">
                 <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h3>
                 <div className="text-sm text-slate-500 italic">No recent activity logged for this project.</div>
              </div>
           </div>
        )}

        {activeTab === 'assets' && (
           <div className="h-[600px] flex flex-col">
              <AssetManager />
           </div>
        )}

        {activeTab === 'settings' && (
           <div className="p-6 max-w-2xl">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Project Configuration</h3>
              <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                    <input 
                      type="text" 
                      value={config.name}
                      onChange={(e) => setConfig({...config, name: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea 
                      value={config.description}
                      onChange={(e) => setConfig({...config, description: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm h-24"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Budget ($)</label>
                       <input 
                         type="number" 
                         value={config.budget}
                         onChange={(e) => setConfig({...config, budget: parseInt(e.target.value)})}
                         className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                       <select 
                         value={config.status}
                         onChange={(e) => setConfig({...config, status: e.target.value as ProjectStatus})}
                         className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                       >
                         <option value={ProjectStatus.PLANNING}>Planning</option>
                         <option value={ProjectStatus.ACTIVE}>Active</option>
                         <option value={ProjectStatus.REVIEW}>Review</option>
                         <option value={ProjectStatus.COMPLETED}>Completed</option>
                         <option value={ProjectStatus.ON_HOLD}>On Hold</option>
                       </select>
                    </div>
                 </div>
                 <div className="pt-4">
                    <button 
                      onClick={handleSaveConfig}
                      className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium"
                    >
                       <Save size={18}/> Save Changes
                    </button>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};
