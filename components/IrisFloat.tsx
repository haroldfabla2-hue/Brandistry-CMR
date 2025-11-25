
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { geminiService } from '../services/geminiService';
import { IrisActionType, IrisAction } from '../types';
import { Sparkles, X, Send, Command, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export const IrisFloat: React.FC = () => {
  const { user, projects, users, executeIrisAction } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingAction, setPendingAction] = useState<IrisAction | null>(null);
  const [history, setHistory] = useState<{role: 'user'|'model', text: string}[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
     if(scrollRef.current) scrollRef.current.scrollIntoView({behavior:'smooth'});
  }, [history, pendingAction]);

  const handleSubmit = async (e?: React.FormEvent) => {
     e?.preventDefault();
     if (!input.trim()) return;

     const userMsg = input;
     setHistory(prev => [...prev, {role: 'user', text: userMsg}]);
     setInput('');
     setIsProcessing(true);

     // Build Context for AI
     const context = `
        Current User: ${user.name} (${user.role}).
        Users: ${users.map(u => `${u.name} (${u.id})`).join(', ')}.
        Projects: ${projects.map(p => `${p.name} (${p.id})`).join(', ')}.
     `;

     const action = await geminiService.analyzeAdminIntent(userMsg, context);
     setIsProcessing(false);

     if (action.type !== IrisActionType.NONE) {
        setPendingAction(action);
        setHistory(prev => [...prev, {role: 'model', text: "I've prepared an action based on your request. Please confirm."}]);
     } else {
        setHistory(prev => [...prev, {role: 'model', text: action.confirmationText}]);
     }
  };

  const handleConfirm = () => {
     if (pendingAction) {
        executeIrisAction(pendingAction);
        setHistory(prev => [...prev, {role: 'model', text: "Action executed successfully."}]);
        setPendingAction(null);
     }
  };

  if (user.role !== 'ADMIN') return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">
       {/* Chat Window */}
       {isOpen && (
          <div className="pointer-events-auto mb-4 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 flex flex-col max-h-[500px]">
             <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <Sparkles size={18} className="text-yellow-300 animate-pulse"/>
                   <span className="font-bold">Iris Orchestrator</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={16}/></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4 custom-scroll">
                {history.length === 0 && (
                   <div className="text-center text-slate-400 mt-10">
                      <Command size={40} className="mx-auto mb-2 opacity-50"/>
                      <p className="text-sm">I am ready, Administrator.</p>
                      <p className="text-xs">Try "Create a task for Maria" or "Delete user John"</p>
                   </div>
                )}
                {history.map((msg, idx) => (
                   <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                         {msg.text}
                      </div>
                   </div>
                ))}
                
                {/* Action Card */}
                {pendingAction && (
                   <div className="bg-white border-l-4 border-amber-500 rounded-r-xl shadow-md p-4 animate-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase mb-2">
                         <AlertTriangle size={14}/> Confirmation Required
                      </div>
                      <p className="text-slate-800 font-medium mb-3">{pendingAction.confirmationText}</p>
                      <div className="flex gap-2">
                         <button onClick={() => setPendingAction(null)} className="flex-1 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded">Cancel</button>
                         <button onClick={handleConfirm} className="flex-1 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm">Execute</button>
                      </div>
                   </div>
                )}

                {isProcessing && (
                   <div className="flex justify-start">
                      <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                         <Loader2 size={14} className="animate-spin text-indigo-600"/>
                         <span className="text-xs text-slate-500">Analyzing system...</span>
                      </div>
                   </div>
                )}
                <div ref={scrollRef}/>
             </div>

             <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100">
                <div className="relative">
                   <input 
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                     placeholder="Command the system..."
                     value={input}
                     onChange={e => setInput(e.target.value)}
                     autoFocus
                   />
                   <button type="submit" className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50" disabled={!input.trim() || isProcessing}>
                      <Send size={16}/>
                   </button>
                </div>
             </form>
          </div>
       )}

       {/* FAB */}
       <button 
         onClick={() => setIsOpen(!isOpen)} 
         className="pointer-events-auto w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl hover:bg-indigo-700 transition-all hover:scale-110 flex items-center justify-center border-4 border-white/50"
       >
          <Sparkles size={24} className={isOpen ? '' : 'animate-pulse'}/>
       </button>
    </div>
  );
};
