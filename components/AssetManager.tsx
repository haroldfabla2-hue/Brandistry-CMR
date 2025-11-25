
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { AssetStatus, AssetType, UserRole, Asset } from '../types';
import { 
  FileImage, FileVideo, FileText, CheckCircle, XCircle, 
  Upload, MessageSquare, History, Trash2, LayoutGrid, List,
  Send, AlertCircle, ChevronRight, Download, Eye, BarChart3, Image
} from 'lucide-react';
import { AssetAnalytics } from './AssetAnalytics';

export const AssetManager: React.FC = () => {
  const { assets, projects, user, addAsset, updateAssetStatus, deleteAsset, addAssetComment, notify } = useStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'gallery' | 'analytics'>('gallery');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Filter assets based on role
  const filteredAssets = assets.filter(asset => {
    if (user.role === UserRole.CLIENT) {
      return asset.status === AssetStatus.DELIVERED;
    }
    return true; // Workers and Admins see all
  });

  const handleDownload = (asset: Asset) => {
      const link = document.createElement('a');
      link.href = asset.url;
      link.download = `${asset.title.replace(/\s+/g, '_')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleDelete = (id: string) => {
    if(window.confirm("Are you sure you want to permanently delete this asset?")) {
        deleteAsset(id);
        setSelectedAsset(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div className="flex items-center gap-6">
          <h2 className="font-bold text-slate-800 text-lg">Assets & Deliverables</h2>
          
          <div className="flex bg-white rounded-lg border border-slate-200 p-1 gap-1">
             <button
               onClick={() => setActiveTab('gallery')}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'gallery' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               <Image size={16}/> Gallery
             </button>
             <button
               onClick={() => setActiveTab('analytics')}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'analytics' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               <BarChart3 size={16}/> Analytics
             </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'gallery' && (
             <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Grid View"
                >
                  <LayoutGrid size={16} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                  title="List View"
                >
                  <List size={16} />
                </button>
              </div>
          )}

          {user.role !== UserRole.CLIENT && activeTab === 'gallery' && (
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm text-sm font-medium active:scale-95 transform"
            >
              <Upload size={16} />
              Upload Asset
            </button>
          )}
        </div>
      </div>

      {activeTab === 'analytics' ? (
         <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scroll">
            <AssetAnalytics />
         </div>
      ) : (
        <div className="flex flex-1 overflow-hidden relative">
          {/* Main Asset View */}
          <div className={`flex-1 overflow-y-auto p-6 ${selectedAsset ? 'w-2/3 border-r border-slate-200' : 'w-full'} custom-scroll bg-slate-50/50 transition-all duration-300`}>
            {filteredAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-in fade-in zoom-in">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <FileImage size={32} />
                </div>
                <p>No assets found.</p>
              </div>
            ) : (
               <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-2'}>
                 {filteredAssets.map(asset => (
                   <div 
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`group cursor-pointer border rounded-xl overflow-hidden transition-all duration-200 ${
                      selectedAsset?.id === asset.id ? 'ring-2 ring-brand-500 border-transparent shadow-md scale-[1.02]' : 'border-slate-200 hover:shadow-md bg-white hover:-translate-y-1'
                    } ${viewMode === 'list' ? 'flex items-center p-3 gap-4 h-16' : ''}`}
                   >
                      {/* Thumbnail */}
                      <div className={viewMode === 'grid' ? 'h-32 bg-slate-100 relative overflow-hidden' : 'w-10 h-10 bg-slate-100 rounded flex items-center justify-center shrink-0'}>
                         {asset.type === AssetType.IMAGE ? (
                           <img src={asset.url} alt={asset.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                         ) : (
                           <div className="text-slate-400 flex items-center justify-center w-full h-full">
                             {asset.type === AssetType.VIDEO ? <FileVideo /> : <FileText />}
                           </div>
                         )}
                         {viewMode === 'grid' && (
                           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                               <Eye className="text-white drop-shadow-md" size={24} />
                           </div>
                         )}
                         {viewMode === 'grid' && (
                           <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase shadow-sm ${getStatusColor(asset.status)}`}>
                             {asset.status.replace('_', ' ')}
                           </div>
                         )}
                      </div>
  
                      {/* Info */}
                      <div className={viewMode === 'grid' ? 'p-3' : 'flex-1 flex justify-between items-center'}>
                         <div className="min-w-0">
                           <h4 className="font-medium text-slate-700 text-sm truncate">{asset.title}</h4>
                           <p className="text-xs text-slate-400 truncate">
                              {projects.find(p => p.id === asset.projectId)?.name} • v{asset.version}
                           </p>
                         </div>
                         {viewMode === 'list' && (
                           <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(asset.status)}`}>
                             {asset.status.replace('_', ' ')}
                           </div>
                         )}
                      </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
  
          {/* Detail/Comment Sidebar */}
          {selectedAsset && (
            <div className="w-96 bg-white flex flex-col border-l border-slate-200 shadow-xl z-20 animate-in slide-in-from-right duration-300 absolute right-0 top-0 bottom-0">
               <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                 <div>
                    <h3 className="font-bold text-slate-800 line-clamp-1">{selectedAsset.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(selectedAsset.status)}`}>
                        {selectedAsset.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400">Version {selectedAsset.version}</span>
                    </div>
                 </div>
                 <button onClick={() => setSelectedAsset(null)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded"><ChevronRight/></button>
               </div>
  
               {/* Preview */}
               <div className="p-4 bg-slate-50 border-b border-slate-100 text-center relative group">
                  {selectedAsset.type === AssetType.IMAGE ? (
                     <img src={selectedAsset.url} className="max-h-48 mx-auto rounded shadow-sm border border-slate-200 object-contain bg-white" alt="Preview"/>
                  ) : (
                     <div className="h-32 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-300 rounded bg-slate-100">
                        <FileText size={32}/>
                        <span className="text-xs mt-2">Preview not available</span>
                     </div>
                  )}
                  
                  <div className="flex justify-center gap-2 mt-4">
                     <button 
                      onClick={() => handleDownload(selectedAsset)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all"
                     >
                        <Download size={12}/> Download
                     </button>
                     {user.role === UserRole.ADMIN && (
                       <button 
                         onClick={() => handleDelete(selectedAsset.id)}
                         className="flex items-center gap-1 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded text-xs font-medium hover:bg-red-50 hover:border-red-300 active:scale-95 transition-all"
                       >
                          <Trash2 size={12}/> Delete
                       </button>
                     )}
                  </div>
               </div>
  
               {/* Workflow Actions */}
               {user.role !== UserRole.CLIENT && (
                 <div className="p-4 border-b border-slate-100 bg-white space-y-2">
                   <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Review Actions</h4>
                   
                   {/* Normal Workflow Buttons */}
                   {selectedAsset.status !== AssetStatus.DELIVERED && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => updateAssetStatus(selectedAsset.id, AssetStatus.APPROVED)}
                          className="flex-1 py-2 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => updateAssetStatus(selectedAsset.id, AssetStatus.CHANGES_REQUESTED)}
                          className="flex-1 py-2 bg-white border border-red-200 text-red-600 rounded text-xs font-medium hover:bg-red-50 active:scale-95 transition-all"
                        >
                          Changes
                        </button>
                      </div>
                   )}

                   {/* Final Delivery Button (Only if Approved) */}
                   {selectedAsset.status === AssetStatus.APPROVED && (
                      <button 
                         onClick={() => updateAssetStatus(selectedAsset.id, AssetStatus.DELIVERED)}
                         className="w-full py-2 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                         <CheckCircle size={14}/> Mark as Delivered
                      </button>
                   )}
                 </div>
               )}
  
               {/* Comments */}
               <div className="flex-1 flex flex-col min-h-0 bg-slate-50/30">
                 <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2 text-xs font-bold text-slate-600 uppercase">
                    <MessageSquare size={12}/> 
                    <span>Comments & Feedback</span>
                    <span className="ml-auto bg-slate-200 text-slate-600 px-1.5 rounded-full">{selectedAsset.comments.length}</span>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
                    {selectedAsset.comments.length === 0 && (
                      <div className="text-center py-8 opacity-50">
                          <MessageSquare size={24} className="mx-auto mb-2 text-slate-400"/>
                          <p className="text-xs text-slate-500 italic">No comments yet.</p>
                          <p className="text-[10px] text-slate-400">Start the conversation below</p>
                      </div>
                    )}
                    {selectedAsset.comments.map(comment => (
                      <div key={comment.id} className="flex gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${comment.userId === user.id ? 'bg-brand-100 text-brand-600' : 'bg-slate-200 text-slate-600'}`}>
                          {comment.userName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`p-2.5 rounded-2xl text-xs ${comment.userId === user.id ? 'bg-brand-50 text-brand-900 rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                            <span className="font-bold block mb-0.5 text-[10px] opacity-70">{comment.userName}</span>
                            <p className="break-words">{comment.content}</p>
                          </div>
                          <span className="text-[9px] text-slate-400 ml-1 mt-0.5 block">
                            {new Date(comment.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                    ))}
                 </div>
                 
                 {/* Add Comment Input */}
                 <div className="p-3 border-t border-slate-200 bg-white">
                   <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const input = (e.target as any).elements.comment;
                        if(input.value.trim()) {
                          addAssetComment(selectedAsset.id, input.value);
                          input.value = '';
                        }
                      }}
                      className="relative"
                   >
                     <input 
                      name="comment"
                      placeholder="Type feedback..."
                      className="w-full pl-3 pr-10 py-2.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                      autoComplete="off"
                     />
                     <button type="submit" className="absolute right-1.5 top-1.5 p-1.5 text-brand-600 hover:bg-brand-50 rounded transition-colors">
                       <Send size={14}/>
                     </button>
                   </form>
                 </div>
               </div>
            </div>
          )}
        </div>
      )}

      {isUploadModalOpen && (
        <UploadModal 
          projects={projects} 
          onClose={() => setIsUploadModalOpen(false)} 
          onUpload={(data: any) => {
            addAsset({
              ...data,
              uploadedBy: user.id
            });
            setIsUploadModalOpen(false);
          }}
        />
      )}
    </div>
  );
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

const UploadModal = ({ projects, onClose, onUpload }: any) => {
  const [form, setForm] = useState({
    title: '',
    projectId: projects[0]?.id || '',
    type: AssetType.IMAGE,
    url: 'https://picsum.photos/seed/new/800/600'
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Upload New Asset</h2>
        <form onSubmit={(e) => { e.preventDefault(); onUpload(form); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Asset Title</label>
            <input 
              required
              type="text" 
              className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
            <select 
              className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              value={form.projectId}
              onChange={e => setForm({...form, projectId: e.target.value})}
            >
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select 
              className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              value={form.type}
              onChange={e => setForm({...form, type: e.target.value as AssetType})}
            >
              <option value={AssetType.IMAGE}>Image</option>
              <option value={AssetType.VIDEO}>Video</option>
              <option value={AssetType.DOCUMENT}>Document</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 font-medium transition-colors">Upload Asset</button>
          </div>
        </form>
      </div>
    </div>
  );
};
