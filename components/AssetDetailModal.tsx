
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { AssetStatus, AssetType, UserRole } from '../types';
import { 
  X, CheckCircle, MessageSquare, Send, ThumbsDown, ThumbsUp, 
  ChevronRight, Download, Trash2, FileText, FileVideo
} from 'lucide-react';

export const AssetDetailModal: React.FC = () => {
  const { viewingAsset, setViewingAsset, updateAssetStatus, deleteAsset, addAssetComment, user } = useStore();
  
  if (!viewingAsset) return null;

  const handleClose = () => setViewingAsset(null);

  const handleDownload = () => {
      const link = document.createElement('a');
      link.href = viewingAsset.url;
      link.download = `${viewingAsset.title.replace(/\s+/g, '_')}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleDelete = () => {
    if(window.confirm("Are you sure you want to permanently delete this asset?")) {
        deleteAsset(viewingAsset.id);
    }
  };

  const getStatusColor = (status: AssetStatus) => {
    switch (status) {
        case AssetStatus.DELIVERED: return 'bg-purple-100 text-purple-700 border-purple-200';
        case AssetStatus.APPROVED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case AssetStatus.CHANGES_REQUESTED: return 'bg-red-100 text-red-700 border-red-200';
        case AssetStatus.PENDING_REVIEW: return 'bg-amber-100 text-amber-700 border-amber-200';
        case AssetStatus.REJECTED: return 'bg-gray-100 text-gray-700 border-gray-200';
        default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex justify-end" onClick={handleClose}>
        <div 
            className="w-full max-w-lg bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col"
            onClick={e => e.stopPropagation()}
        >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                <div>
                    <h3 className="font-bold text-slate-800 line-clamp-1 text-lg">{viewingAsset.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(viewingAsset.status)}`}>
                            {viewingAsset.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400">Version {viewingAsset.version}</span>
                    </div>
                </div>
                <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-lg transition-colors">
                    <X size={20}/>
                </button>
            </div>

            {/* Preview */}
            <div className="p-6 bg-slate-100 border-b border-slate-200 text-center relative group min-h-[300px] flex flex-col justify-center">
                {viewingAsset.type === AssetType.IMAGE ? (
                    <img src={viewingAsset.url} className="max-h-[300px] mx-auto rounded-lg shadow-sm border border-slate-200 object-contain bg-white" alt="Preview"/>
                ) : viewingAsset.type === AssetType.VIDEO ? (
                    <video src={viewingAsset.url} controls className="max-h-[300px] mx-auto rounded-lg shadow-sm border border-slate-200 bg-black w-full" />
                ) : (
                    <div className="h-40 w-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 rounded-xl bg-white/50">
                        <FileText size={48} className="mb-2 opacity-50"/>
                        <span className="text-sm font-medium">Preview not available for this file type</span>
                        <a href={viewingAsset.url} target="_blank" rel="noreferrer" className="text-xs text-brand-600 mt-2 hover:underline">Open in new tab</a>
                    </div>
                )}
                
                <div className="flex justify-center gap-2 mt-6">
                    <button 
                    onClick={handleDownload}
                    className="flex items-center gap-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all"
                    >
                        <Download size={14}/> Download
                    </button>
                    {user.role === UserRole.ADMIN && (
                    <button 
                        onClick={handleDelete}
                        className="flex items-center gap-1 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 hover:border-red-300 shadow-sm transition-all"
                    >
                        <Trash2 size={14}/> Delete
                    </button>
                    )}
                </div>
            </div>

            {/* Workflow Actions */}
            {user.role !== UserRole.CLIENT && (
                <div className="p-4 border-b border-slate-100 bg-white space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Review Actions</h4>
                
                {/* Normal Workflow Buttons */}
                {viewingAsset.status !== AssetStatus.DELIVERED && (
                    <div className="flex gap-3">
                        <button 
                            onClick={() => updateAssetStatus(viewingAsset.id, AssetStatus.APPROVED)}
                            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                            <ThumbsUp size={16}/> Approve
                        </button>
                        <button 
                            onClick={() => updateAssetStatus(viewingAsset.id, AssetStatus.CHANGES_REQUESTED)}
                            className="flex-1 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <ThumbsDown size={16}/> Changes
                        </button>
                    </div>
                )}

                {/* Final Delivery Button (Only if Approved) */}
                {viewingAsset.status === AssetStatus.APPROVED && (
                    <button 
                        onClick={() => updateAssetStatus(viewingAsset.id, AssetStatus.DELIVERED)}
                        className="w-full py-2.5 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={16}/> Mark as Delivered
                    </button>
                )}
                </div>
            )}

            {/* Comments */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
                <div className="p-3 border-b border-slate-200 bg-white flex items-center gap-2 text-xs font-bold text-slate-600 uppercase shadow-sm z-10">
                    <MessageSquare size={14}/> 
                    <span>Comments & Feedback</span>
                    <span className="ml-auto bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{viewingAsset.comments.length}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
                    {viewingAsset.comments.length === 0 && (
                    <div className="text-center py-10 opacity-50">
                        <MessageSquare size={32} className="mx-auto mb-3 text-slate-400"/>
                        <p className="text-sm text-slate-500 italic">No comments yet.</p>
                        <p className="text-xs text-slate-400 mt-1">Start the conversation below</p>
                    </div>
                    )}
                    {viewingAsset.comments.map(comment => (
                    <div key={comment.id} className="flex gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${comment.userId === user.id ? 'bg-brand-100 text-brand-600 border border-brand-200' : 'bg-white text-slate-600 border border-slate-200'}`}>
                        {comment.userName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                        <div className={`p-3 rounded-2xl text-sm shadow-sm ${comment.userId === user.id ? 'bg-brand-50 text-brand-900 rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                            <span className="font-bold block mb-1 text-xs opacity-70">{comment.userName}</span>
                            <p className="break-words leading-relaxed">{comment.content}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 ml-1 mt-1 block">
                            {new Date(comment.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </span>
                        </div>
                    </div>
                    ))}
                </div>
                
                {/* Add Comment Input */}
                <div className="p-4 border-t border-slate-200 bg-white">
                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        const input = (e.target as any).elements.comment;
                        if(input.value.trim()) {
                            addAssetComment(viewingAsset.id, input.value);
                            input.value = '';
                        }
                    }}
                    className="relative"
                >
                    <input 
                    name="comment"
                    placeholder="Type feedback or instructions..."
                    className="w-full pl-4 pr-12 py-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all bg-slate-50 focus:bg-white"
                    autoComplete="off"
                    />
                    <button type="submit" className="absolute right-2 top-2 p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                    <Send size={16}/>
                    </button>
                </form>
                </div>
            </div>
        </div>
    </div>
  );
};
