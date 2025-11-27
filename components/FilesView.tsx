
import React, { useState, useEffect } from 'react';
import { googleDriveService } from '../services/googleDriveService';
import { GoogleFile } from '../types';
import { Folder, FileText, Image as ImageIcon, Video, MoreVertical, Upload, LogIn, ExternalLink, Loader2, RefreshCw, Plus, Trash2, AlertTriangle, Settings, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const FilesView: React.FC = () => {
  const { systemSettings, notify } = useStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [files, setFiles] = useState<GoogleFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [folderHistory, setFolderHistory] = useState<{id: string, name: string}[]>([{id: 'root', name: 'My Drive'}]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const hasCreds = systemSettings.apiKeys.googleDrive; // We assume client ID is stored here or separate

  const initializeService = async () => {
     // For demo purposes, if no key is in settings, we can't init. 
     // Real app would pull from systemSettings.apiKeys.googleDrive (Client ID) and another field for API Key.
     // We will assume the single field contains Client ID for OAuth. API Key usually public or restricted.
     
     // WARNING: In a real deployment, split these into two fields in settings.
     // Here we simulate reading them.
     const clientId = systemSettings.apiKeys.googleDrive;
     const apiKey = systemSettings.apiKeys.googleDrive; // Simplification for demo prompt

     if (clientId) {
        try {
           await googleDriveService.init(apiKey, clientId);
        } catch (e) {
           console.error("Drive Init Failed", e);
        }
     }
  };

  useEffect(() => {
     if(hasCreds) initializeService();
  }, [hasCreds]);

  const loadFiles = async (folderId: string) => {
    setIsLoading(true);
    try {
      const driveFiles = await googleDriveService.listFiles(folderId);
      setFiles(driveFiles || []);
    } catch (error) {
      console.error(error);
      if (!googleDriveService.isAuthenticated) setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      // If service not ready, try init again (JIC)
      const clientId = systemSettings.apiKeys.googleDrive;
      if (!clientId) {
         notify({ title: "Config Missing", message: "Please set Google Drive Client ID in Settings.", type: "error", priority: "HIGH" });
         return;
      }
      await googleDriveService.init(clientId, clientId); // Passing ID as key for simplicity in this demo structure
      await googleDriveService.signIn();
      setIsAuthenticated(true);
      loadFiles('root');
      notify({
        title: "Connected to Drive",
        message: "Successfully authenticated.",
        type: "success",
        priority: "MEDIUM"
      });
    } catch (error: any) {
      if (error?.error === 'popup_closed_by_user') {
         // Do nothing or show a gentle hint
         return; 
      }
      console.error("Login failed", error);
      notify({ title: "Login Failed", message: "Check your Client ID/API Key in Settings.", type: "error", priority: "HIGH" });
    }
  };

  const handleFolderClick = (folderId: string, folderName: string) => {
    setFolderHistory(prev => [...prev, {id: folderId, name: folderName}]);
    setCurrentFolderId(folderId);
    loadFiles(folderId);
  };

  const handleNavigateUp = (index: number) => {
    const newHistory = folderHistory.slice(0, index + 1);
    setFolderHistory(newHistory);
    const targetFolder = newHistory[newHistory.length - 1];
    setCurrentFolderId(targetFolder.id);
    loadFiles(targetFolder.id);
  };

  const handleCreateFolder = async () => {
     if(!newFolderName.trim()) return;
     try {
        await googleDriveService.createFolder(newFolderName, currentFolderId);
        setNewFolderName('');
        setIsCreatingFolder(false);
        loadFiles(currentFolderId);
        notify({ title: "Folder Created", message: "Directory added successfully.", type: "success", priority: "LOW" });
     } catch(e) {
        notify({ title: "Error", message: "Could not create folder.", type: "error", priority: "MEDIUM" });
     }
  };

  const handleDeleteFile = async (fileId: string) => {
     if(!window.confirm("Are you sure you want to move this file to trash?")) return;
     try {
        await googleDriveService.deleteFile(fileId);
        setActiveMenu(null);
        loadFiles(currentFolderId);
        notify({ title: "Item Deleted", message: "Moved to trash.", type: "info", priority: "LOW" });
     } catch(e) {
        notify({ title: "Delete Failed", message: "Check your permissions.", type: "error", priority: "MEDIUM" });
     }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsLoading(true);
      try {
        await googleDriveService.uploadFile(e.target.files[0], currentFolderId);
        notify({ title: "File Uploaded", message: `${e.target.files[0].name} saved.`, type: "success", priority: "MEDIUM" });
        loadFiles(currentFolderId);
      } catch (error) {
        notify({ title: "Upload Failed", message: "Could not upload file.", type: "error", priority: "HIGH" });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // --- STATE: NO CREDENTIALS ---
  if (!hasCreds) {
     return (
        <div className="flex flex-col items-center justify-center h-full space-y-6 animate-in fade-in duration-500 p-8 text-center">
           <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
              <AlertTriangle size={40} />
           </div>
           <div className="max-w-md">
              <h2 className="text-2xl font-bold text-slate-800">Configuration Required</h2>
              <p className="text-slate-500 mt-2 mb-6">To use Google Drive integration, you must configure your Google Cloud Client ID and API Key in the admin settings.</p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-sm text-slate-600 mb-6 space-y-2">
                 <p><strong>1.</strong> Go to Google Cloud Console.</p>
                 <p><strong>2.</strong> Create a Project & Enable Drive API.</p>
                 <p><strong>3.</strong> Create OAuth Credentials.</p>
                 <p><strong>4.</strong> Paste Client ID in Settings.</p>
              </div>
              <button className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors mx-auto">
                 <Settings size={18}/> Go to Settings
              </button>
           </div>
        </div>
     );
  }

  // --- STATE: NOT LOGGED IN ---
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
          <Folder size={40} />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-slate-800">Google Drive Integration</h2>
          <p className="text-slate-500 mt-2">Connect your Google account to manage project files.</p>
        </div>
        <button 
          onClick={handleLogin}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          <LogIn size={20} /> Connect Google Drive
        </button>
      </div>
    );
  }

  // --- MAIN VIEW ---
  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" onClick={() => setActiveMenu(null)}>
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-slate-600 overflow-hidden">
           {folderHistory.map((folder, idx) => (
             <React.Fragment key={folder.id}>
               {idx > 0 && <span className="text-slate-400">/</span>}
               <button 
                 onClick={() => handleNavigateUp(idx)}
                 className="hover:text-blue-600 hover:underline font-medium truncate max-w-[150px]"
               >
                 {folder.name}
               </button>
             </React.Fragment>
           ))}
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => loadFiles(currentFolderId)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg" title="Refresh">
              <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
           </button>
           <button onClick={() => setIsCreatingFolder(true)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg" title="New Folder">
              <Plus size={18} />
           </button>
           <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-sm font-medium">
             <Upload size={16} /> Upload
             <input type="file" className="hidden" onChange={handleFileUpload} />
           </label>
        </div>
      </div>

      {/* Folder Creation Modal Inline */}
      {isCreatingFolder && (
         <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center gap-2 animate-in slide-in-from-top-2">
            <Folder size={20} className="text-blue-500"/>
            <input 
               className="flex-1 bg-white border border-blue-200 rounded px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500"
               placeholder="Folder Name"
               autoFocus
               value={newFolderName}
               onChange={e => setNewFolderName(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
            />
            <button onClick={handleCreateFolder} disabled={!newFolderName.trim()} className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-bold">Create</button>
            <button onClick={() => setIsCreatingFolder(false)} className="p-1 text-slate-400 hover:text-slate-600"><X size={16}/></button>
         </div>
      )}

      {/* File Grid */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scroll">
        {isLoading && files.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map(file => (
              <div 
                key={file.id}
                className="group bg-white border border-slate-200 rounded-xl p-3 hover:shadow-md transition-all cursor-pointer flex flex-col relative"
                onClick={() => {
                   if(file.mimeType === 'application/vnd.google-apps.folder') {
                      handleFolderClick(file.id, file.name);
                   } else {
                      window.open(file.webViewLink, '_blank');
                   }
                }}
              >
                <div className="h-32 bg-slate-100 rounded-lg mb-3 overflow-hidden flex items-center justify-center relative">
                  {file.thumbnailLink ? (
                    <img src={file.thumbnailLink} alt={file.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-400">
                      {file.mimeType.includes('folder') ? <Folder size={48} className="text-blue-400 fill-current"/> : 
                       file.mimeType.includes('image') ? <ImageIcon size={40}/> : 
                       file.mimeType.includes('video') ? <Video size={40}/> : <FileText size={40}/>}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                     <ExternalLink className="text-white drop-shadow-md" size={24} />
                  </div>
                </div>
                <div className="flex justify-between items-start">
                   <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-slate-700 truncate" title={file.name}>{file.name}</h4>
                      <p className="text-xs text-slate-400">{new Date(file.modifiedTime).toLocaleDateString()}</p>
                   </div>
                   <button 
                     className="p-1 hover:bg-slate-100 rounded text-slate-400"
                     onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === file.id ? null : file.id);
                     }}
                   >
                      <MoreVertical size={14} />
                   </button>
                </div>

                {/* Context Menu */}
                {activeMenu === file.id && (
                   <div className="absolute right-2 bottom-10 bg-white shadow-xl border border-slate-100 rounded-lg z-20 py-1 min-w-[120px] animate-in zoom-in-95 duration-100">
                      <button onClick={(e) => { e.stopPropagation(); window.open(file.webViewLink, '_blank'); setActiveMenu(null); }} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-600">
                         <ExternalLink size={12}/> Open
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }} className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 flex items-center gap-2 text-red-600">
                         <Trash2 size={12}/> Delete
                      </button>
                   </div>
                )}
              </div>
            ))}
            {files.length === 0 && !isLoading && (
               <div className="col-span-full flex flex-col items-center justify-center h-40 text-slate-400">
                  <Folder size={32} className="mb-2 opacity-50"/>
                  <p>This folder is empty.</p>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
