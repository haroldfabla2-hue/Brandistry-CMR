
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { ChatSession, UserRole, MessageBlockType, AssetType } from '../types';
import { Search, Send, Plus, Hash, User as UserIcon, MoreVertical, Paperclip, CheckSquare, Image as ImageIcon, Layout, Command, Tag, Link as LinkIcon, X } from 'lucide-react';
import { TaskBlock, AssetBlock } from './MessageBlocks';
import { TaskModal } from './TaskModal';
import { googleDriveService } from '../services/googleDriveService';

export const ChatView: React.FC = () => {
  const { user, users, chats, createChatSession, updateChatSession, sendMessage, markChatRead, tasks, assets, projects, addTask } = useStore();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [showContextRail, setShowContextRail] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false);
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
  
  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSession = chats.find(c => c.id === activeSessionId);

  // Filter users for "New Chat" logic
  const availableContacts = users.filter(u => u.id !== user.id);

  useEffect(() => {
     if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
     if (activeSessionId) markChatRead(activeSessionId);
  }, [activeSession?.messages, activeSessionId]);

  const handleSend = (e?: React.FormEvent) => {
     e?.preventDefault();
     if (!inputValue.trim() || !activeSessionId) return;

     // --- SMART COMMAND PARSING (Words to Workflow) ---
     if (inputValue.startsWith('/task ')) {
        const title = inputValue.replace('/task ', '');
        const newTask = {
            title,
            projectId: activeSession?.projectId || projects[0]?.id || 'p1', 
            assignee: user.id
        };
        addTask(newTask);
        sendMessage(activeSessionId, "Created a task:", [
            { type: 'TASK', id: `t${Date.now()}`, data: { ...newTask, id: `t${Date.now()}`, status: 'TODO', priority: 'MEDIUM', dueDate: new Date().toISOString() } }
        ]);
     } else {
        sendMessage(activeSessionId, inputValue);
     }
     setInputValue('');
  };

  const getPartner = (session: ChatSession) => {
     if (session.isGroup) return { name: session.name || 'Group Chat', avatar: 'https://ui-avatars.com/api/?name=Group' };
     const partnerId = session.participants.find(p => p !== user.id);
     return users.find(u => u.id === partnerId) || { name: 'Unknown', avatar: '' };
  };

  const startChat = (targetId: string) => {
     const sid = createChatSession(targetId);
     setActiveSessionId(sid);
     setIsNewChatOpen(false);
  };

  // --- LINKING HANDLERS ---
  const handleLinkProject = (projectId: string) => {
      if (!activeSessionId) return;
      updateChatSession(activeSessionId, { projectId });
      setIsProjectPickerOpen(false);
  };

  const handleAttachAsset = (asset: any) => {
      if (!activeSessionId) return;
      sendMessage(activeSessionId, "Shared an asset:", [
          { type: 'ASSET', id: `ab_${Date.now()}`, data: asset }
      ]);
      setIsAssetPickerOpen(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && activeSessionId) {
          try {
             // Mock upload for simulation if needed, but here using real service structure
             // If Drive not connected, it might fail, so wrap
             // For reliability in this demo, sending message first
             sendMessage(activeSessionId, `Uploading ${file.name}...`);
             
             // Real upload attempt
             await googleDriveService.uploadFile(file);
             sendMessage(activeSessionId, `Uploaded ${file.name} to Drive.`, [
                { type: 'FILE', id: `f_${Date.now()}`, data: { name: file.name, url: '#' } }
             ]);
          } catch(err) {
             sendMessage(activeSessionId, `Failed to upload ${file.name} to Drive (Auth required).`);
          }
      }
  };

  // Determine Active Context for Right Rail
  const activeContext = activeSession?.projectId ? projects.find(p => p.id === activeSession.projectId) : null;
  const contextAssets = activeContext ? assets.filter(a => a.projectId === activeContext.id) : [];

  return (
    <div className="h-full flex bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
       
       {/* STREAM SIDEBAR (Left) */}
       <div className="w-72 border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-200">
             <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Layout size={18}/> Streams</h2>
                <button onClick={() => setIsNewChatOpen(true)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"><Plus size={18}/></button>
             </div>
             <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={14}/>
                <input 
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all" 
                  placeholder="Filter (e.g. tag:urgent)"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-1">
             {/* Pinned / Priority Streams */}
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-2">Priority</div>
             {chats.filter(c => c.isPinned).map(session => (
                 <ChatListItem key={session.id} session={session} isActive={activeSessionId === session.id} onClick={() => setActiveSessionId(session.id)} partner={getPartner(session)} />
             ))}

             {/* All Streams */}
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-2 mt-2">Recent</div>
             {chats.filter(c => !c.isPinned).sort((a,b) => new Date(b.lastMessage?.timestamp || 0).getTime() - new Date(a.lastMessage?.timestamp || 0).getTime()).map(session => (
                 <ChatListItem key={session.id} session={session} isActive={activeSessionId === session.id} onClick={() => setActiveSessionId(session.id)} partner={getPartner(session)} />
             ))}
          </div>
       </div>

       {/* MAIN STREAM (Center) */}
       <div className="flex-1 flex flex-col bg-white relative">
          {activeSession ? (
             <>
               {/* Smart Header / Command Palette */}
               <div className="h-14 border-b border-slate-100 flex justify-between items-center px-6 bg-white z-10">
                  <div className="flex items-center gap-3">
                     <span className="font-bold text-slate-800 text-lg">{getPartner(activeSession).name}</span>
                     {activeSession.tags?.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs font-medium flex items-center gap-1">
                           <Tag size={10}/> {tag}
                        </span>
                     ))}
                  </div>
                  <div className="flex items-center gap-3">
                     <button onClick={() => setShowContextRail(!showContextRail)} className={`p-2 rounded-lg transition-colors ${showContextRail ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:bg-slate-50'}`}>
                        <Layout size={18}/>
                     </button>
                  </div>
               </div>

               {/* Stream Feed */}
               <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scroll bg-slate-50/30">
                  {activeSession.messages.map((msg, idx) => {
                     const isMe = msg.senderId === user.id;
                     return (
                        <div key={idx} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                           {/* Avatar */}
                           <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 mt-1">
                              {/* Simplify avatar logic */}
                              <img src={isMe ? user.avatar : getPartner(activeSession).avatar} className="w-full h-full object-cover"/>
                           </div>
                           
                           <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                              <div className="flex items-center gap-2 mb-1">
                                 <span className="text-xs font-bold text-slate-700">{isMe ? 'You' : getPartner(activeSession).name}</span>
                                 <span className="text-xs text-slate-400">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                              </div>
                              
                              {/* Message Content Bubble */}
                              {msg.content && (
                                 <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                    isMe ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                                 }`}>
                                    {msg.content}
                                 </div>
                              )}

                              {/* Interactive Blocks (Loop Components) */}
                              {msg.blocks && (
                                 <div className="mt-2 space-y-2">
                                    {msg.blocks.map((block, bIdx) => (
                                       <div key={bIdx}>
                                          {block.type === 'TASK' && <TaskBlock task={block.data} />}
                                          {block.type === 'ASSET' && <AssetBlock asset={block.data} />}
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>
                        </div>
                     );
                  })}
                  <div ref={scrollRef} />
               </div>

               {/* Smart Input */}
               <div className="p-4 bg-white border-t border-slate-100">
                  <form onSubmit={handleSend} className="relative bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent transition-all shadow-sm">
                     <div className="flex items-center px-2 py-1 border-b border-slate-200/50 gap-1">
                         <button type="button" onClick={() => setIsTaskModalOpen(true)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors" title="Add Task"><CheckSquare size={16}/></button>
                         <button type="button" onClick={() => setIsAssetPickerOpen(true)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors" title="Attach Asset"><ImageIcon size={16}/></button>
                         <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors" title="Attach File"><Paperclip size={16}/></button>
                         <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect}/>
                     </div>
                     <div className="flex gap-2 p-2">
                        <input 
                          className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-slate-400"
                          placeholder="Type a message or '/' for commands..."
                          value={inputValue}
                          onChange={e => setInputValue(e.target.value)}
                          autoFocus
                        />
                        <button type="submit" className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50" disabled={!inputValue.trim()}>
                           <Send size={16}/>
                        </button>
                     </div>
                  </form>
                  <div className="text-[10px] text-slate-400 mt-2 px-2 flex justify-between">
                     <span><strong>Tip:</strong> Type <code>/task [name]</code> to create a task instantly.</span>
                     <span>Markdown supported</span>
                  </div>
               </div>
             </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <Command size={48} className="opacity-20 mb-4"/>
                <p>Select a stream to start working.</p>
             </div>
          )}
       </div>

       {/* CONTEXT RAIL (Right) - Intelligent Side Panel */}
       {activeSession && showContextRail && (
          <div className="w-80 bg-slate-50 border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
             <div className="p-4 border-b border-slate-200 font-bold text-slate-700 text-sm uppercase tracking-wide">Context</div>
             <div className="flex-1 overflow-y-auto p-4 custom-scroll">
                {activeContext ? (
                   <div className="space-y-6">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                         <h4 className="font-bold text-slate-800">{activeContext.name}</h4>
                         <p className="text-xs text-slate-500 mt-1">{activeContext.description}</p>
                         <div className="mt-4 flex justify-between text-xs">
                            <span className="text-slate-500">Status</span>
                            <span className="font-bold text-brand-600">{activeContext.status}</span>
                         </div>
                         <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
                            <div className="bg-brand-500 h-1.5 rounded-full" style={{width: `${activeContext.progress}%`}}></div>
                         </div>
                         <button onClick={() => updateChatSession(activeSession.id, { projectId: undefined })} className="mt-3 text-[10px] text-red-500 hover:underline">Unlink Project</button>
                      </div>

                      <div>
                         <h5 className="font-bold text-slate-600 text-xs uppercase mb-3">Recent Assets</h5>
                         <div className="space-y-2">
                            {contextAssets.slice(0, 3).map(asset => (
                               <div key={asset.id} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200">
                                  <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                                     <ImageIcon size={14} className="text-slate-400"/>
                                  </div>
                                  <div className="min-w-0">
                                     <div className="text-xs font-bold text-slate-700 truncate">{asset.title}</div>
                                     <div className="text-[10px] text-slate-400">{asset.status}</div>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                ) : (
                   <div className="text-center text-slate-400 mt-10">
                      <p className="text-sm">No specific project context linked.</p>
                      <button onClick={() => setIsProjectPickerOpen(true)} className="mt-4 text-xs text-brand-600 font-medium hover:underline">Link Project</button>
                   </div>
                )}
             </div>
          </div>
       )}

       {/* --- MODALS --- */}

       {/* New Chat Modal */}
       {isNewChatOpen && (
          <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsNewChatOpen(false)}>
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-100 font-bold text-slate-800">New Context Stream</div>
                <div className="max-h-96 overflow-y-auto p-2">
                   {availableContacts.map(u => (
                      <div key={u.id} onClick={() => startChat(u.id)} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                         <img src={u.avatar} className="w-10 h-10 rounded-full" alt={u.name}/>
                         <div>
                            <div className="font-bold text-sm text-slate-800">{u.name}</div>
                            <div className="text-xs text-slate-500 capitalize">{u.role}</div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
       )}

       {/* Project Picker Modal */}
       {isProjectPickerOpen && (
           <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsProjectPickerOpen(false)}>
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                   <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                       <h3 className="font-bold text-slate-800">Select Project Context</h3>
                       <button onClick={() => setIsProjectPickerOpen(false)}><X size={16}/></button>
                   </div>
                   <div className="p-2 max-h-96 overflow-y-auto">
                       {projects.map(p => (
                           <div key={p.id} onClick={() => handleLinkProject(p.id)} className="p-3 hover:bg-slate-50 rounded-lg cursor-pointer border-b border-slate-50 last:border-0">
                               <div className="font-bold text-sm text-slate-800">{p.name}</div>
                               <div className="text-xs text-slate-500">{p.status}</div>
                           </div>
                       ))}
                   </div>
               </div>
           </div>
       )}

       {/* Asset Picker Modal */}
       {isAssetPickerOpen && (
           <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsAssetPickerOpen(false)}>
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                   <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                       <h3 className="font-bold text-slate-800">Attach Asset</h3>
                       <button onClick={() => setIsAssetPickerOpen(false)}><X size={16}/></button>
                   </div>
                   <div className="p-2 max-h-96 overflow-y-auto">
                       {assets.map(a => (
                           <div key={a.id} onClick={() => handleAttachAsset(a)} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer border-b border-slate-50 last:border-0">
                               <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center">
                                   {a.type === AssetType.IMAGE ? <ImageIcon size={16}/> : <Layout size={16}/>}
                               </div>
                               <div>
                                   <div className="font-bold text-sm text-slate-800">{a.title}</div>
                                   <div className="text-xs text-slate-500">{a.status}</div>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
           </div>
       )}

       {/* Task Modal (Used for Chat) */}
       {/* We don't have a direct onSave callback in TaskModal yet, so we just let it create the task in the store. 
           For a real chat integration, we'd want to capture the created task. 
           Here we assume the user just wants to create a task contextually. */}
       <TaskModal 
           isOpen={isTaskModalOpen} 
           onClose={() => setIsTaskModalOpen(false)}
           initialStatus='TODO'
       />
    </div>
  );
};

// Subcomponent for list items
const ChatListItem = ({ session, isActive, onClick, partner }: any) => {
   const unread = session.unreadCount['me'] || 0; 
   return (
      <div 
        onClick={onClick}
        className={`p-3 mx-2 rounded-lg flex gap-3 cursor-pointer transition-colors ${isActive ? 'bg-white shadow-sm border border-slate-200' : 'hover:bg-slate-200/50 border border-transparent'}`}
      >
         <div className="relative">
            <img src={partner.avatar} className="w-9 h-9 rounded-full bg-slate-200 object-cover" alt="Avatar"/>
            {unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 border-2 border-white rounded-full"></span>}
         </div>
         <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline mb-0.5">
               <span className={`text-sm font-semibold truncate ${unread > 0 ? 'text-slate-900' : 'text-slate-700'}`}>{partner.name}</span>
            </div>
            <p className={`text-xs truncate ${unread > 0 ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>{session.lastMessage?.content || 'Start flow'}</p>
         </div>
      </div>
   );
};
