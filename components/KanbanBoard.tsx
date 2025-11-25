
import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { MoreHorizontal, Plus, Clock, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { TaskModal } from './TaskModal';

interface KanbanBoardProps {
  tasks: Task[];
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
}

const COLUMNS = [
  { id: TaskStatus.TODO, title: 'To Do', color: 'bg-slate-500' },
  { id: TaskStatus.IN_PROGRESS, title: 'In Progress', color: 'bg-blue-500' },
  { id: TaskStatus.REVIEW, title: 'Review', color: 'bg-amber-500' },
  { id: TaskStatus.DONE, title: 'Done', color: 'bg-emerald-500' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onUpdateTaskStatus }) => {
  const { searchQuery, deleteTask } = useStore();
  const [modalState, setModalState] = useState<{isOpen: boolean, task?: Task, initialStatus?: TaskStatus}>({
    isOpen: false
  });
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Filter tasks based on Search Query
  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onUpdateTaskStatus(taskId, status);
    }
  };

  return (
    <>
      <div className="h-full overflow-x-auto pb-4" onClick={() => setActiveMenu(null)}>
        <div className="flex gap-6 min-w-[1000px] h-full">
          {COLUMNS.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            
            return (
              <div 
                key={col.id} 
                className="flex-1 min-w-[300px] flex flex-col bg-slate-100/50 rounded-xl border border-slate-200/60 max-h-[calc(100vh-200px)]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className="p-4 flex justify-between items-center border-b border-slate-200/60 bg-slate-50/80 rounded-t-xl backdrop-blur-sm sticky top-0 z-10">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${col.color}`} />
                    <h3 className="font-semibold text-slate-700">{col.title}</h3>
                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
                      {colTasks.length}
                    </span>
                  </div>
                  <button 
                    onClick={() => setModalState({isOpen: true, initialStatus: col.id})}
                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scroll">
                  {colTasks.map(task => (
                    <div 
                      key={task.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => setModalState({isOpen: true, task})}
                      className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer group relative active:cursor-grabbing"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${
                          task.priority === 'HIGH' ? 'bg-red-50 text-red-600' :
                          task.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {task.priority}
                        </span>
                        
                        <div className="relative">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === task.id ? null : task.id); }}
                            className="text-slate-300 hover:text-slate-500 p-1 rounded hover:bg-slate-50"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          
                          {activeMenu === task.id && (
                             <div className="absolute right-0 top-6 w-32 bg-white rounded-lg shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setModalState({isOpen: true, task}); setActiveMenu(null); }}
                                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-600"
                                >
                                  <Edit2 size={12}/> Edit
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); deleteTask(task.id); setActiveMenu(null); }}
                                  className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 flex items-center gap-2 text-red-600"
                                >
                                  <Trash2 size={12}/> Delete
                                </button>
                             </div>
                          )}
                        </div>
                      </div>
                      
                      <h4 className="text-sm font-semibold text-slate-800 mb-1 leading-snug">{task.title}</h4>
                      <p className="text-xs text-slate-500 mb-4 line-clamp-2">{task.description}</p>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Clock size={14} />
                          <span>{new Date(task.dueDate).toLocaleDateString(undefined, {month: 'short', day:'numeric'})}</span>
                        </div>
                        
                        <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold border border-white shadow-sm">
                          {task.assignee ? 'U' : '?'}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => setModalState({isOpen: true, initialStatus: col.id})}
                    className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center gap-2 text-slate-400 hover:border-brand-300 hover:text-brand-500 transition-colors text-sm font-medium"
                  >
                     <Plus size={16}/> New
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <TaskModal 
        isOpen={modalState.isOpen} 
        onClose={() => setModalState({isOpen: false})}
        task={modalState.task}
        initialStatus={modalState.initialStatus}
      />
    </>
  );
};
