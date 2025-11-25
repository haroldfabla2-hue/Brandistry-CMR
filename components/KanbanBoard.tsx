import React from 'react';
import { Task, TaskStatus } from '../types';
import { MoreHorizontal, Plus, Clock, AlertCircle } from 'lucide-react';

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
  return (
    <div className="h-full overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-[1000px] h-full">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          
          return (
            <div key={col.id} className="flex-1 min-w-[300px] flex flex-col bg-slate-100/50 rounded-xl border border-slate-200/60 max-h-[calc(100vh-200px)]">
              <div className="p-4 flex justify-between items-center border-b border-slate-200/60 bg-slate-50/80 rounded-t-xl backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${col.color}`} />
                  <h3 className="font-semibold text-slate-700">{col.title}</h3>
                  <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
                    {colTasks.length}
                  </span>
                </div>
                <button className="text-slate-400 hover:text-slate-600">
                  <Plus size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scroll">
                {colTasks.map(task => (
                  <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${
                        task.priority === 'HIGH' ? 'bg-red-50 text-red-600' :
                        task.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {task.priority}
                      </span>
                      <button className="text-slate-300 hover:text-slate-500">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                    
                    <h4 className="text-sm font-semibold text-slate-800 mb-1 leading-snug">{task.title}</h4>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">{task.description}</p>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock size={14} />
                        <span>{new Date(task.dueDate).toLocaleDateString(undefined, {month: 'short', day:'numeric'})}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         {/* Simple controls to move tasks since we aren't using a heavy DnD lib */}
                         {col.id !== TaskStatus.TODO && (
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               onUpdateTaskStatus(task.id, getPrevStatus(col.id));
                             }}
                             className="p-1 hover:bg-slate-100 rounded text-xs text-slate-500"
                           >←</button>
                         )}
                         {col.id !== TaskStatus.DONE && (
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               onUpdateTaskStatus(task.id, getNextStatus(col.id));
                             }}
                             className="p-1 hover:bg-slate-100 rounded text-xs text-slate-500"
                           >→</button>
                         )}
                      </div>
                      
                      <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">
                        {task.assignee.charAt(0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const getNextStatus = (current: TaskStatus): TaskStatus => {
  if (current === TaskStatus.TODO) return TaskStatus.IN_PROGRESS;
  if (current === TaskStatus.IN_PROGRESS) return TaskStatus.REVIEW;
  return TaskStatus.DONE;
};

const getPrevStatus = (current: TaskStatus): TaskStatus => {
    if (current === TaskStatus.DONE) return TaskStatus.REVIEW;
    if (current === TaskStatus.REVIEW) return TaskStatus.IN_PROGRESS;
    return TaskStatus.TODO;
  };