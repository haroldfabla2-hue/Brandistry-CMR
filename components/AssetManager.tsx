
import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { AssetStatus, AssetType, UserRole, Asset, GoogleFile } from '../types';
import { 
  FileImage, FileVideo, FileText, CheckCircle, XCircle, 
  Upload, MessageSquare, History, Trash2, LayoutGrid, List,
  Send, AlertCircle, ChevronRight, Download, Eye, BarChart3, Image,
  Laptop, Cloud, Link as LinkIcon, Loader2, FileUp, Folder, FileSpreadsheet, Presentation, FileAudio, FileBox
} from 'lucide-react';
import { AssetAnalytics } from './AssetAnalytics';
import { googleDriveService } from '../services/googleDriveService';

export const AssetManager: React.FC = () => {
  const { assets, projects, user, addAsset, deleteAsset, setViewingAsset } = useStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'gallery' | 'analytics'>('gallery');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Filter assets based on role
  const filteredAssets = assets.filter(asset => {
    if (user.role === UserRole.CLIENT) {
      return asset.status === AssetStatus.DELIVERED;
    }
    return true; // Workers and Admins see all
  });

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
          <div className="flex-1 overflow-y-auto p-6 w-full custom-scroll bg-slate-50/50">
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
                    onClick={() => setViewingAsset(asset)}
                    className={`group cursor-pointer border rounded-xl overflow-hidden transition-all duration-200 border-slate-200 hover:shadow-md bg-white hover:-translate-y-1 ${viewMode === 'list' ? 'flex items-center p-3 gap-4 h-16' : ''}`}
                   >
                      {/* Thumbnail */}
                      <div className={viewMode === 'grid' ? 'h-36 bg-slate-100 relative overflow-hidden flex items-center justify-center' : 'w-10 h-10 bg-slate-100 rounded flex items-center justify-center shrink-0'}>
                         {asset.type === AssetType.IMAGE ? (
                           <img src={asset.url} alt={asset.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                         ) : asset.type === AssetType.VIDEO ? (
                           <div className="w-full h-full relative">
                              <video src={asset.url} className="w-full h-full object-cover" muted />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                 <FileVideo className="text-white drop-shadow-md" size={32}/>
                              </div>
                           </div>
                         ) : (
                           <div className={`flex flex-col items-center justify-center w-full h-full ${
                                asset.type === AssetType.SPREADSHEET ? 'text-emerald-500 bg-emerald-50' :
                                asset.type === AssetType.PRESENTATION ? 'text-orange-500 bg-orange-50' :
                                asset.type === AssetType.AUDIO ? 'text-pink-500 bg-pink-50' :
                                'text-blue-500 bg-blue-50'
                           }`}>
                             {asset.type === AssetType.SPREADSHEET ? <FileSpreadsheet size={32}/> :
                              asset.type === AssetType.PRESENTATION ? <Presentation size={32}/> :
                              asset.type === AssetType.AUDIO ? <FileAudio size={32}/> :
                              <FileText size={32} />}
                           </div>
                         )}
                         
                         {viewMode === 'grid' && (
                           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
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

const UploadModal = ({ projects, onClose, onUpload }: any) => {
  const [activeTab, setActiveTab] = useState<'device' | 'drive' | 'link'>('device');
  const [form, setForm] = useState({
    title: '',
    projectId: projects[0]?.id || '',
    type: AssetType.IMAGE,
    url: ''
  });
  const [driveFiles, setDriveFiles] = useState<GoogleFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'drive') {
      loadDriveFiles();
    }
  }, [activeTab]);

  const loadDriveFiles = async () => {
    setIsLoadingDrive(true);
    try {
      if (!googleDriveService.isAuthenticated) {
         try {
           await googleDriveService.signIn();
         } catch(e) {
           console.log("Sign in cancelled or failed", e);
           setIsLoadingDrive(false);
           return;
         }
      }
      const files = await googleDriveService.listFiles();
      setDriveFiles(files || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleDeviceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
        let type = AssetType.DOCUMENT;
        if (file.type.startsWith('video')) type = AssetType.VIDEO;
        else if (file.type.startsWith('image')) type = AssetType.IMAGE;
        else if (file.type.startsWith('audio')) type = AssetType.AUDIO;
        else if (file.type.includes('sheet') || file.type.includes('csv') || file.type.includes('excel')) type = AssetType.SPREADSHEET;
        else if (file.type.includes('presentation') || file.type.includes('powerpoint')) type = AssetType.PRESENTATION;
        else if (file.type.includes('zip') || file.type.includes('compressed')) type = AssetType.ARCHIVE;

        setForm(prev => ({ 
           ...prev, 
           title: file.name.split('.')[0],
           type
        }));

        const reader = new FileReader();
        reader.onload = (ev) => {
           const result = ev.target?.result as string;
           setForm(prev => ({ ...prev, url: result }));
           if (file.type.startsWith('image')) setPreview(result);
           else setPreview(null);
        };
        reader.readAsDataURL(file);
     }
  };

  const selectDriveFile = (file: GoogleFile) => {
     let type = AssetType.DOCUMENT;
     if (file.mimeType.includes('image')) type = AssetType.IMAGE;
     else if (file.mimeType.includes('video')) type = AssetType.VIDEO;
     else if (file.mimeType.includes('audio')) type = AssetType.AUDIO;
     else if (file.mimeType.includes('spreadsheet')) type = AssetType.SPREADSHEET;
     else if (file.mimeType.includes('presentation')) type = AssetType.PRESENTATION;

     setForm(prev => ({
        ...prev,
        title: file.name,
        url: file.webViewLink,
        type
     }));
     setPreview(file.thumbnailLink || null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-0 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
           <div>
              <h2 className="text-xl font-bold text-slate-800">Upload New Asset</h2>
              <p className="text-xs text-slate-500">Add deliverables to your project.</p>
           </div>
           
           <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
              <button onClick={() => setActiveTab('device')} className={`p-2 rounded transition-colors ${activeTab === 'device' ? 'bg-brand-100 text-brand-600' : 'text-slate-400 hover:text-slate-600'}`} title="From Device"><Laptop size={18}/></button>
              <button onClick={() => setActiveTab('drive')} className={`p-2 rounded transition-colors ${activeTab === 'drive' ? 'bg-brand-100 text-brand-600' : 'text-slate-400 hover:text-slate-600'}`} title="Google Drive"><Cloud size={18}/></button>
              <button onClick={() => setActiveTab('link')} className={`p-2 rounded transition-colors ${activeTab === 'link' ? 'bg-brand-100 text-brand-600' : 'text-slate-400 hover:text-slate-600'}`} title="External Link"><LinkIcon size={18}/></button>
           </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scroll flex-1">
           {activeTab === 'device' && (
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors relative">
                 <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleDeviceFile}/>
                 <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4"><FileUp size={32}/></div>
                 <h3 className="text-lg font-bold text-slate-700">Drag & Drop or Click to Upload</h3>
                 <p className="text-sm text-slate-500 mt-1">Supports All Formats (Images, Video, Docs, ZIP)</p>
                 {form.url && <div className="mt-4 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-2"><CheckCircle size={12}/> File Selected: {form.type}</div>}
              </div>
           )}

           {activeTab === 'drive' && (
              <div className="space-y-4">
                 <h3 className="text-sm font-bold text-slate-700">Select from Google Drive</h3>
                 {isLoadingDrive ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-brand-500"/></div>
                 ) : (
                    <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2 custom-scroll">
                       {driveFiles.map(file => (
                          <div 
                            key={file.id} 
                            onClick={() => selectDriveFile(file)}
                            className={`p-2 border rounded-lg cursor-pointer hover:shadow-md transition-all ${form.url === file.webViewLink ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200 bg-white'}`}
                          >
                             <div className="h-16 bg-slate-100 rounded mb-2 overflow-hidden flex items-center justify-center">
                                {file.thumbnailLink ? <img src={file.thumbnailLink} className="w-full h-full object-cover"/> : <Folder className="text-blue-300"/>}
                             </div>
                             <p className="text-xs font-medium text-slate-700 truncate">{file.name}</p>
                          </div>
                       ))}
                       {driveFiles.length === 0 && <p className="col-span-3 text-center text-sm text-slate-400 py-4">No files found or not signed in.</p>}
                    </div>
                 )}
              </div>
           )}

           {activeTab === 'link' && (
              <div className="space-y-4">
                 <label className="block text-sm font-medium text-slate-700">External URL</label>
                 <div className="flex gap-2">
                    <input 
                      type="url" 
                      placeholder="https://..." 
                      className="flex-1 border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      value={form.url}
                      onChange={e => setForm({...form, url: e.target.value})}
                    />
                 </div>
              </div>
           )}

           {/* Metadata Form */}
           <div className="mt-6 space-y-4 border-t border-slate-100 pt-6">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Asset Title</label>
                    <input 
                      required
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      value={form.title}
                      onChange={e => setForm({...form, title: e.target.value})}
                      placeholder="e.g. Q4 Marketing Banner"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project</label>
                    <select 
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      value={form.projectId}
                      onChange={e => setForm({...form, projectId: e.target.value})}
                    >
                      {projects.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                 </div>
              </div>
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Asset Type</label>
                 <select 
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    value={form.type}
                    onChange={e => setForm({...form, type: e.target.value as AssetType})}
                 >
                    <option value={AssetType.IMAGE}>Image</option>
                    <option value={AssetType.VIDEO}>Video</option>
                    <option value={AssetType.DOCUMENT}>Document</option>
                    <option value={AssetType.SPREADSHEET}>Spreadsheet</option>
                    <option value={AssetType.PRESENTATION}>Presentation</option>
                    <option value={AssetType.AUDIO}>Audio</option>
                    <option value={AssetType.ARCHIVE}>Archive (ZIP)</option>
                 </select>
              </div>

              {preview && activeTab !== 'link' && (
                 <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex items-center gap-4">
                    <img src={preview} className="w-12 h-12 object-cover rounded bg-white border border-slate-200" alt="Preview"/>
                    <div className="text-xs">
                       <p className="font-bold text-slate-700">Ready to Upload</p>
                       <p className="text-slate-500">{form.title}</p>
                    </div>
                 </div>
              )}
           </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 justify-end">
           <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">Cancel</button>
           <button 
             onClick={(e) => { e.preventDefault(); onUpload(form); }} 
             disabled={!form.url || !form.title}
             className="px-6 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
           >
              Upload Asset
           </button>
        </div>
      </div>
    </div>
  );
};
