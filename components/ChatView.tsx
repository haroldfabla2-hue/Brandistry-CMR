
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { ChatSession, UserRole, MessageBlockType, AssetType } from '../types';
import { Search, Send, Plus, Hash, User as UserIcon, MoreVertical, Paperclip, CheckSquare, Image as ImageIcon, Layout, Command, Tag, Link as LinkIcon, X, Edit2, Trash2, EyeOff, Eye, Users } from 'lucide-react';
import { TaskBlock, AssetBlock } from './MessageBlocks';
import { TaskModal } from './TaskModal';
import { googleDriveService } from '../services/googleDriveService';

export const ChatView: React.FC = () => {
  const { user, users, chats, createChatSession, createGroupSession, updateChatSession, sendMessage, editMessage, deleteMessage, markChatRead, toggleChatReadStatus, tasks, assets, projects, addTask } = useStore();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [showContextRail, setShowContextRail] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [activeMessageMenu, setActiveMessageMenu] = useState<string | null>(null);
  const [activeSessionMenu, setActiveSessionMenu] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false);
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);

  const activeSession = chats.find(c => c.id === activeSessionId);
  const availableContacts = users.filter(u => u.id !== user.id);

  // --- CRITICAL FIX: SCROLL LOGIC ---
  // Only scroll when the session ID changes OR the *ID* of the last message changes (new message).
  // Do NOT scroll on edits or read status updates.
  const lastMessageId = activeSession?.messages[activeSession.messages.length - 1]?.id;

  useEffect(() => {
     if (scrollRef.current) {
         scrollRef.current.scrollIntoView({ behavior: 'smooth' });
     }
  }, [activeSessionId, lastMessageId]);

  // --- CRITICAL FIX: READ STATUS LOGIC ---
  // Only mark as read if there are actually unread messages for me.
  // This prevents infinite loops of State Update -> Re-render -> Effect -> State Update.
  const myUnreadCount = activeSession?.unreadCount[user.id] || 0;
  useEffect(() => {
     if (activeSessionId && myUnreadCount > 0) {
        markChatRead(activeSessionId);
     }
  }, [activeSessionId, myUnreadCount, markChatRead]);

  const handleSend = (e?: React.FormEvent) => {
     e?.preventDefault();
     if (!inputValue.trim() || !activeSessionId) return;

     if (inputValue.startsWith('/task ')) {
        const title = inputValue.replace('/task ', '');
        const newTask = { title, projectId: activeSession?.projectId || projects[0]?.id || 'p1', assignee: user.id };
        addTask(newTask);
        sendMessage(activeSessionId, "Created a task:", [{ type: 'TASK', id: `t${Date.now()}`, data: { ...newTask, id: `t${Date.now()}`, status: 'TODO', priority: 'MEDIUM', dueDate: new Date().toISOString() } }]);
     } else {
        sendMessage(activeSessionId, inputValue);
     }
     setInputValue('');
  };

  const handleEditSave = (sessionId: string, messageId: string) => {
      editMessage(sessionId, messageId, editContent);
      setEditingMessageId(null);
      setEditContent('');
  };

  const getPartner = (session: ChatSession) => {
     if (session.isGroup) return { name: session.name || 'Group Chat', avatar: 'https://ui-avatars.com/api/?name=Group&background=random' };
     const partnerId = session.participants.find(p => p !== user.id);
     return users.find(u => u.id === partnerId) || { name: 'Unknown', avatar: 'https://ui-avatars.com/api/?name=Unknown' };
  };

  const startChat = (targetId: string) => {
     const sid = createChatSession(targetId);
     setActiveSessionId(sid);
     setIsNewChatOpen(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && activeSessionId) {
          try {
             sendMessage(activeSessionId, `Uploading ${file.name}...`);
             await googleDriveService.uploadFile(file);
             sendMessage(activeSessionId, `Uploaded ${file.name} to Drive.`, [{ type: 'FILE', id: `f_${Date.now()}`, data: { name: file.name, url: '#' } }]);
          } catch(err) {
             sendMessage(activeSessionId, `Failed to upload ${file.name} to Drive (Auth required).`);
          }
      }
  };

  const activeContext = activeSession?.projectId ? projects.find(p => p.id === activeSession.projectId) : null;
  const contextAssets = activeContext ? assets.filter(a => a.projectId === activeContext.id) : [];

  return (
    <div className="h-full flex bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative" onClick={() => { setActiveMessageMenu(null); setActiveSessionMenu(null); }}>
       
       {/* SIDEBAR */}
       <div className="w-72 border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-200">
             <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">Streams</h2>
                <div className="flex gap-1">
                    <button onClick={() => setIsNewGroupOpen(true)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300" title="New Group"><Users size={16}/></button>
                    <button onClick={() => setIsNewChatOpen(true)} className="p-1.5 bg-brand-100 text-brand-600 rounded-lg hover:bg-brand-200" title="New Chat"><Plus size={16}/></button>
                </div>
             </div>
             <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                <input className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Filter streams..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-1">
             {chats.sort((a,b) => new Date(b.lastMessage?.timestamp || 0).getTime() - new Date(a.lastMessage?.timestamp || 0).getTime()).map(session => (
                 <div key={session.id} className="relative group">
                    <ChatListItem session={session} isActive={activeSessionId === session.id} onClick={() => setActiveSessionId(session.id)} partner={getPartner(session)} />
                    <button 
                        className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-300 rounded text-slate-500"
                        onClick={(e) => { e.stopPropagation(); setActiveSessionMenu(activeSessionMenu === session.id ? null : session.id); }}
                    >
                        <MoreVertical size={14}/>
                    </button>
                    {activeSessionMenu === session.id && (
                        <div className="absolute right-0 top-8 bg-white shadow-lg border rounded-lg z-50 w-32 py-1">
                            <button onClick={() => { toggleChatReadStatus(session.id); setActiveSessionMenu(null); }} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2">
                                {session.unreadCount[user.id] > 0 ? <Eye size={12}/> : <EyeOff size={12}/>}
                                {session.unreadCount[user.id] > 0 ? 'Mark Read' : 'Mark Unread'}
                            </button>
                            {user.role === 'ADMIN' && (
                                <button onClick={() => { deleteMessage(session.id, 'ALL'); setActiveSessionMenu(null); }} className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 flex items-center gap-2 text-red-600">
                                    <Trash2 size={12}/> Delete Chat
                                </button>
                            )}
                        </div>
                    )}
                 </div>
             ))}
          </div>
       </div>

       {/* MAIN CHAT AREA */}
       <div className="flex-1 flex flex-col bg-white relative min-w-0">
          {activeSession ? (
             <>
               {/* HEADER */}
               <div className="h-16 border-b border-slate-100 flex justify-between items-center px-6 bg-white shrink-0">
                  <div className="flex items-center gap-3">
                     <span className="font-bold text-slate-800 text-lg">{getPartner(activeSession).name}</span>
                     {activeSession.isGroup && <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs">{activeSession.participants.length} members</span>}
                  </div>
                  <button onClick={() => setShowContextRail(!showContextRail)} className={`p-2 rounded-lg ${showContextRail ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:bg-slate-50'}`}><Layout size={20}/></button>
               </div>

               {/* MESSAGES SCROLL AREA */}
               <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scroll bg-slate-50/30 flex flex-col min-h-0">
                  {activeSession.messages.map((msg, idx) => {
                     const isMe = msg.senderId === user.id;
                     const isEd = editingMessageId === msg.id;
                     return (
                        <div key={msg.id} className={`group flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                           <img src={isMe ? user.avatar : getPartner(activeSession).avatar} className="w-8 h-8 rounded-full bg-slate-200 object-cover mt-1" alt="User Avatar"/>
                           
                           <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                              <div className="flex items-center gap-2 mb-1">
                                 <span className="text-xs font-bold text-slate-700">{isMe ? 'You' : users.find(u=>u.id===msg.senderId)?.name}</span>
                                 <span className="text-[10px] text-slate-400">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                              </div>
                              
                              {isEd ? (
                                  <div className="bg-white border border-brand-200 p-2 rounded-xl shadow-sm w-full min-w-[300px]">
                                      <textarea 
                                        className="w-full text-sm border-none outline-none resize-none bg-slate-50 p-2 rounded" 
                                        value={editContent} 
                                        onChange={e => setEditContent(e.target.value)}
                                        autoFocus
                                      />
                                      <div className="flex justify-end gap-2 mt-2">
                                          <button onClick={() => setEditingMessageId(null)} className="text-xs px-2 py-1 text-slate-500 hover:bg-slate-100 rounded">Cancel</button>
                                          <button onClick={() => handleEditSave(activeSession.id, msg.id)} className="text-xs px-2 py-1 bg-brand-600 text-white rounded font-medium">Save</button>
                                      </div>
                                  </div>
                              ) : (
                                  <div className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${isMe ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                                      {msg.content}
                                      {msg.isEdited && <span className="text-[9px] opacity-60 ml-1 italic">(edited)</span>}
                                      
                                      {/* Message Actions Menu */}
                                      <div className={`absolute top-0 ${isMe ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                          <button 
                                            className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
                                            onClick={(e) => { e.stopPropagation(); setActiveMessageMenu(activeMessageMenu === msg.id ? null : msg.id); }}
                                          >
                                              <MoreVertical size={14}/>
                                          </button>
                                          {activeMessageMenu === msg.id && (
                                              <div className={`absolute top-6 ${isMe ? 'right-0' : 'left-0'} bg-white shadow-lg border rounded-lg z-50 w-24 py-1 overflow-hidden`}>
                                                  {(isMe || user.role === 'ADMIN') && (
                                                      <button onClick={() => { setEditingMessageId(msg.id); setEditContent(msg.content); setActiveMessageMenu(null); }} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700">
                                                          <Edit2 size={12}/> Edit
                                                      </button>
                                                  )}
                                                  {(isMe || user.role === 'ADMIN') && (
                                                      <button onClick={() => { deleteMessage(activeSession.id, msg.id); setActiveMessageMenu(null); }} className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 flex items-center gap-2 text-red-600">
                                                          <Trash2 size={12}/> Delete
                                                      </button>
                                                  )}
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              )}

                              {msg.blocks?.map((block) => (
                                 <div key={block.id} className="mt-2 w-full">
                                    {block.type === 'TASK' && <TaskBlock task={block.data} />}
                                    {block.type === 'ASSET' && <AssetBlock asset={block.data} />}
                                 </div>
                              ))}
                           </div>
                        </div>
                     );
                  })}
                  {/* Scroll anchor */}
                  <div ref={scrollRef} className="h-px" />
               </div>

               {/* INPUT FOOTER */}
               <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                  <form onSubmit={handleSend} className="relative bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent transition-all shadow-sm">
                     <div className="flex items-center px-2 py-1 border-b border-slate-200/50 gap-1">
                         <button type="button" onClick={() => setIsTaskModalOpen(true)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors" title="Add Task"><CheckSquare size={16}/></button>
                         <button type="button" onClick={() => setIsAssetPickerOpen(true)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors" title="Attach Asset"><ImageIcon size={16}/></button>
                         <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors" title="Attach File"><Paperclip size={16}/></button>
                         <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect}/>
                     </div>
                     <div className="flex gap-2 p-2">
                        <input className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-slate-400" placeholder="Type a message..." value={inputValue} onChange={e => setInputValue(e.target.value)} autoFocus/>
                        <button type="submit" className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50" disabled={!inputValue.trim()}><Send size={16}/></button>
                     </div>
                  </form>
               </div>
             </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <Command size={48} className="opacity-20 mb-4"/>
                <p>Select a stream to start.</p>
             </div>
          )}
       </div>

       {/* CONTEXT RAIL */}
       {activeSession && showContextRail && (
          <div className="w-80 bg-slate-50 border-l border-slate-200 flex flex-col shrink-0">
             <div className="p-4 border-b border-slate-200 font-bold text-slate-700 text-sm uppercase tracking-wide">Context</div>
             <div className="flex-1 overflow-y-auto p-4 custom-scroll">
                {activeContext ? (
                   <div className="space-y-6">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                         <h4 className="font-bold text-slate-800">{activeContext.name}</h4>
                         <p className="text-xs text-slate-500 mt-1">{activeContext.description}</p>
                         <div className="mt-4 flex justify-between text-xs"><span className="text-slate-500">Status</span><span className="font-bold text-brand-600">{activeContext.status}</span></div>
                         <button onClick={() => updateChatSession(activeSession.id, { projectId: undefined })} className="mt-3 text-[10px] text-red-500 hover:underline">Unlink</button>
                      </div>
                      <div>
                         <h5 className="font-bold text-slate-600 text-xs uppercase mb-3">Recent Assets</h5>
                         <div className="space-y-2">{contextAssets.slice(0, 3).map(asset => (<div key={asset.id} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200"><div className="text-xs font-bold text-slate-700 truncate">{asset.title}</div></div>))}</div>
                      </div>
                   </div>
                ) : (
                   <div className="text-center text-slate-400 mt-10"><p className="text-sm">No project linked.</p><button onClick={() => setIsProjectPickerOpen(true)} className="mt-4 text-xs text-brand-600 font-medium hover:underline">Link Project</button></div>
                )}
             </div>
          </div>
       )}

       {/* MODALS */}
       {isNewChatOpen && <NewChatModal contacts={availableContacts} onClose={() => setIsNewChatOpen(false)} onSelect={startChat}/>}
       {isNewGroupOpen && <NewGroupModal contacts={availableContacts} onClose={() => setIsNewGroupOpen(false)} onCreate={createGroupSession}/>}
       {isProjectPickerOpen && <ProjectPicker projects={projects} onClose={() => setIsProjectPickerOpen(false)} onSelect={(pid) => { updateChatSession(activeSessionId!, { projectId: pid }); setIsProjectPickerOpen(false); }}/>}
       {isAssetPickerOpen && <AssetPicker assets={assets} onClose={() => setIsAssetPickerOpen(false)} onSelect={(a) => { sendMessage(activeSessionId!, "Asset:", [{ type: 'ASSET', id: `a_${Date.now()}`, data: a }]); setIsAssetPickerOpen(false); }}/>}
       <TaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} initialStatus='TODO'/>
    </div>
  );
};

// --- SUBCOMPONENTS ---

const ChatListItem = ({ session, isActive, onClick, partner }: any) => {
   const unread = session.unreadCount['me'] || 0; 
   return (
      <div onClick={onClick} className={`p-3 mx-2 rounded-lg flex gap-3 cursor-pointer transition-colors ${isActive ? 'bg-white shadow-sm border border-slate-200' : 'hover:bg-slate-200/50 border border-transparent'}`}>
         <div className="relative"><img src={partner.avatar} className="w-9 h-9 rounded-full bg-slate-200 object-cover" alt="Avatar"/>{unread > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand-500 border-2 border-white rounded-full"></span>}</div>
         <div className="flex-1 min-w-0"><div className="flex justify-between items-baseline mb-0.5"><span className={`text-sm font-semibold truncate ${unread > 0 ? 'text-slate-900' : 'text-slate-700'}`}>{session.name || partner.name}</span></div><p className={`text-xs truncate ${unread > 0 ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>{session.lastMessage?.content || 'New Stream'}</p></div>
      </div>
   );
};

const NewChatModal = ({ contacts, onClose, onSelect }: any) => (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 font-bold text-slate-800">New Direct Stream</div>
            <div className="max-h-96 overflow-y-auto p-2">
                {contacts.map((u: any) => (
                    <div key={u.id} onClick={() => onSelect(u.id)} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
                        <img src={u.avatar} className="w-10 h-10 rounded-full" alt={u.name}/>
                        <div><div className="font-bold text-sm text-slate-800">{u.name}</div><div className="text-xs text-slate-500 capitalize">{u.role}</div></div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const NewGroupModal = ({ contacts, onClose, onCreate }: any) => {
    const [name, setName] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const handleSubmit = () => {
        if(name && selected.length > 0) {
            onCreate(name, selected);
            onClose();
        }
    };
    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-100 font-bold text-slate-800">New Group Stream</div>
                <div className="p-4 space-y-4">
                    <input className="w-full border p-2 rounded text-sm" placeholder="Group Name" value={name} onChange={e => setName(e.target.value)} autoFocus/>
                    <div className="max-h-60 overflow-y-auto border rounded p-2">
                        {contacts.map((u: any) => (
                            <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                                <input type="checkbox" checked={selected.includes(u.id)} onChange={e => {
                                    if(e.target.checked) setSelected([...selected, u.id]);
                                    else setSelected(selected.filter(id => id !== u.id));
                                }}/>
                                <span className="text-sm font-medium">{u.name}</span>
                            </label>
                        ))}
                    </div>
                    <button onClick={handleSubmit} disabled={!name || selected.length===0} className="w-full bg-brand-600 text-white py-2 rounded font-bold text-sm disabled:opacity-50">Create Group</button>
                </div>
            </div>
        </div>
    );
};

const ProjectPicker = ({ projects, onClose, onSelect }: any) => (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 font-bold text-slate-800">Link Project Context</div>
            <div className="max-h-96 overflow-y-auto p-2">
                {projects.map((p: any) => (
                    <div key={p.id} onClick={() => onSelect(p.id)} className="p-3 hover:bg-slate-50 rounded-lg cursor-pointer border-b border-slate-50 last:border-0">
                        <div className="font-bold text-sm text-slate-800">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.status}</div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const AssetPicker = ({ assets, onClose, onSelect }: any) => (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 font-bold text-slate-800">Attach Asset</div>
            <div className="max-h-96 overflow-y-auto p-2">
                {assets.map((a: any) => (
                    <div key={a.id} onClick={() => onSelect(a)} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer border-b border-slate-50 last:border-0">
                        <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center"><ImageIcon size={14}/></div>
                        <div><div className="font-bold text-sm text-slate-800">{a.title}</div><div className="text-xs text-slate-500">{a.status}</div></div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);
