
import React, { useState } from 'react';
import { Task, Asset, TaskStatus, AssetStatus, AssetType } from '../types';
import { useStore } from '../context/StoreContext';
import { 
  CheckCircle, Clock, AlertCircle, FileImage, FileText, FileVideo, 
  ExternalLink, ThumbsUp, ThumbsDown, MessageSquare, Send, X 
} from 'lucide-react';

// --- TASK BLOCK ---

export const TaskBlock: React.FC<{ task: Task }> = ({ task: initialTask }) => {
  const { updateTaskStatus, users, tasks } = useStore();
  
  // Real-time binding: Find the task in the store to get live updates
  const task = tasks.find(t => t.id === initialTask.id) || initialTask;
  const assignee = users.find(u => u.id === task.assignee);

  const getNextStatus = (current: TaskStatus): TaskStatus => {
    if (current === TaskStatus.TODO) return TaskStatus.IN_PROGRESS;
    if (current === TaskStatus.IN_PROGRESS) return TaskStatus.REVIEW;
    if (current === TaskStatus.REVIEW) return TaskStatus.DONE;
    return TaskStatus.TODO;
  };

  const handleClick = () => {
    updateTaskStatus(task.id, getNextStatus(task.status));
  };

  return (
    <div className="my-2 bg-white border border-slate-200 rounded-lg p-3 shadow-sm max-w-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${
            task.status === TaskStatus.DONE ? 'bg-emerald-100 text-emerald-600' :
            task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-600' :
            'bg-slate-100 text-slate-500'
          }`}>
             {task.status === TaskStatus.DONE ? <CheckCircle size={14} /> : <Clock size={14} />}
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Task</span>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
            task.priority === 'HIGH' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
        }`}>{task.priority}</span>
      </div>
      
      <h4 className="font-bold text-slate-800 text-sm mb-1">{task.title}</h4>
      <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>
      
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
           <img src={assignee?.avatar || 'https://i.pravatar.cc/150'} className="w-5 h-5 rounded-full" alt="Assignee"/>
           <span className="text-xs text-slate-600">{assignee?.name || 'Unassigned'}</span>
        </div>
        <button 
           onClick={handleClick}
           className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-2 py-1 rounded transition-colors"
        >
           {task.status.replace('_', ' ')}
        </button>
      </div>
    </div>
  );
};

// --- ASSET BLOCK ---

export const AssetBlock: React.FC<{ asset: Asset }> = ({ asset: initialAsset }) => {
  const { updateAssetStatus, assets, addAssetComment, user } = useStore();
  
  // Real-time binding: Find the asset in the store to get live updates
  const asset = assets.find(a => a.id === initialAsset.id) || initialAsset;
  
  const [isCommenting, setIsCommenting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    // 1. Add Comment
    addAssetComment(asset.id, feedback);
    // 2. Update Status to Changes Requested
    updateAssetStatus(asset.id, AssetStatus.CHANGES_REQUESTED);
    
    setIsCommenting(false);
    setFeedback('');
  };

  const handleApprove = () => {
    updateAssetStatus(asset.id, AssetStatus.APPROVED);
  };

  return (
    <div className="my-2 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm max-w-sm hover:shadow-md transition-shadow">
       {/* Preview Area */}
       <div className="h-32 bg-slate-100 relative group">
          {asset.type === AssetType.IMAGE ? (
             <img src={asset.url} className="w-full h-full object-cover" alt={asset.title}/>
          ) : (
             <div className="w-full h-full flex items-center justify-center text-slate-400">
                {asset.type === AssetType.VIDEO ? <FileVideo size={32}/> : <FileText size={32}/>}
             </div>
          )}
          <div className={`absolute top-2 right-2 px-2 py-0.5 rounded bg-white/95 text-xs font-bold shadow-sm backdrop-blur-sm ${
             asset.status === AssetStatus.APPROVED ? 'text-emerald-600' :
             asset.status === AssetStatus.CHANGES_REQUESTED ? 'text-red-600' : 
             'text-slate-600'
          }`}>
             {asset.status.replace('_', ' ')}
          </div>
       </div>
       
       <div className="p-3">
          <div className="flex justify-between items-start mb-1">
             <h4 className="font-bold text-slate-800 text-sm truncate pr-2">{asset.title}</h4>
             {asset.comments.length > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                   <MessageSquare size={10}/> {asset.comments.length}
                </div>
             )}
          </div>
          
          {/* Feedback Form Mode */}
          {isCommenting ? (
            <form onSubmit={handleSubmitFeedback} className="mt-2 animate-in fade-in slide-in-from-top-2">
               <textarea
                 className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-200 outline-none resize-none mb-2"
                 rows={2}
                 placeholder="Describe required changes..."
                 value={feedback}
                 onChange={(e) => setFeedback(e.target.value)}
                 autoFocus
               />
               <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsCommenting(false)}
                    className="p-1.5 text-slate-400 hover:bg-slate-100 rounded"
                  >
                     <X size={14}/>
                  </button>
                  <button 
                    type="submit"
                    disabled={!feedback.trim()}
                    className="flex-1 py-1.5 bg-red-500 text-white rounded text-xs font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-1"
                  >
                     <Send size={12}/> Request Changes
                  </button>
               </div>
            </form>
          ) : (
             /* Action Buttons Mode */
             <div className="flex gap-2 mt-3">
                {asset.status !== AssetStatus.APPROVED && (
                  <button 
                    onClick={handleApprove}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 text-xs font-bold transition-colors"
                  >
                      <ThumbsUp size={12}/> Approve
                  </button>
                )}
                
                {asset.status !== AssetStatus.CHANGES_REQUESTED && (
                  <button 
                    onClick={() => setIsCommenting(true)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 text-xs font-bold transition-colors"
                  >
                      <ThumbsDown size={12}/> Changes
                  </button>
                )}

                {/* Status Indicator if already processed */}
                {(asset.status === AssetStatus.APPROVED || asset.status === AssetStatus.CHANGES_REQUESTED) && (
                   <div className="flex-1 py-1.5 text-center text-xs text-slate-400 italic">
                      {asset.status === AssetStatus.APPROVED ? 'Approved by you' : 'Feedback sent'}
                   </div>
                )}
             </div>
          )}
       </div>
    </div>
  );
};
