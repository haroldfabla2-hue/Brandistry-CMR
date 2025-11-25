
import React, { useState, useEffect } from 'react';
import { googleDriveService } from '../services/googleDriveService';
import { GoogleFile } from '../types';
import { Folder, FileText, Image as ImageIcon, Video, MoreVertical, Upload, LogIn, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const FilesView: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [files, setFiles] = useState<GoogleFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [folderHistory, setFolderHistory] = useState<{id: string, name: string}[]>([{id: 'root', name: 'My Drive'}]);
  const { notify } = useStore();

  const loadFiles = async (folderId: string) => {
    setIsLoading(true);
    try {
      const driveFiles = await googleDriveService.listFiles(folderId);
      setFiles(driveFiles || []);
    } catch (error) {
      notify({
        title: "Drive Error",
        message: "Failed to load files. Please ensure you are logged in.",
        type: "error",
        priority: "HIGH"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      await googleDriveService.signIn();
      setIsAuthenticated(true);
      loadFiles('root');
      notify({
        title: "Connected to Drive",
        message: "Successfully authenticated with Google.",
        type: "success",
        priority: "MEDIUM"
      });
    } catch (error) {
      console.error("Login failed", error);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsLoading(true);
      try {
        await googleDriveService.uploadFile(e.target.files[0], currentFolderId);
        notify({
          title: "File Uploaded",
          message: `${e.target.files[0].name} saved to Drive.`,
          type: "success",
          priority: "MEDIUM"
        });
        loadFiles(currentFolderId);
      } catch (error) {
        notify({
          title: "Upload Failed",
          message: "Could not upload file to Drive.",
          type: "error",
          priority: "HIGH"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
          <Folder size={40} />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-slate-800">Google Drive Integration</h2>
          <p className="text-slate-500 mt-2">Connect your Google account to access, upload, and manage project files directly within Brandistry.</p>
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

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
           <button onClick={() => loadFiles(currentFolderId)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg">
              <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
           </button>
           <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-sm font-medium">
             <Upload size={16} /> Upload File
             <input type="file" className="hidden" onChange={handleFileUpload} />
           </label>
        </div>
      </div>

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
                className="group bg-white border border-slate-200 rounded-xl p-3 hover:shadow-md transition-all cursor-pointer flex flex-col"
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
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                     <ExternalLink className="text-white drop-shadow-md" size={24} />
                  </div>
                </div>
                <div className="flex justify-between items-start">
                   <div className="min-w-0">
                      <h4 className="text-sm font-medium text-slate-700 truncate" title={file.name}>{file.name}</h4>
                      <p className="text-[10px] text-slate-400">{new Date(file.modifiedTime).toLocaleDateString()}</p>
                   </div>
                   {file.mimeType === 'application/vnd.google-apps.folder' && (
                      <MoreVertical size={14} className="text-slate-400" />
                   )}
                </div>
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
