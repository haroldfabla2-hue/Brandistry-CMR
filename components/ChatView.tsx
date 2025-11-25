
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { User, ChatSession, UserRole } from '../types';
import { Search, Send, Plus, Hash, User as UserIcon, MoreVertical } from 'lucide-react';

export const ChatView: React.FC = () => {
  const { user, users, chats, createChatSession, sendMessage, markChatRead } = useStore();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeSession = chats.find(c => c.id === activeSessionId);

  // Filter users for "New Chat" logic
  const availableContacts = users.filter(u => u.id !== user.id && (
     user.role === UserRole.ADMIN || // Admin sees everyone
     (u.role === UserRole.ADMIN) || // Everyone sees Admin
     (user.assignedClientIds?.some(cid => u.assignedClientIds?.includes(cid))) || // Shared Clients
     (user.assignedProjectIds?.some(pid => u.assignedProjectIds?.includes(pid))) // Shared Projects
  ));

  useEffect(() => {
     if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
     if (activeSessionId) markChatRead(activeSessionId);
  }, [activeSession?.messages, activeSessionId]);

  const handleSend = (e?: React.FormEvent) => {
     e?.preventDefault();
     if (!inputValue.trim() || !activeSessionId) return;
     sendMessage(activeSessionId, inputValue);
     setInputValue('');
  };

  const getPartner = (session: ChatSession) => {
     const partnerId = session.participants.find(p => p !== user.id);
     return users.find(u => u.id === partnerId);
  };

  const startChat = (targetId: string) => {
     const sid = createChatSession(targetId);
     setActiveSessionId(sid);
     setIsNewChatOpen(false);
  };

  return (
    <div className="h-full flex bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
       {/* Sidebar */}
       <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50">
          <div className="p-4 border-b border-slate-200">
             <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-slate-800 text-lg">Messages</h2>
                <button onClick={() => setIsNewChatOpen(true)} className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm"><Plus size={18}/></button>
             </div>
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                <input 
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" 
                  placeholder="Search chats..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scroll">
             {chats.sort((a,b) => new Date(b.lastMessage?.timestamp || 0).getTime() - new Date(a.lastMessage?.timestamp || 0).getTime()).map(session => {
                const partner = getPartner(session);
                if (!partner) return null;
                const unread = session.unreadCount[user.id] || 0;
                
                return (
                   <div 
                     key={session.id} 
                     onClick={() => setActiveSessionId(session.id)}
                     className={`p-4 flex gap-3 cursor-pointer hover:bg-slate-100 transition-colors border-l-4 ${activeSessionId === session.id ? 'bg-white border-brand-600' : 'border-transparent'}`}
                   >
                      <div className="relative">
                         <img src={partner.avatar} className="w-10 h-10 rounded-full bg-slate-200 object-cover" alt="Avatar"/>
                         {unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-slate-50">{unread}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-baseline mb-1">
                            <span className={`text-sm font-semibold truncate ${unread > 0 ? 'text-slate-900' : 'text-slate-700'}`}>{partner.name}</span>
                            <span className="text-[10px] text-slate-400">{session.lastMessage ? new Date(session.lastMessage.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</span>
                         </div>
                         <p className={`text-xs truncate ${unread > 0 ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>{session.lastMessage?.content || 'Start conversation'}</p>
                      </div>
                   </div>
                );
             })}
          </div>
       </div>

       {/* Chat Area */}
       <div className="flex-1 flex flex-col bg-white">
          {activeSession ? (
             <>
               {/* Chat Header */}
               <div className="p-4 border-b border-slate-100 flex justify-between items-center shadow-sm z-10">
                  <div className="flex items-center gap-3">
                     <img src={getPartner(activeSession)?.avatar} className="w-10 h-10 rounded-full" alt="Avatar"/>
                     <div>
                        <h3 className="font-bold text-slate-800">{getPartner(activeSession)?.name}</h3>
                        <div className="flex items-center gap-1.5">
                           <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                           <span className="text-xs text-slate-500">Active now</span>
                        </div>
                     </div>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600"><MoreVertical size={20}/></button>
               </div>

               {/* Messages */}
               <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 custom-scroll">
                  {activeSession.messages.map((msg, idx) => {
                     const isMe = msg.senderId === user.id;
                     return (
                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                              <p>{msg.content}</p>
                              <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-brand-100' : 'text-slate-400'}`}>
                                 {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                              </div>
                           </div>
                        </div>
                     );
                  })}
                  <div ref={scrollRef} />
               </div>

               {/* Input */}
               <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white">
                  <div className="flex gap-2">
                     <input 
                       className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                       placeholder="Type your message..."
                       value={inputValue}
                       onChange={e => setInputValue(e.target.value)}
                       autoFocus
                     />
                     <button type="submit" className="p-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50" disabled={!inputValue.trim()}>
                        <Send size={20}/>
                     </button>
                  </div>
               </form>
             </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                   <Hash size={40} className="opacity-50"/>
                </div>
                <p>Select a conversation or start a new one.</p>
             </div>
          )}
       </div>

       {/* New Chat Modal */}
       {isNewChatOpen && (
          <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsNewChatOpen(false)}>
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-100 font-bold text-slate-800">New Message</div>
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
    </div>
  );
};
