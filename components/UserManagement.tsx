
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { UserRole, Client, User } from '../types';
import { UserPlus, Building, Briefcase, Mail, Lock, Phone, User as UserIcon, Check, X, Shield, Clock, Trash2, Edit2 } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { users, clients, registerUser, editUser, deleteUser, registerClient, requestUserAccess, startImpersonation, user } = useStore();
  const [activeTab, setActiveTab] = useState<'workers' | 'clients'>('workers');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const getRequestStatus = (targetUser: User) => {
     const req = targetUser.accessRequests?.find(r => r.requesterId === user.id);
     if (!req) return 'NONE';
     return req.status;
  };

  const handleAction = (targetUser: User) => {
     const status = getRequestStatus(targetUser);
     if (status === 'APPROVED') {
        startImpersonation(targetUser.id);
     } else if (status === 'NONE' || status === 'REJECTED') {
        requestUserAccess(targetUser.id);
     }
  };

  const handleDelete = (targetId: string) => {
      if(window.confirm("Are you sure you want to delete this user? This cannot be undone.")) {
          deleteUser(targetId);
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
         <div>
           <h1 className="text-2xl font-bold text-slate-800">Team & Users</h1>
           <p className="text-slate-500">Manage access, roles, and client profiles.</p>
         </div>
         <button 
           onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
           className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg shadow-sm hover:bg-brand-700 transition-colors font-medium"
         >
            <UserPlus size={18} />
            {activeTab === 'workers' ? 'Register Worker' : 'Register Client'}
         </button>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
         <button onClick={() => setActiveTab('workers')} className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'workers' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Internal Team (Workers)</button>
         <button onClick={() => setActiveTab('clients')} className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'clients' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Clients (External)</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         {activeTab === 'workers' ? (
           <table className="w-full text-left border-collapse">
             <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                   <th className="p-4 text-xs font-bold text-slate-500 uppercase">User</th>
                   <th className="p-4 text-xs font-bold text-slate-500 uppercase">Role</th>
                   <th className="p-4 text-xs font-bold text-slate-500 uppercase">Specialty</th>
                   <th className="p-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                </tr>
             </thead>
             <tbody>
                {users.filter(u => u.role !== UserRole.CLIENT).map(targetUser => (
                   <tr key={targetUser.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-4">
                         <div className="flex items-center gap-3">
                            <img src={targetUser.avatar} className="w-8 h-8 rounded-full" alt={targetUser.name}/>
                            <div>
                               <div className="text-sm font-bold text-slate-800">{targetUser.name}</div>
                               <div className="text-xs text-slate-500">{targetUser.email}</div>
                            </div>
                         </div>
                      </td>
                      <td className="p-4"><span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${targetUser.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{targetUser.role}</span></td>
                      <td className="p-4 text-sm text-slate-600">{targetUser.specialty || 'N/A'}</td>
                      <td className="p-4 flex gap-2">
                         {targetUser.id !== user.id && (
                           <>
                             <button onClick={() => handleAction(targetUser)} className={`p-2 rounded hover:bg-slate-200 ${getRequestStatus(targetUser) === 'APPROVED' ? 'text-brand-600' : 'text-slate-400'}`} title="Impersonate"><Shield size={16}/></button>
                             <button onClick={() => { setEditingUser(targetUser); setIsModalOpen(true); }} className="p-2 rounded hover:bg-slate-200 text-slate-600" title="Edit"><Edit2 size={16}/></button>
                             <button onClick={() => handleDelete(targetUser.id)} className="p-2 rounded hover:bg-red-100 text-red-500" title="Delete"><Trash2 size={16}/></button>
                           </>
                         )}
                      </td>
                   </tr>
                ))}
             </tbody>
           </table>
         ) : (
           <table className="w-full text-left border-collapse">
             <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                   <th className="p-4 text-xs font-bold text-slate-500 uppercase">Company</th>
                   <th className="p-4 text-xs font-bold text-slate-500 uppercase">Contact</th>
                   <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                   <th className="p-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                </tr>
             </thead>
             <tbody>
                {clients.map(client => {
                   const clientUser = users.find(u => u.assignedClientIds?.includes(client.id) && u.role === UserRole.CLIENT);
                   if (!clientUser) return null;
                   return (
                   <tr key={client.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-4 text-sm font-bold text-slate-800">{client.company}</td>
                      <td className="p-4"><div className="text-sm text-slate-800">{client.name}</div><div className="text-xs text-slate-500">{client.email}</div></td>
                      <td className="p-4"><span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${client.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{client.status}</span></td>
                      <td className="p-4 flex gap-2">
                          <button onClick={() => handleAction(clientUser)} className="p-2 rounded hover:bg-slate-200 text-slate-400"><Shield size={16}/></button>
                          <button onClick={() => { setEditingUser(clientUser); setIsModalOpen(true); }} className="p-2 rounded hover:bg-slate-200 text-slate-600"><Edit2 size={16}/></button>
                          <button onClick={() => handleDelete(clientUser.id)} className="p-2 rounded hover:bg-red-100 text-red-500"><Trash2 size={16}/></button>
                      </td>
                   </tr>
                )})}
             </tbody>
           </table>
         )}
      </div>

      {isModalOpen && (
         <RegistrationModal 
           type={activeTab} 
           user={editingUser}
           onClose={() => setIsModalOpen(false)}
           onRegisterWorker={(u) => editingUser ? editUser(editingUser.id, u) : registerUser(u)}
           onRegisterClient={(c) => registerClient(c)} // Simplified for edit logic
         />
      )}
    </div>
  );
};

const RegistrationModal = ({ type, user, onClose, onRegisterWorker, onRegisterClient }: any) => {
   const [formData, setFormData] = useState<any>({
      name: user?.name || '', email: user?.email || '', password: user?.password || '', 
      company: user?.company || '', industry: user?.industry || '', phone: user?.phone || '', 
      role: user?.role || (type === 'workers' ? UserRole.WORKER : UserRole.CLIENT),
      specialty: user?.specialty || ''
   });

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (type === 'workers') {
         onRegisterWorker(formData);
      } else {
         onRegisterClient(formData);
      }
      onClose();
   };

   return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
         <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
               <h2 className="text-xl font-bold text-slate-800">{user ? 'Edit User' : 'Register New User'}</h2>
               <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600"/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scroll space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label><input required className="w-full border p-2 rounded text-sm" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})}/></div>
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label><input required type="email" className="w-full border p-2 rounded text-sm" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})}/></div>
                  {!user && <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label><input required type="password" className="w-full border p-2 rounded text-sm" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})}/></div>}
               </div>
               {type === 'workers' && (
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Specialty</label><input className="w-full border p-2 rounded text-sm" value={formData.specialty} onChange={e=>setFormData({...formData, specialty: e.target.value})}/></div>
               )}
               <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded text-sm font-bold hover:bg-brand-700">{user ? 'Save Changes' : 'Register'}</button>
               </div>
            </form>
         </div>
      </div>
   );
};
