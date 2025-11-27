
import React, { useState, useEffect } from 'react';
import { Task, TaskStatus } from '../types';
import { X, Calendar, User as UserIcon, Flag, Briefcase, Maximize2, Minimize2, MoreHorizontal } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const PropertyRow = ({ label, icon, children }: { label: string, icon: React.ReactNode, children?: React.ReactNode }) => (
   <div className="flex items-center gap-4 min-h-[32px]">
      <div className="w-32 flex items-center gap-2 text-slate-500 text-sm">
         {icon}
         <span>{label}</span>
      </div>
      <div className="flex-1">
         {children}
      </div>
   </div>
);

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  initialStatus?: TaskStatus;
  initialData?: Partial<Task>;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, task, initialStatus, initialData }) => {
  const { projects, users, addTask, updateTask, user } = useStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: initialStatus || TaskStatus.TODO,
    priority: 'MEDIUM',
    assignee: user.id,
    projectId: projects[0]?.id || '',
    dueDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (task) {
      setFormData(task);
    } else {
      setFormData(prev => ({
        title: initialData?.title || '',
        description: initialData?.description || '',
        status: initialStatus || initialData?.status || TaskStatus.TODO,
        projectId: initialData?.projectId || projects[0]?.id || '',
        assignee: initialData?.assignee || user.id,
        priority: (initialData?.priority as any) || 'MEDIUM',
        dueDate: initialData?.dueDate || new Date().toISOString().split('T')[0],
      }));
    }
  }, [task, isOpen, initialStatus, projects, user.id, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (task) {
        updateTask(task.id, formData);
    } else {
        addTask(formData);
    }
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div 
        className={`bg-white shadow-2xl transition-all duration-300 flex flex-col overflow-hidden ${
          isExpanded ? 'w-full h-full rounded-none' : 'w-full max-w-3xl max-h-[90vh] rounded-xl'
        }`}
      >
        
        {/* Header Actions */}
        <div className="px-6 py-3 flex justify-between items-center text-slate-500">
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}
              </button>
           </div>
           <div className="flex items-center gap-4">
               <span className="text-xs text-slate-400">
                  {task ? `Edited ${new Date().toLocaleDateString()}` : 'New Task'}
               </span>
               <button onClick={() => onClose()} className="p-1 hover:bg-slate-100 rounded transition-colors">
                  <X size={20} />
               </button>
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 md:px-12 py-6 custom-scroll">
           
           {/* Big Title Input */}
           <input 
             required
             type="text"
             placeholder="Untitled"
             className="w-full text-4xl font-bold text-slate-800 placeholder:text-slate-300 outline-none border-none focus:ring-0 p-0 mb-8 bg-transparent"
             value={formData.title}
             onChange={e => setFormData({...formData, title: e.target.value})}
             autoFocus
           />

           {/* Properties Grid (Notion Style) */}
           <div className="space-y-4 mb-8">
              
              <PropertyRow label="Status" icon={<div className="w-4 h-4 rounded bg-slate-400"/>}>
                <select 
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm px-2 py-1 rounded cursor-pointer outline-none border-none transition-colors"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                >
                    <option value={TaskStatus.TODO}>To Do</option>
                    <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                    <option value={TaskStatus.REVIEW}>Review</option>
                    <option value={TaskStatus.DONE}>Done</option>
                </select>
              </PropertyRow>

              <PropertyRow label="Assignee" icon={<UserIcon size={16} className="text-slate-400"/>}>
                 <div className="flex items-center gap-2 hover:bg-slate-100 px-2 py-1 rounded cursor-pointer group relative">
                    <img 
                      src={users.find(u => u.id === formData.assignee)?.avatar || 'https://i.pravatar.cc/150'} 
                      className="w-5 h-5 rounded-full"
                      alt="Assignee"
                    />
                    <select 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      value={formData.assignee}
                      onChange={e => setFormData({...formData, assignee: e.target.value})}
                    >
                       {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <span className="text-sm text-slate-700">{users.find(u => u.id === formData.assignee)?.name}</span>
                 </div>
              </PropertyRow>

              <PropertyRow label="Priority" icon={<Flag size={16} className="text-slate-400"/>}>
                 <select 
                    className={`text-sm px-2 py-1 rounded cursor-pointer outline-none border-none transition-colors font-medium ${
                       formData.priority === 'HIGH' ? 'bg-red-50 text-red-600 hover:bg-red-100' :
                       formData.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' :
                       'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}
                    value={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.value as any})}
                  >
                     <option value="LOW">Low Priority</option>
                     <option value="MEDIUM">Medium Priority</option>
                     <option value="HIGH">High Priority</option>
                  </select>
              </PropertyRow>

              <PropertyRow label="Project" icon={<Briefcase size={16} className="text-slate-400"/>}>
                  <select 
                      className="bg-transparent hover:bg-slate-100 text-slate-700 text-sm px-2 py-1 rounded cursor-pointer outline-none border-none transition-colors truncate max-w-[200px]"
                      value={formData.projectId}
                      onChange={e => setFormData({...formData, projectId: e.target.value})}
                    >
                       {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
              </PropertyRow>

              <PropertyRow label="Due Date" icon={<Calendar size={16} className="text-slate-400"/>}>
                  <input 
                      type="date"
                      className="bg-transparent hover:bg-slate-100 text-slate-700 text-sm px-2 py-1 rounded cursor-pointer outline-none border-none transition-colors"
                      value={formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : ''}
                      onChange={e => setFormData({...formData, dueDate: e.target.value})}
                    />
              </PropertyRow>

           </div>

           <hr className="border-slate-100 mb-8"/>

           {/* Description Area */}
           <div className="min-h-[200px]">
              <textarea 
                className="w-full h-full min-h-[300px] p-0 border-none outline-none focus:ring-0 text-base text-slate-700 resize-none placeholder:text-slate-300 leading-relaxed"
                placeholder="Press 'Enter' to continue with an empty page, or start typing..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
           </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
           <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancel
           </button>
           <button onClick={() => handleSubmit()} className="px-6 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors">
              Done
           </button>
        </div>

      </div>
    </div>
  );
};
